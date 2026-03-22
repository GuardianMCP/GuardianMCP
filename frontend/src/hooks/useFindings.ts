import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Finding, FindingStatus, PaginatedResponse } from '@/types/api';

export function useFindings(params?: {
  serverId?: string;
  severity?: string;
  status?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ['findings', params],
    queryFn: () => api.get<PaginatedResponse<Finding>>('/findings', { params }).then((r) => r.data),
  });
}

export function useBulkUpdateFindings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids: string[]; status: FindingStatus; note?: string }) =>
      api.post('/findings/bulk', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['findings'] }),
  });
}
