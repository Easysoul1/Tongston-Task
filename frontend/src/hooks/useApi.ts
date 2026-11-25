import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api, authApi, contentApi, aiApi, tokenApi, mediaApi } from '../api/client';
import { setAuthToken } from '../api/client';
import { useAuthStore, useBalanceStore } from '../store';
import type { ApiResponse, PaginatedResponse, Tone, Length, AIRun, User } from '../types';

// Auth
function applyAuthSession(payload: { token?: string; user?: User } | undefined) {
  if (!payload?.token || !payload.user?.id || !payload.user?.email) {
    throw new Error('Unexpected auth response from server');
  }
  setAuthToken(payload.token);
  useAuthStore.getState().setAuth(payload.user, payload.token);
  useBalanceStore.getState().setBalance(payload.user.tokenBalance ?? 0);
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
    onSuccess: (response) => applyAuthSession(response.data.data),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({ email, password, role }: { email: string; password: string; role?: 'ADMIN' | 'USER' }) =>
      authApi.register(email, password, role),
    onSuccess: (response) => applyAuthSession(response.data.data),
  });
}

// Content
export function useContentList(params?: { tag?: string; q?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['content', params],
    queryFn: () => contentApi.list(params).then((r) => r.data.data!),
  });
}

export function useContent(id: string) {
  return useQuery({
    queryKey: ['content', id],
    queryFn: () => contentApi.get(id).then((r) => r.data.data!),
    enabled: !!id,
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; body: string; tags?: string[] }) => contentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

// AI
export function useSummarize() {
  const queryClient = useQueryClient();
  const { addBalance } = useBalanceStore();

  return useMutation({
    mutationFn: ({ contentId, tone, length, promptVersion }: { contentId: string; tone: Tone; length: Length; promptVersion?: string }) =>
      aiApi.summarize(contentId, { tone, length, promptVersion }),
    onSuccess: (response, variables) => {
      const { tokensAwarded } = response.data.data!;
      addBalance(tokensAwarded);
      queryClient.invalidateQueries({ queryKey: ['content', variables.contentId] });
      queryClient.invalidateQueries({ queryKey: ['aiRuns'] });
      queryClient.invalidateQueries({ queryKey: ['tokens', 'history'] });
    },
  });
}

export function useAIRuns(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['aiRuns', params],
    queryFn: () => api.get<ApiResponse<PaginatedResponse<AIRun>>>('/ai/runs', { params }).then((r) => r.data.data!),
  });
}

// Tokens
export function useTokenBalance() {
  const { balance, setBalance } = useBalanceStore();

  const { data, refetch } = useQuery({
    queryKey: ['tokens', 'balance'],
    queryFn: () => tokenApi.balance().then((r) => r.data.data!),
    initialData: { balance },
    staleTime: 5_000,
  });

  useEffect(() => {
    if (data && data.balance !== balance) {
      setBalance(data.balance);
    }
  }, [data, balance, setBalance]);

  return { balance: data?.balance ?? balance, refetch };
}

export function useTokenHistory(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['tokens', 'history', params],
    queryFn: () => tokenApi.history(params).then((r) => r.data.data!),
  });
}

export function useConvertTokens() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ toAsset, amount }: { toAsset: 'MOCK_USDT' | 'MOCK_ETH'; amount: number }) => tokenApi.convert(toAsset, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['tokens', 'history'] });
    },
  });
}

export function useWithdrawTokens() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, destination }: { amount: number; destination: string }) => tokenApi.withdraw(amount, destination),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['tokens', 'history'] });
    },
  });
}

// Media
export function useUploadMedia() {
  return useMutation({
    mutationFn: (file: File) => mediaApi.upload(file),
  });
}

export function usePromoteMedia() {
  return useMutation({
    mutationFn: (id: string) => mediaApi.promote(id),
  });
}