/**
 * CloForm — Form for managing CLO data.
 * Source: user-flow.md Section 1.2, visionSnPRD.md FR-01
 *
 * NEEDS CONFIRMATION (AGENTS.md Section 13, highest priority):
 * BR-13 states CLO is considered "given" from OBE system.
 * Use case diagram shows "Mengelola master data" with CLO extension (implies CRUD).
 * This conflict is NOT resolved — do NOT implement full CRUD until confirmed.
 *
 * Current: skeleton only.
 */

export default function CloForm() {
  return (
    <div>
      <h3>CLO</h3>
      {/* NEEDS CONFIRMATION: CRUD penuh vs read-only (BR-13 conflict) */}
      <p>Form pengelolaan CLO — menunggu konfirmasi scope CRUD vs BR-13</p>
    </div>
  );
}
