import React from 'react';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSCurve } from '../../hooks/construction/useSCurve';

interface Props {
  projectId: number;
}

interface TooltipPayloadEntry {
  name: string;
  value: number | null;
  color: string;
  dataKey: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
        {label}
      </Typography>
      {payload.map((entry) => (
        <Typography key={entry.name} variant="body2" sx={{ color: entry.color }}>
          {entry.name}: {entry.value != null ? `${entry.value}%` : '-'}
        </Typography>
      ))}
    </Paper>
  );
};

export default function SCurveChart({ projectId }: Props) {
  const { data, isLoading } = useSCurve(projectId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
        S-eğrisi için yeterli veri bulunmuyor.
      </Typography>
    );
  }

  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  // Find current deviation (latest actual vs planned)
  const latestActual = [...data].reverse().find(p => p.actual != null);
  const latestPlanned = latestActual ? data.find(p => p.date === latestActual.date) : null;
  const deviation = latestActual && latestPlanned
    ? Math.round((latestActual.actual! - latestPlanned.planned) * 10) / 10
    : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={600}>S-Eğrisi İlerleme Grafiği</Typography>
        {deviation !== null && (
          <Typography
            variant="body2"
            fontWeight={600}
            color={deviation >= 0 ? 'success.main' : 'error.main'}
          >
            {deviation >= 0 ? `+${deviation}%` : `${deviation}%`} (plana göre)
          </Typography>
        )}
      </Box>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={v => v.slice(0, 7)}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 11 }}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => value === 'planned' ? 'Planlanan' : 'Gerçekleşen'}
          />
          <ReferenceLine x={todayKey} stroke="rgba(128,128,128,0.4)" strokeDasharray="4 2" label={{ value: 'Bugün', fontSize: 10, fill: 'gray' }} />
          <Line
            type="monotone"
            dataKey="planned"
            name="planned"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            strokeDasharray="6 3"
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="actual"
            stroke="#16a34a"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
