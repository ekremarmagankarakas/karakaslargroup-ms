import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import {
  Box,
  Button,
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
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBulkUpdateStatus, useRequirements, useUpdateStatus } from '../../hooks/procurement/useRequirements';
import { useToggleFavorite } from '../../hooks/procurement/useFavorites';
import { useUsers } from '../../hooks/useUsers';
import type { Requirement, RequirementFilters } from '../../types';
import { ls } from '../../utils/localStorage';
import { PaginationControls } from '../../components/common/PaginationControls';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { FavoritesSection } from '../../components/procurement/favorites/FavoritesSection';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { RequirementCard } from '../../components/procurement/requirements/RequirementCard';
import { RequirementFilters as FiltersBar } from '../../components/procurement/requirements/RequirementFilters';
import { RequirementForm } from '../../components/procurement/requirements/RequirementForm';
import { RequirementModal } from '../../components/procurement/requirements/RequirementModal';
import { RequirementRow } from '../../components/procurement/requirements/RequirementRow';
import { StatisticsPanel } from '../../components/procurement/statistics/StatisticsPanel';

const STATUS_SECTIONS = [
  { key: 'pending',  title: 'Beklemede',  color: '#d97706' },
  { key: 'accepted', title: 'Onaylandı',  color: '#16a34a' },
  { key: 'declined', title: 'Reddedildi', color: '#dc2626' },
] as const;

// Inline status group header — no visual container, just a label row
function StatusGroupLabel({ color, title, count, children }: { color: string; title: string; count: number; children?: ReactNode }) {
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
        <Typography variant="overline" sx={{ color, lineHeight: 1, letterSpacing: '0.08em' }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.disabled">({count})</Typography>
        {children}
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data, isLoading } = useRequirements(filters);
  const { data: usersData } = useUsers();
  const toggleFavorite = useToggleFavorite();
  const updateStatus = useUpdateStatus();
  const bulkUpdate = useBulkUpdateStatus();

  const canManageStatus = user?.role === 'manager' || user?.role === 'admin';


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

  const handleUpdateStatus = (req: Requirement, status: 'accepted' | 'declined') =>
    updateStatus.mutate({ id: req.id, status });

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = async (status: 'accepted' | 'declined') => {
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), status });
    setSelectedIds(new Set());
  };

  const renderCard = (req: Requirement) => (
    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={req.id}>
      <RequirementCard
        requirement={req}
        onClick={() => setSelectedReq(req)}
        onToggleFavorite={() =>
          toggleFavorite.mutate({ requirementId: req.id, isFavorited: req.is_favorited })
        }
        onUpdateStatus={canManageStatus ? (status) => handleUpdateStatus(req, status) : undefined}
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
      onUpdateStatus={canManageStatus ? (status) => handleUpdateStatus(req, status) : undefined}
      selected={selectedIds.has(req.id)}
      onSelect={canManageStatus ? handleToggleSelect : undefined}
    />
  );

  return (
    <DashboardLayout>
      {/* ── Page header ── */}
      <PageHeader
        title={user?.username
          ? `Merhaba, ${user.username.charAt(0).toUpperCase() + user.username.slice(1)}`
          : 'Merhaba'}
      />

      {/* ── Statistics ── */}
      <StatisticsPanel filters={statsFilters} />

      {/* ── Requirements ── */}
      <SectionCard noPadding sx={{ mb: 3 }}>
        <Box sx={{ p: 2.5 }}>
        {/* Section title row */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h3">Talepler</Typography>
            {data && (
              <Typography variant="caption" color="text.secondary">
                {data.total} kayıt · Sayfa {data.page}/{data.total_pages}
              </Typography>
            )}
          </Box>

          <Box display="flex" gap={1} alignItems="center">
            {canSectionView && (
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={handleStyleChange}
                sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
              >
                {stylePreference === 'sectioned' ? 'Tümünü Göster' : 'Grupla'}
              </Button>
            )}

            <ToggleButtonGroup
              value={layout}
              exclusive
              onChange={handleLayoutChange}
              size="small"
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
          <EmptyState
            title="Talep bulunamadı"
            description="Filtrelerinizi değiştirmeyi veya yeni talep oluşturmayı deneyin."
          />
        ) : stylePreference === 'sectioned' && canSectionView ? (
          /* Grouped by status — flat layout, no colored containers */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {STATUS_SECTIONS.map(({ key, title, color }) => {
              const items = byStatus[key];
              return (
                <Box key={key}>
                  <StatusGroupLabel color={color} title={title} count={items.length} />
                  {items.length === 0 ? (
                    <Typography variant="caption" color="text.disabled" sx={{ pl: 1.75 }}>
                      Bu grupta talep yok
                    </Typography>
                  ) : layout === 'grid-layout' ? (
                    <Grid container spacing={2}>
                      {items.map((req) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={req.id}>
                          <RequirementCard
                            requirement={req}
                            onClick={() => setSelectedReq(req)}
                            onToggleFavorite={() =>
                              toggleFavorite.mutate({ requirementId: req.id, isFavorited: req.is_favorited })
                            }
                            onUpdateStatus={canManageStatus ? (status) => handleUpdateStatus(req, status) : undefined}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
                      <Table size="small">
                        <TableBody>{items.map((req) => renderRow(req))}</TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              );
            })}
          </Box>
        ) : layout === 'grid-layout' ? (
          <Grid container spacing={2}>
            {requirements.map((req) => renderCard(req))}
          </Grid>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {canManageStatus && <TableCell padding="checkbox" />}
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
      </SectionCard>

      {/* ── Favorites ── */}
      <SectionCard title="Favorilerim" sx={{ mb: 6 }}>
        <FavoritesSection />
      </SectionCard>

      {/* Modals */}
      <RequirementModal
        requirement={selectedReq}
        open={selectedReq !== null}
        onClose={() => setSelectedReq(null)}
      />
      <RequirementForm open={showForm} onClose={() => setShowForm(false)} />

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            px: 3,
            py: 1.5,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {selectedIds.size} talep seçildi
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleBulkStatus('accepted')}
            disabled={bulkUpdate.isPending}
          >
            Toplu Onayla
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => handleBulkStatus('declined')}
            disabled={bulkUpdate.isPending}
          >
            Toplu Reddet
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={() => setSelectedIds(new Set())}
            sx={{ color: 'text.secondary' }}
          >
            Seçimi Temizle
          </Button>
        </Paper>
      )}

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
