/**
 * VerifikasiSoalPage — Verifikator page for verifying soal.
 * Source: user-flow.md Section 3.2, visionSnPRD.md FR-15, FR-16, FR-17
 *
 * Extensions:
 * - Memberikan Catatan Verifikasi (<<Extend>>, optional)
 * - Mencetak Berita Acara (<<Extend>>, optional)
 *
 * NEEDS CONFIRMATION (visionSnPRD Section 7.1):
 * Relationship between Approve/Revisi/Reject (audit) and this single use case.
 */

import CatatanVerifikasiForm from '../../components/verifikasi/CatatanVerifikasiForm';
import BeritaAcaraPrintButton from '../../components/verifikasi/BeritaAcaraPrintButton';

export default function VerifikasiSoalPage() {
  // TODO: Implement:
  // - List of soal pending verification
  // - Soal viewer (PDF display)
  // - Status selection (Approve/Revisi/Reject) — NEEDS CONFIRMATION
  // - Extension: Catatan Verifikasi
  // - Extension: Cetak Berita Acara

  return (
    <div>
      <h1>Memverifikasi Soal</h1>
      <div>
        <p>Daftar soal untuk diverifikasi</p>
        <CatatanVerifikasiForm />
        <BeritaAcaraPrintButton />
      </div>
    </div>
  );
}
