import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useCreatePermit,
  useDeletePermit,
  usePermits,
  useUpdatePermit,
} from '../../hooks/construction/useConstructionPermits';
import type { ConstructionPermit, PermitStatus, PermitType } from '../../types';

const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  construction: 'İnşaat',
  demolition: 'Yıkım',
  electrical: 'Elektrik',
  plumbing: 'Sıhhi Tesisat',
  fire_safety: 'Yangın Güvenliği',
  environmental: 'Çevre',
  occupancy: 'İskân',
  other: 'Diğer',
};

const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  not_applied: 'Başvurulmadı',
  applied: 'Başvuruldu',
  under_review: 'İncelemede',
  approved: 'Onaylı',
  rejected: 'Reddedildi',
  expired: 'Süresi Doldu',
};

const PERMIT_STATUS_COLORS: Record<
  PermitStatus,
  'default' | 'info' | 'warning' | 'success' | 'error'
> = {
  not_applied: 'default',
  applied: 'info',
  under_review: 'warning',
  approved: 'success',
  rejected: 'error',
  expired: 'error',
};

const PERMIT_TYPES: PermitType[] = [
  'construction',
  'demolition',
  'electrical',
  'plumbing',
  'fire_safety',
  'environmental',
  'occupancy',
  'other',
];

const PERMIT_STATUSES: PermitStatus[] = [
  'not_applied',
  'applied',
  'under_review',
  'approved',
  'rejected',
  'expired',
];

interface PermitFormState {
  permit_type: PermitType;
  permit_number: string;
  issuing_authority: string;
  status: PermitStatus;
  applied_date: string;
  approved_date: string;
  expiry_date: string;
  notes: string;
}

const EMPTY_FORM: PermitFormState = {
  permit_type: 'construction',
  permit_number: '',
  issuing_authority: '',
  status: 'not_applied',
  applied_date: '',
  approved_date: '',
  expiry_date: '',
  notes: '',
};

function isExpiringSoon(expiry_date: string | null): boolean {
  if (!expiry_date) return false;
  const today = new Date();
  const expiry = new Date(expiry_date);
  const diff = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 30;
}

function isExpired(expiry_date: string | null): boolean {
  if (!expiry_date) return false;
  const today = new Date();
  const expiry = new Date(expiry_date);
  return expiry < today;
}

interface Props {
  projectId: number;
  userRole: string;
}

