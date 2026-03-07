import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUpdateStatus, useTogglePaid, useDeleteRequirement } from '../../hooks/useRequirements';
import type { Requirement } from '../../types';
import { formatDate, formatPrice } from '../../utils/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  accepted: 'Onaylandı',
  declined: 'Reddedildi',
};

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  accepted: 'success',
  declined: 'error',
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!requirement) return null;

  const canManageStatus = user?.role === 'manager' || user?.role === 'admin';
  const canTogglePaid = user?.role === 'accountant' || user?.role === 'admin';
  const canDelete = user?.role === 'admin';

  const statusColor = STATUS_COLORS[requirement.status] ?? 'default';

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

        <DialogContent sx={{ pt: 2.5 }}>
          {/* Status badges */}
          <Box display="flex" gap={1} mb={2.5} flexWrap="wrap">
            <Chip
              label={STATUS_LABELS[requirement.status] ?? requirement.status}
              color={statusColor}
              size="medium"
            />
            {requirement.paid && (
              <Chip label="Ödendi" color="info" size="medium" variant="outlined" />
            )}
          </Box>

          {/* Details grid */}
          <Box
            sx={{
              bgcolor: '#f8fafc',
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
                        bgcolor: '#eff6ff',
                        '&:hover': { bgcolor: '#dbeafe' },
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

          {/* Actions */}
          {(canManageStatus || canTogglePaid) && (
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
