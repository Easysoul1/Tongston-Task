import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, ContentItem, MediaAsset, PaginatedResponse, TokenTransaction, User } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken: string | null = typeof window !== 'undefined' ? window.localStorage.getItem('tongston_token') : null;

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

export function setAuthToken(token: string | null) {
  accessToken = token;
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export function extractData<T>(response: { data: ApiResponse<T> }): T {
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Request failed');
  }
  return response.data.data as T;
}

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { error?: { message?: string } } | undefined;
    if (payload?.error?.message) return payload.error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', { email, password }),
  register: (email: string, password: string, role?: 'ADMIN' | 'USER') =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', { email, password, role }),
};

// Content
export const contentApi = {
  list: (params?: { tag?: string; q?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResponse<ContentItem>>>('/content', { params }),
  get: (id: string) =>
    api.get<ApiResponse<ContentItem>>(`/content/${id}`),
  create: (data: { title: string; body: string; tags?: string[] }) =>
    api.post<ApiResponse<ContentItem>>('/content', data),
};

// AI
export const aiApi = {
  summarize: (contentId: string, data: { tone: string; length: string; promptVersion?: string }) =>
    api.post<ApiResponse<{ output: string; latencyMs: number; tokensAwarded: number; totalTokenBalance: number }>>(`/content/${contentId}/ai/summarize`, data),
};

// Tokens
export const tokenApi = {
  balance: () =>
    api.get<ApiResponse<{ balance: number }>>('/tokens/balance'),
  history: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResponse<TokenTransaction>>>('/tokens/history', { params }),
  convert: (toAsset: string, amount: number) =>
    api.post<ApiResponse<{ txHashMock: string; balanceAfter: number }>>('/tokens/convert', { toAsset, amount }),
  withdraw: (amount: number, destination: string) =>
    api.post<ApiResponse<{ status: string; balanceAfter: number; destination: string; txHashMock: string }>>('/tokens/withdraw', { amount, destination }),
};

// Media
export const mediaApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<MediaAsset>>('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  promote: (id: string) =>
    api.post<ApiResponse<Pick<MediaAsset, 'id' | 'status'> & { s3Url?: string; s3Key?: string }>>(`/media/${id}/promote`),
};

// Re-export types
export type { ContentItem, TokenTransaction } from '../types';