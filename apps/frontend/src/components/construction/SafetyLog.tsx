import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useCreateSafetyIncident,
  useDeleteSafetyIncident,
  useSafetyIncidents,
  useSafetyStats,
  useUpdateSafetyIncident,
} from '../../hooks/construction/useConstructionSafety';
import type { ConstructionSafetyIncident, IncidentStatus, IncidentType, UserRole } from '../../types';

const TYPE_LABELS: Record<IncidentType, string> = {
  near_miss: 'Ramak Kala',
  minor_injury: 'Hafif Yaralanma',
  major_injury: 'Ağır Yaralanma',
  property_damage: 'Maddi Hasar',
  environmental: 'Çevre',
  fire: 'Yangın',
  other: 'Diğer',
};

const TYPE_COLORS: Record<IncidentType, 'default' | 'warning' | 'error' | 'info' | 'success'> = {
  near_miss: 'warning',
  minor_injury: 'info',
  major_injury: 'error',
  property_damage: 'warning',
  environmental: 'info',
  fire: 'error',
  other: 'default',
};

const STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: 'Raporlandı',
  under_investigation: 'Soruşturuluyor',
  corrective_action_pending: 'Aksiyon Bekliyor',
  closed: 'Kapatıldı',
};

const STATUS_COLORS: Record<IncidentStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  reported: 'error',
  under_investigation: 'warning',
  corrective_action_pending: 'info',
  closed: 'success',
};

const ALL_TYPES: IncidentType[] = ['near_miss', 'minor_injury', 'major_injury', 'property_damage', 'environmental', 'fire', 'other'];
const ALL_STATUSES: IncidentStatus[] = ['reported', 'under_investigation', 'corrective_action_pending', 'closed'];

interface Props {
  projectId: number;
  userRole: UserRole;
}

const EMPTY_FORM = {
  incident_type: 'near_miss' as IncidentType,
  title: '',
  description: '',
  location_on_site: '',
  incident_date: new Date().toISOString().slice(0, 10),
  injured_person_name: '',
  time_lost_days: '',
  root_cause: '',
  corrective_actions: '',
};

