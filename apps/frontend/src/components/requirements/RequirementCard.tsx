import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Box, Button, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import type { Requirement } from '../../types';
import { formatDate, formatPrice } from '../../utils/formatters';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  accepted: 'Onaylandı',
  declined: 'Reddedildi',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Düşük',
  normal: 'Normal',
  high: 'Yüksek',
  urgent: 'Acil',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b',
  normal: '#2563eb',
  high: '#d97706',
  urgent: '#dc2626',
};

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  accepted: 'success',
  declined: 'error',
};

const STATUS_ACCENT: Record<string, string> = {
  pending: '#d97706',
  accepted: '#16a34a',
  declined: '#dc2626',
};

interface Props {
  requirement: Requirement;
  onClick: () => void;
  onToggleFavorite: () => void;
  onUpdateStatus?: (status: 'accepted' | 'declined') => void;
}

export function RequirementCard({ requirement, onClick, onToggleFavorite, onUpdateStatus }: Props) {
  const accent = STATUS_ACCENT[requirement.status] ?? '#94a3b8';

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        borderTop: `3px solid ${accent}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)',
        },
        p: 2.5,
        pr: 4.5,
      }}
    >
      {/* Item name */}
      <Typography
        variant="subtitle2"
        fontWeight={600}
        noWrap
        title={requirement.item_name}
        sx={{ color: 'text.primary', mb: 0.25 }}
      >
        {requirement.item_name}
      </Typography>

      {/* Username */}
      <Typography variant="caption" color="text.secondary">
        {requirement.username}
      </Typography>

      {/* Price */}
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '1.25rem',
          letterSpacing: '-0.02em',
          color: 'text.primary',
          mt: 1.5,
          mb: 1.5,
          lineHeight: 1,
          fontFamily: '"Inter", sans-serif',
        }}
      >
        ₺{formatPrice(requirement.price)}
      </Typography>

      {/* Status + paid + priority */}
      <Box display="flex" gap={0.75} flexWrap="wrap" alignItems="center">
        <Chip
          label={STATUS_LABELS[requirement.status] ?? requirement.status}
          color={STATUS_COLORS[requirement.status] ?? 'default'}
          size="small"
        />
        {requirement.priority && requirement.priority !== 'normal' && (
          <Chip
            label={PRIORITY_LABELS[requirement.priority] ?? requirement.priority}
            size="small"
            sx={{
              bgcolor: `${PRIORITY_COLORS[requirement.priority]}18`,
              color: PRIORITY_COLORS[requirement.priority],
              fontWeight: 600,
              border: `1px solid ${PRIORITY_COLORS[requirement.priority]}40`,
            }}
          />
        )}
        {requirement.category_name && (
          <Chip
            label={requirement.category_name}
            size="small"
            sx={{
              bgcolor: requirement.category_color ? `${requirement.category_color}18` : '#f1f5f9',
              color: requirement.category_color ?? '#64748b',
              border: `1px solid ${requirement.category_color ? `${requirement.category_color}40` : '#e2e8f0'}`,
            }}
          />
        )}
        {requirement.paid && (
          <Chip label="Ödendi" color="info" size="small" variant="outlined" />
        )}
      </Box>

      {/* Date */}
      <Typography variant="caption" color="text.disabled" display="block" mt={1.5}>
        {formatDate(requirement.created_at)}
      </Typography>

      {/* Status action buttons */}
      {onUpdateStatus && (
        <Box display="flex" gap={0.75} mt={1.5} onClick={(e) => e.stopPropagation()}>
          {requirement.status === 'pending' && (
            <>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => onUpdateStatus('accepted')}
                sx={{ flex: 1, fontSize: '0.72rem', py: 0.5, textTransform: 'none', fontWeight: 600 }}
              >
                Onayla
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CloseIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => onUpdateStatus('declined')}
                sx={{ flex: 1, fontSize: '0.72rem', py: 0.5, textTransform: 'none', fontWeight: 600 }}
              >
                Reddet
              </Button>
            </>
          )}
          {(requirement.status === 'accepted' || requirement.status === 'declined') && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<UndoIcon sx={{ fontSize: '14px !important' }} />}
              onClick={() => onUpdateStatus(requirement.status as 'accepted' | 'declined')}
              sx={{ flex: 1, fontSize: '0.72rem', py: 0.5, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
            >
              Geri Al
            </Button>
          )}
        </Box>
      )}

      {/* Favorite button */}
      <Tooltip title={requirement.is_favorited ? 'Favoriden kaldır' : 'Favoriye ekle'}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            color: requirement.is_favorited ? 'error.main' : '#cbd5e1',
            transition: 'color 0.15s ease',
            '&:hover': { color: 'error.main', bgcolor: '#fef2f2' },
          }}
        >
          {requirement.is_favorited ? (
            <FavoriteIcon sx={{ fontSize: 18 }} />
          ) : (
            <FavoriteBorderIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
