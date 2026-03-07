import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import type { Requirement } from '../../types';
import { formatDate, formatPrice } from '../../utils/formatters';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  accepted: 'Onaylandı',
  declined: 'Reddedildi',
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
}

export function RequirementCard({ requirement, onClick, onToggleFavorite }: Props) {
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

      {/* Status + paid */}
      <Box display="flex" gap={0.75} flexWrap="wrap" alignItems="center">
        <Chip
          label={STATUS_LABELS[requirement.status] ?? requirement.status}
          color={STATUS_COLORS[requirement.status] ?? 'default'}
          size="small"
        />
        {requirement.paid && (
          <Chip label="Ödendi" color="info" size="small" variant="outlined" />
        )}
      </Box>

      {/* Date */}
      <Typography variant="caption" color="text.disabled" display="block" mt={1.5}>
        {formatDate(requirement.created_at)}
      </Typography>

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
