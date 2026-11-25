import { Types } from 'mongoose';
import { ContentItem } from '../../models/content.model.js';
import { AIRun, IAIRun } from '../../models/ai_run.model.js';
import { User } from '../../models/user.model.js';
import { TokenTransaction } from '../../models/token_transaction.model.js';
import { AppError } from '../../utils/errors.js';
import { getProvider } from './provider.js';
import mongoose from 'mongoose';

export class AIService {
  private readonly IDLE_TIMEOUT_MS = 8000;
  private readonly IDEMPOTENCY_WINDOW_MS = 15000;
  private readonly TOKENS_PER_SUMMARY = 5;

  async summarize(
    contentId: string,
    userId: string,
    tone: string,
    length: string,
    promptVersion?: string
  ): Promise<{ output: string; latencyMs: number; tokensAwarded: number; totalTokenBalance: number }> {
    // Fix 3: Idempotency guard - 15 second window
    const recentRun = await AIRun.findOne({
      contentId: new Types.ObjectId(contentId),
      userId: new Types.ObjectId(userId),
      createdAt: { $gte: new Date(Date.now() - this.IDEMPOTENCY_WINDOW_MS) },
      status: { $in: ['PENDING', 'SUCCESS'] },
    });
    if (recentRun) {
      throw AppError.tooManyRequests('Summarization in progress. Please wait.');
    }

    // Step 1: Create PENDING ai_run (outside transaction)
    const aiRun = await AIRun.create({
      contentId: new Types.ObjectId(contentId),
      userId: new Types.ObjectId(userId),
      promptVersion: promptVersion || 'v1',
      tone,
      length,
      status: 'PENDING',
    });

    const content = await ContentItem.findById(new Types.ObjectId(contentId));
    if (!content) {
      await AIRun.findByIdAndUpdate(aiRun._id, { status: 'FAILED', errorMessage: 'Content not found' });
      throw AppError.notFound('Content');
    }

    const start = Date.now();
    const provider = getProvider();

    // Step 2: Call AI with timeout (Fix 2)
    let aiOutput: string;
    let tokensAwarded: number;

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), this.IDLE_TIMEOUT_MS)
      );
      const result = await Promise.race([provider.summarize({ content: content.body, tone, length, promptVersion }), timeoutPromise]);
      aiOutput = result.output;
      tokensAwarded = result.tokensAwarded || this.TOKENS_PER_SUMMARY;
    } catch (err: any) {
      // Timeout or AI error -> mark FAILED
      await AIRun.findByIdAndUpdate(aiRun._id, {
        status: 'FAILED',
        errorMessage: err.message || 'AI provider error',
      });
      throw AppError.internal('AI summarization failed. Please try again.');
    }

    const latencyMs = Date.now() - start;

    // Step 3: Settlement transaction (Fix 2)
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Increment user tokenBalance
        const user = await User.findById(new Types.ObjectId(userId)).session(session).select('tokenBalance');
        if (!user) throw AppError.notFound('User');

        const newBalance = user.tokenBalance + tokensAwarded;
        await User.updateOne({ _id: user._id }, { $set: { tokenBalance: newBalance } }).session(session);

        // Insert token_transactions EARN
        await TokenTransaction.create([{
          userId: new Types.ObjectId(userId),
          type: 'EARN',
          source: 'AI_USAGE',
          amount: tokensAwarded,
          balanceAfter: newBalance,
          referenceId: aiRun._id,
        }], { session });

        // Update ai_run to SUCCESS
        await AIRun.findByIdAndUpdate(aiRun._id, {
          status: 'SUCCESS',
          output: aiOutput,
          latencyMs,
          tokensAwarded,
        }).session(session);
      });

      return { output: aiOutput, latencyMs, tokensAwarded, totalTokenBalance: await User.findById(userId).then(u => u!.tokenBalance) };
    } catch (txError: any) {
      // Outside transaction: mark FAILED for audit
      await AIRun.findByIdAndUpdate(aiRun._id, { status: 'FAILED', errorMessage: txError.message });
      throw AppError.internal('Failed to settle token reward. Please try again.');
    } finally {
      await session.endSession();
    }
  }
}