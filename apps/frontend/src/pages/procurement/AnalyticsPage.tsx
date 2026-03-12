import {
  Box,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { ApprovalRateMetric } from '../../components/procurement/analytics/ApprovalRateMetric';
import { LocationStatusChart } from '../../components/procurement/analytics/LocationStatusChart';
import { SpendByLocationChart } from '../../components/procurement/analytics/SpendByLocationChart';
import { SpendOverTimeChart } from '../../components/procurement/analytics/SpendOverTimeChart';
import { StatusDonutChart } from '../../components/procurement/analytics/StatusDonutChart';
import { TopRequestersChart } from '../../components/procurement/analytics/TopRequestersChart';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatisticsPanel } from '../../components/procurement/statistics/StatisticsPanel';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../hooks/useUsers';
import type { AnalyticsFilters } from '../../types';

const currentDate = new Date().toLocaleDateString('tr-TR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const TURKISH_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - i);

export function AnalyticsPage() {
  const { user } = useAuth();
  const { data: usersData } = useUsers();
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  const canSeeTopRequesters = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'accountant';
  const canSeeLocationCharts = user?.role === 'manager' || user?.role === 'admin' || user?.role === 'accountant';
  const canFilterByUser = user?.role === 'manager' || user?.role === 'admin';

  const statsFilters = { user_id: filters.user_id, paid: filters.paid, month: filters.month, year: filters.year };

  return (
    <DashboardLayout>
      {/* Page header */}
      <Box mb={3} mt={1} display="flex" alignItems="flex-end" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.25 }}>
            Analitik
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentDate}
          </Typography>
        </Box>

        {/* Filter row */}
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          {canFilterByUser && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Kullanıcı</InputLabel>
              <Select
                label="Kullanıcı"
                value={filters.user_id ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, user_id: e.target.value ? Number(e.target.value) : undefined }))
                }
              >
                <MenuItem value="">Tümü</MenuItem>
                {(usersData ?? []).map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Ay</InputLabel>
            <Select
              label="Ay"
              value={filters.month ?? ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, month: e.target.value ? Number(e.target.value) : undefined }))
              }
            >
              <MenuItem value="">Tümü</MenuItem>
              {TURKISH_MONTHS.map((name, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Yıl</InputLabel>
            <Select
              label="Yıl"
              value={filters.year ?? ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, year: e.target.value ? Number(e.target.value) : undefined }))
              }
            >
              <MenuItem value="">Tümü</MenuItem>
              {YEARS.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={filters.paid === true}
                onChange={(e) => setFilters((f) => ({ ...f, paid: e.target.checked ? true : undefined }))}
                size="small"
              />
            }
            label={<Typography variant="body2">Ödenenler</Typography>}
          />
        </Box>
      </Box>

      {/* Statistics cards */}
      <StatisticsPanel filters={statsFilters} />

      {/* Charts row */}
      <Grid container spacing={2.5} mb={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <SpendOverTimeChart filters={filters} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatusDonutChart filters={statsFilters} />
        </Grid>
      </Grid>

      {/* Approval rate */}
      <Box mb={2.5}>
        <ApprovalRateMetric filters={statsFilters} />
      </Box>

      {/* Top requesters (hidden for employee) */}
      {canSeeTopRequesters && (
        <Box mb={2.5}>
          <TopRequestersChart filters={filters} />
        </Box>
      )}

      {/* Location charts (hidden for employee) */}
      {canSeeLocationCharts && (
        <>
          <Box mb={1} mt={1}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
              Lokasyon Analizi
            </Typography>
          </Box>
          <Grid container spacing={2.5} mb={6}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SpendByLocationChart filters={{ month: filters.month, year: filters.year }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocationStatusChart filters={{ month: filters.month, year: filters.year }} />
            </Grid>
          </Grid>
        </>
      )}
    </DashboardLayout>
  );
}
