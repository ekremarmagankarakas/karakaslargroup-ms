import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
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
  useCreateShipment,
  useDeleteShipment,
  useShipments,
  useUpdateShipment,
} from '../../hooks/construction/useConstructionShipments';
import type { ConstructionMaterial, ConstructionShipment, ShipmentStatus, UserRole } from '../../types';
import { formatDate } from '../../utils/formatters';

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: 'default' | 'info' | 'success' | 'warning' | 'error' | 'secondary' }> = {
  ordered: { label: 'Sipariş Verildi', color: 'info' },
  in_transit: { label: 'Yolda', color: 'warning' },
  delivered: { label: 'Teslim Edildi', color: 'success' },
  partial: { label: 'Kısmi Teslim', color: 'secondary' },
  rejected: { label: 'Reddedildi', color: 'error' },
  returned: { label: 'İade Edildi', color: 'default' },
};

const UNIT_OPTIONS = ['m3', 'kg', 'ton', 'adet', 'm2', 'm', 'litre'];

interface Props {
  projectId: number;
  userRole: UserRole;
  materials?: ConstructionMaterial[];
}

interface ShipmentFormState {
  material_id: string;
  material_name: string;
  supplier_name: string;
  quantity_ordered: string;
  unit: string;
  unit_cost: string;
  order_date: string;
  expected_delivery_date: string;
  notes: string;
  delivery_note_number: string;
}

const DEFAULT_FORM: ShipmentFormState = {
  material_id: '',
  material_name: '',
  supplier_name: '',
  quantity_ordered: '',
  unit: 'adet',
  unit_cost: '',
  order_date: new Date().toISOString().slice(0, 10),
  expected_delivery_date: '',
  notes: '',
  delivery_note_number: '',
};

