import { Chip } from '@mui/material';
import type { ConstructionProjectStatus } from '../../types';
import { CONSTRUCTION_STATUS_COLORS } from '../../context/ThemeContext';

// ── Construction project status ──────────────────────────────────────────────

const PROJECT_STATUS_LABELS: Record<ConstructionProjectStatus, string> = {
  planning: 'Planlama',
  active: 'Aktif',
  on_hold: 'Beklemede',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

interface ProjectStatusChipProps {
  status: ConstructionProjectStatus;
  size?: 'small' | 'medium';
}

export function ProjectStatusChip({ status, size = 'small' }: ProjectStatusChipProps) {
  const colors = CONSTRUCTION_STATUS_COLORS[status];
  return (
    <Chip
      label={PROJECT_STATUS_LABELS[status]}
      size={size}
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.7rem' : '0.8rem',
        height: size === 'small' ? 22 : 28,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}

// ── Health status chip (green / amber / red) ─────────────────────────────────

type HealthStatus = 'green' | 'amber' | 'red';

const HEALTH_COLORS: Record<HealthStatus, { bg: string; border: string; text: string; label: string }> = {
  green: { bg: 'rgba(22,163,74,0.10)',  border: 'rgba(22,163,74,0.30)',  text: '#16a34a', label: 'İyi' },
  amber: { bg: 'rgba(217,119,6,0.10)',  border: 'rgba(217,119,6,0.30)',  text: '#d97706', label: 'Dikkat' },
  red:   { bg: 'rgba(220,38,38,0.10)',  border: 'rgba(220,38,38,0.30)',  text: '#dc2626', label: 'Kritik' },
};

interface HealthChipProps {
  status: HealthStatus;
  label?: string;
  size?: 'small' | 'medium';
}

export function HealthChip({ status, label, size = 'small' }: HealthChipProps) {
  const colors = HEALTH_COLORS[status];
  return (
    <Chip
      label={label ?? colors.label}
      size={size}
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.7rem' : '0.8rem',
        height: size === 'small' ? 22 : 28,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}

// ── Generic colored chip ──────────────────────────────────────────────────────

interface ColoredChipProps {
  label: string;
  color: string; // hex or named color
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

/** Renders a chip with rgba background derived from the given color string */
export function ColoredChip({ label, color, size = 'small', variant = 'filled' }: ColoredChipProps) {
  const isRgba = color.startsWith('rgba') || color.startsWith('rgb');
  const bg = variant === 'outlined' ? 'transparent' : isRgba ? color : `${color}18`;
  const border = isRgba ? color.replace(/[\d.]+\)$/, '0.3)') : `${color}40`;

  return (
    <Chip
      label={label}
      size={size}
      variant="outlined"
      sx={{
        bgcolor: bg,
        color,
        borderColor: border,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.7rem' : '0.8rem',
        height: size === 'small' ? 22 : 28,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}
