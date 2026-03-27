import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReplyIcon from '@mui/icons-material/Reply';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Skeleton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useCreateRFI,
  useDeleteRFI,
  useRFIs,
  useUpdateRFI,
} from '../../hooks/construction/useConstructionRFIs';
import type { ConstructionRFI, RFIPriority, RFIStatus, UserRole } from '../../types';

const STATUS_LABELS: Record<RFIStatus, string> = {
  draft: 'Taslak',
  submitted: 'Gönderildi',
  under_review: 'İnceleniyor',
  answered: 'Yanıtlandı',
  closed: 'Kapatıldı',
};

const STATUS_COLORS: Record<RFIStatus, 'default' | 'info' | 'warning' | 'success' | 'primary'> = {
  draft: 'default',
  submitted: 'info',
  under_review: 'warning',
  answered: 'success',
  closed: 'default',
};

const PRIORITY_LABELS: Record<RFIPriority, string> = {
  low: 'Düşük',
  normal: 'Normal',
  high: 'Yüksek',
  urgent: 'Acil',
};

const PRIORITY_COLORS: Record<RFIPriority, 'default' | 'info' | 'warning' | 'error'> = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'error',
};

interface Props {
  projectId: number;
  userRole: UserRole;
}

const EMPTY_FORM = { subject: '', question: '', submitted_to: '', priority: 'normal' as RFIPriority, due_date: '' };
const EMPTY_RESPONSE = { response: '', answered_by_name: '' };

