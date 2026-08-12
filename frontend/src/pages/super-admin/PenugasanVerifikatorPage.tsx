/**
 * PenugasanVerifikatorPage — SuperAdmin page for assigning Verifikator to MK.
 * Source: user-flow.md Section 1.5, visionSnPRD.md FR-08
 *
 * This is the ONLY <<Include>> relationship in the entire use case diagram:
 * "Menentukan dosen verifikator" includes "menentukan MK" as a mandatory step.
 *
 * BR-05: Super Admin dapat menunjuk Verifikator.
 */

import VerifikatorAssignmentForm from '../../components/assignment/VerifikatorAssignmentForm';

export default function PenugasanVerifikatorPage() {
  return (
    <div>
      <h1>Menentukan Dosen Verifikator</h1>
      <VerifikatorAssignmentForm />
    </div>
  );
}
