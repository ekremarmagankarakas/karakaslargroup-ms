import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
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
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useCreateMaterial,
  useDeleteMaterial,
  useMaterials,
  useUpdateMaterial,
} from '../../hooks/construction/useConstruction';
import type { ConstructionMaterial, ConstructionMaterialUnit, UserRole } from '../../types';
import { downloadCsv } from '../../utils/exportCsv';

const UNIT_OPTIONS: ConstructionMaterialUnit[] = ['m3', 'kg', 'ton', 'adet', 'm2', 'm', 'litre'];

const MATERIAL_TYPE_SUGGESTIONS = [
  'Beton',
  'Ahşap',
  'Çelik',
  'Tuğla',
  'Demir',
  'Cam',
  'Alüminyum',
  'İzolasyon',
  'Boya',
  'Kablo',
];

interface FormState {
  name: string;
  material_type: string;
  unit: ConstructionMaterialUnit;
  quantity_planned: string;
  quantity_used: string;
  unit_cost: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  material_type: '',
  unit: 'adet',
  quantity_planned: '',
  quantity_used: '0',
  unit_cost: '',
  notes: '',
};

interface Props {
  projectId: number;
  userRole: UserRole;
}

export function MaterialsTable({ projectId, userRole }: Props) {
  const { data: materials = [], isLoading } = useMaterials(projectId);
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionMaterial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (m: ConstructionMaterial) => {
    setEditTarget(m);
    setForm({
      name: m.name,
      material_type: m.material_type,
      unit: m.unit,
      quantity_planned: m.quantity_planned,
      quantity_used: m.quantity_used,
      unit_cost: m.unit_cost ?? '',
      notes: m.notes ?? '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const body = {
      name: form.name.trim(),
      material_type: form.material_type.trim(),
      unit: form.unit,
      quantity_planned: form.quantity_planned,
      quantity_used: form.quantity_used || '0',
      unit_cost: form.unit_cost || undefined,
      notes: form.notes || undefined,
    };
    if (editTarget) {
      await updateMaterial.mutateAsync({ projectId, materialId: editTarget.id, body });
    } else {
      await createMaterial.mutateAsync({ projectId, body });
    }
    setFormOpen(false);
  };

  const handleDelete = (materialId: number) => {
    deleteMaterial.mutate({ projectId, materialId });
  };

  const usagePercent = (m: ConstructionMaterial) => {
    const planned = parseFloat(m.quantity_planned);
    const used = parseFloat(m.quantity_used);
    if (!planned) return 0;
    return Math.min(100, Math.round((used / planned) * 100));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Malzemeler
        </Typography>
        <Box display="flex" gap={1}>
          {canEdit && (
            <Tooltip title="CSV İndir">
              <IconButton
                size="small"
                onClick={() => downloadCsv(`/construction/${projectId}/export/materials`, `malzemeler_${projectId}.csv`)}
                sx={{ color: 'text.secondary' }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canEdit && (
            <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={openCreate}>
              Malzeme Ekle
            </Button>
          )}
        </Box>
      </Box>

      {isLoading ? (
        <Typography variant="body2" color="text.secondary">
          Yükleniyor...
        </Typography>
      ) : materials.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Henüz malzeme eklenmemiş.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Malzeme</TableCell>
                <TableCell>Tip</TableCell>
                <TableCell align="right">Planlanan</TableCell>
                <TableCell align="right">Kullanılan</TableCell>
                <TableCell align="right">Birim Fiyat</TableCell>
                <TableCell>Kullanım</TableCell>
                {canEdit && <TableCell align="right" />}
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {m.name}
                    </Typography>
                    {m.notes && (
                      <Typography variant="caption" color="text.secondary">
                        {m.notes}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={m.material_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {parseFloat(m.quantity_planned).toLocaleString('tr-TR')} {m.unit}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {parseFloat(m.quantity_used).toLocaleString('tr-TR')} {m.unit}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {m.unit_cost ? `₺${parseFloat(m.unit_cost).toLocaleString('tr-TR')}` : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 60,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'action.hover',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${usagePercent(m)}%`,
                            bgcolor:
                              usagePercent(m) >= 100
                                ? 'error.main'
                                : usagePercent(m) >= 80
                                  ? 'warning.main'
                                  : 'success.main',
                            borderRadius: 3,
                          }}
                        />
                      </Box>
                      <Typography variant="caption">{usagePercent(m)}%</Typography>
                    </Box>
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      <Tooltip title="Düzenle">
                        <IconButton size="small" onClick={() => openEdit(m)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton size="small" onClick={() => handleDelete(m.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Malzeme Düzenle' : 'Malzeme Ekle'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Malzeme Adı"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              size="small"
              required
            />
            <TextField
              label="Tip"
              value={form.material_type}
              onChange={(e) => setForm((f) => ({ ...f, material_type: e.target.value }))}
              fullWidth
              size="small"
              placeholder="Beton, Ahşap, Çelik..."
              helperText={MATERIAL_TYPE_SUGGESTIONS.join(', ')}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Birim</InputLabel>
              <Select
                value={form.unit}
                label="Birim"
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value as ConstructionMaterialUnit }))
                }
              >
                {UNIT_OPTIONS.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <TextField
                label="Planlanan Miktar"
                value={form.quantity_planned}
                onChange={(e) => setForm((f) => ({ ...f, quantity_planned: e.target.value }))}
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0, step: '0.001' }}
              />
              <TextField
                label="Kullanılan Miktar"
                value={form.quantity_used}
                onChange={(e) => setForm((f) => ({ ...f, quantity_used: e.target.value }))}
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0, step: '0.001' }}
              />
            </Box>
            <TextField
              label="Birim Fiyat (₺)"
              value={form.unit_cost}
              onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))}
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
            />
            <TextField
              label="Notlar"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              multiline
              rows={2}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              !form.name.trim() ||
              !form.material_type.trim() ||
              !form.quantity_planned ||
              createMaterial.isPending ||
              updateMaterial.isPending
            }
          >
            {editTarget ? 'Kaydet' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
