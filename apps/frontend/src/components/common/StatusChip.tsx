import { Chip } from '@mui/material';
import {
  CONSTRUCTION_STATUS_COLORS,
  PROCUREMENT_STATUS_COLORS,
  PRIORITY_COLORS,
} from '../../context/ThemeContext';
import type {
  ConstructionProjectStatus,
  RequirementStatus,
  RequirementPriority,
} from '../../types';

// ── Construction project status ───────────────────────────────────────────────

const PROJECT_STATUS_LABELS: Record<ConstructionProjectStatus, string> = {
  planning:  'Planlama',
  active:    'Aktif',
  on_hold:   'Beklemede',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

interface ProjectStatusChipProps {
  status: ConstructionProjectStatus;
  size?: 'small' | 'medium';
}

export function ProjectStatusChip({ status, size = 'small' }: ProjectStatusChipProps) {
  const c = CONSTRUCTION_STATUS_COLORS[status];
  return (
    <Chip
      label={PROJECT_STATUS_LABELS[status]}
      size={size}
      sx={{
        bgcolor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        fontWeight: 600,
      }}
    />
  );
}

// ── Procurement requirement status ────────────────────────────────────────────

const REQ_STATUS_LABELS: Record<RequirementStatus, string> = {
  pending:  'Beklemede',
  accepted: 'Onaylandı',
  declined: 'Reddedildi',
};

interface RequirementStatusChipProps {
  status: RequirementStatus;
  size?: 'small' | 'medium';
}

export function RequirementStatusChip({ status, size = 'small' }: RequirementStatusChipProps) {
  const c = PROCUREMENT_STATUS_COLORS[status];
  return (
    <Chip
      label={REQ_STATUS_LABELS[status]}
      size={size}
      sx={{
        bgcolor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        fontWeight: 600,
      }}
    />
  );
}

// ── Priority chip ─────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<RequirementPriority, string> = {
  low:    'Düşük',
  normal: 'Normal',
  high:   'Yüksek',
  urgent: 'Acil',
};

interface PriorityChipProps {
  priority: RequirementPriority;
  size?: 'small' | 'medium';
}

export function PriorityChip({ priority, size = 'small' }: PriorityChipProps) {
  const c = PRIORITY_COLORS[priority];
  return (
    <Chip
      label={PRIORITY_LABELS[priority]}
      size={size}
      sx={{
        bgcolor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        fontWeight: 600,
      }}
    />
  );
}

// ── Health status chip (green / amber / red) ──────────────────────────────────

type HealthStatus = 'green' | 'amber' | 'red';

const HEALTH_COLORS: Record<HealthStatus, { bg: string; border: string; text: string; label: string }> = {
  green: { bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.20)',  text: '#16a34a', label: 'İyi' },
  amber: { bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.20)',  text: '#d97706', label: 'Dikkat' },
  red:   { bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.20)',  text: '#dc2626', label: 'Kritik' },
};

interface HealthChipProps {
  status: HealthStatus;
  label?: string;
  size?: 'small' | 'medium';
}

export function HealthChip({ status, label, size = 'small' }: HealthChipProps) {
  const c = HEALTH_COLORS[status];
  return (
    <Chip
      label={label ?? c.label}
      size={size}
      sx={{
        bgcolor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        fontWeight: 600,
      }}
    />
  );
}

// ── Generic colored chip ──────────────────────────────────────────────────────

interface ColoredChipProps {
  label: string;
  color: string;
  size?: 'small' | 'medium';
}

export function ColoredChip({ label, color, size = 'small' }: ColoredChipProps) {
  const bg = `${color}14`;
  const border = `${color}33`;
  return (
    <Chip
      label={label}
      size={size}
      sx={{
        bgcolor: bg,
        color,
        border: `1px solid ${border}`,
        fontWeight: 600,
      }}
    />
  );
}
