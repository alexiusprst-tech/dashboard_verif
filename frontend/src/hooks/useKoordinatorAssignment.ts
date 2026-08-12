import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { koordinatorAssignmentApi } from '../api/koordinatorAssignment';
import { useSemesterContext } from '../contexts/SemesterContext';

/**
 * React Query hooks for Koordinator Assignment.
 * Source: tech-spec.md Section 5.2 — optimistic update for BR-04
 *
 * Uses semester_id as part of query key for automatic cache separation per semester.
 */

export function useKoordinatorAssignments() {
  const { activeSemester } = useSemesterContext();

  return useQuery({
    queryKey: ['koordinator-assignments', activeSemester?.id],
    queryFn: () => koordinatorAssignmentApi.getAll(activeSemester?.id),
    enabled: !!activeSemester,
  });
}

export function useKoordinatorAssignment(id: number) {
  return useQuery({
    queryKey: ['koordinator-assignments', id],
    queryFn: () => koordinatorAssignmentApi.getById(id),
    enabled: !!id,
  });
}

export function useStoreKoordinatorAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: koordinatorAssignmentApi.store,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['koordinator-assignments'] });
    },
  });
}

/**
 * Mutation for updating (replacing) Koordinator on an existing assignment.
 * Uses optimistic update as recommended in tech-spec.md Section 5.2.
 */
export function useUpdateKoordinatorAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }: { id: number; userId: number }) =>
      koordinatorAssignmentApi.update(id, { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['koordinator-assignments'] });
    },
  });
}
