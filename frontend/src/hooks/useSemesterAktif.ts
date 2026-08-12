import { useSemesterContext } from '../contexts/SemesterContext';

/**
 * Convenience hook wrapping SemesterContext.
 * Source: tech-spec.md Section 2.3
 *
 * BR-08: Pilihan periode soal mengikuti periode waktu yang sedang berjalan.
 * BR-11: Monitoring status upload kelas menggunakan semester berjalan.
 */
export function useSemesterAktif() {
  const { activeSemester, semesters, setActiveSemester, isLoading, error } =
    useSemesterContext();

  return {
    semesterAktif: activeSemester,
    semuaSemester: semesters,
    setSemesterAktif: setActiveSemester,
    isLoading,
    error,
  };
}
