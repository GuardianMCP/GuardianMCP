import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Server, Scan, PaginatedResponse } from '@/types/api';

export function useServers(page = 1) {
  return useQuery({
    queryKey: ['servers', page],
    queryFn: () => api.get<PaginatedResponse<Server>>('/servers', { params: { page } }).then((r) => r.data),
  });
}

export function useServer(id: string) {
  return useQuery({
    queryKey: ['server', id],
    queryFn: () => api.get<Server>(`/servers/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; language?: string; repository?: string }) =>
      api.post<Server>('/servers', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}

export function useDeleteServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/servers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}

export function useTriggerScan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serverId, branch }: { serverId: string; branch?: string }) =>
      api.post<Scan>(`/servers/${serverId}/scans`, { branch }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scans'] });
      qc.invalidateQueries({ queryKey: ['server'] });
    },
  });
}
