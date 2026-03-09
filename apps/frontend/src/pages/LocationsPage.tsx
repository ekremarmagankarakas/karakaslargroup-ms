import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
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
import { useQuery } from '@tanstack/react-query';
import { fetchAllUsers } from '../api/endpoints/users';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import {
  useAssignUserToLocation,
  useCreateLocation,
  useDeleteLocation,
  useLocations,
  useRemoveUserFromLocation,
  useUpdateLocation,
} from '../hooks/useLocations';
import type { LocationWithUsers, User, UserDropdownItem } from '../types';
import { formatDate } from '../utils/formatters';

export function LocationsPage() {
  const { data: locations, isLoading } = useLocations();
  const { data: allUsers = [] } = useQuery<User[]>({ queryKey: ['users-all'], queryFn: fetchAllUsers });

  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();
  const assignMutation = useAssignUserToLocation();
  const removeMutation = useRemoveUserFromLocation();

  const [editLocation, setEditLocation] = useState<LocationWithUsers | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [assignUser, setAssignUser] = useState<UserDropdownItem | null>(null);

  const handleEditOpen = (loc: LocationWithUsers) => {
    setEditLocation(loc);
    setEditName(loc.name);
    setEditAddress(loc.address ?? '');
  };

  const handleEditSave = () => {
    if (!editLocation) return;
    updateMutation.mutate(
      { id: editLocation.id, payload: { name: editName || undefined, address: editAddress || null } },
      { onSuccess: () => setEditLocation(null) },
    );
  };

  const handleCreate = () => {
    createMutation.mutate(
      { name: newName, address: newAddress || null },
      {
        onSuccess: () => {
          setShowCreate(false);
          setNewName('');
          setNewAddress('');
        },
      },
    );
  };

  const handleAssign = (locationId: number) => {
    if (!assignUser) return;
    assignMutation.mutate(
      { locationId, userId: assignUser.id },
      { onSuccess: () => setAssignUser(null) },
    );
  };

  const assignableUsers = (loc: LocationWithUsers) =>
    allUsers
      .filter((u) => !loc.users.some((lu) => lu.id === u.id))
      .map((u) => ({ id: u.id, username: u.username }));

  return (
    <DashboardLayout>
      <Box mb={3} mt={1} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" sx={{ mb: 0.25 }}>Lokasyonlar</Typography>
          <Typography variant="body2" color="text.secondary">
            AVM lokasyonlarını ve atamalarını yönetin
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreate(true)}>
          Lokasyon Ekle
        </Button>
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>LOKASYON ADI</TableCell>
                  <TableCell>ADRES</TableCell>
                  <TableCell>KULLANICILER</TableCell>
                  <TableCell>OLUŞTURMA TARİHİ</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {(locations ?? []).map((loc) => (
                  <>
                    <TableRow key={loc.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{loc.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {loc.address ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {loc.users.slice(0, 3).map((u) => (
                            <Chip key={u.id} label={u.username} size="small" variant="outlined" />
                          ))}
                          {loc.users.length > 3 && (
                            <Chip label={`+${loc.users.length - 3}`} size="small" />
                          )}
                          {loc.users.length === 0 && (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{formatDate(loc.created_at)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Kullanıcı Yönet">
                            <IconButton
                              size="small"
                              onClick={() => setExpandedId(expandedId === loc.id ? null : loc.id)}
                            >
                              <PersonAddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Düzenle">
                            <IconButton size="small" onClick={() => handleEditOpen(loc)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => deleteMutation.mutate(loc.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>

                    {/* Expanded user management panel */}
                    <TableRow key={`${loc.id}-expand`}>
                      <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                        <Collapse in={expandedId === loc.id} unmountOnExit>
                          <Box sx={{ px: 3, py: 2, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" mb={1.5}>
                              Kullanıcı Atamaları — {loc.name}
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                              {loc.users.map((u) => (
                                <Chip
                                  key={u.id}
                                  label={u.username}
                                  onDelete={() => removeMutation.mutate({ locationId: loc.id, userId: u.id })}
                                  deleteIcon={<PersonRemoveIcon />}
                                  variant="outlined"
                                  size="small"
                                />
                              ))}
                              {loc.users.length === 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  Henüz atanmış kullanıcı yok.
                                </Typography>
                              )}
                            </Box>
                            <Box display="flex" gap={1} alignItems="center" maxWidth={400}>
                              <Autocomplete
                                size="small"
                                options={assignableUsers(loc)}
                                getOptionLabel={(o) => o.username}
                                value={assignUser}
                                onChange={(_, v) => setAssignUser(v)}
                                renderInput={(params) => (
                                  <TextField {...params} label="Kullanıcı seç" />
                                )}
                                sx={{ flex: 1 }}
                              />
                              <Button
                                variant="contained"
                                size="small"
                                disabled={!assignUser || assignMutation.isPending}
                                onClick={() => handleAssign(loc.id)}
                              >
                                Ata
                              </Button>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog open={editLocation !== null} onClose={() => setEditLocation(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Lokasyonu Düzenle</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Lokasyon Adı"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Adres"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
            <Box display="flex" gap={1} justifyContent="flex-end" pt={1}>
              <Button onClick={() => setEditLocation(null)} color="inherit">İptal</Button>
              <Button
                variant="contained"
                disabled={updateMutation.isPending || !editName}
                onClick={handleEditSave}
              >
                {updateMutation.isPending ? <CircularProgress size={18} color="inherit" /> : 'Kaydet'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yeni Lokasyon Ekle</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Lokasyon Adı"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Adres (isteğe bağlı)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
            <Box display="flex" gap={1} justifyContent="flex-end" pt={1}>
              <Button onClick={() => setShowCreate(false)} color="inherit">İptal</Button>
              <Button
                variant="contained"
                disabled={createMutation.isPending || !newName}
                onClick={handleCreate}
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
