import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MaterialsTable } from '../../components/construction/MaterialsTable';
import { MilestonesTimeline } from '../../components/construction/MilestonesTimeline';
import { ProjectForm } from '../../components/construction/ProjectForm';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useProject, useUpdateProject } from '../../hooks/construction/useConstruction';
import type { ConstructionProjectStatus } from '../../types';

const STATUS_LABELS: Record<ConstructionProjectStatus, string> = {
  planning: 'Planlama',
  active: 'Aktif',
  on_hold: 'Beklemede',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<
  ConstructionProjectStatus,
  'default' | 'info' | 'success' | 'warning' | 'error'
> = {
  planning: 'info',
  active: 'success',
  on_hold: 'warning',
  completed: 'default',
  cancelled: 'error',
};

export function ConstructionProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const id = projectId ? parseInt(projectId) : undefined;

  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject();

  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  const handleUpdate = async (body: Parameters<typeof updateProject.mutate>[0]['body']) => {
    if (!id) return;
    await updateProject.mutateAsync({ id, body });
    setEditOpen(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
          <Typography color="text.secondary">Proje bulunamadı.</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Back + Header */}
        <Box display="flex" alignItems="flex-start" gap={1} mb={3}>
          <Tooltip title="Geri">
            <IconButton onClick={() => navigate('/construction')} size="small" sx={{ mt: 0.5 }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box flexGrow={1}>
            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
              <Typography variant="h5" fontWeight={700}>
                {project.name}
              </Typography>
              <Chip
                label={STATUS_LABELS[project.status]}
                color={STATUS_COLORS[project.status]}
                size="small"
                variant="outlined"
              />
              {canEdit && (
                <Button
                  startIcon={<EditIcon />}
                  size="small"
                  variant="outlined"
                  onClick={() => setEditOpen(true)}
                >
                  Düzenle
                </Button>
              )}
            </Box>
            {project.description && (
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {project.description}
              </Typography>
            )}
            <Box display="flex" gap={2} mt={1} flexWrap="wrap">
              {project.location_name && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <LocationOnIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    {project.location_name}
                  </Typography>
                </Box>
              )}
              {(project.start_date || project.end_date) && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    {project.start_date ?? '?'} → {project.end_date ?? '?'}
                  </Typography>
                </Box>
              )}
              {project.budget && (
                <Typography variant="caption" color="text.secondary">
                  Bütçe: ₺{parseFloat(project.budget).toLocaleString('tr-TR')}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Progress Overview */}
        <Paper
          variant="outlined"
          sx={{ p: 2, mb: 3, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" fontWeight={600}>
              Genel İlerleme
            </Typography>
            <Typography variant="body2" fontWeight={700} color="primary.main">
              {project.progress_pct}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={project.progress_pct}
            sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover' }}
          />
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            Oluşturan: {project.created_by_username}
          </Typography>
        </Paper>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Malzemeler" />
            <Tab label="Aşamalar" />
          </Tabs>
        </Box>

        {tab === 0 && (
          <MaterialsTable projectId={project.id} userRole={user!.role} />
        )}
        {tab === 1 && (
          <MilestonesTimeline projectId={project.id} userRole={user!.role} />
        )}

        {/* Edit Form */}
        <ProjectForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={handleUpdate}
          loading={updateProject.isPending}
          project={project}
        />
      </Box>
    </DashboardLayout>
  );
}
