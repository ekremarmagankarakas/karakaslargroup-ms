import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import GridViewIcon from '@mui/icons-material/GridView';
import SearchIcon from '@mui/icons-material/Search';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ConstructionIcon from '@mui/icons-material/Construction';
import {
  Box,
  Card,
  Chip,
  Fab,
  Grid,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { ConstructionChatWidget } from '../../components/construction/ConstructionChatWidget';
import { ConstructionStatsPanel } from '../../components/construction/ConstructionStatsPanel';
import { FavoriteProjectsSection } from '../../components/construction/FavoriteProjectsSection';
import { GanttTimeline } from '../../components/construction/GanttTimeline';
import { ProjectCard } from '../../components/construction/ProjectCard';
import { ProjectForm } from '../../components/construction/ProjectForm';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { PaginationControls } from '../../components/common/PaginationControls';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { downloadCsv } from '../../utils/exportCsv';
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from '../../hooks/construction/useConstruction';
import type { ConstructionProject, ConstructionProjectStatus, ConstructionProjectType } from '../../types';

const STATUS_FILTER_OPTIONS: { value: ConstructionProjectStatus | ''; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'planning', label: 'Planlama' },
  { value: 'active', label: 'Aktif' },
  { value: 'on_hold', label: 'Beklemede' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal' },
];

const TYPE_FILTER_OPTIONS: { value: ConstructionProjectType | ''; label: string }[] = [
  { value: '', label: 'Tüm Tipler' },
  { value: 'shopping_mall', label: 'AVM' },
  { value: 'residential', label: 'Konut' },
  { value: 'office', label: 'Ofis' },
  { value: 'mixed_use', label: 'Karma' },
  { value: 'hotel', label: 'Otel' },
  { value: 'industrial', label: 'Endüstriyel' },
  { value: 'other', label: 'Diğer' },
];

export function ConstructionDashboardPage() {
  const { user } = useAuth();
  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConstructionProjectStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ConstructionProjectType | ''>('');
  const [myProjectsOnly, setMyProjectsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  const [viewMode, setViewMode] = useState<'grid' | 'gantt'>(() => {
    return (localStorage.getItem('construction_view_preference') as 'grid' | 'gantt') ?? 'grid';
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConstructionProject | null>(null);

  const filters = {
    search: search || undefined,
    status: statusFilter || undefined,
    project_type: typeFilter || undefined,
    my_projects: myProjectsOnly || undefined,
    page,
    limit,
  };

  const { data, isLoading } = useProjects(filters);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const handleCreate = async (body: Parameters<typeof createProject.mutateAsync>[0]) => {
    await createProject.mutateAsync(body);
    setFormOpen(false);
  };

  const handleUpdate = async (body: Parameters<typeof createProject.mutateAsync>[0]) => {
    if (!editTarget) return;
    await updateProject.mutateAsync({ id: editTarget.id, body });
    setEditTarget(null);
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteProject.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <DashboardLayout hideChatWidget>
        {/* Stats Panel */}
        <ConstructionStatsPanel />

        {/* Favorites Section */}
        <FavoriteProjectsSection
          userRole={user!.role}
          onEdit={(p) => { setEditTarget(p); setFormOpen(true); }}
          onDelete={(p) => setDeleteTarget(p)}
        />

        {/* Header */}
        <PageHeader
          title="İnşaat Projeleri"
          subtitle="Projeleri görüntüle, malzemeleri ve ilerlemeyi takip et"
          actions={
            <Box display="flex" gap={0.5}>
              {canCreate && (
                <Tooltip title="CSV İndir">
                  <IconButton
                    size="small"
                    onClick={() => downloadCsv('/construction/export/projects', 'projeler.csv')}
                    sx={{ color: 'text.secondary' }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Kart Görünümü">
                <IconButton
                  size="small"
                  onClick={() => { setViewMode('grid'); localStorage.setItem('construction_view_preference', 'grid'); }}
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                >
                  <GridViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Gantt Görünümü">
                <IconButton
                  size="small"
                  onClick={() => { setViewMode('gantt'); localStorage.setItem('construction_view_preference', 'gantt'); }}
                  color={viewMode === 'gantt' ? 'primary' : 'default'}
                >
                  <TableRowsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />

        {/* Filters */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={3} alignItems="center">
          <TextField
            placeholder="Proje ara..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            size="small"
            sx={{ minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <Box display="flex" gap={0.75} flexWrap="wrap">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                onClick={() => {
                  setStatusFilter(opt.value as ConstructionProjectStatus | '');
                  setPage(1);
                }}
                variant={statusFilter === opt.value ? 'filled' : 'outlined'}
                color={statusFilter === opt.value ? 'primary' : 'default'}
                size="small"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
          <Box display="flex" gap={0.75} flexWrap="wrap">
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                onClick={() => {
                  setTypeFilter(opt.value as ConstructionProjectType | '');
                  setPage(1);
                }}
                variant={typeFilter === opt.value ? 'filled' : 'outlined'}
                color={typeFilter === opt.value ? 'secondary' : 'default'}
                size="small"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
          <Chip
            label="Projelerim"
            onClick={() => {
              setMyProjectsOnly((v) => !v);
              setPage(1);
            }}
            variant={myProjectsOnly ? 'filled' : 'outlined'}
            color={myProjectsOnly ? 'primary' : 'default'}
            size="small"
            sx={{ cursor: 'pointer' }}
          />
        </Stack>

        {/* Content */}
        {isLoading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
                <Card variant="outlined" sx={{ p: 2, height: 220 }}>
                  <Box display="flex" gap={1} mb={1.5}>
                    <Skeleton variant="rounded" width={56} height={22} />
                    <Skeleton variant="rounded" width={48} height={22} />
                  </Box>
                  <Skeleton variant="text" width="70%" height={24} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="90%" height={16} />
                  <Skeleton variant="text" width="60%" height={16} sx={{ mb: 1.5 }} />
                  <Skeleton variant="text" width="50%" height={14} />
                  <Skeleton variant="text" width="40%" height={14} sx={{ mb: 1.5 }} />
                  <Skeleton variant="rounded" width="100%" height={6} />
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            Icon={ConstructionIcon}
            title="Proje bulunamadı"
            description={canCreate ? 'Sağ alttaki butona tıklayarak yeni proje oluşturabilirsiniz.' : undefined}
          />
        ) : viewMode === 'gantt' ? (
          <GanttTimeline projects={data.items} />
        ) : (
          <>
            <Grid container spacing={2}>
              {data.items.map((project) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={project.id}>
                  <ProjectCard
                    project={project}
                    userRole={user!.role}
                    onEdit={(p) => {
                      setEditTarget(p);
                      setFormOpen(true);
                    }}
                    onDelete={(p) => setDeleteTarget(p)}
                  />
                </Grid>
              ))}
            </Grid>

            {data.total_pages > 1 && (
              <Box mt={3}>
                <PaginationControls
                  page={page}
                  totalPages={data.total_pages}
                  onChange={setPage}
                />
              </Box>
            )}
          </>
        )}

        {/* FAB */}
        {canCreate && (
          <Fab
            color="primary"
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
            sx={{ position: 'fixed', bottom: 32, right: 32 }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Project Form */}
        <ProjectForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditTarget(null);
          }}
          onSubmit={editTarget ? handleUpdate : handleCreate}
          loading={createProject.isPending || updateProject.isPending}
          project={editTarget}
        />

        {/* Construction AI Chat */}
        <ConstructionChatWidget />

        {/* Delete Confirm */}
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Projeyi Sil"
          message={`"${deleteTarget?.name}" projesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
    </DashboardLayout>
  );
}
