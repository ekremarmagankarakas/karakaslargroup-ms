import AddIcon from '@mui/icons-material/Add';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
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
import { useAuth } from '../context/AuthContext';
import { useRequirements } from '../hooks/useRequirements';
import { useToggleFavorite } from '../hooks/useFavorites';
import { useUsers } from '../hooks/useUsers';
import type { Requirement, RequirementFilters } from '../types';
import { ls } from '../utils/localStorage';
import { PaginationControls } from '../components/common/PaginationControls';
import { FavoritesSection } from '../components/favorites/FavoritesSection';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { RequirementCard } from '../components/requirements/RequirementCard';
import { RequirementFilters as FiltersBar } from '../components/requirements/RequirementFilters';
import { RequirementForm } from '../components/requirements/RequirementForm';
import { RequirementModal } from '../components/requirements/RequirementModal';
import { RequirementRow } from '../components/requirements/RequirementRow';
import { StatisticsPanel } from '../components/statistics/StatisticsPanel';

export function DashboardPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<RequirementFilters>({ page: 1, limit: 10 });
  const [layout, setLayout] = useState<'grid-layout' | 'list-layout'>(() => ls.getLayoutPreference());
  const [stylePreference, setStylePreference] = useState<'sectioned' | 'all'>(() =>
    user?.role === 'accountant' ? 'all' : ls.getStylePreference()
  );
  const [sidebarHidden, setSidebarHidden] = useState(() => ls.getSidebarHidden());
  const [statisticsVisible, setStatisticsVisible] = useState(() => ls.getStatisticsVisible());
  const [inboxVisible, setInboxVisible] = useState(() => ls.getInboxVisible());
  const [favoritesVisible, setFavoritesVisible] = useState(() => ls.getFavoritesVisible());
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useRequirements(filters);
  const { data: usersData } = useUsers();
  const toggleFavorite = useToggleFavorite();

  const canSubmit = user?.role === 'employee' || user?.role === 'admin';
  const canSectionView = user?.role !== 'accountant';

  const handleLayoutChange = (newLayout: 'grid-layout' | 'list-layout') => {
    setLayout(newLayout);
    ls.setLayoutPreference(newLayout);
  };

  const handleStyleChange = () => {
    const next = stylePreference === 'sectioned' ? 'all' : 'sectioned';
    setStylePreference(next);
    ls.setStylePreference(next);
  };

  const handleToggleSidebar = () => {
    const next = !sidebarHidden;
    setSidebarHidden(next);
    ls.setSidebarHidden(next);
  };

  const handleToggleStatistics = () => {
    const next = !statisticsVisible;
    setStatisticsVisible(next);
    ls.setStatisticsVisible(next);
  };

  const handleToggleInbox = () => {
    const next = !inboxVisible;
    setInboxVisible(next);
    ls.setInboxVisible(next);
  };

  const handleToggleFavorites = () => {
    const next = !favoritesVisible;
    setFavoritesVisible(next);
    ls.setFavoritesVisible(next);
  };

  const requirements = data?.items ?? [];
  const pending = requirements.filter((r) => r.status === 'pending');
  const accepted = requirements.filter((r) => r.status === 'accepted');
  const declined = requirements.filter((r) => r.status === 'declined');

  const statsFilters = {
    search: filters.search,
    user_id: filters.user_id,
    paid: filters.paid,
    month: filters.month,
    year: filters.year,
  };

  const renderCard = (req: Requirement) => (
    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={req.id}>
      <RequirementCard
        requirement={req}
        onClick={() => setSelectedReq(req)}
        onToggleFavorite={() =>
          toggleFavorite.mutate({ requirementId: req.id, isFavorited: req.is_favorited })
        }
      />
    </Grid>
  );

  const renderRow = (req: Requirement) => (
    <RequirementRow
      key={req.id}
      requirement={req}
      onClick={() => setSelectedReq(req)}
      onToggleFavorite={() =>
        toggleFavorite.mutate({ requirementId: req.id, isFavorited: req.is_favorited })
      }
    />
  );

  return (
    <DashboardLayout
      sidebarHidden={sidebarHidden}
      statisticsVisible={statisticsVisible}
      inboxVisible={inboxVisible}
      favoritesVisible={favoritesVisible}
      onToggleSidebar={handleToggleSidebar}
      onToggleStatistics={handleToggleStatistics}
      onToggleInbox={handleToggleInbox}
      onToggleFavorites={handleToggleFavorites}
    >
      {statisticsVisible && <StatisticsPanel filters={statsFilters} />}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>
          Talepler
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          {canSubmit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
              Yeni Talep
            </Button>
          )}
          {canSectionView && (
            <Button variant="outlined" onClick={handleStyleChange} size="small">
              {stylePreference === 'sectioned' ? 'Tümünü Göster' : 'Bölümlü Göster'}
            </Button>
          )}
          <IconButton
            onClick={() => handleLayoutChange('grid-layout')}
            color={layout === 'grid-layout' ? 'primary' : 'default'}
          >
            <GridViewIcon />
          </IconButton>
          <IconButton
            onClick={() => handleLayoutChange('list-layout')}
            color={layout === 'list-layout' ? 'primary' : 'default'}
          >
            <ViewListIcon />
          </IconButton>
        </Box>
      </Box>

      <FiltersBar filters={filters} users={usersData ?? []} onChange={setFilters} />

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : stylePreference === 'sectioned' && canSectionView ? (
        <Grid container spacing={2}>
          {[
            { title: 'Beklemede', items: pending },
            { title: 'Onaylandı', items: accepted },
            { title: 'Reddedildi', items: declined },
          ].map(({ title, items }) => (
            <Grid size={{ xs: 12, md: 4 }} key={title}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                {title} ({items.length})
              </Typography>
              {layout === 'grid-layout' ? (
                <Grid container spacing={1}>
                  {items.map((req) => renderCard(req))}
                </Grid>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>{items.map((req) => renderRow(req))}</TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>
          ))}
        </Grid>
      ) : layout === 'grid-layout' ? (
        <Grid container spacing={2}>
          {requirements.map((req) => renderCard(req))}
        </Grid>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
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
            <TableBody>{requirements.map((req) => renderRow(req))}</TableBody>
          </Table>
        </TableContainer>
      )}

      {data && (
        <PaginationControls
          page={data.page}
          totalPages={data.total_pages}
          onChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      )}

      {favoritesVisible && (
        <>
          <Divider sx={{ my: 3 }} />
          <FavoritesSection />
        </>
      )}

      <RequirementModal
        requirement={selectedReq}
        open={selectedReq !== null}
        onClose={() => setSelectedReq(null)}
      />
      <RequirementForm open={showForm} onClose={() => setShowForm(false)} />
    </DashboardLayout>
  );
}
