import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Avatar,
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useAddTeamMember,
  useProjectTeam,
  useRemoveTeamMember,
  useUpdateTeamMember,
} from '../../hooks/construction/useConstructionTeam';
import { useUsers } from '../../hooks/useUsers';
import type { ConstructionProjectMember, ConstructionProjectRole, UserRole } from '../../types';

const ROLE_LABELS: Record<ConstructionProjectRole, string> = {
  project_manager: 'Proje Yöneticisi',
  site_engineer: 'Saha Mühendisi',
  foreman: 'Ustabaşı',
  architect: 'Mimar',
  safety_officer: 'İş Güvenliği Uzmanı',
  consultant: 'Danışman',
  observer: 'Gözlemci',
};

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value: value as ConstructionProjectRole,
  label,
}));

const GLOBAL_ROLE_LABELS: Record<string, string> = {
  employee: 'Çalışan',
  manager: 'Yönetici',
  accountant: 'Muhasebeci',
  admin: 'Admin',
};

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

interface Props {
  projectId: number;
  userRole: UserRole;
}

export function ProjectTeam({ projectId, userRole }: Props) {
  const canEdit = userRole === 'admin' || userRole === 'manager';
  const { data: members = [], isLoading } = useProjectTeam(projectId);
  const { data: allUsers = [] } = useUsers();
  const addMember = useAddTeamMember();
  const updateMember = useUpdateTeamMember();
  const removeMember = useRemoveTeamMember();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionProjectMember | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<ConstructionProjectRole>('observer');
  const [joinedAt, setJoinedAt] = useState('');
  const [editRole, setEditRole] = useState<ConstructionProjectRole>('observer');

  const existingUserIds = new Set(members.map((m) => m.user_id));
  const availableUsers = allUsers.filter((u) => !existingUserIds.has(u.id));

  const handleAdd = async () => {
    await addMember.mutateAsync({
      projectId,
      body: {
        user_id: parseInt(selectedUserId),
        construction_role: selectedRole,
        joined_at: joinedAt || undefined,
      },
    });
    setAddOpen(false);
    setSelectedUserId('');
    setSelectedRole('observer');
    setJoinedAt('');
  };

  const handleUpdateRole = async () => {
    if (!editTarget) return;
    await updateMember.mutateAsync({
      projectId,
      memberId: editTarget.id,
      body: { construction_role: editRole },
    });
    setEditTarget(null);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Ekip Üyeleri{' '}
          <Chip label={members.length} size="small" sx={{ ml: 0.5 }} />
        </Typography>
        {canEdit && (
          <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => setAddOpen(true)}>
            Üye Ekle
          </Button>
        )}
      </Box>

      {members.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Henüz ekip üyesi bulunmuyor.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {members.map((member) => (
            <Box
              key={member.id}
              display="flex"
              alignItems="center"
              gap={2}
              p={1.5}
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: 14 }}>
                {getInitials(member.username)}
              </Avatar>
              <Box flexGrow={1}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="body2" fontWeight={600}>
                    {member.username}
                  </Typography>
                  <Chip
                    label={ROLE_LABELS[member.construction_role]}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={GLOBAL_ROLE_LABELS[member.global_role] ?? member.global_role}
                    size="small"
                    variant="outlined"
                    sx={{ color: 'text.secondary', borderColor: 'divider' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {member.email}
                  {member.joined_at ? ` · ${member.joined_at}` : ''}
                </Typography>
              </Box>
              {canEdit && (
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Rolü Değiştir">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditTarget(member);
                        setEditRole(member.construction_role);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ekipten Çıkar">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        removeMember.mutate({ projectId, memberId: member.id })
                      }
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
            </Box>
          ))}
        </Stack>
      )}

      {/* Add Member Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Üye Ekle</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Kullanıcı</InputLabel>
              <Select
                value={selectedUserId}
                label="Kullanıcı"
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                {availableUsers.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>İnşaat Rolü</InputLabel>
              <Select
                value={selectedRole}
                label="İnşaat Rolü"
                onChange={(e) => setSelectedRole(e.target.value as ConstructionProjectRole)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Katılım Tarihi"
              size="small"
              type="date"
              value={joinedAt}
              onChange={(e) => setJoinedAt(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!selectedUserId || addMember.isPending}
          >
            Ekle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Rol Değiştir</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={0.5}>
            <Typography variant="body2">{editTarget?.username}</Typography>
            <FormControl size="small" fullWidth>
              <InputLabel>İnşaat Rolü</InputLabel>
              <Select
                value={editRole}
                label="İnşaat Rolü"
                onChange={(e) => setEditRole(e.target.value as ConstructionProjectRole)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    {r.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleUpdateRole}
            disabled={updateMember.isPending}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
