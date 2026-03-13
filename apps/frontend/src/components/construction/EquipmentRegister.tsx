import React, { useState } from 'react';
import {
  Box, Button, Typography, Chip, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, Select, MenuItem,
  FormControl, InputLabel, Paper, Table, TableBody, TableCell, TableHead,
  TableRow, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { ConstructionEquipment, EquipmentCategory, EquipmentStatus } from '../../types';
import {
  useEquipment,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
} from '../../hooks/construction/useConstructionEquipment';

interface Props {
  projectId: number;
  canEdit: boolean;
}

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'Mevcut',
  in_use: 'Kullanımda',
  under_maintenance: 'Bakımda',
  out_of_service: 'Hizmet Dışı',
  returned: 'İade Edildi',
};

const STATUS_COLORS: Record<EquipmentStatus, 'success' | 'primary' | 'warning' | 'error' | 'default'> = {
  available: 'success',
  in_use: 'primary',
  under_maintenance: 'warning',
  out_of_service: 'error',
  returned: 'default',
};

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  heavy_machinery: 'Ağır Makine',
  lifting: 'Kaldırma',
  earthmoving: 'Toprak İşleri',
  compaction: 'Sıkıştırma',
  concrete: 'Beton',
  electrical: 'Elektrik',
  scaffolding: 'İskele',
  safety: 'Güvenlik',
  survey: 'Ölçüm',
  other: 'Diğer',
};

const EQUIPMENT_STATUSES: EquipmentStatus[] = ['available', 'in_use', 'under_maintenance', 'out_of_service', 'returned'];
const EQUIPMENT_CATEGORIES: EquipmentCategory[] = ['heavy_machinery', 'lifting', 'earthmoving', 'compaction', 'concrete', 'electrical', 'scaffolding', 'safety', 'survey', 'other'];

const emptyForm = {
  name: '',
  category: 'other' as EquipmentCategory,
  status: 'available' as EquipmentStatus,
  model_number: '',
  serial_number: '',
  supplier: '',
  rental_rate_daily: '',
  mobilization_date: '',
  demobilization_date: '',
  last_maintenance_date: '',
  next_maintenance_date: '',
  notes: '',
};

