import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface BranchesResponse {
  branches: string[];
  defaultBranch: string;
}

export function useBranches(serverId: string | undefined, hasRepository: boolean) {
  return useQuery({
    queryKey: ['branches', serverId],
    queryFn: () =>
      api.get<BranchesResponse>(`/servers/${serverId}/branches`).then((r) => r.data),
    enabled: !!serverId && hasRepository,
    staleTime: 60_000,
  });
}
