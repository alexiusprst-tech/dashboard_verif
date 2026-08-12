/**
 * BeritaAcaraPrintButton — Button to print/generate Berita Acara PDF.
 * Source: user-flow.md Section 3.2, visionSnPRD.md FR-17
 *
 * BR-09: Dev Mode tidak memengaruhi akses Berita Acara.
 * tech-spec.md Section 1.2: PDF generation via Laravel Queue (async, not in request cycle).
 *
 * <<Extend>> of "Memverifikasi Soal".
 */

interface BeritaAcaraPrintButtonProps {
  /** ID of the soal/verification record */
  soalId?: number;
  /** Whether the button should be disabled */
  disabled?: boolean;
}

export default function BeritaAcaraPrintButton({
  soalId,
  disabled = false,
}: BeritaAcaraPrintButtonProps) {
  const handlePrint = async () => {
    // TODO: Implement:
    // 1. Trigger async PDF generation via API (Laravel Queue)
    // 2. Poll for completion or use WebSocket notification
    // 3. Download generated PDF
    console.log('Generate Berita Acara for soal:', soalId);
  };

  return (
    <button
      onClick={handlePrint}
      disabled={disabled || !soalId}
    >
      Cetak Berita Acara
    </button>
  );
}
