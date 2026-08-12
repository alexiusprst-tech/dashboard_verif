/**
 * UploadSoalPage — Koordinator page for uploading soal PDF.
 * Source: user-flow.md Section 2.3, visionSnPRD.md FR-12, FR-13
 *
 * Extension: Mengunggah Revisi Soal (<<Extend>>, optional)
 */

import SoalUploadForm from '../../components/soal/SoalUploadForm';
import SoalRevisiForm from '../../components/soal/SoalRevisiForm';

export default function UploadSoalPage() {
  // TODO: Implement conditional rendering:
  // - Show SoalUploadForm for initial upload
  // - Show SoalRevisiForm when revision is available (extend condition NEEDS CONFIRMATION)

  return (
    <div>
      <h1>Mengunggah Soal</h1>
      <SoalUploadForm />
      {/* Extension: Revisi Soal — rendered conditionally */}
      {/* <SoalRevisiForm /> */}
    </div>
  );
}
