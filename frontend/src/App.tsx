import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages — SuperAdmin
import MasterDataPage from './pages/super-admin/MasterDataPage';
import TahunAjaranPage from './pages/super-admin/TahunAjaranPage';
import KategoriSoalPage from './pages/super-admin/KategoriSoalPage';
import PenugasanVerifikatorPage from './pages/super-admin/PenugasanVerifikatorPage';

// Pages — Koordinator
import UploadSoalPage from './pages/koordinator/UploadSoalPage';
import TemplateSoalPage from './pages/koordinator/TemplateSoalPage';
import StatusVerifikasiPage from './pages/koordinator/StatusVerifikasiPage';

// Pages — Verifikator
import VerifikasiSoalPage from './pages/verifikator/VerifikasiSoalPage';

/**
 * Main App component with routing.
 *
 * Route structure mirrors use case diagram actor grouping:
 * - /super-admin/* — SuperAdmin use cases
 * - /koordinator/* — Koordinator use cases
 * - /verifikator/* — Verifikator use cases
 *
 * TODO: Wrap routes with RoleGuard component (tech-spec Section 5.2)
 * after auth context is implemented.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/super-admin/master-data" replace />} />

        {/* SuperAdmin routes */}
        <Route path="/super-admin/master-data" element={<MasterDataPage />} />
        <Route path="/super-admin/tahun-ajaran" element={<TahunAjaranPage />} />
        <Route path="/super-admin/kategori-soal" element={<KategoriSoalPage />} />
        <Route path="/super-admin/penugasan-verifikator" element={<PenugasanVerifikatorPage />} />

        {/* Koordinator routes */}
        <Route path="/koordinator/upload-soal" element={<UploadSoalPage />} />
        <Route path="/koordinator/template-soal" element={<TemplateSoalPage />} />
        <Route path="/koordinator/status-verifikasi" element={<StatusVerifikasiPage />} />

        {/* Verifikator routes */}
        <Route path="/verifikator/verifikasi-soal" element={<VerifikasiSoalPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