export default function EquipmentRegister({ projectId, canEdit }: Props) {
  const { data: items = [], isLoading, isError } = useEquipment(projectId);
  const createMutation = useCreateEquipment(projectId);
  const updateMutation = useUpdateEquipment(projectId);
  const deleteMutation = useDeleteEquipment(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ConstructionEquipment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ConstructionEquipment | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: ConstructionEquipment) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      status: item.status,
      model_number: item.model_number ?? '',
      serial_number: item.serial_number ?? '',
      supplier: item.supplier ?? '',
      rental_rate_daily: item.rental_rate_daily ?? '',
      mobilization_date: item.mobilization_date ?? '',
      demobilization_date: item.demobilization_date ?? '',
      last_maintenance_date: item.last_maintenance_date ?? '',
      next_maintenance_date: item.next_maintenance_date ?? '',
      notes: item.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      category: form.category,
      status: form.status,
      model_number: form.model_number || null,
      serial_number: form.serial_number || null,
      supplier: form.supplier || null,
      rental_rate_daily: form.rental_rate_daily || null,
      mobilization_date: form.mobilization_date || null,
      demobilization_date: form.demobilization_date || null,
      last_maintenance_date: form.last_maintenance_date || null,
      next_maintenance_date: form.next_maintenance_date || null,
      notes: form.notes || null,
    };
    if (editing) {
      await updateMutation.mutateAsync({ equipmentId: editing.id, body: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const overdueCount = items.filter(i => i.maintenance_overdue).length;

  if (isLoading) return <Typography sx={{ p: 2 }}>Yükleniyor...</Typography>;

  if (isError) return <Alert severity="error">Veriler yüklenirken bir hata oluştu.</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Ekipman Sicil Defteri</Typography>
          {overdueCount > 0 && (
            <Chip
              icon={<WarningAmberIcon />}
              label={`${overdueCount} bakım gecikmiş`}
              color="warning"
              size="small"
            />
          )}
        </Box>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
            Ekipman Ekle
          </Button>
        )}
      </Box>

      {/* Summary chips */}
      {items.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {EQUIPMENT_STATUSES.map(s => {
            const cnt = items.filter(i => i.status === s).length;
            if (cnt === 0) return null;
            return (
              <Chip
                key={s}
                label={`${STATUS_LABELS[s]}: ${cnt}`}
                color={STATUS_COLORS[s]}
                size="small"
                variant="outlined"
              />
            );
          })}
        </Stack>
      )}

      {items.length === 0 && (
        <Alert severity="info">Henüz ekipman kaydı bulunmuyor.</Alert>
      )}

      {items.length > 0 && (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ekipman Adı</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Tedarikçi</TableCell>
                <TableCell>Günlük Kira (₺)</TableCell>
                <TableCell>Mobilizasyon</TableCell>
                <TableCell>Sonraki Bakım</TableCell>
                {canEdit && <TableCell align="right">İşlem</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id} sx={{ bgcolor: item.maintenance_overdue ? 'rgba(237,108,2,0.05)' : 'inherit' }}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                      {item.model_number && (
                        <Typography variant="caption" color="text.secondary">Model: {item.model_number}</Typography>
                      )}
                      {item.serial_number && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          S/N: {item.serial_number}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{CATEGORY_LABELS[item.category]}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[item.status]}
                      color={STATUS_COLORS[item.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.supplier ?? '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.rental_rate_daily ? `₺${parseFloat(item.rental_rate_daily).toLocaleString('tr-TR')}` : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.mobilization_date ?? '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {item.maintenance_overdue && <WarningAmberIcon fontSize="small" color="warning" />}
                      <Typography
                        variant="body2"
                        color={item.maintenance_overdue ? 'warning.main' : 'text.primary'}
                        fontWeight={item.maintenance_overdue ? 600 : 400}
                      >
                        {item.next_maintenance_date ?? '-'}
                      </Typography>
                    </Box>
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      <Tooltip title="Düzenle">
                        <IconButton size="small" onClick={() => openEdit(item)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(item)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Ekipmanı Düzenle' : 'Yeni Ekipman'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Ekipman Adı"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={form.category}
                  label="Kategori"
                  onChange={e => setForm({ ...form, category: e.target.value as EquipmentCategory })}
                >
                  {EQUIPMENT_CATEGORIES.map(c => (
                    <MenuItem key={c} value={c}>{CATEGORY_LABELS[c]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={form.status}
                  label="Durum"
                  onChange={e => setForm({ ...form, status: e.target.value as EquipmentStatus })}
                >
                  {EQUIPMENT_STATUSES.map(s => (
                    <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Model No"
                value={form.model_number}
                onChange={e => setForm({ ...form, model_number: e.target.value })}
                fullWidth
              />
              <TextField
                label="Seri No"
                value={form.serial_number}
                onChange={e => setForm({ ...form, serial_number: e.target.value })}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Tedarikçi"
                value={form.supplier}
                onChange={e => setForm({ ...form, supplier: e.target.value })}
                fullWidth
              />
              <TextField
                label="Günlük Kira (₺)"
                type="number"
                value={form.rental_rate_daily}
                onChange={e => setForm({ ...form, rental_rate_daily: e.target.value })}
                fullWidth
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Mobilizasyon Tarihi"
                type="date"
                value={form.mobilization_date}
                onChange={e => setForm({ ...form, mobilization_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Demobilizasyon Tarihi"
                type="date"
                value={form.demobilization_date}
                onChange={e => setForm({ ...form, demobilization_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Son Bakım Tarihi"
                type="date"
                value={form.last_maintenance_date}
                onChange={e => setForm({ ...form, last_maintenance_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Sonraki Bakım Tarihi"
                type="date"
                value={form.next_maintenance_date}
                onChange={e => setForm({ ...form, next_maintenance_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <TextField
              label="Notlar"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Ekipmanı Sil</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{deleteTarget?.name}</strong> ekipmanını silmek istediğinize emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>İptal</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleteMutation.isPending}>
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
