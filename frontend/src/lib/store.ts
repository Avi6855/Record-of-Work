import { create } from 'zustand';

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organizationId: number;
  organizationName: string;
  roles: string[];
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setLoading: (loading) => set({ isLoading: loading }),
}));

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  toggleMobile: () => set((s) => ({ isMobileOpen: !s.isMobileOpen })),
  closeMobile: () => set({ isMobileOpen: false }),
}));

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  resolved: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  resolved: 'light',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    }
    set({ theme, resolved });
  },
}));
