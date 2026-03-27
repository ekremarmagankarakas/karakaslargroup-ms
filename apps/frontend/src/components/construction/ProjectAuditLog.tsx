import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  Box,
  Chip,
  Skeleton,
  Paper,
  Typography,
} from '@mui/material';
import { useProjectAuditLog } from '../../hooks/construction/useConstructionAuditLog';
import type { ConstructionAuditAction } from '../../types';

const ACTION_LABELS: Record<ConstructionAuditAction, string> = {
  created: 'Oluşturuldu',
  status_changed: 'Durum Değişikliği',
  budget_changed: 'Bütçe Değişikliği',
  progress_updated: 'İlerleme Güncellendi',
  edited: 'Düzenlendi',
};

const ACTION_COLORS: Record<
  ConstructionAuditAction,
  'default' | 'success' | 'info' | 'warning' | 'primary'
> = {
  created: 'success',
  status_changed: 'warning',
  budget_changed: 'info',
  progress_updated: 'primary',
  edited: 'default',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  projectId: number;
}

export function ProjectAuditLog({ projectId }: Props) {
  const { data: logs = [], isLoading } = useProjectAuditLog(projectId);

  if (isLoading) return <Skeleton variant="rounded" height={120} />;

  if (logs.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        Henüz geçmiş kaydı bulunmuyor.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} mb={2}>
        Proje Geçmişi ({logs.length})
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        {logs.map((log) => (
          <Paper
            key={log.id}
            variant="outlined"
            sx={{ p: 1.5, borderColor: 'divider', bgcolor: 'background.paper' }}
          >
            <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                  <Chip
                    label={ACTION_LABELS[log.action]}
                    color={ACTION_COLORS[log.action]}
                    size="small"
                    variant="outlined"
                  />
                  {log.field_name && (
                    <Typography variant="caption" color="text.secondary">
                      Alan: <strong>{log.field_name}</strong>
                    </Typography>
                  )}
                </Box>
                {(log.old_value !== null || log.new_value !== null) && (
                  <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                    {log.old_value !== null && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          bgcolor: 'action.hover',
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 0.5,
                          fontFamily: 'monospace',
                        }}
                      >
                        {log.old_value}
                      </Typography>
                    )}
                    {log.old_value !== null && log.new_value !== null && (
                      <ArrowForwardIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                    )}
                    {log.new_value !== null && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.primary',
                          bgcolor: 'action.selected',
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 0.5,
                          fontFamily: 'monospace',
                        }}
                      >
                        {log.new_value}
                      </Typography>
                    )}
                  </Box>
                )}
                <Box display="flex" gap={1.5} mt={0.5}>
                  {log.username && (
                    <Typography variant="caption" color="text.secondary">
                      {log.username}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.disabled">
                    {formatDate(log.created_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
