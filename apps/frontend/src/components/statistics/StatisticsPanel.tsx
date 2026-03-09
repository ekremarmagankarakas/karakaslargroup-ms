import AssignmentIcon from '@mui/icons-material/Assignment';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import SavingsIcon from '@mui/icons-material/Savings';
import { Box, Button, Dialog, DialogContent, DialogTitle, Grid, LinearProgress, Skeleton, TextField, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { useStatistics } from '../../hooks/useStatistics';
import { useBudgetStatus, useSetBudget } from '../../hooks/useBudget';
import { useAuth } from '../../context/AuthContext';
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
    light: 'rgba(37,99,235,0.12)',
    featured: true,
  },
  {
    key: 'pending' as const,
    label: 'Beklemede',
    Icon: HourglassEmptyIcon,
    color: '#d97706',
    gradient: null,
    light: 'rgba(217,119,6,0.12)',
    featured: false,
  },
  {
    key: 'accepted' as const,
    label: 'Onaylandı',
    Icon: CheckCircleIcon,
    color: '#16a34a',
    gradient: null,
    light: 'rgba(22,163,74,0.12)',
    featured: false,
  },
  {
    key: 'declined' as const,
    label: 'Reddedildi',
    Icon: BlockIcon,
    color: '#dc2626',
    gradient: null,
    light: 'rgba(220,38,38,0.12)',
    featured: false,
  },
] as const;

export function StatisticsPanel({ filters }: Props) {
  const { data, isLoading } = useStatistics(filters);
  const { user } = useAuth();
  const { data: budget } = useBudgetStatus(filters.month, filters.year);
  const setBudget = useSetBudget();
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');

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

  const budgetUsed = budget ? parseFloat(budget.budget_used) : 0;
  const budgetAmount_ = budget?.budget_amount ? parseFloat(budget.budget_amount) : null;
  const budgetPct = budgetAmount_ ? Math.min((budgetUsed / budgetAmount_) * 100, 100) : 0;
  const budgetColor = budgetPct >= 100 ? 'error' : budgetPct >= 80 ? 'warning' : 'primary';

  const now = new Date();
  const currentMonth = filters.month ?? now.getMonth() + 1;
  const currentYear = filters.year ?? now.getFullYear();

  return (
    <>
    <Grid container spacing={2} mb={3}>
      {STATS_CONFIG.map(({ key, label, Icon, color, gradient, light, featured }) => (
        <Grid size={{ xs: 6, md: 3 }} key={key}>
          <Box
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              height: '100%',
              background: featured ? gradient! : 'transparent',
              bgcolor: featured ? undefined : 'background.paper',
              border: '1px solid',
              borderColor: featured ? 'transparent' : 'divider',
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

      {/* Budget bar */}
      {budget && (
        <Grid size={12}>
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <SavingsIcon sx={{ color: '#2563eb', flexShrink: 0 }} />
            <Box flex={1}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  {currentMonth}/{currentYear} Bütçe
                </Typography>
                <Typography variant="caption" fontWeight={700} color={`${budgetColor}.main`}>
                  ₺{formatPrice(budget.budget_used)}
                  {budgetAmount_ ? ` / ₺${formatPrice(budget.budget_amount!)}` : ''}
                </Typography>
              </Box>
              {budgetAmount_ ? (
                <Tooltip title={`%${budgetPct.toFixed(1)} kullanıldı`}>
                  <LinearProgress
                    variant="determinate"
                    value={budgetPct}
                    color={budgetColor}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Tooltip>
              ) : (
                <Typography variant="caption" color="text.disabled">Bütçe belirlenmemiş</Typography>
              )}
            </Box>
            {user?.role === 'admin' && (
              <Button size="small" variant="outlined" onClick={() => setShowBudgetDialog(true)} sx={{ flexShrink: 0 }}>
                Bütçe Belirle
              </Button>
            )}
          </Box>
        </Grid>
      )}
    </Grid>

    {/* Budget dialog */}
    <Dialog open={showBudgetDialog} onClose={() => setShowBudgetDialog(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Bütçe Belirle</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} pt={1}>
          <Typography variant="body2" color="text.secondary">
            {currentMonth}/{currentYear} dönemi için bütçe limitini girin.
          </Typography>
          <TextField
            label="Bütçe (₺)"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            fullWidth
            size="small"
            type="number"
          />
          <Box display="flex" gap={1} justifyContent="flex-end">
            <Button onClick={() => setShowBudgetDialog(false)} color="inherit">İptal</Button>
            <Button
              variant="contained"
              disabled={!budgetAmount || setBudget.isPending}
              onClick={async () => {
                await setBudget.mutateAsync({
                  amount: budgetAmount,
                  period_month: currentMonth,
                  period_year: currentYear,
                });
                setShowBudgetDialog(false);
                setBudgetAmount('');
              }}
            >
              Kaydet
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
    </>
  );
}
