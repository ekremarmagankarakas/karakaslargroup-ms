import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useCreatePunchListItem,
  useDeletePunchListItem,
  usePunchList,
  useUpdatePunchListItem,
  useVerifyPunchListItem,
} from '../../hooks/construction/useConstructionPunchList';
import type { ConstructionPunchListItem, PunchListStatus, UserRole } from '../../types';

const STATUS_LABELS: Record<PunchListStatus, string> = {
  open: 'Açık',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  verified: 'Doğrulandı',
  rejected: 'Reddedildi',
};

const STATUS_COLORS: Record<PunchListStatus, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
  open: 'error',
  in_progress: 'warning',
  completed: 'info',
  verified: 'success',
  rejected: 'default',
};

const COLUMNS: PunchListStatus[] = ['open', 'in_progress', 'completed', 'verified'];

interface Props {
  projectId: number;
  userRole: UserRole;
}

const EMPTY_FORM = { title: '', description: '', location_on_site: '', due_date: '' };

export function PunchList({ projectId, userRole }: Props) {
  const { data: items = [], isLoading } = usePunchList(projectId);
  const createItem = useCreatePunchListItem();
  const updateItem = useUpdatePunchListItem();
  const verifyItem = useVerifyPunchListItem();
  const deleteItem = useDeletePunchListItem();
  const canEdit = userRole === 'admin' || userRole === 'manager';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionPunchListItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: ConstructionPunchListItem) => {
    setEditTarget(item);
    setForm({
      title: item.title,
      description: item.description ?? '',
      location_on_site: item.location_on_site ?? '',
      due_date: item.due_date ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const body = {
      title: form.title,
      description: form.description || undefined,
      location_on_site: form.location_on_site || undefined,
      due_date: form.due_date || undefined,
    };
    if (editTarget) {
      updateItem.mutate({ projectId, itemId: editTarget.id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createItem.mutate({ projectId, body }, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleStatusChange = (item: ConstructionPunchListItem, newStatus: PunchListStatus) => {
    updateItem.mutate({ projectId, itemId: item.id, body: { status: newStatus } });
  };

  const handleDelete = (item: ConstructionPunchListItem) => {
    if (confirm(`"${item.title}" kalemini silmek istediğinizden emin misiniz?`)) {
      deleteItem.mutate({ projectId, itemId: item.id });
    }
  };

  if (isLoading) {
    return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>;
  }

  const total = items.length;
  const verified = items.filter((i) => i.status === 'verified').length;
  const completed = items.filter((i) => i.status === 'completed' || i.status === 'verified').length;
  const pct = total > 0 ? Math.round((verified / total) * 100) : 0;

  return (
    <Box>
      {/* Progress summary */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="subtitle2" fontWeight={700}>
            {verified}/{total} doğrulandı
          </Typography>
          <Typography variant="body2" fontWeight={600} color={pct === 100 ? 'success.main' : 'text.secondary'}>
            %{pct}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }}
          color={pct === 100 ? 'success' : 'primary'}
        />
        <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
          {completed} tamamlandı · {items.filter((i) => i.is_overdue).length} vadesi geçmiş
        </Typography>
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" fontWeight={700}>Teslim Listesi</Typography>
        {canEdit && (
          <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={openCreate}>
            Kalem Ekle
          </Button>
        )}
      </Box>

      {/* Kanban columns */}
      <Grid container spacing={2}>
        {COLUMNS.map((col) => {
          const colItems = items.filter((i) => i.status === col);
          return (
            <Grid key={col} size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 1.5 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <Chip label={STATUS_LABELS[col]} color={STATUS_COLORS[col]} size="small" />
                  <Typography variant="caption" color="text.secondary">({colItems.length})</Typography>
                </Box>
                <Box display="flex" flexDirection="column" gap={1}>
                  {colItems.length === 0 && (
                    <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>Kalem yok</Typography>
                  )}
                  {colItems.map((item) => (
                    <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderColor: item.is_overdue ? 'error.main' : 'divider', bgcolor: 'background.paper' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="body2" fontWeight={600} sx={{ flexGrow: 1 }}>{item.title}</Typography>
                        {canEdit && (
                          <Box display="flex" ml={0.5} flexShrink={0}>
                            <Tooltip title="Düzenle">
                              <IconButton size="small" onClick={() => openEdit(item)}>
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Sil">
                              <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => handleDelete(item)}>
                                <DeleteIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                      {item.location_on_site && (
                        <Typography variant="caption" color="text.secondary">{item.location_on_site}</Typography>
                      )}
                      {item.due_date && (
                        <Typography variant="caption" sx={{ color: item.is_overdue ? 'error.main' : 'text.secondary', display: 'block' }}>
                          {item.is_overdue && <WarningIcon sx={{ fontSize: 12, mr: 0.25 }} />}
                          Vade: {item.due_date}
                        </Typography>
                      )}
                      {item.subcontractor_name && (
                        <Typography variant="caption" color="text.secondary" display="block">{item.subcontractor_name}</Typography>
                      )}
                      {canEdit && (
                        <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                          {col === 'open' && (
                            <Button size="small" sx={{ fontSize: 11, py: 0 }} onClick={() => handleStatusChange(item, 'in_progress')}>
                              Başlat
                            </Button>
                          )}
                          {col === 'in_progress' && (
                            <Button size="small" sx={{ fontSize: 11, py: 0 }} startIcon={<CheckCircleIcon sx={{ fontSize: 13 }} />} onClick={() => handleStatusChange(item, 'completed')}>
                              Tamamla
                            </Button>
                          )}
                          {col === 'completed' && (
                            <Button size="small" color="success" sx={{ fontSize: 11, py: 0 }} startIcon={<VerifiedIcon sx={{ fontSize: 13 }} />} onClick={() => verifyItem.mutate({ projectId, itemId: item.id })}>
                              Doğrula
                            </Button>
                          )}
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Kalemi Düzenle' : 'Teslim Listesi Kalemi Ekle'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Başlık" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} size="small" required />
          <TextField label="Açıklama" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} size="small" multiline rows={2} />
          <TextField label="Konum (Sahada)" value={form.location_on_site} onChange={(e) => setForm({ ...form, location_on_site: e.target.value })} size="small" />
          <TextField label="Vade Tarihi" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} size="small" InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.title || createItem.isPending || updateItem.isPending}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
