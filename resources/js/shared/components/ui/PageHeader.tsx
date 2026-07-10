import type { ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ── Types ─────────────────────────────────────────────────── */

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumb?: BreadcrumbItem[];
    action?: ReactNode;
}

/* ── Component ──────────────────────────────────────────────── */

/**
 * PageHeader — Header standar untuk semua halaman.
 *
 * Urutan: Judul → Deskripsi → Breadcrumb → Action Button
 */
export function PageHeader({ title, description, breadcrumb, action }: PageHeaderProps) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: title + description + breadcrumb */}
            <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{title}</h1>
                {description && (
                    <p className="text-sm text-gray-500">{description}</p>
                )}
                {breadcrumb && breadcrumb.length > 0 && (
                    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-gray-400">
                        <Home size={12} />
                        <ChevronRight size={10} />
                        {breadcrumb.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-1">
                                {crumb.href ? (
                                    <Link
                                        to={crumb.href}
                                        className="transition hover:text-[var(--color-primary)]"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="font-medium text-[var(--color-secondary)]">
                                        {crumb.label}
                                    </span>
                                )}
                                {i < breadcrumb.length - 1 && <ChevronRight size={10} />}
                            </span>
                        ))}
                    </nav>
                )}
            </div>

            {/* Right: action button */}
            {action && (
                <div className="flex-shrink-0">{action}</div>
            )}
        </div>
    );
}
