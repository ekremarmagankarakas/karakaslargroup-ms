import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Box, Button, Checkbox, IconButton, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import type { Requirement } from '../../../types';
import { formatDate, formatPrice } from '../../../utils/formatters';
import { RequirementStatusChip, PriorityChip, ColoredChip } from '../../common/StatusChip';

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
      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
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
          <RequirementStatusChip status={requirement.status} />
          {requirement.priority && requirement.priority !== 'normal' && (
            <PriorityChip priority={requirement.priority} />
          )}
          {requirement.category_name && (
            <ColoredChip
              label={requirement.category_name}
              color={requirement.category_color ?? '#64748b'}
            />
          )}
        </Box>
      </TableCell>
      <TableCell onClick={onClick}>
        <Typography variant="caption" color={requirement.paid ? 'success.main' : 'text.disabled'}>
          {requirement.paid ? 'Ödendi' : '—'}
        </Typography>
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
