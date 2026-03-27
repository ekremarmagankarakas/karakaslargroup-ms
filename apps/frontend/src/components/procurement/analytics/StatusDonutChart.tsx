import { Skeleton } from '@mui/material';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { StatisticsFilters } from '../../../types';
import { useStatistics } from '../../../hooks/procurement/useStatistics';
import { SectionCard } from '../../common/SectionCard';

interface Props {
  filters: StatisticsFilters;
}

const SLICES = [
  { key: 'pending_count' as const, label: 'Beklemede', color: '#d97706' },
  { key: 'accepted_count' as const, label: 'Onaylandı', color: '#16a34a' },
  { key: 'declined_count' as const, label: 'Reddedildi', color: '#dc2626' },
];

export function StatusDonutChart({ filters }: Props) {
  const { data, isLoading } = useStatistics(filters);

  if (isLoading) return <Skeleton variant="rounded" height={260} />;
  if (!data) return null;

  const chartData = SLICES.map((s) => ({ name: s.label, value: data[s.key], color: s.color })).filter(
    (d) => d.value > 0
  );

  return (
    <SectionCard title="Durum Dağılımı" sx={{ height: '100%' }}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </SectionCard>
  );
}
