import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useApproveChangeOrder,
  useChangeOrders,
  useCreateChangeOrder,
  useDeleteChangeOrder,
  useRejectChangeOrder,
  useSubmitChangeOrder,
} from '../../hooks/construction/useConstructionChangeOrders';
import type { ChangeOrderStatus } from '../../types';

const STATUS_LABELS: Record<ChangeOrderStatus, string> = {
  draft: 'Taslak',
  submitted: 'Gönderildi',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

const STATUS_COLORS: Record<
  ChangeOrderStatus,
  'default' | 'warning' | 'success' | 'error'
> = {
  draft: 'default',
  submitted: 'warning',
  approved: 'success',
  rejected: 'error',
};

interface FormState {
  title: string;
  description: string;
  cost_delta: string;
  schedule_delta_days: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  cost_delta: '0',
  schedule_delta_days: '',
};

function formatCostDelta(delta: string): string {
  const val = parseFloat(delta);
  if (isNaN(val)) return '₺0';
  const sign = val >= 0 ? '+' : '';
  return `${sign}₺${Math.abs(val).toLocaleString('tr-TR')}`;
}

interface Props {
  projectId: number;
  userRole: string;
}

export function ChangeOrderList({ projectId, userRole }: Props) {
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
  const { data: changeOrders = [], isLoading } = useChangeOrders(projectId);
  const createCO = useCreateChangeOrder();
  const submitCO = useSubmitChangeOrder();
  const approveCO = useApproveChangeOrder();
  const rejectCO = useRejectChangeOrder();
  const deleteCO = useDeleteChangeOrder();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const totalApproved = changeOrders
    .filter((co) => co.status === 'approved')
    .reduce((sum, co) => sum + parseFloat(co.cost_delta || '0'), 0);

  const handleCreate = async () => {
    await createCO.mutateAsync({
      projectId,
      body: {
        title: form.title,
        description: form.description,
        cost_delta: form.cost_delta || '0',
        schedule_delta_days: form.schedule_delta_days
          ? parseInt(form.schedule_delta_days)
          : null,
      },
    });
    setDialogOpen(false);
    setForm(EMPTY_FORM);
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
          Revizyon Siparişleri ({changeOrders.length})
        </Typography>
        <Button startIcon={<AddIcon />} size="small" variant="contained" onClick={() => setDialogOpen(true)}>
          Yeni Revizyon
        </Button>
      </Box>

      {/* Total approved summary */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 2,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Onaylanan Toplam Maliyet Etkisi
        </Typography>
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{ color: totalApproved >= 0 ? 'success.main' : 'error.main' }}
        >
          {totalApproved >= 0 ? '+' : ''}₺{Math.abs(totalApproved).toLocaleString('tr-TR')}
        </Typography>
      </Paper>

      {changeOrders.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          Henüz revizyon siparişi bulunmuyor.
        </Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {changeOrders.map((co) => (
            <Paper
              key={co.id}
              variant="outlined"
              sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                    <Chip
                      label={STATUS_LABELS[co.status]}
                      color={STATUS_COLORS[co.status]}
                      size="small"
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {co.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    {co.description}
                  </Typography>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{
                        color:
                          parseFloat(co.cost_delta) >= 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      Maliyet: {formatCostDelta(co.cost_delta)}
                    </Typography>
                    {co.schedule_delta_days !== null && (
                      <Typography variant="caption" color="text.secondary">
                        Süre: {co.schedule_delta_days > 0 ? '+' : ''}
                        {co.schedule_delta_days} gün
                      </Typography>
                    )}
                    {co.requester_username && (
                      <Typography variant="caption" color="text.secondary">
                        Talep Eden: {co.requester_username}
                      </Typography>
                    )}
                    {co.reviewer_username && (
                      <Typography variant="caption" color="text.secondary">
                        İnceleyen: {co.reviewer_username}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  {co.status === 'draft' && (
                    <Tooltip title="Gönder">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => submitCO.mutate({ projectId, coId: co.id })}
                      >
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {co.status === 'submitted' && isManagerOrAdmin && (
                    <>
                      <Tooltip title="Onayla">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => approveCO.mutate({ projectId, coId: co.id })}
                        >
                          <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reddet">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => rejectCO.mutate({ projectId, coId: co.id })}
                        >
                          <ThumbDownOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  {isManagerOrAdmin && (
                    <Tooltip title="Sil">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteCO.mutate({ projectId, coId: co.id })}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Revizyon Siparişi</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Başlık"
              size="small"
              fullWidth
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <TextField
              label="Açıklama"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <TextField
              label="Maliyet Farkı (₺)"
              size="small"
              fullWidth
              type="number"
              value={form.cost_delta}
              onChange={(e) => setForm((f) => ({ ...f, cost_delta: e.target.value }))}
              helperText="Pozitif: maliyet artışı, negatif: tasarruf"
            />
            <TextField
              label="Süre Farkı (gün)"
              size="small"
              fullWidth
              type="number"
              value={form.schedule_delta_days}
              onChange={(e) => setForm((f) => ({ ...f, schedule_delta_days: e.target.value }))}
              helperText="Pozitif: gecikme, negatif: erken bitiş"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!form.title || !form.description || createCO.isPending}
          >
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
