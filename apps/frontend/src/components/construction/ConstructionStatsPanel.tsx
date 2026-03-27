import { Box, Skeleton, Typography } from '@mui/material';
import { useProjects } from '../../hooks/construction/useConstruction';
import { usePendingShipmentsCount } from '../../hooks/construction/useConstructionShipments';
import { useTotalTeamCount } from '../../hooks/construction/useConstructionTeam';

function StatsStrip({ stats, mb = 1.5 }: { stats: { label: string; value: string | number; color?: string }[]; mb?: number }) {
  return (
    <Box
      sx={{
        display: 'flex',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        overflow: 'hidden',
        mb,
      }}
    >
      {stats.map(({ label, value, color }, i) => (
        <Box
          key={label}
          sx={{
            flex: 1,
            px: { xs: 1.5, sm: 2.5 },
            py: 1.75,
            borderRight: i < stats.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.625rem',
              fontWeight: 600,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color: 'text.disabled',
              mb: 0.5,
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Fraunces", serif',
              fontSize: { xs: '1.5rem', sm: '1.875rem' },
              fontWeight: 700,
              lineHeight: 1,
              color: color ?? 'text.primary',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export function ConstructionStatsPanel() {
  const { data, isLoading } = useProjects({ limit: 1000, page: 1 });
  const { data: pendingShipments = 0 } = usePendingShipmentsCount();
  const { data: totalTeamMembers = 0 } = useTotalTeamCount();

  if (isLoading) {
    return (
      <>
        <Skeleton variant="rounded" height={72} sx={{ mb: 1.5 }} />
        <Skeleton variant="rounded" height={72} sx={{ mb: 3 }} />
      </>
    );
  }

  const projects = data?.items ?? [];
  const total = data?.total ?? 0;
  const activeCount = projects.filter((p) => p.status === 'active').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget ? parseFloat(p.budget) : 0), 0);
  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progress_pct, 0) / projects.length)
      : 0;

  return (
    <>
      <StatsStrip
        stats={[
          { label: 'Toplam',      value: total },
          { label: 'Aktif',       value: activeCount,   color: '#16a34a' },
          { label: 'Tamamlanan',  value: completedCount,color: '#64748b' },
          { label: 'Ort. İlerleme', value: `%${avgProgress}` },
        ]}
      />
      <StatsStrip
        mb={3}
        stats={[
          { label: 'Toplam Bütçe',      value: `₺${totalBudget.toLocaleString('tr-TR')}` },
          { label: 'Bekleyen Sevkiyat', value: pendingShipments, color: '#d97706' },
          { label: 'Ekip Üyesi',        value: totalTeamMembers },
        ]}
      />
    </>
  );
}
