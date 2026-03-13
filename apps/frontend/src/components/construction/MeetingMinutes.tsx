import { useState } from 'react';
import {
  Box, Button, Typography, Accordion, AccordionSummary, AccordionDetails,
  Chip, CircularProgress, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Checkbox, Divider, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import type { ConstructionMeeting, MeetingActionCreate } from '../../types';
import {
  useMeetings,
  useCreateMeeting,
  useUpdateMeeting,
  useDeleteMeeting,
  useToggleMeetingAction,
} from '../../hooks/construction/useConstructionMeetings';

interface Props {
  projectId: number;
  canEdit: boolean;
}

const emptyForm = {
  title: '',
  meeting_date: new Date().toISOString().split('T')[0],
  location: '',
  attendees: '',
  agenda: '',
  summary: '',
  decisions: '',
};

export default function MeetingMinutes({ projectId, canEdit }: Props) {
  const { data: meetings = [], isLoading, isError } = useMeetings(projectId);
  const createMutation = useCreateMeeting(projectId);
  const updateMutation = useUpdateMeeting(projectId);
  const deleteMutation = useDeleteMeeting(projectId);
  const toggleAction = useToggleMeetingAction(projectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ConstructionMeeting | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [actions, setActions] = useState<MeetingActionCreate[]>([]);
  const [newAction, setNewAction] = useState({ description: '', assigned_to_name: '', due_date: '' });
  const [deleteTarget, setDeleteTarget] = useState<ConstructionMeeting | null>(null);
  const [expanded, setExpanded] = useState<number | false>(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setActions([]);
    setNewAction({ description: '', assigned_to_name: '', due_date: '' });
    setDialogOpen(true);
  };

  const openEdit = (m: ConstructionMeeting) => {
    setEditing(m);
    setForm({
      title: m.title,
      meeting_date: m.meeting_date,
      location: m.location ?? '',
      attendees: m.attendees ?? '',
      agenda: m.agenda ?? '',
      summary: m.summary,
      decisions: m.decisions ?? '',
    });
    setActions([]);
    setDialogOpen(true);
  };

  const handleAddAction = () => {
    if (!newAction.description.trim() || !newAction.assigned_to_name.trim()) return;
    setActions([...actions, {
      description: newAction.description,
      assigned_to_name: newAction.assigned_to_name,
      due_date: newAction.due_date || null,
    }]);
    setNewAction({ description: '', assigned_to_name: '', due_date: '' });
  };

  const handleRemoveAction = (idx: number) => {
    setActions(actions.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.summary.trim()) return;
    if (editing) {
      await updateMutation.mutateAsync({
        meetingId: editing.id,
        body: {
          title: form.title || undefined,
          meeting_date: form.meeting_date || undefined,
          location: form.location || null,
          attendees: form.attendees || null,
          agenda: form.agenda || null,
          summary: form.summary || undefined,
          decisions: form.decisions || null,
        },
      });
    } else {
      await createMutation.mutateAsync({
        title: form.title,
        meeting_date: form.meeting_date,
        location: form.location || null,
        attendees: form.attendees || null,
        agenda: form.agenda || null,
        summary: form.summary,
        decisions: form.decisions || null,
        actions,
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleToggle = (meetingId: number, actionId: number) => {
    toggleAction.mutate({ meetingId, actionId });
  };

  const pendingActionsCount = (m: ConstructionMeeting) => m.actions.filter(a => !a.completed).length;
  const overdueActions = (m: ConstructionMeeting) =>
    m.actions.filter(a => !a.completed && a.due_date && a.due_date < new Date().toISOString().split('T')[0]);

  if (isLoading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>;

  if (isError) return <Alert severity="error">Veriler yüklenirken bir hata oluştu.</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Toplantı Tutanakları</Typography>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
            Toplantı Ekle
          </Button>
        )}
      </Box>

      {meetings.length === 0 && (
        <Alert severity="info">Henüz toplantı kaydı bulunmuyor.</Alert>
      )}

      {meetings.map(m => (
        <Accordion
          key={m.id}
          expanded={expanded === m.id}
          onChange={(_, isExp) => setExpanded(isExp ? m.id : false)}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1, mr: 1 }}>
              <Typography fontWeight={600}>{m.title}</Typography>
              <Chip
                label={m.meeting_date}
                size="small"
                icon={<EventIcon />}
                sx={{ bgcolor: 'action.selected' }}
              />
              {pendingActionsCount(m) > 0 && (
                <Chip
                  label={`${pendingActionsCount(m)} bekleyen`}
                  size="small"
                  color="warning"
                />
              )}
              {overdueActions(m).length > 0 && (
                <Chip label="Gecikmiş" size="small" color="error" />
              )}
              {canEdit && (
                <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }} onClick={e => e.stopPropagation()}>
                  <Tooltip title="Düzenle">
                    <IconButton size="small" onClick={() => openEdit(m)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sil">
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(m)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {m.location && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2">{m.location}</Typography>
                </Box>
              )}
              {m.attendees && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <PeopleIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
                  <Typography variant="body2">{m.attendees}</Typography>
                </Box>
              )}
              {m.agenda && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Gündem</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.agenda}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Özet</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.summary}</Typography>
              </Box>
              {m.decisions && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Kararlar</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.decisions}</Typography>
                </Box>
              )}
              {m.actions.length > 0 && (
                <Box>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Aksiyon Maddeleri ({m.actions.filter(a => a.completed).length}/{m.actions.length} tamamlandı)
                  </Typography>
                  <Paper variant="outlined" sx={{ borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox" />
                          <TableCell>Açıklama</TableCell>
                          <TableCell>Sorumlu</TableCell>
                          <TableCell>Son Tarih</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {m.actions.map(a => {
                          const overdue = !a.completed && a.due_date && a.due_date < new Date().toISOString().split('T')[0];
                          return (
                            <TableRow key={a.id} sx={{ opacity: a.completed ? 0.6 : 1 }}>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={a.completed}
                                  onChange={() => handleToggle(m.id, a.id)}
                                  icon={<RadioButtonUncheckedIcon />}
                                  checkedIcon={<CheckCircleIcon color="success" />}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{ textDecoration: a.completed ? 'line-through' : 'none' }}
                                >
                                  {a.description}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{a.assigned_to_name}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  color={overdue ? 'error' : 'text.primary'}
                                  fontWeight={overdue ? 600 : 400}
                                >
                                  {a.due_date ?? '-'}
                                  {overdue ? ' ⚠' : ''}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Paper>
                </Box>
              )}
              {m.creator_username && (
                <Typography variant="caption" color="text.secondary">
                  Oluşturan: {m.creator_username} · {new Date(m.created_at).toLocaleDateString('tr-TR')}
                </Typography>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Toplantıyı Düzenle' : 'Yeni Toplantı'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Başlık"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Toplantı Tarihi"
                type="date"
                value={form.meeting_date}
                onChange={e => setForm({ ...form, meeting_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
              />
              <TextField
                label="Konum"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                fullWidth
              />
            </Stack>
            <TextField
              label="Katılımcılar"
              value={form.attendees}
              onChange={e => setForm({ ...form, attendees: e.target.value })}
              multiline
              rows={2}
              fullWidth
              placeholder="Her satıra bir katılımcı..."
            />
            <TextField
              label="Gündem"
              value={form.agenda}
              onChange={e => setForm({ ...form, agenda: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Özet"
              value={form.summary}
              onChange={e => setForm({ ...form, summary: e.target.value })}
              multiline
              rows={3}
              required
              fullWidth
            />
            <TextField
              label="Kararlar"
              value={form.decisions}
              onChange={e => setForm({ ...form, decisions: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />

            {!editing && (
              <Box>
                <Divider sx={{ mb: 1.5 }} />
                <Typography variant="subtitle2" gutterBottom>Aksiyon Maddeleri</Typography>
                <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ mb: 1 }}>
                  <TextField
                    label="Açıklama"
                    value={newAction.description}
                    onChange={e => setNewAction({ ...newAction, description: e.target.value })}
                    size="small"
                    sx={{ flex: 2 }}
                  />
                  <TextField
                    label="Sorumlu"
                    value={newAction.assigned_to_name}
                    onChange={e => setNewAction({ ...newAction, assigned_to_name: e.target.value })}
                    size="small"
                    sx={{ flex: 1.5 }}
                  />
                  <TextField
                    label="Son Tarih"
                    type="date"
                    value={newAction.due_date}
                    onChange={e => setNewAction({ ...newAction, due_date: e.target.value })}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1 }}
                  />
                  <Button variant="outlined" onClick={handleAddAction} size="small">
                    Ekle
                  </Button>
                </Stack>
                {actions.map((a, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 0.75,
                      mb: 0.5,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Typography variant="body2" sx={{ flex: 1 }}>{a.description}</Typography>
                    <Typography variant="caption" color="text.secondary">{a.assigned_to_name}</Typography>
                    {a.due_date && (
                      <Typography variant="caption" color="text.secondary">{a.due_date}</Typography>
                    )}
                    <IconButton size="small" onClick={() => handleRemoveAction(i)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.title.trim() || !form.summary.trim() || createMutation.isPending || updateMutation.isPending}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Toplantıyı Sil</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{deleteTarget?.title}</strong> toplantısını silmek istediğinize emin misiniz?
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
