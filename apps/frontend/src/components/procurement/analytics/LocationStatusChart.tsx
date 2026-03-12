import { Box, Paper, Skeleton, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsFilters } from '../../../types';
import { useLocationStats } from '../../../hooks/procurement/useAnalytics';

interface Props {
  filters: Pick<AnalyticsFilters, 'month' | 'year'>;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={3} sx={{ p: 1.5, minWidth: 170 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
        {label}
      </Typography>
      {payload.map((entry: any) => (
        <Typography key={entry.name} variant="caption" display="block" sx={{ color: entry.fill }}>
          {entry.name}: {entry.value}
        </Typography>
      ))}
    </Paper>
  );
}

export function LocationStatusChart({ filters }: Props) {
  const { data, isLoading } = useLocationStats(filters);

  if (isLoading) return <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />;

  const chartData = (data?.data ?? []).map((d) => ({
    name: d.location_name,
    Beklemede: d.pending_count,
    Onaylandı: d.accepted_count,
    Reddedildi: d.declined_count,
  }));

  if (chartData.length === 0) {
    return (
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>Lokasyona Göre Talep Durumu</Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center" py={4}>
          Lokasyon verisi bulunamadı
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5 }}>
      <Typography variant="subtitle1" fontWeight={700} mb={2}>
        Lokasyona Göre Talep Durumu
      </Typography>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Beklemede" fill="#d97706" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="Onaylandı" fill="#16a34a" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="Reddedildi" fill="#dc2626" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
