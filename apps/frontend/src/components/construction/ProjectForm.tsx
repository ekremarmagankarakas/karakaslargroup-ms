import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocations } from '../../hooks/useLocations';
import type { ConstructionProject } from '../../types';

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planlama' },
  { value: 'active', label: 'Aktif' },
  { value: 'on_hold', label: 'Beklemede' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    location_id?: number;
    status: string;
    start_date?: string;
    end_date?: string;
    budget?: string;
    progress_pct?: number;
  }) => void;
  loading?: boolean;
  project?: ConstructionProject | null;
}

export function ProjectForm({ open, onClose, onSubmit, loading, project }: Props) {
  const { data: locations } = useLocations();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState<number | ''>('');
  const [status, setStatus] = useState('planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setLocationId(project.location_id ?? '');
      setStatus(project.status);
      setStartDate(project.start_date ?? '');
      setEndDate(project.end_date ?? '');
      setBudget(project.budget ?? '');
      setProgressPct(project.progress_pct);
    } else {
      setName('');
      setDescription('');
      setLocationId('');
      setStatus('planning');
      setStartDate('');
      setEndDate('');
      setBudget('');
      setProgressPct(0);
    }
  }, [project, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      location_id: locationId !== '' ? (locationId as number) : undefined,
      status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      budget: budget || undefined,
      ...(project ? { progress_pct: progressPct } : {}),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{project ? 'Proje Düzenle' : 'Yeni Proje'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Proje Adı"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Açıklama"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
            size="small"
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Lokasyon</InputLabel>
            <Select
              value={locationId}
              label="Lokasyon"
              onChange={(e) => setLocationId(e.target.value as number | '')}
            >
              <MenuItem value="">Seçilmedi</MenuItem>
              {locations?.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Durum</InputLabel>
            <Select value={status} label="Durum" onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box display="flex" gap={2}>
            <TextField
              label="Başlangıç Tarihi"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Bitiş Tarihi"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <TextField
            label="Bütçe (₺)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            fullWidth
            size="small"
            type="number"
            inputProps={{ min: 0, step: '0.01' }}
          />
          {project && (
            <TextField
              label="İlerleme (%)"
              value={progressPct}
              onChange={(e) => setProgressPct(Math.min(100, Math.max(0, Number(e.target.value))))}
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0, max: 100 }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          İptal
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!name.trim() || loading}>
          {project ? 'Kaydet' : 'Oluştur'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
