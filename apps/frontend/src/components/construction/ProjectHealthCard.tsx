import { Box, Chip, CircularProgress, Paper, Tooltip, Typography } from '@mui/material';
import { useProjectHealth } from '../../hooks/construction/useConstruction';

type RAG = 'red' | 'amber' | 'green';

const RAG_COLORS: Record<RAG, string> = {
  red: '#ef4444',
  amber: '#f59e0b',
  green: '#22c55e',
};

const RAG_LABELS: Record<RAG, string> = {
  red: 'Kritik',
  amber: 'Uyarı',
  green: 'Normal',
};

const DIMENSION_LABELS: Record<string, string> = {
  budget_status: 'Bütçe',
  schedule_status: 'Zamanlama',
  issue_status: 'Sorunlar',
};

interface Props {
  projectId: number;
}

export function ProjectHealthCard({ projectId }: Props) {
  const { data: health, isLoading } = useProjectHealth(projectId);

  if (isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress size={20} />
        </Box>
      </Paper>
    );
  }

  if (!health) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
        {/* Overall RAG dot */}
        <Tooltip title={`Genel durum: ${RAG_LABELS[health.overall]}`}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: RAG_COLORS[health.overall],
              flexShrink: 0,
              boxShadow: `0 0 8px ${RAG_COLORS[health.overall]}60`,
            }}
          />
        </Tooltip>

        <Box flexGrow={1}>
          <Typography variant="subtitle2" fontWeight={700} mb={0.75}>
            Proje Sağlığı
          </Typography>

          {/* Sub-indicators */}
          <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
            {(['budget_status', 'schedule_status', 'issue_status'] as const).map((key) => (
              <Chip
                key={key}
                label={DIMENSION_LABELS[key]}
                size="small"
                sx={{
                  bgcolor: `${RAG_COLORS[health[key]]}20`,
                  color: RAG_COLORS[health[key]],
                  border: `1px solid ${RAG_COLORS[health[key]]}40`,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Box>

          {/* Detail list */}
          {health.details.map((d, i) => (
            <Typography key={i} variant="caption" color="text.secondary" display="block">
              • {d}
            </Typography>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
