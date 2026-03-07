import DeleteIcon from '@mui/icons-material/Delete';
import PaidIcon from '@mui/icons-material/Paid';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import type { Requirement } from '../../types';
import { formatDate, formatPrice } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useUpdateStatus, useTogglePaid, useDeleteRequirement } from '../../hooks/useRequirements';
import { useState } from 'react';
import { ConfirmDialog } from '../common/ConfirmDialog';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  accepted: 'Onaylandı',
  declined: 'Reddedildi',
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

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Typography variant="h6">{requirement.item_name}</Typography>
            {canDelete && (
              <IconButton color="error" onClick={() => setConfirmDelete(true)} size="small">
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            <Chip
              label={STATUS_LABELS[requirement.status] ?? requirement.status}
              color={
                requirement.status === 'accepted'
                  ? 'success'
                  : requirement.status === 'declined'
                  ? 'error'
                  : 'warning'
              }
            />
            {requirement.paid && <Chip icon={<PaidIcon />} label="Ödendi" color="info" />}
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Kullanıcı:</strong> {requirement.username}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Fiyat:</strong> {formatPrice(requirement.price)} TL
          </Typography>
          {requirement.explanation && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Açıklama:</strong> {requirement.explanation}
            </Typography>
          )}
          {requirement.approved_by_username && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Onaylayan:</strong> {requirement.approved_by_username}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {formatDate(requirement.created_at)}
          </Typography>

          {requirement.images.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Dosyalar
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {requirement.images.map((img) =>
                  img.file_type === 'pdf' ? (
                    <Box key={img.id}>
                      <a href={img.url} target="_blank" rel="noopener noreferrer">
                        {img.original_filename}
                      </a>
                    </Box>
                  ) : (
                    <Box key={img.id} sx={{ maxWidth: 200 }}>
                      <img
                        src={img.url}
                        alt={img.original_filename}
                        style={{ width: '100%', borderRadius: 4 }}
                      />
                    </Box>
                  )
                )}
              </Box>
            </>
          )}

          {(canManageStatus || canTogglePaid) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" gap={1} flexWrap="wrap">
                {canManageStatus && (
                  <>
                    <Button
                      variant={requirement.status === 'accepted' ? 'contained' : 'outlined'}
                      color="success"
                      onClick={() => updateStatus.mutate({ id: requirement.id, status: 'accepted' })}
                      disabled={updateStatus.isPending}
                    >
                      {requirement.status === 'accepted' ? 'Onayı Kaldır' : 'Onayla'}
                    </Button>
                    <Button
                      variant={requirement.status === 'declined' ? 'contained' : 'outlined'}
                      color="error"
                      onClick={() => updateStatus.mutate({ id: requirement.id, status: 'declined' })}
                      disabled={updateStatus.isPending}
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
