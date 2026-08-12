/**
 * Type definitions for Semester.
 * Used by SemesterContext for tracking active semester/periode.
 * Source: tech-spec.md Section 2.3 (semester-aware data), BR-02, BR-08
 */

export interface Semester {
  id: number;
  nama: string;
  tahun_ajaran: string;
  periode: string; // e.g., 'Ganjil', 'Genap'
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
