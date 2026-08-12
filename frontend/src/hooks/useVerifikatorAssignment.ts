import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verifikatorAssignmentApi } from '../api/verifikatorAssignment';
import { useSemesterContext } from '../contexts/SemesterContext';

/**
 * React Query hooks for Verifikator Assignment.
 * Source: AGENTS.md Section 5, tech-spec.md Section 5.2
 */

export function useVerifikatorAssignments() {
  const { activeSemester } = useSemesterContext();

  return useQuery({
    queryKey: ['verifikator-assignments', activeSemester?.id],
    queryFn: () => verifikatorAssignmentApi.getAll(activeSemester?.id),
    enabled: !!activeSemester,
  });
}

export function useStoreVerifikatorAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifikatorAssignmentApi.store,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifikator-assignments'] });
    },
  });
}

export function useDestroyVerifikatorAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifikatorAssignmentApi.destroy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifikator-assignments'] });
    },
  });
}
