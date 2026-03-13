import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PaymentIcon from '@mui/icons-material/Payment';
import WarningIcon from '@mui/icons-material/Warning';
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
  IconButton,
  MenuItem,
  Paper,
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
  useCreateInvoice,
  useDeleteInvoice,
  useInvoices,
  useMarkInvoicePaid,
  useUpdateInvoice,
} from '../../hooks/construction/useConstructionInvoices';
import type { ConstructionInvoice, ConstructionSubcontractor, InvoiceStatus, UserRole } from '../../types';

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  received: 'Alındı',
  under_review: 'İnceleniyor',
  approved: 'Onaylandı',
  paid: 'Ödendi',
  disputed: 'İtirazlı',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<InvoiceStatus, 'default' | 'info' | 'primary' | 'success' | 'error' | 'warning'> = {
  received: 'info',
  under_review: 'warning',
  approved: 'primary',
  paid: 'success',
  disputed: 'error',
  cancelled: 'default',
};

interface Props {
  projectId: number;
  userRole: UserRole;
  subcontractors?: ConstructionSubcontractor[];
}

const EMPTY_FORM = {
  invoice_number: '',
  description: '',
  amount: '',
  tax_amount: '0',
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  subcontractor_id: '',
  notes: '',
};

export function InvoiceList({ projectId, userRole, subcontractors = [] }: Props) {
  const { data: invoices = [], isLoading, isError } = useInvoices(projectId);
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const markPaid = useMarkInvoicePaid();
  const deleteInvoice = useDeleteInvoice();
  const canEdit = userRole === 'admin' || userRole === 'manager';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionInvoice | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (invoice: ConstructionInvoice) => {
    setEditTarget(invoice);
    setForm({
      invoice_number: invoice.invoice_number,
      description: invoice.description,
      amount: invoice.amount,
      tax_amount: invoice.tax_amount,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date ?? '',
      subcontractor_id: invoice.subcontractor_id?.toString() ?? '',
      notes: invoice.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const body = {
      invoice_number: form.invoice_number,
      description: form.description,
      amount: form.amount,
      tax_amount: form.tax_amount || '0',
      invoice_date: form.invoice_date,
      due_date: form.due_date || undefined,
      subcontractor_id: form.subcontractor_id ? parseInt(form.subcontractor_id) : undefined,
      notes: form.notes || undefined,
    };
    if (editTarget) {
      updateInvoice.mutate({ projectId, invoiceId: editTarget.id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createInvoice.mutate({ projectId, body }, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = (invoice: ConstructionInvoice) => {
    if (confirm(`"${invoice.invoice_number}" faturasını silmek istediğinizden emin misiniz?`)) {
      deleteInvoice.mutate({ projectId, invoiceId: invoice.id });
    }
  };

  // Summary
  const totalReceived = invoices.filter((i) => !['paid', 'cancelled'].includes(i.status))
    .reduce((s, i) => s + parseFloat(i.total_amount), 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total_amount), 0);
  const outstanding = totalReceived;

  if (isLoading) {
    return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>;
  }

  if (isError) return <Alert severity="error">Veriler yüklenirken bir hata oluştu.</Alert>;

  return (
    <Box>
      {/* Summary */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {[
          { label: 'Toplam Bekleyen', value: `₺${totalReceived.toLocaleString('tr-TR')}`, color: 'warning.main' },
          { label: 'Toplam Ödenen', value: `₺${totalPaid.toLocaleString('tr-TR')}`, color: 'success.main' },
          { label: 'Vadesi Geçen', value: invoices.filter((i) => i.is_overdue).length.toString(), color: 'error.main' },
        ].map((s) => (
          <Paper key={s.label} variant="outlined" sx={{ p: 1.5, borderColor: 'divider', bgcolor: 'background.paper', minWidth: 140 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" fontWeight={700}>Faturalar</Typography>
        {canEdit && (
          <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={openCreate}>
            Fatura Ekle
          </Button>
        )}
      </Box>

      {invoices.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Kayıtlı fatura bulunmuyor.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fatura No</TableCell>
                <TableCell>Taşeron / Tedarikçi</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell align="right">Tutar (₺)</TableCell>
                <TableCell align="right">Toplam (₺)</TableCell>
                <TableCell>Vade</TableCell>
                <TableCell>Durum</TableCell>
                {canEdit && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} hover sx={inv.is_overdue ? { bgcolor: 'rgba(239,68,68,0.05)' } : {}}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {inv.is_overdue && <Tooltip title="Vadesi geçmiş"><WarningIcon sx={{ fontSize: 14, color: 'error.main' }} /></Tooltip>}
                      <Typography variant="body2" fontWeight={600}>{inv.invoice_number}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{inv.subcontractor_name ?? '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 160 }}>
                    <Typography variant="caption" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {inv.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{parseFloat(inv.amount).toLocaleString('tr-TR')}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>{parseFloat(inv.total_amount).toLocaleString('tr-TR')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: inv.is_overdue ? 'error.main' : 'text.secondary' }}>
                      {inv.due_date ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={STATUS_LABELS[inv.status]} color={STATUS_COLORS[inv.status]} size="small" />
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Box display="flex">
                        {inv.status === 'approved' && (
                          <Tooltip title="Öde">
                            <IconButton
                              size="small"
                              sx={{ color: 'success.main' }}
                              onClick={() => markPaid.mutate({ projectId, invoiceId: inv.id })}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Düzenle">
                          <IconButton size="small" onClick={() => openEdit(inv)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => handleDelete(inv)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {/* Summary row */}
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell colSpan={4} align="right">
                  <Typography variant="caption" fontWeight={700}>Toplam</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={700}>
                    ₺{invoices.reduce((s, i) => s + parseFloat(i.total_amount), 0).toLocaleString('tr-TR')}
                  </Typography>
                </TableCell>
                <TableCell colSpan={canEdit ? 3 : 2} />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Fatura Düzenle' : 'Fatura Ekle'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Fatura No" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} size="small" required />
          <TextField label="Açıklama" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} size="small" multiline rows={2} required />
          <TextField label="Tutar (₺)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} size="small" required />
          <TextField label="KDV Tutarı (₺)" type="number" value={form.tax_amount} onChange={(e) => setForm({ ...form, tax_amount: e.target.value })} size="small" />
          <TextField label="Fatura Tarihi" type="date" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} size="small" InputLabelProps={{ shrink: true }} required />
          <TextField label="Vade Tarihi" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} size="small" InputLabelProps={{ shrink: true }} />
          {subcontractors.length > 0 && (
            <TextField
              select
              label="Taşeron"
              value={form.subcontractor_id}
              onChange={(e) => setForm({ ...form, subcontractor_id: e.target.value })}
              size="small"
            >
              <MenuItem value="">— Seçiniz —</MenuItem>
              {subcontractors.map((s) => <MenuItem key={s.id} value={s.id.toString()}>{s.company_name}</MenuItem>)}
            </TextField>
          )}
          <TextField label="Notlar" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} size="small" multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.invoice_number || !form.amount || createInvoice.isPending || updateInvoice.isPending}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
