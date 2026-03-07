import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Box, Chip, IconButton, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
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

interface Props {
  requirement: Requirement;
  onClick: () => void;
  onToggleFavorite: () => void;
}

export function RequirementRow({ requirement, onClick, onToggleFavorite }: Props) {
  return (
    <TableRow
      hover
      sx={{
        cursor: 'pointer',
        '&:hover': { bgcolor: '#f8fafc' },
        borderLeft: `3px solid ${STATUS_DOT[requirement.status] ?? 'transparent'}`,
      }}
    >
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
        <Chip
          label={STATUS_LABELS[requirement.status] ?? requirement.status}
          color={STATUS_COLORS[requirement.status] ?? 'default'}
          size="small"
        />
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
      <TableCell sx={{ width: 48, p: 0.5 }}>
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
      </TableCell>
    </TableRow>
  );
}
