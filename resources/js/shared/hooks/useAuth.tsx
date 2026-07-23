import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from 'react';

/* ── Types ─────────────────────────────────────────────────── */

export type UserRole = 'coordinator' | 'pic' | 'dosen';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    kode_dosen: string | null;
    is_super_admin: boolean;
    is_coordinator: boolean;
    /** Apakah user adalah PIC aktif di periode yang sedang berjalan.
     *  Ini bukan role permanen — dihitung dari assignment di tabel `penugasan`. */
    is_pic_active: boolean;
    program_studi_id: number | null;
    program_studi_name: string | null;
}

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    /** Role efektif berdasarkan flag di user object */
    role: UserRole;
    login: (token: string, user: AuthUser) => void;
    logout: () => void;
    /** Update data user (mis. setelah fetch /auth/me) tanpa re-login */
    updateUser: (user: AuthUser) => void;
}

/* ── Context ───────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Helper: derive role ───────────────────────────────────── */

function deriveRole(user: AuthUser): UserRole {
    if (user.is_super_admin) return 'coordinator';
    if (user.is_pic_active) return 'pic';
    return 'dosen';
}

/* ── Provider ──────────────────────────────────────────────── */

function getStoredUser(): AuthUser | null {
    try {
        const raw = localStorage.getItem('auth_user');
        return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem('auth_token'),
    );
    const [user, setUser] = useState<AuthUser | null>(getStoredUser);

    const login = useCallback((newToken: string, newUser: AuthUser) => {
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
    }, []);

    const updateUser = useCallback((updatedUser: AuthUser) => {
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    }, []);

    const role: UserRole = user ? deriveRole(user) : 'dosen';

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token && !!user,
                role,
                login,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

/* ── Hook ──────────────────────────────────────────────────── */

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within <AuthProvider>');
    }
    return ctx;
}
