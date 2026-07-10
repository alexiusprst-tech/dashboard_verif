import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    CheckSquare,
    Users,
    Calendar,
    Tag,
    Megaphone,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    Bell,
    X,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks/useAuth';

/* ── Nav Item Types ─────────────────────────────────────────── */

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: number;
    roles?: Array<'super_admin' | 'coordinator' | 'dosen' | 'pic'>;
}

interface NavSection {
    title?: string;
    items: NavItem[];
}

/* ── Nav Config per Role ────────────────────────────────────── */

const COMMON_ITEMS: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'PLO & CLO', href: '/plo-clo', icon: GraduationCap },
];

const DOSEN_ITEMS: NavItem[] = [
    { label: 'Soal Saya', href: '/soal', icon: FileText },
];

const PIC_ITEMS: NavItem[] = [
    { label: 'Verifikasi Soal', href: '/verifikasi', icon: CheckSquare },
    { label: 'Berita Acara', href: '/berita-acara', icon: ClipboardList },
];

const COORDINATOR_ITEMS: NavItem[] = [
    { label: 'Monitoring Prodi', href: '/monitoring', icon: BookOpen },
];

const ADMIN_ITEMS: NavItem[] = [
    { label: 'Periode & Deadline', href: '/periode', icon: Calendar },
    { label: 'Kategori & Template', href: '/kategori', icon: Tag },
    { label: 'Penugasan PIC', href: '/penugasan-pic', icon: Users },
    { label: 'Broadcast', href: '/broadcast', icon: Megaphone },
    { label: 'Semua Soal', href: '/soal/semua', icon: FileText },
    { label: 'Berita Acara', href: '/berita-acara', icon: ClipboardList },
];

/* ── Build sections berdasarkan role + is_pic_active ───────── */

function buildNavSections(
    role: 'super_admin' | 'coordinator' | 'dosen',
    isPicActive: boolean,
    picPendingCount?: number,
): NavSection[] {
    const sections: NavSection[] = [
        { items: COMMON_ITEMS },
    ];

    if (role === 'super_admin') {
        sections.push({ title: 'Manajemen', items: ADMIN_ITEMS });
    }

    if (role === 'coordinator') {
        sections.push({ title: 'Koordinator', items: COORDINATOR_ITEMS });
    }

    // Semua dosen (termasuk admin/koordinator) bisa upload soal
    if (role !== 'super_admin') {
        sections.push({ title: 'Soal', items: DOSEN_ITEMS });
    }

    // PIC section — hanya muncul jika user sedang ditugaskan sebagai PIC
    if (isPicActive) {
        sections.push({
            title: 'Tugas Verifikasi',
            items: PIC_ITEMS.map((item) =>
                item.href === '/verifikasi' && picPendingCount
                    ? { ...item, badge: picPendingCount }
                    : item,
            ),
        });
    }

    return sections;
}

/* ── Single Nav Item ────────────────────────────────────────── */

interface NavItemProps {
    item: NavItem;
    collapsed: boolean;
}

function SidebarNavItem({ item, collapsed }: NavItemProps) {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.href}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
                cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    'text-gray-300 hover:bg-white/10 hover:text-white',
                    isActive && 'sidebar-active-item !text-white',
                    collapsed && 'justify-center px-2',
                )
            }
        >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && (
                <span className="truncate">{item.label}</span>
            )}
            {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-xs font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                </span>
            )}
        </NavLink>
    );
}

/* ── Sidebar Component ──────────────────────────────────────── */

interface SidebarProps {
    mobileOpen: boolean;
    onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const { user, role } = useAuth();

    const sections = buildNavSections(
        role,
        user?.is_pic_active ?? false,
        /* picPendingCount — nanti bisa diambil via TanStack Query */
        undefined,
    );

    const sidebarContent = (
        <div className="flex h-full flex-col bg-[var(--color-secondary)]">

            {/* ── Logo & Brand ── */}
            <div
                className={cn(
                    'flex items-center border-b border-white/10 px-4 py-5',
                    collapsed ? 'justify-center' : 'gap-3',
                )}
            >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)]">
                    <GraduationCap size={18} className="text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <p className="text-xs font-semibold leading-tight text-white">
                            Sistem Verifikasi
                        </p>
                        <p className="text-[10px] text-gray-400">Soal Ujian</p>
                    </div>
                )}
            </div>

            {/* ── Nav Sections ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                {sections.map((section, sIdx) => (
                    <div key={sIdx}>
                        {section.title && !collapsed && (
                            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                {section.title}
                            </p>
                        )}
                        <ul className="space-y-0.5">
                            {section.items.map((item) => (
                                <li key={item.href}>
                                    <SidebarNavItem item={item} collapsed={collapsed} />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* ── User Info & Collapse Toggle ── */}
            <div className="border-t border-white/10 p-3">
                {!collapsed && user && (
                    <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-white">
                                {user.name}
                            </p>
                            <p className="truncate text-[10px] text-gray-400">
                                {user.kode_dosen ?? user.email}
                            </p>
                        </div>
                    </div>
                )}
                {/* Collapse button — desktop only */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden w-full items-center justify-center rounded-lg py-2 text-gray-400 transition hover:bg-white/10 hover:text-white md:flex"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* ── Desktop Sidebar ── */}
            <aside
                className={cn(
                    'hidden md:flex flex-col flex-shrink-0 transition-all duration-300',
                    collapsed ? 'w-16' : 'w-60',
                )}
            >
                {sidebarContent}
            </aside>

            {/* ── Mobile Sidebar Overlay ── */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={onMobileClose}
                        aria-hidden="true"
                    />
                    {/* Drawer */}
                    <aside className="absolute left-0 top-0 h-full w-64 shadow-xl">
                        {/* Close button */}
                        <button
                            onClick={onMobileClose}
                            className="absolute right-3 top-3 z-10 rounded-md p-1 text-gray-400 hover:text-white"
                            aria-label="Tutup menu"
                        >
                            <X size={18} />
                        </button>
                        {sidebarContent}
                    </aside>
                </div>
            )}
        </>
    );
}
