import { Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import { useStatistics } from '../../hooks/useStatistics';
import type { StatisticsFilters } from '../../types';
import { formatPrice } from '../../utils/formatters';

interface Props {
  filters: StatisticsFilters;
}

export function StatisticsPanel({ filters }: Props) {
  const { data, isLoading } = useStatistics(filters);

  if (isLoading) return <CircularProgress size={24} />;
  if (!data) return null;

  const stats = [
    { label: 'Toplam', count: data.total_count, price: data.total_price, color: 'primary.main' },
    { label: 'Beklemede', count: data.pending_count, price: data.pending_price, color: 'warning.main' },
    { label: 'Onaylandı', count: data.accepted_count, price: data.accepted_price, color: 'success.main' },
    { label: 'Reddedildi', count: data.declined_count, price: data.declined_price, color: 'error.main' },
  ];

  return (
    <Grid container spacing={2} mb={2}>
      {stats.map(({ label, count, price, color }) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={label}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h5" fontWeight={700} color={color}>
                {count}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatPrice(price)} TL
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
