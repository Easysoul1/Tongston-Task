export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  tokenBalance: number;
}

export interface ContentItem {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdBy: string;
  mediaAssets: MediaAsset[];
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  originalName: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  s3Url?: string;
  s3Key?: string;
  status: 'CLOUDINARY' | 'S3' | 'FAILED';
}

export interface AIRun {
  id: string;
  contentId: string;
  userId: string;
  promptVersion: string;
  tone: string;
  length: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  output?: string;
  latencyMs?: number;
  tokensAwarded?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  type: 'EARN' | 'CONVERT' | 'WITHDRAW';
  source: 'AI_USAGE' | 'MANUAL' | 'SYSTEM';
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  destination?: string;
  createdAt: string;
}

export interface ContractConversion {
  id: string;
  userId: string;
  fromToken: string;
  toAsset: 'MOCK_USDT' | 'MOCK_ETH';
  amount: number;
  exchangeRate: number;
  txHashMock: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type Tone = 'professional' | 'casual' | 'funny';
export type Length = 'short' | 'medium' | 'long';
export type Asset = 'MOCK_USDT' | 'MOCK_ETH';