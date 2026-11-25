import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { User } from '../models/user.model.js';
import { TokenTransaction, ITokenTransaction } from '../models/token_transaction.model.js';
import { ContractConversion } from '../models/contract_conversion.model.js';
import { AppError } from '../utils/errors.js';
import { crypto } from '../utils/crypto.js';

export const RATES: Record<string, number> = {
  MOCK_USDT: 100,
  MOCK_ETH: 200,
};

export class TokenService {
  async getBalance(userId: string): Promise<number> {
    const user = await User.findById(userId).select('tokenBalance');
    if (!user) throw AppError.notFound('User');
    return user.tokenBalance;
  }

  async getHistory(userId: string, page = 1, limit = 20): Promise<{ data: any[]; pagination: any }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      TokenTransaction.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TokenTransaction.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);
    return {
      data: data.map((item) => ({ ...item, id: item._id.toString() })),
      pagination: { page, pageSize: limit, totalItems: total, totalPages: Math.ceil(total / limit) },
    };
  }

  async convert(userId: string, toAsset: 'MOCK_USDT' | 'MOCK_ETH', amount: number): Promise<any> {
    const session = await mongoose.startSession();
    try {
      const rate = RATES[toAsset];
      const txHashMock = crypto.randomBytes(32).toString('hex');
      const result = await session.withTransaction(async () => {
        const user = await User.findById(new Types.ObjectId(userId)).session(session).select('tokenBalance');
        if (!user) throw AppError.notFound('User');
        if (user.tokenBalance < amount) {
          throw AppError.conflict(`Insufficient tokens. You have ${user.tokenBalance}, tried ${amount}`);
        }

        const newBalance = user.tokenBalance - amount;
        await User.updateOne(
          { _id: user._id },
          { $set: { tokenBalance: newBalance } }
        ).session(session);

        await TokenTransaction.create([{
          userId: new Types.ObjectId(userId),
          type: 'CONVERT',
          source: 'AI_USAGE',
          amount: -amount,
          balanceAfter: newBalance,
          referenceId: txHashMock,
        }], { session });

        const contract = await ContractConversion.create([{
          userId: new Types.ObjectId(userId),
          fromToken: 'TOK',
          toAsset,
          amount,
          exchangeRate: rate,
          txHashMock: `0x${txHashMock}`,
          status: 'CONFIRMED',
        }], { session });

        return { contract: contract[0], balanceAfter: newBalance };
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  async withdraw(userId: string, amount: number, destination: string): Promise<any> {
    const session = await mongoose.startSession();
    try {
      const result = await session.withTransaction(async () => {
        const user = await User.findById(new Types.ObjectId(userId)).session(session).select('tokenBalance');
        if (!user) throw AppError.notFound('User');
        if (user.tokenBalance < amount) {
          throw AppError.conflict(`Insufficient tokens. You have ${user.tokenBalance}, tried ${amount}`);
        }
        const newBalance = user.tokenBalance - amount;
        await User.updateOne({ _id: user._id }, { $set: { tokenBalance: newBalance } }).session(session);
        await TokenTransaction.create([{
          userId: new Types.ObjectId(userId),
          type: 'WITHDRAW',
          source: 'SYSTEM',
          amount: -amount,
          balanceAfter: newBalance,
          referenceId: 'mock-withdraw',
          destination,
        }], { session });
        return { status: 'confirmed', balanceAfter: newBalance, destination, txHashMock: `0x${crypto.randomBytes(32).toString('hex')}` };
      });
      return result;
    } finally {
      await session.endSession();
    }
  }
}