export function ShipmentList({ projectId, userRole, materials = [] }: Props) {
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const { data: shipments = [], isLoading } = useShipments(projectId);
  const createShipment = useCreateShipment();
  const updateShipment = useUpdateShipment();
  const deleteShipment = useDeleteShipment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ShipmentFormState>(DEFAULT_FORM);
  const [deliveryDialog, setDeliveryDialog] = useState<ConstructionShipment | null>(null);
  const [deliveredQty, setDeliveredQty] = useState('');

  const totalOrdered = shipments.reduce(
    (sum, s) => sum + (s.unit_cost ? parseFloat(s.quantity_ordered) * parseFloat(s.unit_cost) : 0),
    0,
  );
  const totalDelivered = shipments
    .filter((s) => s.status === 'delivered' || s.status === 'partial')
    .reduce(
      (sum, s) =>
        sum +
        (s.quantity_delivered && s.unit_cost
          ? parseFloat(s.quantity_delivered) * parseFloat(s.unit_cost)
          : 0),
      0,
    );
  const pendingCount = shipments.filter(
    (s) => s.status === 'ordered' || s.status === 'in_transit',
  ).length;

  const handleMaterialSelect = (materialId: string) => {
    const mat = materials.find((m) => String(m.id) === materialId);
    if (mat) {
      setForm((f) => ({
        ...f,
        material_id: materialId,
        material_name: mat.name,
        unit: mat.unit,
        unit_cost: mat.unit_cost ?? '',
      }));
    } else {
      setForm((f) => ({ ...f, material_id: '' }));
    }
  };

  const handleCreate = async () => {
    await createShipment.mutateAsync({
      projectId,
      body: {
        material_id: form.material_id ? parseInt(form.material_id) : undefined,
        material_name: form.material_name,
        supplier_name: form.supplier_name,
        quantity_ordered: form.quantity_ordered,
        unit: form.unit,
        unit_cost: form.unit_cost || undefined,
        order_date: form.order_date,
        expected_delivery_date: form.expected_delivery_date || undefined,
        notes: form.notes || undefined,
        delivery_note_number: form.delivery_note_number || undefined,
      },
    });
    setDialogOpen(false);
    setForm(DEFAULT_FORM);
  };

  const handleQuickDeliver = async () => {
    if (!deliveryDialog) return;
    await updateShipment.mutateAsync({
      projectId,
      shipmentId: deliveryDialog.id,
      body: {
        status: 'delivered',
        quantity_delivered: deliveredQty,
        actual_delivery_date: new Date().toISOString().slice(0, 10),
      },
    });
    setDeliveryDialog(null);
    setDeliveredQty('');
  };

  const handleQuickReject = async (shipment: ConstructionShipment) => {
    await updateShipment.mutateAsync({
      projectId,
      shipmentId: shipment.id,
      body: { status: 'rejected' },
    });
  };

  const handleStatusToInTransit = async (shipment: ConstructionShipment) => {
    await updateShipment.mutateAsync({
      projectId,
      shipmentId: shipment.id,
      body: { status: 'in_transit' },
    });
  };

  if (isLoading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Yükleniyor...
      </Typography>
    );
  }

  return (
    <Box>
      {/* Summary cards */}
      <Grid container spacing={2} mb={2.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="caption" color="text.secondary">Toplam Sipariş Tutarı</Typography>
            <Typography variant="h6" fontWeight={700}>
              ₺{totalOrdered.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="caption" color="text.secondary">Toplam Teslim Tutarı</Typography>
            <Typography variant="h6" fontWeight={700} color="success.main">
              ₺{totalDelivered.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="caption" color="text.secondary">Bekleyen Sevkiyat</Typography>
            <Typography variant="h6" fontWeight={700} color={pendingCount > 0 ? 'warning.main' : 'text.primary'}>
              {pendingCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle1" fontWeight={700}>Sevkiyatlar</Typography>
        {canEdit && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setDialogOpen(true)}
          >
            Yeni Sevkiyat
          </Button>
        )}
      </Box>

      {shipments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Henüz sevkiyat bulunmuyor.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Malzeme</TableCell>
                <TableCell>Tedarikçi</TableCell>
                <TableCell align="right">Sipariş Miktarı</TableCell>
                <TableCell align="right">Teslim Miktarı</TableCell>
                <TableCell align="right">Birim Fiyat</TableCell>
                <TableCell align="right">Toplam</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Sipariş Tarihi</TableCell>
                <TableCell>Beklenen Teslim</TableCell>
                {canEdit && <TableCell align="center">İşlem</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {shipments.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {s.material_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {s.supplier_name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {parseFloat(s.quantity_ordered).toLocaleString('tr-TR')} {s.unit}
                  </TableCell>
                  <TableCell align="right">
                    {s.quantity_delivered
                      ? `${parseFloat(s.quantity_delivered).toLocaleString('tr-TR')} ${s.unit}`
                      : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {s.unit_cost ? `₺${parseFloat(s.unit_cost).toLocaleString('tr-TR')}` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {s.unit_cost
                      ? `₺${(parseFloat(s.quantity_ordered) * parseFloat(s.unit_cost)).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_CONFIG[s.status].label}
                      color={STATUS_CONFIG[s.status].color}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{formatDate(s.order_date)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {s.expected_delivery_date ? formatDate(s.expected_delivery_date) : '—'}
                    </Typography>
                  </TableCell>
                  {canEdit && (
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {(s.status === 'in_transit' || s.status === 'ordered') && (
                          <>
                            <Tooltip title="Teslim Alındı">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  setDeliveryDialog(s);
                                  setDeliveredQty(s.quantity_ordered);
                                }}
                              >
                                <CheckCircleOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reddedildi">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleQuickReject(s)}
                              >
                                <DoNotDisturbIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {s.status === 'ordered' && (
                          <Tooltip title="Yola Çıktı">
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 10, px: 0.75, py: 0.25, minWidth: 0 }}
                              onClick={() => handleStatusToInTransit(s)}
                            >
                              Yolda
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip title="Sil">
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() =>
                              deleteShipment.mutate({ projectId, shipmentId: s.id })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Sevkiyat</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            {materials.length > 0 && (
              <FormControl size="small" fullWidth>
                <InputLabel>Malzeme (opsiyonel)</InputLabel>
                <Select
                  value={form.material_id}
                  label="Malzeme (opsiyonel)"
                  onChange={(e) => handleMaterialSelect(e.target.value)}
                >
                  <MenuItem value="">— Ad-hoc —</MenuItem>
                  {materials.map((m) => (
                    <MenuItem key={m.id} value={String(m.id)}>
                      {m.name} ({m.unit})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              label="Malzeme Adı"
              size="small"
              value={form.material_name}
              onChange={(e) => setForm((f) => ({ ...f, material_name: e.target.value }))}
              required
            />
            <TextField
              label="Tedarikçi"
              size="small"
              value={form.supplier_name}
              onChange={(e) => setForm((f) => ({ ...f, supplier_name: e.target.value }))}
              required
            />
            <Stack direction="row" spacing={1}>
              <TextField
                label="Sipariş Miktarı"
                size="small"
                type="number"
                value={form.quantity_ordered}
                onChange={(e) => setForm((f) => ({ ...f, quantity_ordered: e.target.value }))}
                sx={{ flex: 1 }}
                required
              />
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Birim</InputLabel>
                <Select
                  value={form.unit}
                  label="Birim"
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <MenuItem key={u} value={u}>{u}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="Birim Fiyat (₺)"
              size="small"
              type="number"
              value={form.unit_cost}
              onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))}
            />
            <Stack direction="row" spacing={1}>
              <TextField
                label="Sipariş Tarihi"
                size="small"
                type="date"
                value={form.order_date}
                onChange={(e) => setForm((f) => ({ ...f, order_date: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Beklenen Teslim Tarihi"
                size="small"
                type="date"
                value={form.expected_delivery_date}
                onChange={(e) => setForm((f) => ({ ...f, expected_delivery_date: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: 1 }}
              />
            </Stack>
            <TextField
              label="İrsaliye No"
              size="small"
              value={form.delivery_note_number}
              onChange={(e) => setForm((f) => ({ ...f, delivery_note_number: e.target.value }))}
            />
            <TextField
              label="Notlar"
              size="small"
              multiline
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={
              !form.material_name || !form.supplier_name || !form.quantity_ordered || createShipment.isPending
            }
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Deliver Dialog */}
      <Dialog
        open={Boolean(deliveryDialog)}
        onClose={() => setDeliveryDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Teslim Alındı</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            <Typography variant="body2">
              {deliveryDialog?.material_name} — {deliveryDialog?.supplier_name}
            </Typography>
            <TextField
              label="Teslim Alınan Miktar"
              size="small"
              type="number"
              value={deliveredQty}
              onChange={(e) => setDeliveredQty(e.target.value)}
              slotProps={{ input: { endAdornment: <Typography variant="caption">&nbsp;{deliveryDialog?.unit}</Typography> } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryDialog(null)}>İptal</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleQuickDeliver}
            disabled={!deliveredQty || updateShipment.isPending}
          >
            Onayla
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
