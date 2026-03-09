import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Box, Button, Checkbox, Chip, IconButton, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
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

const STATUS_DOT: Record<string, string> = {
  pending: '#d97706',
  accepted: '#16a34a',
  declined: '#dc2626',
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

interface Props {
  requirement: Requirement;
  onClick: () => void;
  onToggleFavorite: () => void;
  onUpdateStatus?: (status: 'accepted' | 'declined') => void;
  selected?: boolean;
  onSelect?: (id: number) => void;
}

export function RequirementRow({ requirement, onClick, onToggleFavorite, onUpdateStatus, selected, onSelect }: Props) {
  return (
    <TableRow
      hover
      selected={selected}
      sx={{
        cursor: 'pointer',
        '&:hover': { bgcolor: '#f8fafc' },
        borderLeft: `3px solid ${STATUS_DOT[requirement.status] ?? 'transparent'}`,
      }}
    >
      {onSelect && (
        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            size="small"
            checked={selected ?? false}
            onChange={() => onSelect(requirement.id)}
          />
        </TableCell>
      )}
      <TableCell onClick={onClick}>
        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 280 }}>
          {requirement.item_name}
        </Typography>
      </TableCell>
      <TableCell onClick={onClick}>
        <Typography variant="body2" color="text.secondary">
          {requirement.username}
        </Typography>
      </TableCell>
      <TableCell onClick={onClick}>
        <Typography variant="body2" fontWeight={600}>
          {formatPrice(requirement.price)} ₺
        </Typography>
      </TableCell>
      <TableCell onClick={onClick}>
        <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center">
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
                fontSize: '0.7rem',
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
                fontSize: '0.7rem',
              }}
            />
          )}
        </Box>
      </TableCell>
      <TableCell onClick={onClick}>
        <Box
          sx={{
            display: 'inline-flex',
            px: 1,
            py: 0.25,
            borderRadius: 1,
            bgcolor: requirement.paid ? '#f0fdf4' : '#fafafa',
            border: '1px solid',
            borderColor: requirement.paid ? '#bbf7d0' : '#e2e8f0',
          }}
        >
          <Typography variant="caption" fontWeight={500} color={requirement.paid ? 'success.main' : 'text.secondary'}>
            {requirement.paid ? 'Ödendi' : 'Ödenmedi'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell onClick={onClick}>
        <Typography variant="caption" color="text.secondary">
          {formatDate(requirement.created_at)}
        </Typography>
      </TableCell>
      <TableCell sx={{ width: onUpdateStatus && requirement.status === 'pending' ? 180 : 48, p: 0.5 }}>
        <Box display="flex" alignItems="center" gap={0.5}>
          {onUpdateStatus && requirement.status === 'pending' && (
            <>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckIcon sx={{ fontSize: '13px !important' }} />}
                onClick={(e) => { e.stopPropagation(); onUpdateStatus('accepted'); }}
                sx={{ fontSize: '0.72rem', py: 0.4, px: 1, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Onayla
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CloseIcon sx={{ fontSize: '13px !important' }} />}
                onClick={(e) => { e.stopPropagation(); onUpdateStatus('declined'); }}
                sx={{ fontSize: '0.72rem', py: 0.4, px: 1, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Reddet
              </Button>
            </>
          )}
          {onUpdateStatus && (requirement.status === 'accepted' || requirement.status === 'declined') && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<UndoIcon sx={{ fontSize: '13px !important' }} />}
              onClick={(e) => { e.stopPropagation(); onUpdateStatus(requirement.status as 'accepted' | 'declined'); }}
              sx={{ fontSize: '0.72rem', py: 0.4, px: 1, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', color: 'text.secondary' }}
            >
              Geri Al
            </Button>
          )}
          <Tooltip title={requirement.is_favorited ? 'Favoriden kaldır' : 'Favoriye ekle'}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            sx={{
              color: requirement.is_favorited ? 'error.main' : 'text.disabled',
              '&:hover': { color: 'error.main' },
            }}
          >
            {requirement.is_favorited ? (
              <FavoriteIcon fontSize="small" />
            ) : (
              <FavoriteBorderIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
}
