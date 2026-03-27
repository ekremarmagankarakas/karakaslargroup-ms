import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import {
  Box,
  IconButton,
  LinearProgress,
  Skeleton,
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
import { BudgetBreakdown } from '../../components/construction/BudgetBreakdown';
import { InvoiceList } from '../../components/construction/InvoiceList';
import { PunchList } from '../../components/construction/PunchList';
import { RFIList } from '../../components/construction/RFIList';
import MeetingMinutes from '../../components/construction/MeetingMinutes';
import EquipmentRegister from '../../components/construction/EquipmentRegister';
import SCurveChart from '../../components/construction/SCurveChart';
import { SafetyLog } from '../../components/construction/SafetyLog';
import { SubcontractorList } from '../../components/construction/SubcontractorList';
import { SectionCard } from '../../components/common/SectionCard';
import { ProjectStatusChip } from '../../components/common/StatusChip';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useMaterials, useProject, useUpdateProject } from '../../hooks/construction/useConstruction';

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
        <Box sx={{ pt: 2, pb: 0, mx: { xs: -2, sm: -3 }, px: { xs: 2, sm: 3 }, borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Skeleton variant="text" width={280} height={32} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={200} height={18} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" width="100%" height={4} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" width="100%" height={36} />
        </Box>
        <Skeleton variant="rounded" width="100%" height={120} />
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
  const budgetColor = budgetPct == null
    ? 'primary.main'
    : budgetPct >= 100
      ? 'error.main'
      : budgetPct >= 80
        ? 'warning.main'
        : 'success.main';

  return (
    <DashboardLayout hideChatWidget>
      {/* Sticky project header */}
      <Box
        sx={{
          position: 'sticky',
          top: 56,
          zIndex: 10,
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pt: 2,
          pb: 0,
          mx: { xs: -2, sm: -3 },
          px: { xs: 2, sm: 3 },
          mb: 0,
        }}
      >
        {/* Back + name row */}
        <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
          <Tooltip title="Geri">
            <IconButton onClick={() => navigate('/construction')} size="small">
              <ArrowBackIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Box flexGrow={1} minWidth={0}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="h2" sx={{ fontWeight: 700 }}>
                {project.name}
              </Typography>
              <ProjectStatusChip status={project.status} />
              {canEdit && (
                <Tooltip title="Düzenle">
                  <IconButton size="small" onClick={() => setEditOpen(true)} sx={{ color: 'text.secondary' }}>
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box display="flex" gap={2} mt={0.5} flexWrap="wrap" alignItems="center">
              {project.location_name && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    {project.location_name}
                  </Typography>
                </Box>
              )}
              {(project.start_date || project.end_date) && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
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
            {/* Progress bar */}
            <Box mt={1} pb={1.5} display="flex" alignItems="center" gap={1.5}>
              <LinearProgress
                variant="determinate"
                value={project.progress_pct}
                sx={{ flex: 1, height: 4, borderRadius: 2 }}
              />
              <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ flexShrink: 0 }}>
                {project.progress_pct}%
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mx: -0.5 }}
        >
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
          <Tab label="Belgeler" />
          <Tab label="Ekip" />
          <Tab label="Bütçe Kalemleri" />
          <Tab label="Güvenlik" />
          <Tab label="Faturalar" />
          <Tab label="Teslim Listesi" />
          <Tab label="Bilgi Talepleri" />
          <Tab label="Toplantılar" />
          <Tab label="Ekipman" />
          {canEdit && <Tab label="Geçmiş" />}
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box pt={3}>
        {tab === 0 && (
          <Box display="flex" flexDirection="column" gap={2.5}>
            <ProjectHealthCard projectId={project.id} />
            {budget !== null && (
              <SectionCard title="Bütçe Durumu">
                <Box display="flex" justifyContent="space-between" mb={0.75}>
                  <Typography variant="body2" color="text.secondary">Gerçekleşen Maliyet</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: budgetColor }}>
                    ₺{actualCost.toLocaleString('tr-TR')} / ₺{budget.toLocaleString('tr-TR')} ({budgetPct}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, budgetPct ?? 0)}
                  color={budgetPct != null && budgetPct >= 100 ? 'error' : budgetPct != null && budgetPct >= 80 ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    Planlanan: ₺{plannedCost.toLocaleString('tr-TR')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Bütçe: ₺{budget.toLocaleString('tr-TR')}
                  </Typography>
                </Box>
              </SectionCard>
            )}
            {project.description && (
              <Typography variant="body2" color="text.secondary">
                {project.description}
              </Typography>
            )}
            <SectionCard title="S-Eğrisi İlerleme">
              <SCurveChart projectId={project.id} />
            </SectionCard>
          </Box>
        )}
        {tab === 1 && <MaterialsTable projectId={project.id} userRole={user!.role} />}
        {tab === 2 && <ShipmentList projectId={project.id} userRole={user!.role} materials={materials} />}
        {tab === 3 && <MilestonesTimeline projectId={project.id} userRole={user!.role} />}
        {tab === 4 && <IssuesLog projectId={project.id} userRole={user!.role} />}
        {tab === 5 && <PhotoGallery projectId={project.id} userRole={user!.role} />}
        {tab === 6 && <ProjectComments projectId={project.id} currentUserId={user!.id} userRole={user!.role} />}
        {tab === 7 && <DailyLogList projectId={project.id} userRole={user!.role} />}
        {tab === 8 && <SubcontractorList projectId={project.id} userRole={user!.role} />}
        {tab === 9 && <PermitTracker projectId={project.id} userRole={user!.role} />}
        {tab === 10 && <ChangeOrderList projectId={project.id} userRole={user!.role} />}
        {tab === 11 && <DocumentList projectId={project.id} userRole={user!.role} />}
        {tab === 12 && <ProjectTeam projectId={project.id} userRole={user!.role} />}
        {tab === 13 && <BudgetBreakdown projectId={project.id} userRole={user!.role} />}
        {tab === 14 && <SafetyLog projectId={project.id} userRole={user!.role} />}
        {tab === 15 && <InvoiceList projectId={project.id} userRole={user!.role} />}
        {tab === 16 && <PunchList projectId={project.id} userRole={user!.role} />}
        {tab === 17 && <RFIList projectId={project.id} userRole={user!.role} />}
        {tab === 18 && <MeetingMinutes projectId={project.id} canEdit={canEdit} />}
        {tab === 19 && <EquipmentRegister projectId={project.id} canEdit={canEdit} />}
        {tab === 20 && canEdit && <ProjectAuditLog projectId={project.id} />}
      </Box>

      <ConstructionChatWidget />

      <ProjectForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleUpdate}
        loading={updateProject.isPending}
        project={project}
      />
    </DashboardLayout>
  );
}
