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
    PanelLeft,
    GraduationCap,
    Bell,
    X,
    Scroll,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks/useAuth';

/* ── Nav Item Types ─────────────────────────────────────────── */

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: number;
    roles?: Array<'coordinator' | 'dosen' | 'pic'>;
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
    { label: 'Berita Acara', href: '/berita-acara', icon: ClipboardList },
];

const PIC_ITEMS: NavItem[] = [
    { label: 'Verifikasi Soal', href: '/verifikasi', icon: CheckSquare },
];

const BERITA_ACARA_ITEM: NavItem = { label: 'Berita Acara', href: '/berita-acara', icon: ClipboardList };

const COORDINATOR_ITEMS: NavItem[] = [
    { label: 'Monitoring Prodi', href: '/monitoring', icon: BookOpen },
];

const SUPER_ADMIN_ITEMS: NavItem[] = [
    { label: 'Manajemen Dosen', href: '/dosen', icon: GraduationCap },
    { label: 'Periode & Deadline', href: '/periode', icon: Calendar },
    { label: 'Kategori & Template', href: '/kategori', icon: Tag },
    { label: 'Template Berita Acara', href: '/template-ba', icon: Scroll },
    { label: 'Penugasan PIC', href: '/penugasan-pic', icon: Users },
    { label: 'Broadcast', href: '/broadcast', icon: Megaphone },
    { label: 'Semua Soal', href: '/soal/semua', icon: FileText },
    { label: 'Monitoring Prodi', href: '/monitoring', icon: BookOpen },
    { label: 'Berita Acara', href: '/berita-acara', icon: ClipboardList },
];

const COORDINATOR_MANAGEMENT_ITEMS: NavItem[] = [
    { label: 'Manajemen Dosen', href: '/dosen', icon: GraduationCap },
];

/* ── Build sections berdasarkan role + is_pic_active + is_super_admin ─ */

function buildNavSections(
    role: 'coordinator' | 'pic' | 'dosen',
    isPicActive: boolean,
    isSuperAdmin: boolean,
    picPendingCount?: number,
): NavSection[] {
    const sections: NavSection[] = [
        { items: COMMON_ITEMS },
    ];

    if (isSuperAdmin) {
        sections.push({ title: 'Soal', items: DOSEN_ITEMS });
        sections.push({ title: 'Manajemen', items: SUPER_ADMIN_ITEMS });
        return sections;
    }

    if (role === 'coordinator') {
        const soalItems = [
            ...DOSEN_ITEMS,
            ...(isPicActive
                ? PIC_ITEMS.map((item) =>
                      item.href === '/verifikasi' && picPendingCount
                          ? { ...item, badge: picPendingCount }
                          : item,
                  )
                : []),
        ];
        sections.push({ title: 'Soal', items: soalItems });
        sections.push({
            title: 'Manajemen',
            items: [
                ...COORDINATOR_MANAGEMENT_ITEMS,
                { label: 'Monitoring Prodi', href: '/monitoring', icon: BookOpen },
                { label: 'Berita Acara', href: '/berita-acara', icon: ClipboardList },
            ],
        });
        return sections;
    }

    // PIC / Verifikator atau Dosen biasa
    if (role === 'pic' || isPicActive) {
        const picItemsWithBadge = PIC_ITEMS.map((item) =>
            item.href === '/verifikasi' && picPendingCount
                ? { ...item, badge: picPendingCount }
                : item,
        );

        sections.push({
            title: 'Soal',
            items: [
                ...DOSEN_ITEMS,
                ...picItemsWithBadge,
                BERITA_ACARA_ITEM,
            ],
        });
    } else {
        // Dosen biasa hanya bisa upload soal
        sections.push({ title: 'Soal', items: DOSEN_ITEMS });
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
            end={item.href === '/soal'}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
                cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    isActive && 'sidebar-active-item',
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
        user?.is_super_admin ?? false,
        /* picPendingCount — nanti bisa diambil via TanStack Query */
        undefined,
    );

    const sidebarContent = (
        <div className="flex h-full flex-col bg-white border-r border-gray-200">

            {/* ── Logo & Brand (juga tombol toggle sidebar) ── */}

            {/* COLLAPSED: Ikon PanelLeft sebagai tombol buka sidebar */}
            {collapsed && (
                <div className="flex justify-center border-b border-gray-100 px-3 py-4">
                    <button
                        onClick={() => setCollapsed(false)}
                        className="hidden md:flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Buka sidebar"
                        title="Buka sidebar"
                    >
                        <PanelLeft size={20} />
                    </button>
                </div>
            )}

            {/* EXPANDED: Logo + teks, klik untuk collapse */}
            {!collapsed && (
                <div className="border-b border-gray-100 px-3 py-3">
                    <button
                        onClick={() => setCollapsed(true)}
                        className="group hidden md:flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-50"
                        aria-label="Tutup sidebar"
                        title="Tutup sidebar"
                    >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100 p-1.5 transition-transform group-hover:scale-95">
                            <img src="/images/logo-telkom.png" alt="Telkom University Logo" className="h-full w-full object-contain" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold leading-tight text-gray-900">
                                Sistem Verifikasi
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">Soal Ujian · Tel-U</p>
                        </div>
                        <PanelLeft
                            size={15}
                            className="ml-auto text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
                        />
                    </button>

                    {/* Mobile: hanya tampilkan logo statis */}
                    <div className="flex md:hidden items-center gap-3 px-2 py-2">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100 p-1.5">
                            <img src="/images/logo-telkom.png" alt="Telkom University Logo" className="h-full w-full object-contain" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold leading-tight text-gray-900">Sistem Verifikasi</p>
                            <p className="text-[10px] text-gray-400 font-medium">Soal Ujian · Tel-U</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Nav Sections ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {sections.map((section, sIdx) => (
                    <div key={sIdx}>
                        {section.title && !collapsed && (
                            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
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
                            className="absolute right-3 top-3 z-10 rounded-md p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
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
