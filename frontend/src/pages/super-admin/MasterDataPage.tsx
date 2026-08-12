/**
 * MasterDataPage — SuperAdmin page for managing master data.
 * Source: user-flow.md Section 1.2
 *
 * Extension points: CLO, PLO, Mata Kuliah, Dosen
 *
 * NEEDS CONFIRMATION (highest priority, AGENTS.md Section 13):
 * BR-13 vs use case diagram conflict on CRUD scope for CLO/PLO/MataKuliah.
 */

import CloForm from '../../components/master-data/CloForm';
import PloForm from '../../components/master-data/PloForm';
import MataKuliahForm from '../../components/master-data/MataKuliahForm';
import DosenForm from '../../components/master-data/DosenForm';

export default function MasterDataPage() {
  // TODO: Implement tab/section navigation between extension points

  return (
    <div>
      <h1>Mengelola Master Data</h1>
      <div>
        <CloForm />
        <PloForm />
        <MataKuliahForm />
        <DosenForm />
      </div>
    </div>
  );
}
