/**
 * KoordinatorAssignmentForm — Form for SuperAdmin to assign/replace Koordinator.
 * Source: tech-spec.md Section 5.2, AGENTS.md Section 9
 *
 * BR-03: Super Admin dapat menunjuk Koordinator.
 * BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
 *
 * Uses React Query useMutation with optimistic update (tech-spec Section 5.2).
 */

export default function KoordinatorAssignmentForm() {
  // TODO: Implement form with:
  // - Course picker (MK selection)
  // - Dosen picker (for Koordinator)
  // - Semester context (auto-filled from SemesterContext)
  // - Optimistic update via useUpdateKoordinatorAssignment hook

  return (
    <div>
      <h2>Penugasan Koordinator</h2>
      {/* Skeleton — form implementation pending */}
      <p>Form penunjukan/penggantian Koordinator</p>
    </div>
  );
}
