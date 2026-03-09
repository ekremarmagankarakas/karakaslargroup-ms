import { Box, Paper, Skeleton, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsFilters } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { useLocationStats } from '../../hooks/useAnalytics';

const COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];

interface Props {
  filters: Pick<AnalyticsFilters, 'month' | 'year'>;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const approvalRate = d.total_count > 0 ? ((d.accepted_count / d.total_count) * 100).toFixed(0) : 0;
  return (
    <Paper elevation={3} sx={{ p: 1.5, minWidth: 200 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
        {d.location_name}
      </Typography>
      <Typography variant="caption" display="block">
        Toplam Harcama: ₺{formatPrice(d.total_price)}
      </Typography>
      <Typography variant="caption" display="block" sx={{ color: '#16a34a' }}>
        Onaylanan: ₺{formatPrice(d.accepted_price)}
      </Typography>
      <Typography variant="caption" display="block">
        Talep Sayısı: {d.total_count}
      </Typography>
      <Typography variant="caption" display="block">
        Onay Oranı: %{approvalRate}
      </Typography>
    </Paper>
  );
}

export function SpendByLocationChart({ filters }: Props) {
  const { data, isLoading } = useLocationStats(filters);

  if (isLoading) return <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />;

  const chartData = (data?.data ?? []).map((d) => ({
    location_name: d.location_name,
    total_price: parseFloat(d.total_price),
    accepted_price: parseFloat(d.accepted_price),
    total_count: d.total_count,
    accepted_count: d.accepted_count,
  }));

  if (chartData.length === 0) {
    return (
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid #e2e8f0', p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>Lokasyona Göre Harcama</Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center" py={4}>
          Lokasyon verisi bulunamadı
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid #e2e8f0', p: 2.5 }}>
      <Typography variant="subtitle1" fontWeight={700} mb={2}>
        Lokasyona Göre Harcama
      </Typography>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart layout="vertical" data={chartData} margin={{ top: 4, right: 24, bottom: 0, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `₺${formatPrice(v)}`}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="location_name"
            tick={{ fontSize: 11 }}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total_price" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
