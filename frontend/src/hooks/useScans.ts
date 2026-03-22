import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Scan, PaginatedResponse } from '@/types/api';

export function useScans(params?: { serverId?: string; page?: number }) {
  return useQuery({
    queryKey: ['scans', params],
    queryFn: () => api.get<PaginatedResponse<Scan>>('/scans', { params }).then((r) => r.data),
  });
}

export function useScan(id: string) {
  return useQuery({
    queryKey: ['scan', id],
    queryFn: () => api.get<Scan>(`/scans/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}
