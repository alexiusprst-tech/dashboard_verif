/**
 * VerifikatorAssignmentForm — Form for SuperAdmin to assign Verifikator.
 * Source: tech-spec.md Section 5.2, user-flow.md Section 1.5
 *
 * BR-05: Super Admin dapat menunjuk Verifikator.
 * Include wajib: menentukan MK (use case diagram <<Include>>).
 *
 * This form embeds MataKuliahPicker as a required sub-step,
 * not a separate page (tech-spec Section 5.2).
 */

export default function VerifikatorAssignmentForm() {
  // TODO: Implement form with:
  // - MataKuliahPicker (include wajib, embedded as sub-step)
  // - Dosen picker (for Verifikator)
  // - Semester context

  return (
    <div>
      <h2>Penugasan Verifikator</h2>
      {/* Skeleton — form implementation pending */}
      <p>Form penunjukan Verifikator (dengan penentuan MK wajib)</p>
    </div>
  );
}