export function RFIList({ projectId, userRole }: Props) {
  const { data: rfis = [], isLoading, isError } = useRFIs(projectId);
  const createRFI = useCreateRFI();
  const updateRFI = useUpdateRFI();
  const deleteRFI = useDeleteRFI();
  const canEdit = userRole === 'admin' || userRole === 'manager';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionRFI | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseTarget, setResponseTarget] = useState<ConstructionRFI | null>(null);
  const [responseForm, setResponseForm] = useState(EMPTY_RESPONSE);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (rfi: ConstructionRFI) => {
    setEditTarget(rfi);
    setForm({
      subject: rfi.subject,
      question: rfi.question,
      submitted_to: rfi.submitted_to,
      priority: rfi.priority,
      due_date: rfi.due_date ?? '',
    });
    setDialogOpen(true);
  };

  const openResponse = (rfi: ConstructionRFI) => {
    setResponseTarget(rfi);
    setResponseForm({ response: rfi.response ?? '', answered_by_name: rfi.answered_by_name ?? '' });
    setResponseDialogOpen(true);
  };

  const handleSave = () => {
    const body = {
      subject: form.subject,
      question: form.question,
      submitted_to: form.submitted_to,
      priority: form.priority,
      due_date: form.due_date || undefined,
    };
    if (editTarget) {
      updateRFI.mutate({ projectId, rfiId: editTarget.id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createRFI.mutate({ projectId, body }, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleResponseSave = () => {
    if (!responseTarget) return;
    updateRFI.mutate(
      { projectId, rfiId: responseTarget.id, body: { response: responseForm.response, answered_by_name: responseForm.answered_by_name || undefined } },
      { onSuccess: () => setResponseDialogOpen(false) },
    );
  };

  const handleDelete = (rfi: ConstructionRFI) => {
    if (confirm(`"${rfi.rfi_number} — ${rfi.subject}" silinsin mi?`)) {
      deleteRFI.mutate({ projectId, rfiId: rfi.id });
    }
  };

  const openCount = rfis.filter((r) => !['answered', 'closed'].includes(r.status)).length;

  if (isLoading) return <Skeleton variant="rounded" height={120} />;

  if (isError) return <Alert severity="error">Veriler yüklenirken bir hata oluştu.</Alert>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" fontWeight={700}>
          Bilgi Talepleri (RFI)
          {openCount > 0 && <Chip label={openCount} color="warning" size="small" sx={{ ml: 1 }} />}
        </Typography>
        <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={openCreate}>
          RFI Oluştur
        </Button>
      </Box>

      {rfis.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Henüz RFI oluşturulmamış.</Typography>
      ) : (
        rfis.map((rfi) => (
          <Accordion key={rfi.id} variant="outlined" sx={{ mb: 1, '&:before': { display: 'none' }, borderColor: rfi.is_overdue ? 'error.main' : 'divider' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" flexGrow={1} pr={1}>
                <Chip label={rfi.rfi_number} size="small" sx={{ fontWeight: 700, fontFamily: 'monospace', bgcolor: 'action.hover' }} />
                <Chip label={PRIORITY_LABELS[rfi.priority]} color={PRIORITY_COLORS[rfi.priority]} size="small" />
                <Chip label={STATUS_LABELS[rfi.status]} color={STATUS_COLORS[rfi.status]} size="small" variant="outlined" />
                {rfi.is_overdue && <Tooltip title="Yanıt bekleniyor — vadesi geçti"><WarningIcon sx={{ fontSize: 16, color: 'error.main' }} /></Tooltip>}
                <Typography variant="body2" fontWeight={600} sx={{ flexGrow: 1 }}>{rfi.subject}</Typography>
                <Typography variant="caption" color="text.secondary">→ {rfi.submitted_to}</Typography>
                {rfi.days_open != null && (
                  <Typography variant="caption" color="text.secondary">
                    {rfi.status === 'answered' ? `${rfi.days_open}g içinde yanıtlandı` : `${rfi.days_open} gündür açık`}
                  </Typography>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary">SORU</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 1.5 }}>{rfi.question}</Typography>
                {rfi.response ? (
                  <>
                    <Typography variant="caption" fontWeight={700} color="success.main">YANIT</Typography>
                    {rfi.answered_by_name && (
                      <Typography variant="caption" color="text.secondary"> — {rfi.answered_by_name}</Typography>
                    )}
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 1 }}>{rfi.response}</Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.disabled" mb={1}>Henüz yanıt verilmedi.</Typography>
                )}
                <Box display="flex" gap={1} mt={1}>
                  {canEdit && ['submitted', 'under_review'].includes(rfi.status) && (
                    <Button size="small" startIcon={<ReplyIcon />} variant="outlined" color="success" onClick={() => openResponse(rfi)}>
                      Yanıt Ekle
                    </Button>
                  )}
                  {canEdit && (
                    <>
                      <Tooltip title="Düzenle">
                        <IconButton size="small" onClick={() => openEdit(rfi)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => handleDelete(rfi)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'RFI Düzenle' : 'Yeni RFI Oluştur'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Konu" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} size="small" required />
          <TextField label="Soru" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} size="small" multiline rows={4} required />
          <TextField label="Gönderilen Kişi / Firma" value={form.submitted_to} onChange={(e) => setForm({ ...form, submitted_to: e.target.value })} size="small" required />
          <TextField select label="Öncelik" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as RFIPriority })} size="small">
            {(['low', 'normal', 'high', 'urgent'] as RFIPriority[]).map((p) => <MenuItem key={p} value={p}>{PRIORITY_LABELS[p]}</MenuItem>)}
          </TextField>
          <TextField label="Yanıt Bekleme Tarihi" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} size="small" InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.subject || !form.question || !form.submitted_to || createRFI.isPending || updateRFI.isPending}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onClose={() => setResponseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yanıt Ekle — {responseTarget?.rfi_number}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Yanıt" value={responseForm.response} onChange={(e) => setResponseForm({ ...responseForm, response: e.target.value })} size="small" multiline rows={4} required />
          <TextField label="Yanıtlayan Kişi / Firma" value={responseForm.answered_by_name} onChange={(e) => setResponseForm({ ...responseForm, answered_by_name: e.target.value })} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialogOpen(false)}>İptal</Button>
          <Button variant="contained" color="success" onClick={handleResponseSave} disabled={!responseForm.response || updateRFI.isPending}>
            Yanıtı Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
