import FavoriteIcon from '@mui/icons-material/Favorite';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useFavorites, useToggleFavorite } from '../../../hooks/procurement/useFavorites';
import type { Requirement } from '../../../types';
import { ls } from '../../../utils/localStorage';
import { PaginationControls } from '../../common/PaginationControls';
import { RequirementCard } from '../requirements/RequirementCard';
import { RequirementModal } from '../requirements/RequirementModal';
import { RequirementRow } from '../requirements/RequirementRow';

export function FavoritesSection() {
  const [page, setPage] = useState(1);
  const [layout, setLayout] = useState(() => ls.getLayoutPreferenceFav());
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);

  const { data, isLoading } = useFavorites(page);
  const toggleFavorite = useToggleFavorite();

  const handleLayoutChange = (newLayout: 'grid-layout' | 'list-layout') => {
    setLayout(newLayout);
    ls.setLayoutPreferenceFav(newLayout);
  };

  return (
    <>
      {/* Layout toggle — only show when there's content */}
      {data && data.items.length > 0 && (
        <Box display="flex" justifyContent="flex-end" mb={1.5}>
          <Box display="flex" gap={0.5}>
            <Tooltip title="Kart görünümü">
              <IconButton
                size="small"
                onClick={() => handleLayoutChange('grid-layout')}
                sx={{
                  color: layout === 'grid-layout' ? 'primary.main' : 'text.disabled',
                  bgcolor: layout === 'grid-layout' ? 'action.selected' : 'transparent',
                  borderRadius: 1.5,
                }}
              >
                <GridViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Liste görünümü">
              <IconButton
                size="small"
                onClick={() => handleLayoutChange('list-layout')}
                sx={{
                  color: layout === 'list-layout' ? 'primary.main' : 'text.disabled',
                  bgcolor: layout === 'list-layout' ? 'action.selected' : 'transparent',
                  borderRadius: 1.5,
                }}
              >
                <ViewListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      {isLoading ? (
        layout === 'grid-layout' ? (
          <Grid container spacing={2}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <CircularProgress size={24} />
        )
      ) : !data || data.items.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 5,
            color: 'text.disabled',
          }}
        >
          <FavoriteIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Henüz favori talep eklemediniz
          </Typography>
          <Typography variant="caption" color="text.disabled" align="center">
            Taleplerin yanındaki kalp ikonuna tıklayarak favoriye ekleyebilirsiniz.
          </Typography>
        </Box>
      ) : layout === 'grid-layout' ? (
        <Grid container spacing={2}>
          {data.items.map((req) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={req.id}>
              <RequirementCard
                requirement={req}
                onClick={() => setSelectedReq(req)}
                onToggleFavorite={() =>
                  toggleFavorite.mutate({ requirementId: req.id, isFavorited: req.is_favorited })
                }
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ÜRÜN</TableCell>
                <TableCell>KULLANICI</TableCell>
                <TableCell>FİYAT</TableCell>
                <TableCell>DURUM</TableCell>
                <TableCell>ÖDEME</TableCell>
                <TableCell>TARİH</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((req) => (
                <RequirementRow
                  key={req.id}
                  requirement={req}
                  onClick={() => setSelectedReq(req)}
                  onToggleFavorite={() =>
                    toggleFavorite.mutate({ requirementId: req.id, isFavorited: req.is_favorited })
                  }
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {data && <PaginationControls page={page} totalPages={data.total_pages} onChange={setPage} />}

      <RequirementModal
        requirement={selectedReq}
        open={selectedReq !== null}
        onClose={() => setSelectedReq(null)}
      />
    </>
  );
}
