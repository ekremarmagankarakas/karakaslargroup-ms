import { Paper, Skeleton, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsFilters } from '../../../types';
import { formatPrice } from '../../../utils/formatters';
import { useTopRequesters } from '../../../hooks/procurement/useAnalytics';
import { SectionCard } from '../../common/SectionCard';

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
  payload: {
    username: string;
    total_price: number;
    total_count: number;
    accepted_count: number;
  };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

interface Props {
  filters: AnalyticsFilters;
}

function CustomTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const rate = d.total_count > 0 ? ((d.accepted_count / d.total_count) * 100).toFixed(0) : 0;
  return (
    <Paper elevation={3} sx={{ p: 1.5, minWidth: 180 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
        {d.username}
      </Typography>
      <Typography variant="caption" display="block">
        Toplam: ₺{formatPrice(d.total_price)}
      </Typography>
      <Typography variant="caption" display="block">
        Talep sayısı: {d.total_count}
      </Typography>
      <Typography variant="caption" display="block">
        Onay oranı: %{rate}
      </Typography>
    </Paper>
  );
}

export function TopRequestersChart({ filters }: Props) {
  const { data, isLoading } = useTopRequesters(8, filters);

  if (isLoading) return <Skeleton variant="rounded" height={300} />;

  const chartData = (data?.data ?? []).map((d) => ({
    username: d.username,
    total_price: parseFloat(d.total_price),
    total_count: d.total_count,
    accepted_count: d.accepted_count,
  }));

  return (
    <SectionCard title="En Çok Talep Edenler">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart layout="vertical" data={chartData} margin={{ top: 4, right: 24, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `₺${formatPrice(v)}`}
            tick={{ fontSize: 11 }}
          />
          <YAxis type="category" dataKey="username" tick={{ fontSize: 12 }} width={90} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total_price" fill="#4338ca" radius={[0, 4, 4, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </SectionCard>
  );
}
