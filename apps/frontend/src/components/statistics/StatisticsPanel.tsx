import AssignmentIcon from '@mui/icons-material/Assignment';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { Box, Grid, Skeleton, Typography } from '@mui/material';
import { useStatistics } from '../../hooks/useStatistics';
import type { StatisticsFilters } from '../../types';
import { formatPrice } from '../../utils/formatters';

interface Props {
  filters: StatisticsFilters;
}

const STATS_CONFIG = [
  {
    key: 'total' as const,
    label: 'Toplam Talep',
    Icon: AssignmentIcon,
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)',
    light: '#eff6ff',
    featured: true,
  },
  {
    key: 'pending' as const,
    label: 'Beklemede',
    Icon: HourglassEmptyIcon,
    color: '#d97706',
    gradient: null,
    light: '#fffbeb',
    featured: false,
  },
  {
    key: 'accepted' as const,
    label: 'Onaylandı',
    Icon: CheckCircleIcon,
    color: '#16a34a',
    gradient: null,
    light: '#f0fdf4',
    featured: false,
  },
  {
    key: 'declined' as const,
    label: 'Reddedildi',
    Icon: BlockIcon,
    color: '#dc2626',
    gradient: null,
    light: '#fef2f2',
    featured: false,
  },
] as const;

export function StatisticsPanel({ filters }: Props) {
  const { data, isLoading } = useStatistics(filters);

  if (isLoading) {
    return (
      <Grid container spacing={2} mb={3}>
        {[0, 1, 2, 3].map((i) => (
          <Grid size={{ xs: 6, md: 3 }} key={i}>
            <Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!data) return null;

  const values = {
    total: { count: data.total_count, price: data.total_price },
    pending: { count: data.pending_count, price: data.pending_price },
    accepted: { count: data.accepted_count, price: data.accepted_price },
    declined: { count: data.declined_count, price: data.declined_price },
  };

  return (
    <Grid container spacing={2} mb={3}>
      {STATS_CONFIG.map(({ key, label, Icon, color, gradient, light, featured }) => (
        <Grid size={{ xs: 6, md: 3 }} key={key}>
          <Box
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              height: '100%',
              background: featured ? gradient! : '#ffffff',
              border: '1px solid',
              borderColor: featured ? 'transparent' : '#e2e8f0',
              boxShadow: featured
                ? '0 4px 20px rgba(37,99,235,0.25)'
                : '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: featured
                  ? '0 10px 32px rgba(37,99,235,0.3)'
                  : '0 8px 24px rgba(0,0,0,0.08)',
              },
            }}
          >
            {/* Colored top bar for non-featured cards */}
            {!featured && <Box sx={{ height: 3, bgcolor: color }} />}

            <Box sx={{ p: 2.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      fontSize: '0.63rem',
                      textTransform: 'uppercase',
                      color: featured ? 'rgba(255,255,255,0.75)' : 'text.secondary',
                    }}
                  >
                    {label}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: '2rem',
                      lineHeight: 1.1,
                      mt: 0.5,
                      color: featured ? '#ffffff' : color,
                      letterSpacing: '-0.03em',
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    {values[key].count}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: featured ? 'rgba(255,255,255,0.2)' : light,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon sx={{ color: featured ? '#ffffff' : color, fontSize: 20 }} />
                </Box>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  mt: 1.5,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: featured ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                ₺ {formatPrice(values[key].price)}
              </Typography>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
