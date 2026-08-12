import { type ReactNode } from 'react';
import type { UserRole } from '../../types/User';

/**
 * RoleGuard — Wrapper component for route-level role protection.
 * Source: tech-spec.md Section 5.2
 *
 * Reads role from token/user state and renders children only if the user
 * has the required role. Combined with backend middleware for defense-in-depth.
 *
 * Note: Authorization MUST NOT rely on frontend alone (AGENTS.md Section 5.2,
 * audit finding UX-01). Backend middleware is the primary enforcement.
 */

interface RoleGuardProps {
  /** The role(s) allowed to access the wrapped content */
  allowedRoles: UserRole[];
  /** Content to render if the user has the required role */
  children: ReactNode;
  /** Optional fallback to render if user does not have the required role */
  fallback?: ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  // TODO: Implement actual role check from auth state/Sanctum token
  // This is a skeleton — actual implementation will read user role from
  // auth context/store and compare against allowedRoles.
  const userRole: UserRole | null = null; // Placeholder

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
