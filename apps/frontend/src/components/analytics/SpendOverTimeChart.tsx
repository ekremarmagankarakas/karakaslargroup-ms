import { Box, Paper, Skeleton, Typography } from '@mui/material';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsFilters } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { useSpendOverTime } from '../../hooks/useAnalytics';

interface Props {
  filters: AnalyticsFilters;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={3} sx={{ p: 1.5, minWidth: 160 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
        {label}
      </Typography>
      {payload.map((entry: any) => (
        <Typography key={entry.name} variant="caption" display="block" sx={{ color: entry.color }}>
          {entry.name}: ₺{formatPrice(entry.value)}
        </Typography>
      ))}
    </Paper>
  );
}

export function SpendOverTimeChart({ filters }: Props) {
  const { data, isLoading } = useSpendOverTime(filters);

  if (isLoading) return <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />;

  const chartData = (data?.data ?? []).map((d) => ({
    name: d.month_label,
    'Toplam': parseFloat(d.total_price),
    'Onaylanan': parseFloat(d.accepted_price),
  }));

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid #e2e8f0', p: 2.5 }}>
      <Typography variant="subtitle1" fontWeight={700} mb={2}>
        Zaman İçinde Harcama
      </Typography>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `₺${formatPrice(v)}`} tick={{ fontSize: 11 }} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Toplam" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Line type="monotone" dataKey="Onaylanan" stroke="#16a34a" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
