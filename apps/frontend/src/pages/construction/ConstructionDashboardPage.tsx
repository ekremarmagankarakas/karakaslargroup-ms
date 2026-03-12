import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import GridViewIcon from '@mui/icons-material/GridView';
import SearchIcon from '@mui/icons-material/Search';
import TableRowsIcon from '@mui/icons-material/TableRows';
import {
  Box,
  Chip,
  CircularProgress,
  Fab,
  Grid,
  IconButton,
  InputAdornment,
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
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { PaginationControls } from '../../components/common/PaginationControls';
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
      <Box sx={{ p: 3 }}>
        {/* Stats Panel */}
        <ConstructionStatsPanel />

        {/* Favorites Section */}
        <FavoriteProjectsSection
          userRole={user!.role}
          onEdit={(p) => { setEditTarget(p); setFormOpen(true); }}
          onDelete={(p) => setDeleteTarget(p)}
        />

        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              İnşaat Projeleri
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Projeleri görüntüle, malzemeleri ve ilerlemeyi takip et
            </Typography>
          </Box>
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
        </Box>

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
        </Stack>

        {/* Content */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : !data || data.items.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={10}
            gap={1}
          >
            <Typography variant="h6" color="text.secondary">
              Proje bulunamadı
            </Typography>
            {canCreate && (
              <Typography variant="body2" color="text.secondary">
                Sağ alttaki butona tıklayarak yeni proje oluşturabilirsiniz.
              </Typography>
            )}
          </Box>
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
      </Box>
    </DashboardLayout>
  );
}
