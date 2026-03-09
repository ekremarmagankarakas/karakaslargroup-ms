import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ mode: 'light', toggleMode: () => {} });

export function useThemeMode() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = 'kg_theme_mode';

function buildTheme(mode: ThemeMode) {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: '#2563eb', dark: '#1d4ed8', light: '#3b82f6', contrastText: '#ffffff' },
      secondary: { main: '#0891b2', contrastText: '#ffffff' },
      success: { main: '#16a34a' },
      warning: { main: '#d97706' },
      error: { main: '#dc2626' },
      background: {
        default: isDark ? '#0f172a' : '#f1f5f9',
        paper: isDark ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? '#334155' : '#e2e8f0',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 800, letterSpacing: '-0.03em' },
      h5: { fontWeight: 700, letterSpacing: '-0.02em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      body2: { lineHeight: 1.6 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'box-shadow 0.15s ease, transform 0.15s ease',
            '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: isDark ? '#334155' : '#e2e8f0' },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 8, letterSpacing: 0 },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 2px 8px rgba(37,99,235,0.25)' },
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 500, borderRadius: 6 } },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            color: isDark ? '#64748b' : '#94a3b8',
            fontSize: '0.68rem',
            letterSpacing: '0.1em',
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            paddingTop: 12,
            paddingBottom: 12,
          },
          body: {
            fontSize: '0.875rem',
            color: isDark ? '#cbd5e1' : '#334155',
            borderColor: isDark ? '#1e293b' : '#f1f5f9',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child td': { borderBottom: 0 },
            '&:hover td': { backgroundColor: isDark ? '#1e293b' : '#f8fafc' },
          },
        },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 16, boxShadow: '0 25px 50px rgba(0,0,0,0.15)' } },
      },
      MuiAppBar: {
        styleOverrides: { root: { boxShadow: 'none' } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
          },
          notchedOutline: { borderColor: isDark ? '#334155' : '#e2e8f0' },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { boxShadow: '0 6px 28px rgba(37,99,235,0.45)' },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 500, borderColor: isDark ? '#334155' : '#e2e8f0' },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: isDark ? '#334155' : '#e2e8f0' } },
      },
    },
  });
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'light'
  );

  const toggleMode = () => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const value = useMemo(() => ({ mode, toggleMode }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
