import { Box, LinearProgress, Skeleton, Typography } from '@mui/material';
import type { StatisticsFilters } from '../../types';
import { useStatistics } from '../../hooks/useStatistics';

interface Props {
  filters: StatisticsFilters;
}

export function ApprovalRateMetric({ filters }: Props) {
  const { data, isLoading } = useStatistics(filters);

  if (isLoading) return <Skeleton variant="rounded" height={80} sx={{ borderRadius: 3 }} />;
  if (!data) return null;

  const rate = data.total_count > 0 ? (data.accepted_count / data.total_count) * 100 : 0;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing="0.08em" textTransform="uppercase" fontSize="0.63rem">
          Onay Oranı
        </Typography>
        <Typography
          sx={{ fontWeight: 800, fontSize: '2.5rem', lineHeight: 1, color: '#16a34a', letterSpacing: '-0.03em' }}
        >
          %{rate.toFixed(0)}
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
          {data.accepted_count} / {data.total_count} talep onaylandı
        </Typography>
        <LinearProgress
          variant="determinate"
          value={rate}
          color="success"
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>
    </Box>
  );
}
