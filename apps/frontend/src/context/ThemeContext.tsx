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

// ── Light palette tokens ───────────────────────────────────────────────────────
const L = {
  bg:        '#f8f9fc',
  surface:   '#ffffff',
  elevated:  '#ffffff',
  border:    '#e5e7eb',
  hover:     'rgba(0,0,0,0.04)',
  selected:  'rgba(67,56,202,0.08)',
  divider:   '#e5e7eb',

  textPrimary:   '#111827',
  textSecondary: '#6b7280',
  textDisabled:  '#9ca3af',

  primary:   '#4338ca',
  primaryDk: '#3730a3',
  primaryLt: '#6366f1',
  success:   '#16a34a',
  warning:   '#d97706',
  error:     '#dc2626',
  info:      '#0891b2',
};

// ── Dark palette tokens ────────────────────────────────────────────────────────
const D = {
  bg:        '#0f1117',
  surface:   '#1a1d27',
  elevated:  '#222536',
  border:    'rgba(255,255,255,0.08)',
  hover:     'rgba(255,255,255,0.05)',
  selected:  'rgba(129,140,248,0.14)',
  divider:   'rgba(255,255,255,0.08)',

  textPrimary:   '#f1f5f9',
  textSecondary: '#94a3b8',
  textDisabled:  '#475569',

  primary:   '#818cf8',
  primaryDk: '#6366f1',
  primaryLt: '#a5b4fc',
  success:   '#22c55e',
  warning:   '#f59e0b',
  error:     '#f87171',
  info:      '#38bdf8',
};

// ── Construction semantic status colors ────────────────────────────────────────
export const CONSTRUCTION_STATUS_COLORS = {
  planning:  { bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.25)',  text: '#0284c7' },
  active:    { bg: 'rgba(22,163,74,0.10)',   border: 'rgba(22,163,74,0.25)',   text: '#16a34a' },
  on_hold:   { bg: 'rgba(217,119,6,0.10)',   border: 'rgba(217,119,6,0.25)',   text: '#d97706' },
  completed: { bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.25)', text: '#64748b' },
  cancelled: { bg: 'rgba(220,38,38,0.10)',   border: 'rgba(220,38,38,0.25)',   text: '#dc2626' },
} as const;

// ── Procurement semantic status colors ─────────────────────────────────────────
export const PROCUREMENT_STATUS_COLORS = {
  pending:  { bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.20)',  text: '#d97706' },
  accepted: { bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.20)',  text: '#16a34a' },
  declined: { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.20)', text: '#dc2626' },
} as const;

// ── Priority colors ────────────────────────────────────────────────────────────
export const PRIORITY_COLORS = {
  low:    { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.20)', text: '#64748b' },
  normal: { bg: 'rgba(67,56,202,0.08)',   border: 'rgba(67,56,202,0.20)',   text: '#4338ca' },
  high:   { bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.20)',   text: '#d97706' },
  urgent: { bg: 'rgba(220,38,38,0.08)',   border: 'rgba(220,38,38,0.20)',   text: '#dc2626' },
} as const;

