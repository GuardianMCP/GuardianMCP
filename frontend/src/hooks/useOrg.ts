import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Organization } from '@/types/api';

export function useOrg() {
  return useQuery({
    queryKey: ['org'],
    queryFn: () => api.get<Organization>('/organizations/current').then((r) => r.data),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => api.post('/organizations/current/members', { email }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org'] }),
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api.post<{ id: string; rawKey: string }>('/organizations/current/api-keys', { name }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/organizations/current/api-keys').then((r) => r.data),
  });
}
