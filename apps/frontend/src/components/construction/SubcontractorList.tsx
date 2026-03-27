import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Chip,
  Skeleton,
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
  useCreateSubcontractor,
  useDeleteSubcontractor,
  useSubcontractors,
  useUpdateSubcontractor,
} from '../../hooks/construction/useConstructionSubcontractors';
import type { ConstructionSubcontractor, SubcontractorStatus, UserRole } from '../../types';
import { formatPrice } from '../../utils/formatters';

const STATUS_CONFIG: Record<
  SubcontractorStatus,
  { label: string; color: 'success' | 'default' | 'error' }
> = {
  active: { label: 'Aktif', color: 'success' },
  inactive: { label: 'Pasif', color: 'default' },
  blacklisted: { label: 'Kara Liste', color: 'error' },
};

const STATUS_OPTIONS: { value: SubcontractorStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Pasif' },
  { value: 'blacklisted', label: 'Kara Liste' },
];

interface FormState {
  company_name: string;
  trade: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  contract_value: string;
  status: SubcontractorStatus;
  notes: string;
}

const EMPTY_FORM: FormState = {
  company_name: '',
  trade: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  contract_value: '',
  status: 'active',
  notes: '',
};

interface Props {
  projectId: number;
  userRole: UserRole;
}

export function SubcontractorList({ projectId, userRole }: Props) {
  const { data: subs = [], isLoading } = useSubcontractors(projectId);
  const createSub = useCreateSubcontractor();
  const updateSub = useUpdateSubcontractor();
  const deleteSub = useDeleteSubcontractor();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionSubcontractor | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const totalActive = subs
    .filter((s) => s.status === 'active' && s.contract_value)
    .reduce((sum, s) => sum + parseFloat(s.contract_value!), 0);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (sub: ConstructionSubcontractor) => {
    setEditTarget(sub);
    setForm({
      company_name: sub.company_name,
      trade: sub.trade,
      contact_name: sub.contact_name,
      contact_phone: sub.contact_phone,
      contact_email: sub.contact_email ?? '',
      contract_value: sub.contract_value ?? '',
      status: sub.status,
      notes: sub.notes ?? '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      company_name: form.company_name.trim(),
      trade: form.trade.trim(),
      contact_name: form.contact_name.trim(),
      contact_phone: form.contact_phone.trim(),
      contact_email: form.contact_email.trim() || null,
      contract_value: form.contract_value.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    if (editTarget) {
      await updateSub.mutateAsync({ projectId, subId: editTarget.id, body: payload });
    } else {
      await createSub.mutateAsync({ projectId, body: payload });
    }
    setFormOpen(false);
  };

  const isValid =
    form.company_name.trim() &&
    form.trade.trim() &&
    form.contact_name.trim() &&
    form.contact_phone.trim();

  return (
    <Box>
      {/* Summary card */}
      {subs.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 2, mb: 2, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Aktif Taşeronlar Toplam Sözleşme Değeri
            </Typography>
            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
              ₺{formatPrice(totalActive)}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {subs.filter((s) => s.status === 'active').length} aktif /{' '}
            {subs.length} toplam taşeron
          </Typography>
        </Paper>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Taşeronlar
        </Typography>
        {canEdit && (
          <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={openCreate}>
            Taşeron Ekle
          </Button>
        )}
      </Box>

      {isLoading ? (
        <Skeleton variant="rounded" height={120} />
      ) : subs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Henüz taşeron kaydedilmemiş.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Şirket</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>İş Kolu</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>İletişim</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Sözleşme Değeri
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Durum</TableCell>
                {canEdit && <TableCell align="center" sx={{ fontWeight: 700 }}>İşlemler</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {subs.map((sub) => {
                const st = STATUS_CONFIG[sub.status];
                return (
                  <TableRow key={sub.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {sub.company_name}
                      </Typography>
                      {sub.notes && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {sub.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{sub.trade}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{sub.contact_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sub.contact_phone}
                      </Typography>
                      {sub.contact_email && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {sub.contact_email}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {sub.contract_value
                          ? `₺${formatPrice(parseFloat(sub.contract_value))}`
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={st.label} color={st.color} size="small" />
                    </TableCell>
                    {canEdit && (
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Düzenle">
                            <IconButton size="small" onClick={() => openEdit(sub)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                deleteSub.mutate({ projectId, subId: sub.id })
                              }
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Taşeron Düzenle' : 'Taşeron Ekle'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Şirket Adı"
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              fullWidth
              size="small"
              required
            />
            <TextField
              label="İş Kolu"
              value={form.trade}
              onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))}
              fullWidth
              size="small"
              required
            />
            <Box display="flex" gap={2}>
              <TextField
                label="Yetkili Adı"
                value={form.contact_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                size="small"
                sx={{ flex: 1 }}
                required
              />
              <TextField
                label="Telefon"
                value={form.contact_phone}
                onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                size="small"
                sx={{ flex: 1 }}
                required
              />
            </Box>
            <TextField
              label="E-posta"
              value={form.contact_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
              fullWidth
              size="small"
              type="email"
            />
            <TextField
              label="Sözleşme Değeri (₺)"
              value={form.contract_value}
              onChange={(e) => setForm((f) => ({ ...f, contract_value: e.target.value }))}
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={form.status}
                label="Durum"
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SubcontractorStatus }))}
              >
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Notlar"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isValid || createSub.isPending || updateSub.isPending}
          >
            {editTarget ? 'Kaydet' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
