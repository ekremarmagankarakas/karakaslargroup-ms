import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Box, Button, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import type { Requirement } from '../../../types';
import { formatDate, formatPrice } from '../../../utils/formatters';
import { RequirementStatusChip, PriorityChip, ColoredChip } from '../../common/StatusChip';

interface Props {
  requirement: Requirement;
  onClick: () => void;
  onToggleFavorite: () => void;
  onUpdateStatus?: (status: 'accepted' | 'declined') => void;
}

export function RequirementCard({ requirement, onClick, onToggleFavorite, onUpdateStatus }: Props) {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s ease',
        '&:hover': { boxShadow: 3 },
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
          fontFamily: '"Fraunces", serif',
        }}
      >
        ₺{formatPrice(requirement.price)}
      </Typography>

      {/* Status + paid + priority */}
      <Box display="flex" gap={0.75} flexWrap="wrap" alignItems="center">
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
            color: requirement.is_favorited ? 'error.main' : 'text.disabled',
            transition: 'color 0.15s ease',
            '&:hover': { color: 'error.main', bgcolor: 'action.hover' },
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
