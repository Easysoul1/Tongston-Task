export interface AIProviderRequest {
  content: string;
  tone: string;
  length: string;
  promptVersion?: string;
}

export interface AIProviderResponse {
  output: string;
  tokensAwarded: number;
}

export interface AIProvider {
  summarize(input: AIProviderRequest): Promise<AIProviderResponse>;
}

export class MockAIProvider implements AIProvider {
  async summarize(input: AIProviderRequest): Promise<AIProviderResponse> {
    const base = `MOCK_SUMMARY[v${input.promptVersion || 'v1'}]: ${input.content.slice(0, 120)}...`;
    return { output: base, tokensAwarded: 5 };
  }
}

export class OpenAIProvider implements AIProvider {
  constructor(private readonly apiKey: string) {}

  async summarize(input: AIProviderRequest): Promise<AIProviderResponse> {
    // Production implementation: call OpenAI chat completions with promptVersion
    throw new Error('OpenAIProvider not configured');
  }
}

import { isUsableCredential } from '../../utils/credentials.js';

export function getProvider(): AIProvider {
  const key = process.env.AI_API_KEY;
  if (isUsableCredential(key) && key!.length > 20) {
    return new OpenAIProvider(key!);
  }
  return new MockAIProvider();
}
