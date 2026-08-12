import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Semester } from '../types/Semester';
import axiosInstance from '../api/axiosInstance';

/**
 * SemesterContext — React Context for active semester/periode.
 * Source: tech-spec.md Section 2.3
 *
 * BR-02: Koordinator dapat berubah setiap semester.
 * BR-08: Pilihan periode soal mengikuti periode waktu yang sedang berjalan.
 *
 * React Query digunakan dengan semester_id sebagai bagian dari query key,
 * supaya cache otomatis terpisah per semester.
 */

interface SemesterContextValue {
  /** The currently active semester */
  activeSemester: Semester | null;
  /** All available semesters */
  semesters: Semester[];
  /** Set the active semester manually (for SuperAdmin switching) */
  setActiveSemester: (semester: Semester) => void;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

const SemesterContext = createContext<SemesterContextValue | undefined>(undefined);

export function SemesterProvider({ children }: { children: ReactNode }) {
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);

  // Fetch all semesters
  const {
    data: semesters = [],
    isLoading,
    error,
  } = useQuery<Semester[]>({
    queryKey: ['semesters'],
    queryFn: async () => {
      const response = await axiosInstance.get('/semesters');
      return response.data.data;
    },
  });

  // Auto-select the active semester on first load
  useEffect(() => {
    if (semesters.length > 0 && !activeSemester) {
      const active = semesters.find((s) => s.is_active);
      setActiveSemester(active ?? semesters[0]);
    }
  }, [semesters, activeSemester]);

  return (
    <SemesterContext.Provider
      value={{
        activeSemester,
        semesters,
        setActiveSemester,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemesterContext(): SemesterContextValue {
  const context = useContext(SemesterContext);
  if (context === undefined) {
    throw new Error('useSemesterContext must be used within a SemesterProvider');
  }
  return context;
}

export default SemesterContext;
