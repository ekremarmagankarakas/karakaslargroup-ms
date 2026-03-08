import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUser, fetchAllUsers, updateUser } from '../api/endpoints/users';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import type { User, UserRole } from '../types';
import { formatDate } from '../utils/formatters';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Yönetici',
  manager: 'Müdür',
  accountant: 'Muhasebe',
  employee: 'Çalışan',
};

const ROLE_COLORS: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  admin: 'error',
  manager: 'warning',
  accountant: 'info',
  employee: 'default',
};

export function UsersPage() {
  const qc = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ['users-all'], queryFn: fetchAllUsers });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('employee');
  const [editEmail, setEditEmail] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('employee');

  const updateMutation = useMutation({
    mutationFn: (data: { userId: number; role: UserRole; email: string; is_active: boolean }) =>
      updateUser(data.userId, { role: data.role, email: data.email, is_active: data.is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users-all'] });
      setEditUser(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => createUser({ username: newUsername, email: newEmail, password: newPassword, role: newRole }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users-all'] });
      setShowCreate(false);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('employee');
    },
  });

  const handleEditOpen = (u: User) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditEmail(u.email);
    setEditActive(u.is_active);
  };

  return (
    <DashboardLayout>
      <Box mb={3} mt={1} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" sx={{ mb: 0.25 }}>Kullanıcılar</Typography>
          <Typography variant="body2" color="text.secondary">
            Kullanıcı hesaplarını yönetin
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreate(true)}>
          Kullanıcı Ekle
        </Button>
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>KULLANICI ADI</TableCell>
                  <TableCell>E-POSTA</TableCell>
                  <TableCell>ROL</TableCell>
                  <TableCell>DURUM</TableCell>
                  <TableCell>KAYIT TARİHİ</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {(users ?? []).map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{u.username}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ROLE_LABELS[u.role] ?? u.role}
                        color={ROLE_COLORS[u.role] ?? 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.is_active ? 'Aktif' : 'Pasif'}
                        color={u.is_active ? 'success' : 'default'}
                        size="small"
                        variant={u.is_active ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{formatDate(u.created_at)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Düzenle">
                        <IconButton size="small" onClick={() => handleEditOpen(u)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog open={editUser !== null} onClose={() => setEditUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="E-posta"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              fullWidth
              size="small"
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select value={editRole} label="Rol" onChange={(e) => setEditRole(e.target.value as UserRole)}>
                <MenuItem value="employee">Çalışan</MenuItem>
                <MenuItem value="manager">Müdür</MenuItem>
                <MenuItem value="accountant">Muhasebe</MenuItem>
                <MenuItem value="admin">Yönetici</MenuItem>
              </Select>
            </FormControl>
            <Box display="flex" alignItems="center" gap={1}>
              <Switch checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
              <Typography variant="body2">{editActive ? 'Aktif' : 'Pasif'}</Typography>
            </Box>
            <Box display="flex" gap={1} justifyContent="flex-end" pt={1}>
              <Button onClick={() => setEditUser(null)} color="inherit">İptal</Button>
              <Button
                variant="contained"
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    userId: editUser!.id,
                    role: editRole,
                    email: editEmail,
                    is_active: editActive,
                  })
                }
              >
                {updateMutation.isPending ? <CircularProgress size={18} color="inherit" /> : 'Kaydet'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Kullanıcı Adı" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} fullWidth size="small" />
            <TextField label="E-posta" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} fullWidth size="small" />
            <TextField label="Şifre" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth size="small" />
            <FormControl size="small" fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select value={newRole} label="Rol" onChange={(e) => setNewRole(e.target.value as UserRole)}>
                <MenuItem value="employee">Çalışan</MenuItem>
                <MenuItem value="manager">Müdür</MenuItem>
                <MenuItem value="accountant">Muhasebe</MenuItem>
                <MenuItem value="admin">Yönetici</MenuItem>
              </Select>
            </FormControl>
            <Box display="flex" gap={1} justifyContent="flex-end" pt={1}>
              <Button onClick={() => setShowCreate(false)} color="inherit">İptal</Button>
              <Button
                variant="contained"
                disabled={createMutation.isPending || !newUsername || !newEmail || !newPassword}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? <CircularProgress size={18} color="inherit" /> : 'Ekle'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
