import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AlertRule } from '@/types/api';

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get<AlertRule[]>('/alerts').then((r) => r.data),
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AlertRule>) => api.post('/alerts', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}
