import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
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
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useCreateRequirement } from '../../../hooks/procurement/useRequirements';
import { useLocations } from '../../../hooks/useLocations';
import { useCategories } from '../../../hooks/procurement/useCategories';
import { parsePriceInput } from '../../../utils/formatters';
import type { RequirementPriority } from '../../../types';

const PRIORITY_OPTIONS: { value: RequirementPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Düşük', color: '#64748b' },
  { value: 'normal', label: 'Normal', color: '#4338ca' },
  { value: 'high', label: 'Yüksek', color: '#d97706' },
  { value: 'urgent', label: 'Acil', color: '#dc2626' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RequirementForm({ open, onClose }: Props) {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [explanation, setExplanation] = useState('');
  const [locationId, setLocationId] = useState<number | ''>('');
  const [priority, setPriority] = useState<RequirementPriority>('normal');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [files, setFiles] = useState<File[]>([]);
  const createReq = useCreateRequirement();
  const { data: locations = [] } = useLocations();
  const { data: categories = [] } = useCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parsePriceInput(price);
    await createReq.mutateAsync({
      item_name: itemName,
      price: parsedPrice,
      explanation: explanation || undefined,
      location_id: locationId !== '' ? locationId : undefined,
      priority,
      category_id: categoryId !== '' ? categoryId : undefined,
      files,
    });
    setItemName('');
    setPrice('');
    setExplanation('');
    setLocationId('');
    setPriority('normal');
    setCategoryId('');
    setFiles([]);
    onClose();
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setItemName('');
    setPrice('');
    setExplanation('');
    setLocationId('');
    setPriority('normal');
    setCategoryId('');
    setFiles([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 1.5,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Yeni Talep Oluştur
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Satın alma talebi gönderin
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2.5}>
          <TextField
            label="Ürün / Hizmet Adı"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
            fullWidth
            placeholder="Örn: MacBook Pro 14 inch"
            helperText="Talep ettiğiniz ürün veya hizmetin adını girin"
          />
          <TextField
            label="Tahmini Fiyat (₺)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            fullWidth
            placeholder="0,00"
            inputProps={{ inputMode: 'decimal' }}
          />
          <TextField
            label="Açıklama"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder="Bu talebin neden gerekli olduğunu açıklayın..."
          />
          {locations.length > 0 && (
            <FormControl fullWidth size="small">
              <InputLabel>Lokasyon</InputLabel>
              <Select
                value={locationId}
                label="Lokasyon"
                onChange={(e) => setLocationId(e.target.value as number | '')}
              >
                <MenuItem value=""><em>Belirtilmemiş</em></MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box display="flex" gap={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Öncelik</InputLabel>
              <Select
                value={priority}
                label="Öncelik"
                onChange={(e) => setPriority(e.target.value as RequirementPriority)}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: opt.color, flexShrink: 0 }} />
                      {opt.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {categories.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={categoryId}
                  label="Kategori"
                  onChange={(e) => setCategoryId(e.target.value as number | '')}
                >
                  <MenuItem value=""><em>Belirtilmemiş</em></MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {cat.color && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
                        )}
                        {cat.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          {/* File attachment */}
          <Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFileIcon />}
              color="inherit"
              sx={{ borderColor: 'divider', color: 'text.secondary' }}
            >
              Dosya Ekle
              <input
                type="file"
                hidden
                multiple
                accept="image/jpeg,image/png,image/gif,application/pdf"
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files ?? []);
                  setFiles((prev) => [...prev, ...newFiles]);
                  e.target.value = '';
                }}
              />
            </Button>
            <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
              JPG, PNG, GIF, PDF · Maks 20MB
            </Typography>

            {files.length > 0 && (
              <Box display="flex" gap={1} flexWrap="wrap" mt={1.5}>
                {files.map((f, i) => (
                  <Chip
                    key={i}
                    label={f.name}
                    size="small"
                    onDelete={() => removeFile(i)}
                    deleteIcon={<CloseIcon />}
                    sx={{ maxWidth: 200 }}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Box display="flex" gap={1.5} justifyContent="flex-end" pt={0.5}>
            <Button onClick={handleClose} color="inherit" sx={{ color: 'text.secondary' }}>
              İptal
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createReq.isPending || !itemName || !price}
              sx={{ minWidth: 100 }}
            >
              {createReq.isPending ? <CircularProgress size={20} color="inherit" /> : 'Gönder'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
