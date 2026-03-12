import AddIcon from '@mui/icons-material/Add';
import CloudIcon from '@mui/icons-material/Cloud';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
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
  Pagination,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  useCreateDailyLog,
  useDeleteDailyLog,
  useDailyLogs,
  useUpdateDailyLog,
} from '../../hooks/construction/useConstructionDailyLogs';
import type { ConstructionDailyLog, UserRole, WeatherCondition } from '../../types';

const WEATHER_OPTIONS: { value: WeatherCondition; label: string; icon: React.ReactNode }[] = [
  { value: 'sunny', label: 'Güneşli', icon: <WbSunnyIcon fontSize="small" sx={{ color: 'warning.main' }} /> },
  { value: 'cloudy', label: 'Bulutlu', icon: <CloudIcon fontSize="small" sx={{ color: 'text.secondary' }} /> },
  { value: 'rainy', label: 'Yağmurlu', icon: <WaterDropIcon fontSize="small" sx={{ color: 'info.main' }} /> },
  { value: 'stormy', label: 'Fırtınalı', icon: <WaterDropIcon fontSize="small" sx={{ color: 'error.main' }} /> },
  { value: 'snowy', label: 'Karlı', icon: <CloudIcon fontSize="small" sx={{ color: 'info.light' }} /> },
];

const WEATHER_LABEL: Record<WeatherCondition, string> = {
  sunny: 'Güneşli',
  cloudy: 'Bulutlu',
  rainy: 'Yağmurlu',
  stormy: 'Fırtınalı',
  snowy: 'Karlı',
};

function WeatherIcon({ weather }: { weather: WeatherCondition }) {
  const opt = WEATHER_OPTIONS.find((o) => o.value === weather);
  return <>{opt?.icon ?? null}</>;
}

interface FormState {
  log_date: string;
  weather: WeatherCondition;
  temperature_c: string;
  worker_count: string;
  work_summary: string;
  equipment_on_site: string;
  visitors: string;
}

const EMPTY_FORM: FormState = {
  log_date: new Date().toISOString().slice(0, 10),
  weather: 'sunny',
  temperature_c: '',
  worker_count: '0',
  work_summary: '',
  equipment_on_site: '',
  visitors: '',
};

interface Props {
  projectId: number;
  userRole: UserRole;
}

export function DailyLogList({ projectId, userRole }: Props) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading } = useDailyLogs(projectId, page, limit);
  const createLog = useCreateDailyLog();
  const updateLog = useUpdateDailyLog();
  const deleteLog = useDeleteDailyLog();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionDailyLog | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (log: ConstructionDailyLog) => {
    setEditTarget(log);
    setForm({
      log_date: log.log_date,
      weather: log.weather,
      temperature_c: log.temperature_c != null ? String(log.temperature_c) : '',
      worker_count: String(log.worker_count),
      work_summary: log.work_summary,
      equipment_on_site: log.equipment_on_site ?? '',
      visitors: log.visitors ?? '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      log_date: form.log_date,
      weather: form.weather,
      temperature_c: form.temperature_c !== '' ? parseInt(form.temperature_c) : null,
      worker_count: parseInt(form.worker_count) || 0,
      work_summary: form.work_summary.trim(),
      equipment_on_site: form.equipment_on_site.trim() || null,
      visitors: form.visitors.trim() || null,
    };

    if (editTarget) {
      await updateLog.mutateAsync({ projectId, logId: editTarget.id, body: payload });
    } else {
      await createLog.mutateAsync({ projectId, body: payload });
    }
    setFormOpen(false);
  };

  const logs = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle1" fontWeight={700}>
            Günlük Kayıtlar
          </Typography>
          {data && (
            <Chip label={`${data.total} kayıt`} size="small" variant="outlined" />
          )}
        </Box>
        {canEdit && (
          <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={openCreate}>
            Yeni Günlük Ekle
          </Button>
        )}
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={28} />
        </Box>
      ) : logs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Henüz günlük kaydı eklenmemiş.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {logs.map((log) => (
            <Paper
              key={log.id}
              variant="outlined"
              sx={{ p: 2, borderColor: 'divider', bgcolor: 'background.paper' }}
            >
              <Box display="flex" alignItems="flex-start" gap={2}>
                {/* Date column */}
                <Box
                  sx={{
                    minWidth: 80,
                    textAlign: 'center',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    pr: 2,
                  }}
                >
                  <Typography variant="caption" color="text.disabled" display="block">
                    {new Date(log.log_date).toLocaleDateString('tr-TR', { month: 'short' })}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.1}>
                    {new Date(log.log_date).getDate()}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {new Date(log.log_date).getFullYear()}
                  </Typography>
                </Box>

                {/* Content */}
                <Box flexGrow={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <WeatherIcon weather={log.weather} />
                      <Typography variant="body2">{WEATHER_LABEL[log.weather]}</Typography>
                    </Box>
                    {log.temperature_c != null && (
                      <Typography variant="body2" color="text.secondary">
                        {log.temperature_c}°C
                      </Typography>
                    )}
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PeopleIcon fontSize="small" sx={{ color: 'text.disabled', fontSize: 16 }} />
                      <Chip label={`${log.worker_count} işçi`} size="small" variant="outlined" />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.primary" mb={0.5}>
                    {log.work_summary}
                  </Typography>
                  {log.equipment_on_site && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Ekipman: {log.equipment_on_site}
                    </Typography>
                  )}
                  {log.visitors && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Ziyaretçiler: {log.visitors}
                    </Typography>
                  )}
                  {log.recorder_username && (
                    <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                      Kaydeden: {log.recorder_username}
                    </Typography>
                  )}
                </Box>

                {/* Actions */}
                {canEdit && (
                  <Box display="flex" gap={0.5} flexShrink={0}>
                    <Tooltip title="Düzenle">
                      <IconButton size="small" onClick={() => openEdit(log)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteLog.mutate({ projectId, logId: log.id })}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            size="small"
            color="primary"
          />
        </Box>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Günlük Düzenle' : 'Yeni Günlük Ekle'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Tarih"
              type="date"
              value={form.log_date}
              onChange={(e) => setForm((f) => ({ ...f, log_date: e.target.value }))}
              fullWidth
              size="small"
              disabled={!!editTarget}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Hava Durumu</InputLabel>
              <Select
                value={form.weather}
                label="Hava Durumu"
                onChange={(e) => setForm((f) => ({ ...f, weather: e.target.value as WeatherCondition }))}
              >
                {WEATHER_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {o.icon}
                      {o.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <TextField
                label="Sıcaklık (°C)"
                type="number"
                value={form.temperature_c}
                onChange={(e) => setForm((f) => ({ ...f, temperature_c: e.target.value }))}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="İşçi Sayısı"
                type="number"
                value={form.worker_count}
                onChange={(e) => setForm((f) => ({ ...f, worker_count: e.target.value }))}
                size="small"
                sx={{ flex: 1 }}
                inputProps={{ min: 0 }}
              />
            </Box>
            <TextField
              label="Yapılan İşler"
              value={form.work_summary}
              onChange={(e) => setForm((f) => ({ ...f, work_summary: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              size="small"
              required
            />
            <TextField
              label="Sahadaki Ekipmanlar"
              value={form.equipment_on_site}
              onChange={(e) => setForm((f) => ({ ...f, equipment_on_site: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label="Ziyaretçiler"
              value={form.visitors}
              onChange={(e) => setForm((f) => ({ ...f, visitors: e.target.value }))}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              !form.log_date ||
              !form.work_summary.trim() ||
              createLog.isPending ||
              updateLog.isPending
            }
          >
            {editTarget ? 'Kaydet' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
