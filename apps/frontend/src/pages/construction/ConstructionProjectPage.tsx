import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
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
import { ChangeOrderList } from '../../components/construction/ChangeOrderList';
import { DailyLogList } from '../../components/construction/DailyLogList';
import { DocumentList } from '../../components/construction/DocumentList';
import { IssuesLog } from '../../components/construction/IssuesLog';
import { MaterialsTable } from '../../components/construction/MaterialsTable';
import { MilestonesTimeline } from '../../components/construction/MilestonesTimeline';
import { PermitTracker } from '../../components/construction/PermitTracker';
import { PhotoGallery } from '../../components/construction/PhotoGallery';
import { ShipmentList } from '../../components/construction/ShipmentList';
import { ProjectTeam } from '../../components/construction/ProjectTeam';
import { ConstructionChatWidget } from '../../components/construction/ConstructionChatWidget';
import { ProjectAuditLog } from '../../components/construction/ProjectAuditLog';
import { ProjectHealthCard } from '../../components/construction/ProjectHealthCard';
import { ProjectComments } from '../../components/construction/ProjectComments';
import { ProjectForm } from '../../components/construction/ProjectForm';
import { SubcontractorList } from '../../components/construction/SubcontractorList';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useMaterials, useProject, useUpdateProject } from '../../hooks/construction/useConstruction';
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
  const { data: materials = [] } = useMaterials(id);
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
      <DashboardLayout hideChatWidget>
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout hideChatWidget>
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
          <Typography color="text.secondary">Proje bulunamadı.</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout hideChatWidget>
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
              {project.team_count > 0 && (
                <Chip
                  icon={<GroupIcon sx={{ fontSize: '14px !important' }} />}
                  label={`${project.team_count} üye`}
                  size="small"
                  variant="outlined"
                  sx={{ color: 'text.secondary', borderColor: 'divider' }}
                />
              )}
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
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="Genel Bakış" />
            <Tab label="Malzemeler" />
            <Tab label="Sevkiyatlar" />
            <Tab label="Aşamalar" />
            <Tab label="Sorunlar" />
            <Tab label="Fotoğraflar" />
            <Tab label="Yorumlar" />
            <Tab label="Günlük" />
            <Tab label="Taşeronlar" />
            <Tab label="İzinler" />
            <Tab label="Revizyonlar" />
            <Tab label="Ekip" />
            <Tab label="Belgeler" />
            {canEdit && <Tab label="Geçmiş" />}
          </Tabs>
        </Box>

        {tab === 0 && (() => {
          const actualCost = materials.reduce((sum, m) => {
            const used = parseFloat(m.quantity_used) || 0;
            const cost = parseFloat(m.unit_cost ?? '0') || 0;
            return sum + used * cost;
          }, 0);
          const plannedCost = materials.reduce((sum, m) => {
            const planned = parseFloat(m.quantity_planned) || 0;
            const cost = parseFloat(m.unit_cost ?? '0') || 0;
            return sum + planned * cost;
          }, 0);
          const budget = project.budget ? parseFloat(project.budget) : null;
          const budgetPct = budget && budget > 0 ? Math.min(200, Math.round((actualCost / budget) * 100)) : null;
          const budgetColor = budgetPct == null ? 'primary.main' : budgetPct >= 100 ? 'error.main' : budgetPct >= 80 ? 'warning.main' : 'success.main';

          return (
            <Box>
              <ProjectHealthCard projectId={project.id} />
              {budget !== null && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Bütçe Durumu</Typography>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">Gerçekleşen Maliyet</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: budgetColor }}>
                      ₺{actualCost.toLocaleString('tr-TR')} / ₺{budget!.toLocaleString('tr-TR')} ({budgetPct}%)
                    </Typography>
                  </Box>
                  <Box sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${Math.min(100, budgetPct ?? 0)}%`, bgcolor: budgetColor, borderRadius: 5, transition: 'width 0.3s' }} />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="caption" color="text.secondary">Planlanan Maliyet: ₺{plannedCost.toLocaleString('tr-TR')}</Typography>
                    <Typography variant="caption" color="text.secondary">Bütçe: ₺{budget!.toLocaleString('tr-TR')}</Typography>
                  </Box>
                </Paper>
              )}
              <Typography variant="body2" color="text.secondary">
                {project.description ?? 'Proje açıklaması bulunmuyor.'}
              </Typography>
            </Box>
          );
        })()}
        {tab === 1 && (
          <MaterialsTable projectId={project.id} userRole={user!.role} />
        )}
        {tab === 2 && (
          <ShipmentList projectId={project.id} userRole={user!.role} materials={materials} />
        )}
        {tab === 3 && (
          <MilestonesTimeline projectId={project.id} userRole={user!.role} />
        )}
        {tab === 4 && (
          <IssuesLog projectId={project.id} userRole={user!.role} />
        )}
        {tab === 5 && (
          <PhotoGallery projectId={project.id} userRole={user!.role} />
        )}
        {tab === 6 && (
          <ProjectComments projectId={project.id} currentUserId={user!.id} userRole={user!.role} />
        )}
        {tab === 7 && (
          <DailyLogList projectId={project.id} userRole={user!.role} />
        )}
        {tab === 8 && (
          <SubcontractorList projectId={project.id} userRole={user!.role} />
        )}
        {tab === 9 && (
          <PermitTracker projectId={project.id} userRole={user!.role} />
        )}
        {tab === 10 && (
          <ChangeOrderList projectId={project.id} userRole={user!.role} />
        )}
        {tab === 11 && (
          <DocumentList projectId={project.id} userRole={user!.role} />
        )}
        {tab === 12 && (
          <ProjectTeam projectId={project.id} userRole={user!.role} />
        )}
        {tab === 13 && canEdit && (
          <ProjectAuditLog projectId={project.id} />
        )}

        {/* Construction AI Chat */}
        <ConstructionChatWidget />

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
