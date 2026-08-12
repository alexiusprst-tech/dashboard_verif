/**
 * Type definitions for Verifikator Assignment.
 * Source: AGENTS.md Section 7 — tabel penugasan_verifikator
 */

export interface VerifikatorAssignment {
  id: number;
  user_id: number;
  course_id: number;
  semester_id: number;
  created_at: string;
  updated_at: string;

  // Relations
  user?: {
    id: number;
    name: string;
    email: string;
  };
  course?: {
    id: number;
    nama: string;
    kode: string;
  };
}