function buildTheme(mode: ThemeMode) {
  const isDark = mode === 'dark';
  const T = isDark ? D : L;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: T.primary,
        dark: T.primaryDk,
        light: T.primaryLt,
        contrastText: '#ffffff',
      },
      secondary: { main: isDark ? D.info : '#0891b2', contrastText: '#ffffff' },
      success:   { main: T.success },
      warning:   { main: T.warning },
      error:     { main: T.error },
      info:      { main: T.info },
      background: {
        default: T.bg,
        paper:   T.surface,
      },
      text: {
        primary:   T.textPrimary,
        secondary: T.textSecondary,
        disabled:  T.textDisabled,
      },
      divider: T.divider,
      action: {
        hover:              T.hover,
        selected:           T.selected,
        disabledBackground: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      },
    },
    typography: {
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
      h1: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 },
      h2: { fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.3 },
      h3: { fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35 },
      h4: { fontSize: '0.9375rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.4 },
      h5: { fontSize: '0.875rem', fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.4 },
      h6: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.4 },
      subtitle1: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 },
      subtitle2: { fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.5 },
      body1: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.6 },
      body2: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.5 },
      caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.5, color: T.textSecondary },
      overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', lineHeight: 1.5, textTransform: 'uppercase' },
    },
    shape: { borderRadius: 8 },
    components: {
      // ── Card ──────────────────────────────────────────────────────────────────
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: isDark
              ? '0 1px 3px rgba(0,0,0,0.4)'
              : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.15s ease, transform 0.15s ease',
            '&:hover': {
              boxShadow: isDark
                ? '0 4px 16px rgba(0,0,0,0.6)'
                : '0 4px 12px rgba(0,0,0,0.12)',
            },
          },
        },
      },
      // ── Paper ─────────────────────────────────────────────────────────────────
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: T.surface,
          },
          outlined: {
            borderColor: T.border,
          },
          elevation1: {
            boxShadow: isDark
              ? '0 1px 3px rgba(0,0,0,0.4)'
              : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
          },
        },
      },
      // ── AppBar ────────────────────────────────────────────────────────────────
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            backgroundColor: T.surface,
            borderBottom: `1px solid ${T.border}`,
            color: T.textPrimary,
            backdropFilter: 'blur(8px)',
          },
        },
      },
      // ── Button ────────────────────────────────────────────────────────────────
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 6,
            letterSpacing: 0,
            fontSize: '0.8125rem',
            padding: '5px 14px',
          },
          sizeSmall: {
            fontSize: '0.75rem',
            padding: '3px 10px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
              backgroundColor: isDark ? D.primaryLt : L.primaryDk,
            },
          },
          outlined: {
            borderColor: T.border,
            '&:hover': {
              borderColor: isDark ? D.primary : L.primary,
              backgroundColor: T.hover,
            },
          },
          text: {
            '&:hover': { backgroundColor: T.hover },
          },
        },
      },
      // ── IconButton ────────────────────────────────────────────────────────────
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            '&:hover': { backgroundColor: T.hover },
          },
        },
      },
      // ── Chip ─────────────────────────────────────────────────────────────────
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            height: 24,
            fontSize: '0.75rem',
            fontWeight: 500,
            '& .MuiChip-label': { paddingLeft: 8, paddingRight: 8 },
          },
          sizeSmall: {
            height: 20,
            fontSize: '0.6875rem',
          },
          colorDefault: isDark ? { backgroundColor: D.elevated, color: D.textSecondary } : {},
        },
      },
      // ── TextField ─────────────────────────────────────────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontSize: '0.875rem',
            backgroundColor: isDark ? D.elevated : L.surface,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#d1d5db',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: T.primary,
              borderWidth: 1,
            },
          },
          notchedOutline: { borderColor: T.border },
          input: {
            color: T.textPrimary,
            '&::placeholder': { color: T.textDisabled, opacity: 1 },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            color: T.textSecondary,
            '&.Mui-focused': { color: T.primary },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: { fontSize: '0.875rem' },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: { color: T.textSecondary },
        },
      },
      // ── Tabs ─────────────────────────────────────────────────────────────────
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 40 },
          indicator: {
            height: 2,
            borderRadius: '2px 2px 0 0',
            backgroundColor: T.primary,
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
            fontWeight: 400,
            fontSize: '0.8125rem',
            minHeight: 40,
            padding: '8px 14px',
            letterSpacing: 0,
            color: T.textSecondary,
            '&.Mui-selected': {
              fontWeight: 600,
              color: T.primary,
            },
          },
        },
      },
      // ── Dialog ───────────────────────────────────────────────────────────────
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            backgroundColor: isDark ? D.elevated : L.surface,
            border: isDark ? `1px solid ${D.border}` : 'none',
            boxShadow: isDark
              ? '0 25px 60px rgba(0,0,0,0.75)'
              : '0 25px 50px rgba(0,0,0,0.15)',
            backgroundImage: 'none',
          },
          root: isDark ? {
            '& .MuiBackdrop-root': {
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0,0,0,0.7)',
            },
          } : {},
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: '0.9375rem',
            fontWeight: 600,
            padding: '20px 24px 12px',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { padding: '8px 24px 16px' },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { padding: '12px 24px 20px', gap: 8 },
        },
      },
      // ── Menu ─────────────────────────────────────────────────────────────────
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 8,
            backgroundColor: isDark ? D.elevated : L.surface,
            border: isDark ? `1px solid ${D.border}` : `1px solid ${L.border}`,
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.6)'
              : '0 4px 16px rgba(0,0,0,0.12)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.8125rem',
            borderRadius: 4,
            margin: '1px 4px',
            padding: '7px 10px',
            '&:hover': { backgroundColor: T.hover },
            '&.Mui-selected': {
              backgroundColor: T.selected,
              '&:hover': { backgroundColor: T.selected },
            },
          },
        },
      },
      // ── Table ─────────────────────────────────────────────────────────────────
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            fontSize: '0.6875rem',
            color: T.textSecondary,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            backgroundColor: isDark ? D.bg : '#f8f9fc',
            borderBottom: `1px solid ${T.border}`,
            paddingTop: 10,
            paddingBottom: 10,
          },
          body: {
            fontSize: '0.8125rem',
            color: T.textPrimary,
            borderColor: T.border,
            padding: '10px 16px',
          },
          sizeSmall: {
            padding: '7px 12px',
            fontSize: '0.8125rem',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child td': { borderBottom: 0 },
            '&:hover td': { backgroundColor: T.hover },
            transition: 'background-color 0.1s ease',
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
      // ── Divider ───────────────────────────────────────────────────────────────
      MuiDivider: {
        styleOverrides: { root: { borderColor: T.border } },
      },
      // ── LinearProgress ────────────────────────────────────────────────────────
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
          },
        },
      },
      // ── Skeleton ──────────────────────────────────────────────────────────────
      MuiSkeleton: {
        styleOverrides: {
          root: { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f0f2f5' },
        },
      },
      // ── Tooltip ───────────────────────────────────────────────────────────────
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? D.elevated : '#1f2937',
            border: isDark ? `1px solid ${D.border}` : 'none',
            color: isDark ? D.textPrimary : '#f9fafb',
            fontSize: '0.75rem',
            fontWeight: 400,
            padding: '5px 9px',
            borderRadius: 5,
          },
          arrow: { color: isDark ? D.elevated : '#1f2937' },
        },
      },
      // ── Badge ────────────────────────────────────────────────────────────────
      MuiBadge: {
        styleOverrides: {
          badge: { fontWeight: 600, fontSize: '0.65rem', minWidth: 16, height: 16 },
        },
      },
      // ── Accordion ─────────────────────────────────────────────────────────────
      MuiAccordion: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${T.border}`,
            borderRadius: '8px !important',
            '&:not(:last-child)': { marginBottom: 6 },
            '&::before': { display: 'none' },
            '&.Mui-expanded': { margin: '0 0 6px 0' },
            backgroundColor: T.surface,
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: { minHeight: 48, '&.Mui-expanded': { minHeight: 48 } },
          content: { '&.Mui-expanded': { margin: '12px 0' } },
        },
      },
      // ── Fab ───────────────────────────────────────────────────────────────────
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: isDark
              ? '0 4px 20px rgba(129,140,248,0.45)'
              : '0 4px 20px rgba(67,56,202,0.35)',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8125rem',
            '&:hover': {
              boxShadow: isDark
                ? '0 6px 28px rgba(129,140,248,0.55)'
                : '0 6px 28px rgba(67,56,202,0.45)',
            },
          },
        },
      },
      // ── ToggleButton ──────────────────────────────────────────────────────────
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.8125rem',
            borderColor: T.border,
            color: T.textSecondary,
            padding: '5px 12px',
            '&.Mui-selected': {
              backgroundColor: isDark ? D.selected : L.selected,
              color: T.primary,
              borderColor: T.primary,
              '&:hover': {
                backgroundColor: isDark ? D.selected : L.selected,
              },
            },
          },
        },
      },
      // ── Alert ─────────────────────────────────────────────────────────────────
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontSize: '0.8125rem',
          },
        },
      },
      // ── Avatar ────────────────────────────────────────────────────────────────
      MuiAvatar: {
        styleOverrides: {
          root: { fontSize: '0.75rem', fontWeight: 700 },
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
