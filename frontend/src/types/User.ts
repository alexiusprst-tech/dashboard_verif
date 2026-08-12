/**
 * Type definitions for User.
 * Source: AGENTS.md Section 5 — three active roles
 * BR-07: Role sistem terdiri dari Super Admin, Koordinator, dan Verifikator.
 */

export type UserRole = 'super_admin' | 'koordinator' | 'verifikator';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends User {
  /** Token from Laravel Sanctum (if using token-based auth) */
  token?: string;
}
