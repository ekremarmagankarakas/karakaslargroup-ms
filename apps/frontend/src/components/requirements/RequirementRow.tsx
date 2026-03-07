import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Chip, IconButton, TableCell, TableRow, Typography } from '@mui/material';
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

interface Props {
  requirement: Requirement;
  onClick: () => void;
  onToggleFavorite: () => void;
}

export function RequirementRow({ requirement, onClick, onToggleFavorite }: Props) {
  return (
    <TableRow hover sx={{ cursor: 'pointer' }}>
      <TableCell onClick={onClick}>
        <Typography variant="body2" fontWeight={500}>
          {requirement.item_name}
        </Typography>
      </TableCell>
      <TableCell onClick={onClick}>{requirement.username}</TableCell>
      <TableCell onClick={onClick}>{formatPrice(requirement.price)} TL</TableCell>
      <TableCell onClick={onClick}>
        <Chip
          label={STATUS_LABELS[requirement.status] ?? requirement.status}
          color={STATUS_COLORS[requirement.status] ?? 'default'}
          size="small"
        />
      </TableCell>
      <TableCell onClick={onClick}>{requirement.paid ? 'Ödendi' : 'Ödenmedi'}</TableCell>
      <TableCell onClick={onClick}>
        <Typography variant="caption">{formatDate(requirement.created_at)}</Typography>
      </TableCell>
      <TableCell>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          color={requirement.is_favorited ? 'error' : 'default'}
        >
          {requirement.is_favorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
