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

// ── Dark palette tokens ────────────────────────────────────────────────────────
// Three-layer elevation: bg (deepest) → surface (cards/paper) → overlay (modals)
const D = {
  bg:        '#10131a',   // page background
  surface:   '#181c27',   // cards, drawers, AppBar
  overlay:   '#1e2333',   // dialogs, popovers
  border:    '#252c3d',   // subtle borders
  hover:     '#1e2333',   // row / item hover
  divider:   '#252c3d',

  textPrimary:   '#dde3f0',  // main readable text (slightly cool white)
  textSecondary: '#7a87a3',  // muted labels
  textDisabled:  '#454f66',

  // Accent colors brightened for dark backgrounds
  primary:   '#5b8ef5',   // lighter, more vibrant blue
  primaryDk: '#3d6fd4',
  primaryLt: '#7aaaf8',
  success:   '#34d399',   // mint green
  warning:   '#fbbf24',   // bright amber
  error:     '#f87171',   // soft coral red
  info:      '#38bdf8',   // sky blue
};

// ── Construction semantic status colors ────────────────────────────────────────
// Used via CSS custom properties so construction components can reference them
// without hardcoding per-component
export const CONSTRUCTION_STATUS_COLORS = {
  planning:  { bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.30)',  text: '#0284c7' },
  active:    { bg: 'rgba(22,163,74,0.10)',   border: 'rgba(22,163,74,0.30)',   text: '#16a34a' },
  on_hold:   { bg: 'rgba(217,119,6,0.10)',   border: 'rgba(217,119,6,0.30)',   text: '#d97706' },
  completed: { bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.30)', text: '#64748b' },
  cancelled: { bg: 'rgba(220,38,38,0.10)',   border: 'rgba(220,38,38,0.30)',   text: '#dc2626' },
} as const;

function buildTheme(mode: ThemeMode) {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? D.primary : '#2563eb',
        dark: isDark ? D.primaryDk : '#1d4ed8',
        light: isDark ? D.primaryLt : '#3b82f6',
        contrastText: '#ffffff',
      },
      secondary: { main: isDark ? D.info : '#0891b2', contrastText: '#ffffff' },
      success: { main: isDark ? D.success : '#16a34a' },
      warning: { main: isDark ? D.warning : '#d97706' },
      error: { main: isDark ? D.error : '#dc2626' },
      info: { main: isDark ? D.info : '#0891b2' },
      background: {
        default: isDark ? D.bg : '#f1f5f9',
        paper: isDark ? D.surface : '#ffffff',
      },
      text: {
        primary: isDark ? D.textPrimary : '#0f172a',
        secondary: isDark ? D.textSecondary : '#64748b',
        disabled: isDark ? D.textDisabled : '#94a3b8',
      },
      divider: isDark ? D.divider : '#e2e8f0',
      action: {
        hover: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        selected: isDark ? 'rgba(91,142,245,0.12)' : 'rgba(37,99,235,0.08)',
        disabledBackground: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      },
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
            border: `1px solid ${isDark ? D.border : '#e2e8f0'}`,
            borderRadius: 12,
            backgroundColor: isDark ? D.surface : '#ffffff',
            boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'box-shadow 0.15s ease, transform 0.15s ease',
            '&:hover': {
              boxShadow: isDark ? '0 8px 28px rgba(0,0,0,0.55)' : '0 8px 24px rgba(0,0,0,0.08)',
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? D.surface : '#ffffff',
          },
          outlined: { borderColor: isDark ? D.border : '#e2e8f0' },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            backgroundColor: isDark ? D.surface : '#ffffff',
            borderBottom: `1px solid ${isDark ? D.border : '#e2e8f0'}`,
            color: isDark ? D.textPrimary : '#0f172a',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 8, letterSpacing: 0 },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: isDark
                ? '0 2px 12px rgba(91,142,245,0.35)'
                : '0 2px 8px rgba(37,99,235,0.25)',
            },
          },
          outlined: {
            borderColor: isDark ? D.border : '#e2e8f0',
            '&:hover': { borderColor: isDark ? D.primary : '#2563eb', backgroundColor: isDark ? 'rgba(91,142,245,0.08)' : undefined },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, borderRadius: 6 },
          colorDefault: isDark ? { backgroundColor: D.overlay, color: D.textSecondary } : {},
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            color: isDark ? D.textDisabled : '#94a3b8',
            fontSize: '0.68rem',
            letterSpacing: '0.1em',
            backgroundColor: isDark ? D.bg : '#f8fafc',
            borderBottom: `1px solid ${isDark ? D.border : '#e2e8f0'}`,
            paddingTop: 12,
            paddingBottom: 12,
          },
          body: {
            fontSize: '0.875rem',
            color: isDark ? D.textPrimary : '#334155',
            borderColor: isDark ? D.border : '#f1f5f9',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child td': { borderBottom: 0 },
            '&:hover td': { backgroundColor: isDark ? D.hover : '#f8fafc' },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            backgroundColor: isDark ? D.overlay : '#ffffff',
            border: isDark ? `1px solid ${D.border}` : 'none',
            boxShadow: isDark
              ? '0 25px 60px rgba(0,0,0,0.7)'
              : '0 25px 50px rgba(0,0,0,0.15)',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? D.overlay : '#ffffff',
            border: isDark ? `1px solid ${D.border}` : 'none',
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.6)' : undefined,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : undefined },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDark ? D.overlay : '#ffffff',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#3a4459' : '#cbd5e1',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? D.primary : '#2563eb',
            },
          },
          notchedOutline: { borderColor: isDark ? D.border : '#e2e8f0' },
          input: { color: isDark ? D.textPrimary : '#0f172a' },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { color: isDark ? D.textSecondary : '#64748b' },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: { color: isDark ? D.textSecondary : '#94a3b8' },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: isDark
              ? '0 4px 20px rgba(91,142,245,0.45)'
              : '0 4px 20px rgba(37,99,235,0.35)',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              boxShadow: isDark
                ? '0 6px 28px rgba(91,142,245,0.55)'
                : '0 6px 28px rgba(37,99,235,0.45)',
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderColor: isDark ? D.border : '#e2e8f0',
            color: isDark ? D.textSecondary : undefined,
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(91,142,245,0.15)' : undefined,
              color: isDark ? D.primary : undefined,
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: isDark ? D.border : '#e2e8f0' } },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { backgroundColor: isDark ? D.border : undefined },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: { backgroundColor: isDark ? D.overlay : undefined },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? D.overlay : '#1e293b',
            border: isDark ? `1px solid ${D.border}` : 'none',
            color: isDark ? D.textPrimary : '#f1f5f9',
          },
          arrow: { color: isDark ? D.overlay : '#1e293b' },
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: { fontWeight: 700 },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 44,
          },
          indicator: {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
          scrollButtons: {
            '&.Mui-disabled': { opacity: 0.3 },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.8125rem',
            minHeight: 44,
            padding: '8px 14px',
            letterSpacing: 0,
            '&.Mui-selected': { fontWeight: 700 },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            '& thead th': {
              position: 'sticky',
              top: 0,
              zIndex: 1,
            },
          },
        },
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
