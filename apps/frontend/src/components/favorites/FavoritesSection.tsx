import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useFavorites, useToggleFavorite } from '../../hooks/useFavorites';
import type { Requirement } from '../../types';
import { ls } from '../../utils/localStorage';
import { PaginationControls } from '../common/PaginationControls';
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Favoriler</Typography>
        <Box>
          <IconButton onClick={() => handleLayoutChange('grid-layout')} color={layout === 'grid-layout' ? 'primary' : 'default'}>
            <GridViewIcon />
          </IconButton>
          <IconButton onClick={() => handleLayoutChange('list-layout')} color={layout === 'list-layout' ? 'primary' : 'default'}>
            <ViewListIcon />
          </IconButton>
        </Box>
      </Box>

      {isLoading ? (
        <CircularProgress size={24} />
      ) : !data || data.items.length === 0 ? (
        <Typography color="text.secondary">Favori talep bulunmuyor.</Typography>
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
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ürün</TableCell>
                <TableCell>Kullanıcı</TableCell>
                <TableCell>Fiyat</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Ödeme</TableCell>
                <TableCell>Tarih</TableCell>
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

      {data && (
        <PaginationControls page={page} totalPages={data.total_pages} onChange={setPage} />
      )}

      <RequirementModal
        requirement={selectedReq}
        open={selectedReq !== null}
        onClose={() => setSelectedReq(null)}
      />
    </Box>
  );
}
