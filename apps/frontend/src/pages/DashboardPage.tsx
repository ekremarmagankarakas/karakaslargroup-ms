import AddIcon from '@mui/icons-material/Add';
import FavoriteIcon from '@mui/icons-material/Favorite';
import GridViewIcon from '@mui/icons-material/GridView';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Box,
  CircularProgress,
  Fab,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
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

const STATUS_SECTIONS = [
  { key: 'pending', title: 'Beklemede', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { key: 'accepted', title: 'Onaylandı', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { key: 'declined', title: 'Reddedildi', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
] as const;

const currentDate = new Date().toLocaleDateString('tr-TR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
      <Box
        sx={{
          p: 0.875,
          borderRadius: 2,
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ color: 'white', fontSize: 18 }} />
      </Box>
      <Box>
        <Typography variant="h6">{title}</Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<RequirementFilters>({ page: 1, limit: 12 });
  const [layout, setLayout] = useState<'grid-layout' | 'list-layout'>(() => ls.getLayoutPreference());
  const [stylePreference, setStylePreference] = useState<'sectioned' | 'all'>(() =>
    user?.role === 'accountant' ? 'all' : ls.getStylePreference()
  );
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useRequirements(filters);
  const { data: usersData } = useUsers();
  const toggleFavorite = useToggleFavorite();

  const canSubmit = user?.role === 'employee' || user?.role === 'admin';
  const canSectionView = user?.role !== 'accountant';

  const handleLayoutChange = (_: unknown, newLayout: 'grid-layout' | 'list-layout' | null) => {
    if (!newLayout) return;
    setLayout(newLayout);
    ls.setLayoutPreference(newLayout);
  };

  const handleStyleChange = () => {
    const next = stylePreference === 'sectioned' ? 'all' : 'sectioned';
    setStylePreference(next);
    ls.setStylePreference(next);
  };

  const requirements = data?.items ?? [];
  const byStatus: Record<string, Requirement[]> = {
    pending: requirements.filter((r) => r.status === 'pending'),
    accepted: requirements.filter((r) => r.status === 'accepted'),
    declined: requirements.filter((r) => r.status === 'declined'),
  };

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
    <DashboardLayout>
      {/* ── Page header ── */}
      <Box mb={3} mt={1}>
        <Typography variant="h4" sx={{ mb: 0.25 }}>
          {user?.username
            ? `Merhaba, ${user.username.charAt(0).toUpperCase() + user.username.slice(1)}`
            : 'Merhaba'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {currentDate}
        </Typography>
      </Box>

      {/* ── Statistics ── */}
      <StatisticsPanel filters={statsFilters} />

      {/* ── Requirements ── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          p: 2.5,
          mb: 3,
        }}
      >
        {/* Section title row */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <SectionHeader
            icon={ListAltIcon}
            title="Talepler"
            subtitle={
              data
                ? `${data.total} kayıt · Sayfa ${data.page}/${data.total_pages}`
                : undefined
            }
          />

          <Box display="flex" gap={1} alignItems="center">
            {canSectionView && (
              <Tooltip title={stylePreference === 'sectioned' ? 'Tümünü tek listede göster' : 'Duruma göre grupla'}>
                <Box
                  onClick={handleStyleChange}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { bgcolor: '#f8fafc' },
                  }}
                >
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    {stylePreference === 'sectioned' ? 'Tümünü Göster' : 'Grupla'}
                  </Typography>
                </Box>
              </Tooltip>
            )}

            <ToggleButtonGroup
              value={layout}
              exclusive
              onChange={handleLayoutChange}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  border: '1px solid #e2e8f0',
                  px: 1,
                  py: 0.5,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderColor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                },
              }}
            >
              <ToggleButton value="grid-layout" aria-label="kart görünümü">
                <Tooltip title="Kart görünümü">
                  <GridViewIcon sx={{ fontSize: 18 }} />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="list-layout" aria-label="liste görünümü">
                <Tooltip title="Liste görünümü">
                  <ViewListIcon sx={{ fontSize: 18 }} />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Filters */}
        <FiltersBar filters={filters} users={usersData ?? []} onChange={setFilters} />

        {/* Content */}
        {isLoading ? (
          layout === 'grid-layout' ? (
            <Grid container spacing={2}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                  <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: 0.5, borderRadius: 1 }} />
              ))}
            </Box>
          )
        ) : requirements.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 7,
              color: 'text.disabled',
            }}
          >
            <ListAltIcon sx={{ fontSize: 56, mb: 2, opacity: 0.25 }} />
            <Typography variant="subtitle1" fontWeight={600} color="text.secondary" gutterBottom>
              Talep bulunamadı
            </Typography>
            <Typography variant="body2">
              Filtrelerinizi değiştirmeyi veya yeni talep oluşturmayı deneyin.
            </Typography>
          </Box>
        ) : stylePreference === 'sectioned' && canSectionView ? (
          /* Kanban columns */
          <Grid container spacing={2}>
            {STATUS_SECTIONS.map(({ key, title, color, bg, border }) => {
              const items = byStatus[key];
              return (
                <Grid size={{ xs: 12, md: 4 }} key={key}>
                  <Box
                    sx={{
                      bgcolor: bg,
                      borderRadius: 2.5,
                      border: `1px solid ${border}`,
                      p: 1.5,
                      minHeight: 160,
                    }}
                  >
                    {/* Column header */}
                    <Box display="flex" alignItems="center" gap={1} mb={1.5} px={0.5}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: color,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color, flex: 1 }}>
                        {title}
                      </Typography>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 10,
                          bgcolor: color,
                          minWidth: 24,
                          textAlign: 'center',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: 'white', fontWeight: 700, fontSize: '0.68rem', lineHeight: 1 }}
                        >
                          {items.length}
                        </Typography>
                      </Box>
                    </Box>

                    {items.length === 0 ? (
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ display: 'block', textAlign: 'center', py: 3 }}
                      >
                        Bu grupta talep yok
                      </Typography>
                    ) : layout === 'grid-layout' ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {items.map((req) => (
                          <RequirementCard
                            key={req.id}
                            requirement={req}
                            onClick={() => setSelectedReq(req)}
                            onToggleFavorite={() =>
                              toggleFavorite.mutate({ requirementId: req.id, isFavorited: req.is_favorited })
                            }
                          />
                        ))}
                      </Box>
                    ) : (
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, bgcolor: '#fff' }}>
                        <Table size="small">
                          <TableBody>{items.map((req) => renderRow(req))}</TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        ) : layout === 'grid-layout' ? (
          <Grid container spacing={2}>
            {requirements.map((req) => renderCard(req))}
          </Grid>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
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
              <TableBody>{requirements.map((req) => renderRow(req))}</TableBody>
            </Table>
          </TableContainer>
        )}

        {data && (
          <Box mt={2}>
            <PaginationControls
              page={data.page}
              totalPages={data.total_pages}
              onChange={(p) => setFilters((f) => ({ ...f, page: p }))}
            />
          </Box>
        )}
      </Box>

      {/* ── Favorites ── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          p: 2.5,
          mb: 6,
        }}
      >
        <SectionHeader icon={FavoriteIcon} title="Favorilerim" />
        <FavoritesSection />
      </Box>

      {/* Modals */}
      <RequirementModal
        requirement={selectedReq}
        open={selectedReq !== null}
        onClose={() => setSelectedReq(null)}
      />
      <RequirementForm open={showForm} onClose={() => setShowForm(false)} />

      {/* FAB */}
      {canSubmit && (
        <Tooltip title="Yeni talep oluştur" placement="left">
          <Fab
            color="primary"
            onClick={() => setShowForm(true)}
            sx={{ position: 'fixed', bottom: 28, right: 28, zIndex: 100 }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}
    </DashboardLayout>
  );
}
