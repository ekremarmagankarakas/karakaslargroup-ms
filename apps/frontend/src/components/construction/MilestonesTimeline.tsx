import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PendingIcon from '@mui/icons-material/Pending';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import {
  Alert,
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
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useCreateMilestone,
  useDeleteMilestone,
  useMilestones,
  useUpdateMilestone,
} from '../../hooks/construction/useConstruction';
import type { ConstructionMilestone, ConstructionTaskStatus, UserRole } from '../../types';
import { downloadCsv } from '../../utils/exportCsv';

const STATUS_CONFIG: Record<
  ConstructionTaskStatus,
  { label: string; color: 'default' | 'info' | 'success' | 'error'; icon: React.ReactNode }
> = {
  not_started: { label: 'Başlamadı', color: 'default', icon: <PendingIcon fontSize="small" /> },
  in_progress: { label: 'Devam Ediyor', color: 'info', icon: <PlayCircleIcon fontSize="small" /> },
  completed: { label: 'Tamamlandı', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  blocked: { label: 'Engellendi', color: 'error', icon: <BlockIcon fontSize="small" /> },
};

const STATUS_OPTIONS: { value: ConstructionTaskStatus; label: string }[] = [
  { value: 'not_started', label: 'Başlamadı' },
  { value: 'in_progress', label: 'Devam Ediyor' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'blocked', label: 'Engellendi' },
];

interface FormState {
  title: string;
  description: string;
  due_date: string;
  status: ConstructionTaskStatus;
  completion_pct: number;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  due_date: '',
  status: 'not_started',
  completion_pct: 0,
};

interface Props {
  projectId: number;
  userRole: UserRole;
}

export function MilestonesTimeline({ projectId, userRole }: Props) {
  const { data: milestones = [], isLoading, isError } = useMilestones(projectId);
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionMilestone | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (m: ConstructionMilestone) => {
    setEditTarget(m);
    setForm({
      title: m.title,
      description: m.description ?? '',
      due_date: m.due_date ?? '',
      status: m.status,
      completion_pct: m.completion_pct,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const body = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      due_date: form.due_date || undefined,
      status: form.status,
      completion_pct: form.completion_pct,
    };
    if (editTarget) {
      await updateMilestone.mutateAsync({ projectId, milestoneId: editTarget.id, body });
    } else {
      await createMilestone.mutateAsync({ projectId, body });
    }
    setFormOpen(false);
  };

  const handleDelete = (milestoneId: number) => {
    deleteMilestone.mutate({ projectId, milestoneId });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Aşamalar
        </Typography>
        <Box display="flex" gap={1}>
          {canEdit && (
            <Tooltip title="CSV İndir">
              <IconButton
                size="small"
                onClick={() => downloadCsv(`/construction/${projectId}/export/milestones`, `asamalar_${projectId}.csv`)}
                sx={{ color: 'text.secondary' }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canEdit && (
            <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={openCreate}>
              Aşama Ekle
            </Button>
          )}
        </Box>
      </Box>

      {isError ? (
        <Alert severity="error">Veriler yüklenirken bir hata oluştu.</Alert>
      ) : isLoading ? (
        <Typography variant="body2" color="text.secondary">
          Yükleniyor...
        </Typography>
      ) : milestones.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Henüz aşama eklenmemiş.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {milestones.map((m, index) => {
            const cfg = STATUS_CONFIG[m.status];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = m.due_date ? new Date(m.due_date) : null;
            const isOverdue = dueDate && dueDate < today && m.status !== 'completed';
            const diffDays = isOverdue && dueDate ? Math.floor((today.getTime() - dueDate.getTime()) / 86400000) : 0;
            const overdueSeverity = diffDays > 14 ? 'error' : 'warning';
            return (
              <Box
                key={m.id}
                display="flex"
                gap={2}
                alignItems="flex-start"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'action.selected',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  <Typography variant="caption" fontWeight={700}>
                    {index + 1}
                  </Typography>
                </Box>

                <Box flexGrow={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="body2" fontWeight={600}>
                      {m.title}
                    </Typography>
                    <Chip
                      label={cfg.label}
                      color={cfg.color}
                      size="small"
                      icon={cfg.icon as React.ReactElement}
                    />
                    {m.due_date && (
                      <Typography variant="caption" color="text.secondary">
                        Son: {m.due_date}
                      </Typography>
                    )}
                    {isOverdue && (
                      <Chip
                        label={diffDays > 14 ? `${diffDays} gün gecikti` : `${diffDays} gün gecikti`}
                        color={overdueSeverity}
                        size="small"
                        icon={<WarningAmberIcon fontSize="small" />}
                      />
                    )}
                  </Box>
                  {m.description && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                      {m.description}
                    </Typography>
                  )}
                  <Box display="flex" alignItems="center" gap={1} mt={0.75}>
                    <Box
                      sx={{
                        flexGrow: 1,
                        maxWidth: 180,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'action.hover',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${m.completion_pct}%`,
                          bgcolor:
                            m.completion_pct === 100 ? 'success.main' : 'primary.main',
                          borderRadius: 3,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {m.completion_pct}%
                    </Typography>
                  </Box>
                </Box>

                {canEdit && (
                  <Box display="flex" gap={0.5} flexShrink={0}>
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
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Aşama Düzenle' : 'Aşama Ekle'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Başlık"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth
              size="small"
              required
            />
            <TextField
              label="Açıklama"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              multiline
              rows={2}
              fullWidth
              size="small"
            />
            <TextField
              label="Son Tarih"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={form.status}
                label="Durum"
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as ConstructionTaskStatus }))
                }
              >
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography variant="body2" gutterBottom>
                Tamamlanma: {form.completion_pct}%
              </Typography>
              <Slider
                value={form.completion_pct}
                onChange={(_, v) => setForm((f) => ({ ...f, completion_pct: v as number }))}
                min={0}
                max={100}
                step={5}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 50, label: '50%' },
                  { value: 100, label: '100%' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              !form.title.trim() ||
              createMilestone.isPending ||
              updateMilestone.isPending
            }
          >
            {editTarget ? 'Kaydet' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
