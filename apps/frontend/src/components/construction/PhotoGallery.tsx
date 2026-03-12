import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import {
  useDeletePhoto,
  usePhotos,
  useUploadPhoto,
} from '../../hooks/construction/useConstructionPhotos';
import type { ConstructionPhoto, UserRole } from '../../types';
import { formatDate } from '../../utils/formatters';

interface Props {
  projectId: number;
  userRole: UserRole;
}

export function PhotoGallery({ projectId, userRole }: Props) {
  const { data: photos = [], isLoading } = usePhotos(projectId);
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<ConstructionPhoto | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    await uploadPhoto.mutateAsync({ projectId, formData });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (photo: ConstructionPhoto) => {
    await deletePhoto.mutateAsync({ projectId, photoId: photo.id });
    if (lightbox?.id === photo.id) setLightbox(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Fotoğraflar
        </Typography>
        {canEdit && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              startIcon={
                uploadPhoto.isPending ? (
                  <CircularProgress size={16} />
                ) : (
                  <AddPhotoAlternateIcon />
                )
              }
              variant="outlined"
              size="small"
              disabled={uploadPhoto.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              Fotoğraf Yükle
            </Button>
          </>
        )}
      </Box>

      {photos.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Henüz fotoğraf yüklenmemiş.
        </Typography>
      ) : (
        <ImageList cols={4} gap={8} sx={{ mt: 0 }}>
          {photos.map((photo) => (
            <ImageListItem
              key={photo.id}
              sx={{ cursor: 'pointer', position: 'relative', borderRadius: 1, overflow: 'hidden' }}
              onMouseEnter={() => setHoveredId(photo.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setLightbox(photo)}
            >
              <img
                src={photo.url}
                alt={photo.caption ?? 'Fotoğraf'}
                loading="lazy"
                style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
              />
              {photo.caption && (
                <ImageListItemBar
                  title={photo.caption}
                  sx={{ '.MuiImageListItemBar-title': { fontSize: 12 } }}
                />
              )}
              {canEdit && hoveredId === photo.id && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title="Sil">
                    <IconButton
                      size="small"
                      sx={{ bgcolor: 'error.main', color: 'common.white', '&:hover': { bgcolor: 'error.dark' } }}
                      onClick={() => handleDelete(photo)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {/* Lightbox */}
      <Dialog
        open={!!lightbox}
        onClose={() => setLightbox(null)}
        maxWidth="lg"
        PaperProps={{ sx: { bgcolor: 'background.default', boxShadow: 24 } }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setLightbox(null)}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: 'action.hover' }}
          >
            <CloseIcon />
          </IconButton>
          {lightbox && (
            <Box>
              <img
                src={lightbox.url}
                alt={lightbox.caption ?? 'Fotoğraf'}
                style={{ maxWidth: '90vw', maxHeight: '80vh', display: 'block' }}
              />
              {(lightbox.caption || lightbox.uploader_username) && (
                <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  {lightbox.caption && (
                    <Typography variant="body2">{lightbox.caption}</Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {lightbox.uploader_username ?? 'Bilinmiyor'} · {formatDate(lightbox.created_at)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
