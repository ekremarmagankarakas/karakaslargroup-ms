import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SendIcon from '@mui/icons-material/Send';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  useAuditLog,
  useComments,
  useCreateComment,
  useDeleteRequirement,
  useEditRequirement,
  useTogglePaid,
  useUpdateStatus,
} from '../../../hooks/procurement/useRequirements';
import type { Requirement } from '../../../types';
import { formatDate, formatPrice } from '../../../utils/formatters';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { RequirementStatusChip } from '../../common/StatusChip';

const ACTION_LABELS: Record<string, string> = {
  created: 'Oluşturuldu',
  status_changed: 'Durum değiştirildi',
  paid_toggled: 'Ödeme durumu değiştirildi',
  edited: 'Düzenlendi',
  deleted: 'Silindi',
};

interface Props {
  requirement: Requirement | null;
  open: boolean;
  onClose: () => void;
}

export function RequirementModal({ requirement, open, onClose }: Props) {
  const { user } = useAuth();
  const updateStatus = useUpdateStatus();
  const togglePaid = useTogglePaid();
  const deleteReq = useDeleteRequirement();
  const editReq = useEditRequirement();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editItemName, setEditItemName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [commentText, setCommentText] = useState('');

  const reqId = requirement?.id ?? 0;
  const { data: comments } = useComments(reqId);
  const createComment = useCreateComment(reqId);
  const canViewAudit = user?.role === 'manager' || user?.role === 'admin';
  const { data: auditLogs } = useAuditLog(reqId, canViewAudit && activeTab === 2);

  if (!requirement) return null;

  const canManageStatus = user?.role === 'manager' || user?.role === 'admin';
  const canTogglePaid = user?.role === 'accountant' || user?.role === 'admin';
  const canDelete = user?.role === 'admin';
  const canEdit =
    requirement.status === 'pending' &&
    (user?.role === 'admin' || user?.id === requirement.user_id);

  const handleEditOpen = () => {
    setEditItemName(requirement.item_name);
    setEditPrice(String(requirement.price));
    setEditExplanation(requirement.explanation ?? '');
    setEditMode(true);
  };

  const handleEditSave = async () => {
    await editReq.mutateAsync({
      id: requirement.id,
      data: {
        item_name: editItemName,
        price: editPrice,
        explanation: editExplanation || undefined,
      },
    });
    setEditMode(false);
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    await createComment.mutateAsync(commentText.trim());
    setCommentText('');
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        {/* Title bar */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            pb: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ flex: 1, pr: 1 }}>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
              {requirement.item_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {requirement.username} · {formatDate(requirement.created_at)}
            </Typography>
          </Box>
          <Box display="flex" gap={0.5} flexShrink={0}>
            {canEdit && !editMode && (
              <Tooltip title="Düzenle">
                <IconButton color="primary" onClick={handleEditOpen} size="small">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title="Talebi Sil">
                <IconButton color="error" onClick={() => setConfirmDelete(true)} size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          <Tab label="Detaylar" />
          <Tab label={`Yorumlar (${comments?.length ?? 0})`} />
          {canViewAudit && <Tab label="Geçmiş" icon={<HistoryIcon sx={{ fontSize: 16 }} />} iconPosition="start" />}
        </Tabs>

        <DialogContent sx={{ pt: 2.5 }}>
          {/* TAB 0: Details */}
          {activeTab === 0 && (
            <>
              {editMode ? (
                <Box display="flex" flexDirection="column" gap={2} mb={2}>
                  <TextField
                    label="Ürün / Hizmet Adı"
                    value={editItemName}
                    onChange={(e) => setEditItemName(e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Fiyat (₺)"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Açıklama"
                    value={editExplanation}
                    onChange={(e) => setEditExplanation(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                    size="small"
                  />
                  <Box display="flex" gap={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => setEditMode(false)} color="inherit">İptal</Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleEditSave}
                      disabled={editReq.isPending || !editItemName || !editPrice}
                    >
                      {editReq.isPending ? <CircularProgress size={16} color="inherit" /> : 'Kaydet'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  {/* Status badges */}
                  <Box display="flex" gap={1} mb={2.5} flexWrap="wrap">
                    <RequirementStatusChip status={requirement.status} size="medium" />
                    {requirement.paid && (
                      <Chip label="Ödendi" color="info" size="medium" variant="outlined" />
                    )}
                  </Box>

                  {/* Details grid */}
                  <Box
                    sx={{
                      bgcolor: 'action.hover',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      p: 2,
                      mb: 2,
                    }}
                  >
                    <Grid container spacing={1.5}>
                      <Grid size={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                          Fiyat
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color="primary.main">
                          {formatPrice(requirement.price)} ₺
                        </Typography>
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                          Talep Eden
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {requirement.username}
                        </Typography>
                      </Grid>
                      {requirement.approved_by_username && (
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                            Onaylayan
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {requirement.approved_by_username}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  {/* Explanation */}
                  {requirement.explanation && (
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                        Açıklama
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {requirement.explanation}
                      </Typography>
                    </Box>
                  )}

                  {/* Images / Files */}
                  {requirement.images.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', display: 'block', mb: 1.5 }}>
                        Ekler ({requirement.images.length})
                      </Typography>
                      <Box display="flex" gap={1.5} flexWrap="wrap">
                        {requirement.images.map((img) =>
                          img.file_type === 'pdf' ? (
                            <Box
                              key={img.id}
                              component="a"
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1.5,
                                py: 1,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                textDecoration: 'none',
                                color: 'primary.main',
                                bgcolor: 'action.selected',
                                '&:hover': { bgcolor: 'action.focus' },
                              }}
                            >
                              <Typography variant="caption" fontWeight={500}>
                                {img.original_filename}
                              </Typography>
                              <OpenInNewIcon sx={{ fontSize: 14 }} />
                            </Box>
                          ) : (
                            <Box
                              key={img.id}
                              sx={{
                                width: 120,
                                height: 90,
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.85 },
                              }}
                              component="a"
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={img.url}
                                alt={img.original_filename}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Box>
                          )
                        )}
                      </Box>
                    </>
                  )}
                </>
              )}

              {/* Actions */}
              {(canManageStatus || canTogglePaid) && !editMode && (
                <>
                  <Divider sx={{ my: 2.5 }} />
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {canManageStatus && (
                      <>
                        <Button
                          variant={requirement.status === 'accepted' ? 'contained' : 'outlined'}
                          color="success"
                          onClick={() => updateStatus.mutate({ id: requirement.id, status: 'accepted' })}
                          disabled={updateStatus.isPending}
                          size="small"
                        >
                          {requirement.status === 'accepted' ? 'Onayı Kaldır' : 'Onayla'}
                        </Button>
                        <Button
                          variant={requirement.status === 'declined' ? 'contained' : 'outlined'}
                          color="error"
                          onClick={() => updateStatus.mutate({ id: requirement.id, status: 'declined' })}
                          disabled={updateStatus.isPending}
                          size="small"
                        >
                          {requirement.status === 'declined' ? 'Reddi Kaldır' : 'Reddet'}
                        </Button>
                      </>
                    )}
                    {canTogglePaid && (
                      <Button
                        variant="outlined"
                        color="info"
                        onClick={() => togglePaid.mutate(requirement.id)}
                        disabled={togglePaid.isPending}
                        size="small"
                      >
                        {requirement.paid ? 'Ödenmedi İşaretle' : 'Ödendi İşaretle'}
                      </Button>
                    )}
                  </Box>
                </>
              )}
            </>
          )}

          {/* TAB 1: Comments */}
          {activeTab === 1 && (
            <Box>
              {!comments || comments.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
                  Henüz yorum yok
                </Typography>
              ) : (
                <Box display="flex" flexDirection="column" gap={1.5} mb={2}>
                  {comments.map((c) => (
                    <Box key={c.id} display="flex" gap={1.5}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem', flexShrink: 0 }}>
                        {c.username.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, px: 1.5, py: 1, flex: 1 }}>
                        <Box display="flex" gap={1} alignItems="center" mb={0.5}>
                          <Typography variant="caption" fontWeight={600}>{c.username}</Typography>
                          <Typography variant="caption" color="text.disabled">{formatDate(c.created_at)}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{c.body}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
              <Divider sx={{ my: 1.5 }} />
              <Box display="flex" gap={1} alignItems="flex-end">
                <TextField
                  placeholder="Yorum yaz..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  multiline
                  maxRows={3}
                  fullWidth
                  size="small"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendComment}
                  disabled={!commentText.trim() || createComment.isPending}
                >
                  {createComment.isPending ? <CircularProgress size={20} /> : <SendIcon />}
                </IconButton>
              </Box>
            </Box>
          )}

          {/* TAB 2: Audit Log */}
          {activeTab === 2 && canViewAudit && (
            <Box>
              {!auditLogs || auditLogs.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
                  Geçmiş kaydı yok
                </Typography>
              ) : (
                <Box display="flex" flexDirection="column" gap={0}>
                  {auditLogs.map((log, idx) => (
                    <Box key={log.id} display="flex" gap={1.5} sx={{ position: 'relative' }}>
                      {/* Timeline line */}
                      {idx < auditLogs.length - 1 && (
                        <Box sx={{ position: 'absolute', left: 11, top: 28, bottom: 0, width: 2, bgcolor: 'divider' }} />
                      )}
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          flexShrink: 0,
                          mt: 0.25,
                        }}
                      />
                      <Box pb={2} flex={1}>
                        <Typography variant="caption" fontWeight={600}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {log.actor_username} · {formatDate(log.created_at)}
                        </Typography>
                        {(log.old_value || log.new_value) && (
                          <Box sx={{ mt: 0.5, p: 1, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                            {log.old_value && (
                              <Typography variant="caption" color="error.main" display="block">
                                − {log.old_value}
                              </Typography>
                            )}
                            {log.new_value && (
                              <Typography variant="caption" color="success.main" display="block">
                                + {log.new_value}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        title="Talebi Sil"
        message={`"${requirement.item_name}" talebini silmek istediğinizden emin misiniz?`}
        onConfirm={() => {
          deleteReq.mutate(requirement.id);
          setConfirmDelete(false);
          onClose();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
