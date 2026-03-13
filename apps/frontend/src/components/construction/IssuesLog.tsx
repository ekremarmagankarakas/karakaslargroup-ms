import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useCreateIssue,
  useDeleteIssue,
  useIssues,
  useUpdateIssue,
} from '../../hooks/construction/useConstructionIssues';
import type { ConstructionIssue, ConstructionIssueSeverity, ConstructionIssueStatus, UserRole } from '../../types';
import { formatDate } from '../../utils/formatters';

const SEVERITY_CONFIG: Record<ConstructionIssueSeverity, { label: string; color: 'default' | 'info' | 'warning' | 'error' }> = {
  low: { label: 'Düşük', color: 'default' },
  medium: { label: 'Orta', color: 'info' },
  high: { label: 'Yüksek', color: 'warning' },
  critical: { label: 'Kritik', color: 'error' },
};

const STATUS_CONFIG: Record<ConstructionIssueStatus, { label: string; color: 'default' | 'info' | 'success' }> = {
  open: { label: 'Açık', color: 'default' },
  in_progress: { label: 'İşlemde', color: 'info' },
  resolved: { label: 'Çözüldü', color: 'success' },
};

const SEVERITY_OPTIONS: { value: ConstructionIssueSeverity; label: string }[] = [
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
  { value: 'critical', label: 'Kritik' },
];

const STATUS_OPTIONS: { value: ConstructionIssueStatus; label: string }[] = [
  { value: 'open', label: 'Açık' },
  { value: 'in_progress', label: 'İşlemde' },
  { value: 'resolved', label: 'Çözüldü' },
];

interface Props {
  projectId: number;
  userRole: UserRole;
}

interface FormState {
  title: string;
  description: string;
  severity: ConstructionIssueSeverity;
  status: ConstructionIssueStatus;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  severity: 'medium',
  status: 'open',
};

export function IssuesLog({ projectId, userRole }: Props) {
  const { data: issues = [], isLoading } = useIssues(projectId);
  const createIssue = useCreateIssue();
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionIssue | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (issue: ConstructionIssue) => {
    setEditTarget(issue);
    setForm({
      title: issue.title,
      description: issue.description ?? '',
      severity: issue.severity,
      status: issue.status,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (editTarget) {
      await updateIssue.mutateAsync({
        projectId,
        issueId: editTarget.id,
        body: {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          severity: form.severity,
          status: form.status,
        },
      });
    } else {
      await createIssue.mutateAsync({
        projectId,
        body: {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          severity: form.severity,
        },
      });
    }
    setFormOpen(false);
  };

  const openCount = issues.filter((i) => i.status !== 'resolved').length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1" fontWeight={700}>
            Sorunlar
          </Typography>
          {openCount > 0 && (
            <Chip label={`${openCount} açık`} size="small" color="warning" />
          )}
        </Box>
        <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={openCreate}>
          Sorun Ekle
        </Button>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
      ) : issues.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Henüz sorun kaydedilmemiş.</Typography>
      ) : (
        <Stack spacing={1}>
          {issues.map((issue) => {
            const sev = SEVERITY_CONFIG[issue.severity];
            const st = STATUS_CONFIG[issue.status];
            return (
              <Box
                key={issue.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'flex-start',
                }}
              >
                <Box flexGrow={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="body2" fontWeight={600}>{issue.title}</Typography>
                    <Chip label={sev.label} color={sev.color} size="small" />
                    <Chip label={st.label} color={st.color} size="small" variant="outlined" />
                  </Box>
                  {issue.description && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                      {issue.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                    {issue.reporter_username ?? 'Bilinmiyor'} · {formatDate(issue.created_at)}
                  </Typography>
                </Box>
                {canEdit && (
                  <Box display="flex" gap={0.5} flexShrink={0}>
                    <Tooltip title="Düzenle">
                      <IconButton size="small" onClick={() => openEdit(issue)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteIssue.mutate({ projectId, issueId: issue.id })}
                      >
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
        <DialogTitle>{editTarget ? 'Sorun Düzenle' : 'Sorun Ekle'}</DialogTitle>
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
            <FormControl size="small" fullWidth>
              <InputLabel>Şiddet</InputLabel>
              <Select
                value={form.severity}
                label="Şiddet"
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as ConstructionIssueSeverity }))}
              >
                {SEVERITY_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {editTarget && (
              <FormControl size="small" fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={form.status}
                  label="Durum"
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ConstructionIssueStatus }))}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!form.title.trim() || createIssue.isPending || updateIssue.isPending}
          >
            {editTarget ? 'Kaydet' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
