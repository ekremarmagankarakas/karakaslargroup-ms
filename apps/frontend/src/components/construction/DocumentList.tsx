import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import UploadFileIcon from '@mui/icons-material/UploadFile';
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
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import {
  useDeleteDocument,
  useDocuments,
  useUploadDocument,
} from '../../hooks/construction/useConstructionDocuments';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  blueprint: 'Proje',
  contract: 'Sözleşme',
  inspection: 'Denetim',
  other: 'Diğer',
};

const DOCUMENT_TYPES = ['blueprint', 'contract', 'inspection', 'other'];

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(filename: string, documentType: string | null) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return <ImageIcon fontSize="small" />;
  }
  if (ext === 'pdf' || documentType === 'blueprint' || documentType === 'contract') {
    return <DescriptionIcon fontSize="small" />;
  }
  return <InsertDriveFileIcon fontSize="small" />;
}

interface Props {
  projectId: number;
  userRole: string;
}

export function DocumentList({ projectId, userRole }: Props) {
  const canEdit = userRole === 'manager' || userRole === 'admin';
  const { data: documents = [], isLoading } = useDocuments(projectId);
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const filtered =
    typeFilter === 'all'
      ? documents
      : documents.filter((d) => d.document_type === typeFilter);

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (uploadType) formData.append('document_type', uploadType);
    if (uploadCaption) formData.append('caption', uploadCaption);
    await uploadDoc.mutateAsync({ projectId, formData });
    setUploadOpen(false);
    setSelectedFile(null);
    setUploadType('');
    setUploadCaption('');
  };

  if (isLoading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Belgeler ({documents.length})
        </Typography>
        {canEdit && (
          <Button
            startIcon={<UploadFileIcon />}
            size="small"
            variant="contained"
            onClick={() => setUploadOpen(true)}
          >
            Belge Yükle
          </Button>
        )}
      </Box>

      {/* Type filter chips */}
      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
        <Chip
          label="Tümü"
          size="small"
          variant={typeFilter === 'all' ? 'filled' : 'outlined'}
          onClick={() => setTypeFilter('all')}
          clickable
        />
        {DOCUMENT_TYPES.map((t) => (
          <Chip
            key={t}
            label={DOCUMENT_TYPE_LABELS[t]}
            size="small"
            variant={typeFilter === t ? 'filled' : 'outlined'}
            onClick={() => setTypeFilter(t)}
            clickable
          />
        ))}
      </Box>

      {filtered.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          {typeFilter === 'all' ? 'Henüz belge bulunmuyor.' : 'Bu kategoride belge bulunmuyor.'}
        </Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap={1}>
          {filtered.map((doc) => (
            <Paper
              key={doc.id}
              variant="outlined"
              sx={{ p: 1.5, borderColor: 'divider', bgcolor: 'background.paper' }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {getFileIcon(doc.original_filename, doc.document_type)}
                </Box>
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 300,
                      }}
                    >
                      {doc.original_filename}
                    </Typography>
                    {doc.document_type && (
                      <Chip
                        label={DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    {doc.file_size_bytes !== null && (
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(doc.file_size_bytes)}
                      </Typography>
                    )}
                    {doc.uploader_username && (
                      <Typography variant="caption" color="text.secondary">
                        {doc.uploader_username}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                    </Typography>
                    {doc.caption && (
                      <Typography variant="caption" color="text.secondary">
                        {doc.caption}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Tooltip title="İndir / Görüntüle">
                    <Button
                      size="small"
                      variant="outlined"
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ minWidth: 'unset', px: 1 }}
                    >
                      Aç
                    </Button>
                  </Tooltip>
                  {canEdit && (
                    <Tooltip title="Sil">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteDoc.mutate({ projectId, docId: doc.id })}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Belge Yükle</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
                fullWidth
              >
                {selectedFile ? selectedFile.name : 'Dosya Seç'}
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </Button>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                  {formatFileSize(selectedFile.size)}
                </Typography>
              )}
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Belge Türü</InputLabel>
              <Select
                label="Belge Türü"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
              >
                <MenuItem value="">Belirtilmemiş</MenuItem>
                {DOCUMENT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {DOCUMENT_TYPE_LABELS[t]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Açıklama"
              size="small"
              fullWidth
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploadDoc.isPending}
          >
            Yükle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
