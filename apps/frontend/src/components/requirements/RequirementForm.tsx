import AttachFileIcon from '@mui/icons-material/AttachFile';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useCreateRequirement } from '../../hooks/useRequirements';
import { parsePriceInput } from '../../utils/formatters';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RequirementForm({ open, onClose }: Props) {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [explanation, setExplanation] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const createReq = useCreateRequirement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parsePriceInput(price);
    await createReq.mutateAsync({
      item_name: itemName,
      price: parsedPrice,
      explanation: explanation || undefined,
      files,
    });
    setItemName('');
    setPrice('');
    setExplanation('');
    setFiles([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Yeni Talep Oluştur</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Ürün Adı"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Fiyat (TL)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            fullWidth
            inputProps={{ inputMode: 'decimal' }}
          />
          <TextField
            label="Açıklama"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
          <Button variant="outlined" component="label" startIcon={<AttachFileIcon />}>
            Dosya Ekle ({files.length} seçili)
            <input
              type="file"
              hidden
              multiple
              accept="image/jpeg,image/png,image/gif,application/pdf"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </Button>
          {files.length > 0 && (
            <Box>
              {files.map((f, i) => (
                <Typography key={i} variant="caption" display="block">
                  {f.name}
                </Typography>
              ))}
            </Box>
          )}
          <Box display="flex" gap={1} justifyContent="flex-end">
            <Button onClick={onClose}>İptal</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createReq.isPending || !itemName || !price}
            >
              {createReq.isPending ? <CircularProgress size={20} /> : 'Gönder'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
