import { Paper, Skeleton, Typography } from '@mui/material';
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
import type { AnalyticsFilters } from '../../../types';
import { formatPrice } from '../../../utils/formatters';
import { useSpendOverTime } from '../../../hooks/procurement/useAnalytics';
import { SectionCard } from '../../common/SectionCard';

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

interface Props {
  filters: AnalyticsFilters;
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={3} sx={{ p: 1.5, minWidth: 160 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>{label}</Typography>
      {payload.map((entry) => (
        <Typography key={entry.name} variant="caption" display="block" sx={{ color: entry.color }}>
          {entry.name}: ₺{formatPrice(entry.value)}
        </Typography>
      ))}
    </Paper>
  );
}

export function SpendOverTimeChart({ filters }: Props) {
  const { data, isLoading } = useSpendOverTime(filters);

  if (isLoading) return <Skeleton variant="rounded" height={260} />;

  const chartData = (data?.data ?? []).map((d) => ({
    name: d.month_label,
    'Toplam': parseFloat(d.total_price),
    'Onaylanan': parseFloat(d.accepted_price),
  }));

  return (
    <SectionCard title="Zaman İçinde Harcama">
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `₺${formatPrice(v)}`} tick={{ fontSize: 11 }} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Toplam" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Line type="monotone" dataKey="Onaylanan" stroke="#16a34a" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </SectionCard>
  );
}