export function SafetyLog({ projectId, userRole }: Props) {
  const { data: incidents = [], isLoading, isError } = useSafetyIncidents(projectId);
  const { data: stats } = useSafetyStats(projectId);
  const createIncident = useCreateSafetyIncident();
  const updateIncident = useUpdateSafetyIncident();
  const deleteIncident = useDeleteSafetyIncident();
  const canEdit = userRole === 'admin' || userRole === 'manager';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionSafetyIncident | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editStatus, setEditStatus] = useState<IncidentStatus | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<ConstructionSafetyIncident | null>(null);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (incident: ConstructionSafetyIncident) => {
    setEditTarget(incident);
    setForm({
      incident_type: incident.incident_type,
      title: incident.title,
      description: incident.description,
      location_on_site: incident.location_on_site ?? '',
      incident_date: incident.incident_date,
      injured_person_name: incident.injured_person_name ?? '',
      time_lost_days: incident.time_lost_days?.toString() ?? '',
      root_cause: incident.root_cause ?? '',
      corrective_actions: incident.corrective_actions ?? '',
    });
    setDialogOpen(true);
  };

  const openStatusEdit = (incident: ConstructionSafetyIncident) => {
    setStatusTarget(incident);
    setEditStatus(incident.status);
    setStatusDialogOpen(true);
  };

  const handleSave = () => {
    const body = {
      incident_type: form.incident_type,
      title: form.title,
      description: form.description,
      incident_date: form.incident_date,
      location_on_site: form.location_on_site || undefined,
      injured_person_name: form.injured_person_name || undefined,
      time_lost_days: form.time_lost_days ? parseInt(form.time_lost_days) : undefined,
      root_cause: form.root_cause || undefined,
      corrective_actions: form.corrective_actions || undefined,
    };
    if (editTarget) {
      updateIncident.mutate({ projectId, incidentId: editTarget.id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createIncident.mutate({ projectId, body }, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleStatusSave = () => {
    if (!statusTarget || !editStatus) return;
    updateIncident.mutate(
      { projectId, incidentId: statusTarget.id, body: { status: editStatus } },
      { onSuccess: () => setStatusDialogOpen(false) },
    );
  };

  const handleDelete = (incident: ConstructionSafetyIncident) => {
    if (confirm(`"${incident.title}" olayını silmek istediğinizden emin misiniz?`)) {
      deleteIncident.mutate({ projectId, incidentId: incident.id });
    }
  };

  const dsli = stats?.days_since_last_incident;
  const dsliColor = dsli == null ? '#22c55e' : dsli === 0 ? '#ef4444' : dsli < 30 ? '#f59e0b' : '#22c55e';
  const dsliText = dsli == null ? 'Hiç olay yok' : dsli === 0 ? 'Bugün olay yaşandı' : `${dsli} Gündür Kazasız`;

  if (isLoading) {
    return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>;
  }

  if (isError) return <Alert severity="error">Veriler yüklenirken bir hata oluştu.</Alert>;

  return (
    <Box>
      {/* DSLI Banner */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderColor: `${dsliColor}40`,
          bgcolor: `${dsliColor}10`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: dsliColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {dsliColor === '#22c55e' ? (
            <CheckCircleIcon sx={{ color: '#fff', fontSize: 26 }} />
          ) : (
            <WarningAmberIcon sx={{ color: '#fff', fontSize: 26 }} />
          )}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ color: dsliColor }}>{dsliText}</Typography>
          {stats && (
            <Typography variant="caption" color="text.secondary">
              {stats.open_count} açık olay
              {stats.major_injury_open > 0 && ` • ${stats.major_injury_open} ağır yaralanma`}
            </Typography>
          )}
        </Box>
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" fontWeight={700}>
          Güvenlik Olayları
          {stats && stats.major_injury_open > 0 && (
            <Chip label={stats.major_injury_open} color="error" size="small" sx={{ ml: 1 }} />
          )}
        </Typography>
        <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={openCreate}>
          Olay Raporla
        </Button>
      </Box>

      {incidents.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Kayıtlı güvenlik olayı bulunmuyor.</Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {incidents.map((incident) => (
            <Paper key={incident.id} variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
                <Box flexGrow={1}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                    <Chip label={TYPE_LABELS[incident.incident_type]} color={TYPE_COLORS[incident.incident_type]} size="small" />
                    <Chip label={STATUS_LABELS[incident.status]} color={STATUS_COLORS[incident.status]} size="small" variant="outlined" />
                    {incident.incident_type === 'major_injury' && incident.status !== 'closed' && (
                      <Chip label="ACİL" color="error" size="small" sx={{ fontWeight: 700 }} />
                    )}
                  </Box>
                  <Typography variant="subtitle2" fontWeight={700}>{incident.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{incident.incident_date}</Typography>
                  {incident.location_on_site && (
                    <Typography variant="caption" color="text.secondary"> · {incident.location_on_site}</Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" mt={0.5} sx={{ whiteSpace: 'pre-line' }}>
                    {incident.description}
                  </Typography>
                  {incident.injured_person_name && (
                    <Typography variant="caption" color="text.secondary">Yaralanan: {incident.injured_person_name}</Typography>
                  )}
                  {incident.corrective_actions && (
                    <Box mt={0.5}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">Alınan Aksiyonlar: </Typography>
                      <Typography variant="caption" color="text.secondary">{incident.corrective_actions}</Typography>
                    </Box>
                  )}
                  <Box mt={0.5}>
                    <Typography variant="caption" color="text.disabled">
                      Raporlayan: {incident.reporter_username ?? '—'}
                    </Typography>
                  </Box>
                </Box>
                {canEdit && (
                  <Box display="flex" flexShrink={0}>
                    <Tooltip title="Durum Güncelle">
                      <IconButton size="small" onClick={() => openStatusEdit(incident)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Düzenle">
                      <IconButton size="small" onClick={() => openEdit(incident)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => handleDelete(incident)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Olayı Düzenle' : 'Güvenlik Olayı Raporla'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            select
            label="Olay Türü"
            value={form.incident_type}
            onChange={(e) => setForm({ ...form, incident_type: e.target.value as IncidentType })}
            size="small"
          >
            {ALL_TYPES.map((t) => <MenuItem key={t} value={t}>{TYPE_LABELS[t]}</MenuItem>)}
          </TextField>
          <TextField label="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} size="small" required />
          <TextField label="Açıklama" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} size="small" multiline rows={3} required />
          <TextField label="Olay Tarihi" type="date" value={form.incident_date} onChange={(e) => setForm({ ...form, incident_date: e.target.value })} size="small" InputLabelProps={{ shrink: true }} required />
          <TextField label="Olay Yeri (Sahada)" value={form.location_on_site} onChange={(e) => setForm({ ...form, location_on_site: e.target.value })} size="small" />
          <TextField label="Yaralanan Kişi" value={form.injured_person_name} onChange={(e) => setForm({ ...form, injured_person_name: e.target.value })} size="small" />
          <TextField label="İş Günü Kaybı" type="number" value={form.time_lost_days} onChange={(e) => setForm({ ...form, time_lost_days: e.target.value })} size="small" />
          <Divider />
          <TextField label="Kök Neden" value={form.root_cause} onChange={(e) => setForm({ ...form, root_cause: e.target.value })} size="small" multiline rows={2} />
          <TextField label="Alınan Aksiyonlar" value={form.corrective_actions} onChange={(e) => setForm({ ...form, corrective_actions: e.target.value })} size="small" multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.title || !form.description || createIncident.isPending || updateIncident.isPending}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Durumu Güncelle</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            select
            label="Durum"
            value={editStatus ?? ''}
            onChange={(e) => setEditStatus(e.target.value as IncidentStatus)}
            size="small"
            fullWidth
          >
            {ALL_STATUSES.map((s) => <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleStatusSave} disabled={updateIncident.isPending}>Güncelle</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
