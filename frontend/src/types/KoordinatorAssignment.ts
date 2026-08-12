/**
 * Type definitions for Koordinator Assignment.
 * Source: AGENTS.md Section 7-8, tech-spec.md Section 3.2
 *
 * Tabel: koordinator_assignments
 * Unique constraint: (course_id, semester_id) — satu MK hanya punya satu Koordinator per semester.
 */

export interface KoordinatorAssignment {
  id: number;
  course_id: number;
  user_id: number;
  semester_id: number;
  assigned_by: number;
  created_at: string;
  updated_at: string;

  // Relations (loaded via API includes)
  course?: Course;
  user?: User;
  semester?: Semester;
  assigner?: User;
}

export interface Course {
  id: number;
  nama: string;
  kode: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'koordinator' | 'verifikator';
}

export interface Semester {
  id: number;
  nama: string;
  tahun_ajaran: string;
  is_active: boolean;
}