export function PermitTracker({ projectId, userRole }: Props) {
  const canEdit = userRole === 'manager' || userRole === 'admin';
  const { data: permits = [], isLoading } = usePermits(projectId);
  const createPermit = useCreatePermit();
  const updatePermit = useUpdatePermit();
  const deletePermit = useDeletePermit();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPermit, setEditingPermit] = useState<ConstructionPermit | null>(null);
  const [form, setForm] = useState<PermitFormState>(EMPTY_FORM);

  const openCreate = () => {
    setEditingPermit(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (permit: ConstructionPermit) => {
    setEditingPermit(permit);
    setForm({
      permit_type: permit.permit_type,
      permit_number: permit.permit_number ?? '',
      issuing_authority: permit.issuing_authority,
      status: permit.status,
      applied_date: permit.applied_date ?? '',
      approved_date: permit.approved_date ?? '',
      expiry_date: permit.expiry_date ?? '',
      notes: permit.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const body = {
      permit_type: form.permit_type,
      permit_number: form.permit_number || null,
      issuing_authority: form.issuing_authority,
      status: form.status,
      applied_date: form.applied_date || null,
      approved_date: form.approved_date || null,
      expiry_date: form.expiry_date || null,
      notes: form.notes || null,
    };

    if (editingPermit) {
      await updatePermit.mutateAsync({ projectId, permitId: editingPermit.id, body });
    } else {
      await createPermit.mutateAsync({ projectId, body });
    }
    setDialogOpen(false);
  };

  const handleDelete = async (permitId: number) => {
    await deletePermit.mutateAsync({ projectId, permitId });
  };

  if (isLoading) {
    return (
      <Typography color="text.secondary" variant="body2">
        Yükleniyor...
      </Typography>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          İzin Takibi ({permits.length})
        </Typography>
        {canEdit && (
          <Button startIcon={<AddIcon />} size="small" variant="contained" onClick={openCreate}>
            İzin Ekle
          </Button>
        )}
      </Box>

      {permits.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          Henüz izin kaydı bulunmuyor.
        </Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {permits.map((permit) => {
            const expiringSoon = isExpiringSoon(permit.expiry_date);
            const expired = isExpired(permit.expiry_date);
            const showWarning = (expiringSoon || expired) && permit.expiry_date;

            return (
              <Paper
                key={permit.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderColor: showWarning ? 'rgba(211,47,47,0.4)' : 'divider',
                  bgcolor: showWarning ? 'rgba(211,47,47,0.04)' : 'background.paper',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                      <Chip
                        label={PERMIT_TYPE_LABELS[permit.permit_type]}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip
                        label={PERMIT_STATUS_LABELS[permit.status]}
                        color={PERMIT_STATUS_COLORS[permit.status]}
                        size="small"
                      />
                      {showWarning && (
                        <Tooltip
                          title={expired ? 'Süresi doldu' : '30 gün içinde süresi dolacak'}
                        >
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                            sx={{
                              color: 'error.main',
                              bgcolor: 'rgba(211,47,47,0.08)',
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                            }}
                          >
                            <WarningAmberIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption" fontWeight={600}>
                              {expired ? 'Süresi Doldu' : 'Yakında Doluyor'}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                    <Typography variant="body2" fontWeight={600}>
                      {permit.issuing_authority}
                    </Typography>
                    {permit.permit_number && (
                      <Typography variant="caption" color="text.secondary">
                        No: {permit.permit_number}
                      </Typography>
                    )}
                    <Box display="flex" gap={2} mt={0.5} flexWrap="wrap">
                      {permit.applied_date && (
                        <Typography variant="caption" color="text.secondary">
                          Başvuru: {permit.applied_date}
                        </Typography>
                      )}
                      {permit.approved_date && (
                        <Typography variant="caption" color="text.secondary">
                          Onay: {permit.approved_date}
                        </Typography>
                      )}
                      {permit.expiry_date && (
                        <Typography
                          variant="caption"
                          sx={{ color: showWarning ? 'error.main' : 'text.secondary' }}
                        >
                          Son Geçerlilik: {permit.expiry_date}
                        </Typography>
                      )}
                    </Box>
                    {permit.notes && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                        {permit.notes}
                      </Typography>
                    )}
                  </Box>
                  {canEdit && (
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Düzenle">
                        <IconButton size="small" onClick={() => openEdit(permit)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(permit.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPermit ? 'İzin Düzenle' : 'Yeni İzin Ekle'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>İzin Türü</InputLabel>
              <Select
                label="İzin Türü"
                value={form.permit_type}
                onChange={(e) => setForm((f) => ({ ...f, permit_type: e.target.value as PermitType }))}
              >
                {PERMIT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {PERMIT_TYPE_LABELS[t]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Veren Kurum"
              size="small"
              fullWidth
              value={form.issuing_authority}
              onChange={(e) => setForm((f) => ({ ...f, issuing_authority: e.target.value }))}
            />
            <TextField
              label="İzin Numarası"
              size="small"
              fullWidth
              value={form.permit_number}
              onChange={(e) => setForm((f) => ({ ...f, permit_number: e.target.value }))}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Durum</InputLabel>
              <Select
                label="Durum"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PermitStatus }))}
              >
                {PERMIT_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {PERMIT_STATUS_LABELS[s]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Başvuru Tarihi"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.applied_date}
              onChange={(e) => setForm((f) => ({ ...f, applied_date: e.target.value }))}
            />
            <TextField
              label="Onay Tarihi"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.approved_date}
              onChange={(e) => setForm((f) => ({ ...f, approved_date: e.target.value }))}
            />
            <TextField
              label="Son Geçerlilik Tarihi"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.expiry_date}
              onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
            />
            <TextField
              label="Notlar"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.issuing_authority || createPermit.isPending || updatePermit.isPending}
          >
            {editingPermit ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
