import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import { useProjects } from '../../hooks/construction/useConstruction';
import { usePendingShipmentsCount } from '../../hooks/construction/useConstructionShipments';
import { useTotalTeamCount } from '../../hooks/construction/useConstructionTeam';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {label}
            </Typography>
            <Typography variant="h6" fontWeight={700} mt={0.25}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: `${color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export function ConstructionStatsPanel() {
  const { data, isLoading } = useProjects({ limit: 1000, page: 1 });
  const { data: pendingShipments = 0 } = usePendingShipmentsCount();
  const { data: totalTeamMembers = 0 } = useTotalTeamCount();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={2}>
        <CircularProgress size={24} />
      </Box>
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

  const stats = [
    {
      label: 'Toplam Proje',
      value: total,
      icon: <AssignmentIcon fontSize="small" />,
      color: '#2563eb',
    },
    {
      label: 'Aktif',
      value: activeCount,
      icon: <PlayCircleIcon fontSize="small" />,
      color: '#16a34a',
    },
    {
      label: 'Tamamlanan',
      value: completedCount,
      icon: <CheckCircleIcon fontSize="small" />,
      color: '#64748b',
    },
    {
      label: 'Toplam Bütçe',
      value: `₺${totalBudget.toLocaleString('tr-TR')}`,
      icon: <AccountBalanceWalletIcon fontSize="small" />,
      color: '#d97706',
    },
    {
      label: 'Ort. İlerleme',
      value: `%${avgProgress}`,
      icon: <TrendingUpIcon fontSize="small" />,
      color: '#7c3aed',
    },
    {
      label: 'Bekleyen Sevkiyat',
      value: pendingShipments,
      icon: <LocalShippingIcon fontSize="small" />,
      color: '#0891b2',
    },
    {
      label: 'Aktif Ekip Üyesi',
      value: totalTeamMembers,
      icon: <GroupIcon fontSize="small" />,
      color: '#db2777',
    },
  ];

  return (
    <Grid container spacing={2} mb={3}>
      {stats.map((s) => (
        <Grid size={{ xs: 12, sm: 6, md: 'auto' }} sx={{ flexGrow: 1 }} key={s.label}>
          <StatCard {...s} />
        </Grid>
      ))}
    </Grid>
  );
}
