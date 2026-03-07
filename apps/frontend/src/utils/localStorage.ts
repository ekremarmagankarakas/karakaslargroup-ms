import type { User } from '../types';

type LayoutPreference = 'grid-layout' | 'list-layout';
type StylePreference = 'sectioned' | 'all';

export const ls = {
  getStatisticsVisible: (): boolean => localStorage.getItem('statisticsVisible') === 'true',
  setStatisticsVisible: (v: boolean) => localStorage.setItem('statisticsVisible', String(v)),

  getInboxVisible: (): boolean => localStorage.getItem('inboxVisible') !== 'false',
  setInboxVisible: (v: boolean) => localStorage.setItem('inboxVisible', String(v)),

  getFavoritesVisible: (): boolean => localStorage.getItem('favoritesVisible') === 'true',
  setFavoritesVisible: (v: boolean) => localStorage.setItem('favoritesVisible', String(v)),

  getSidebarHidden: (): boolean => localStorage.getItem('sidebarHidden') === 'true',
  setSidebarHidden: (v: boolean) => localStorage.setItem('sidebarHidden', String(v)),

  getLayoutPreference: (): LayoutPreference =>
    (localStorage.getItem('layoutPreference') as LayoutPreference) || 'grid-layout',
  setLayoutPreference: (v: LayoutPreference) => localStorage.setItem('layoutPreference', v),

  getLayoutPreferenceFav: (): LayoutPreference =>
    (localStorage.getItem('layoutPreferenceFav') as LayoutPreference) || 'grid-layout',
  setLayoutPreferenceFav: (v: LayoutPreference) => localStorage.setItem('layoutPreferenceFav', v),

  getStylePreference: (): StylePreference =>
    (localStorage.getItem('stylePreference') as StylePreference) || 'sectioned',
  setStylePreference: (v: StylePreference) => localStorage.setItem('stylePreference', v),

  getAccessToken: (): string | null => localStorage.getItem('auth_access_token'),
  setAccessToken: (v: string) => localStorage.setItem('auth_access_token', v),
  removeAccessToken: () => localStorage.removeItem('auth_access_token'),

  getRefreshToken: (): string | null => localStorage.getItem('auth_refresh_token'),
  setRefreshToken: (v: string) => localStorage.setItem('auth_refresh_token', v),
  removeRefreshToken: () => localStorage.removeItem('auth_refresh_token'),

  getUser: (): User | null => {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: User) => localStorage.setItem('auth_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('auth_user'),

  clearAuth: () => {
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
  },
};
