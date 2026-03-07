import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PaidIcon from '@mui/icons-material/Paid';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
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

export function RequirementCard({ requirement, onClick, onToggleFavorite }: Props) {
  return (
    <Card variant="outlined" sx={{ position: 'relative' }}>
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {requirement.item_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {requirement.username}
          </Typography>
          <Typography variant="h6" mt={1}>
            {formatPrice(requirement.price)} TL
          </Typography>
          <Box display="flex" gap={1} mt={1} flexWrap="wrap" alignItems="center">
            <Chip
              label={STATUS_LABELS[requirement.status] ?? requirement.status}
              color={STATUS_COLORS[requirement.status] ?? 'default'}
              size="small"
            />
            {requirement.paid && (
              <Chip icon={<PaidIcon />} label="Ödendi" color="info" size="small" />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            {formatDate(requirement.created_at)}
          </Typography>
        </CardContent>
      </CardActionArea>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        sx={{ position: 'absolute', top: 8, right: 8 }}
        color={requirement.is_favorited ? 'error' : 'default'}
      >
        {requirement.is_favorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      </IconButton>
    </Card>
  );
}
