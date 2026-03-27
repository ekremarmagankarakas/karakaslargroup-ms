import { Box, Button, Dialog, DialogContent, DialogTitle, LinearProgress, Skeleton, TextField, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { useStatistics } from '../../../hooks/procurement/useStatistics';
import { useBudgetStatus, useSetBudget } from '../../../hooks/procurement/useBudget';
import { useAuth } from '../../../context/AuthContext';
import type { StatisticsFilters } from '../../../types';
import { formatPrice } from '../../../utils/formatters';

interface Props {
  filters: StatisticsFilters;
}

const STATS_CONFIG = [
  { key: 'total'    as const, label: 'Toplam',    color: null       },
  { key: 'pending'  as const, label: 'Beklemede', color: '#d97706'  },
  { key: 'accepted' as const, label: 'Onaylandı', color: '#16a34a'  },
  { key: 'declined' as const, label: 'Reddedildi',color: '#dc2626'  },
] as const;

export function StatisticsPanel({ filters }: Props) {
  const { data, isLoading } = useStatistics(filters);
  const { user } = useAuth();
  const { data: budget } = useBudgetStatus(filters.month, filters.year);
  const setBudget = useSetBudget();
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');

  if (isLoading) {
    return <Skeleton variant="rounded" height={72} sx={{ mb: 2 }} />;
  }

  if (!data) return null;

  const values = {
    total:    { count: data.total_count,    price: data.total_price    },
    pending:  { count: data.pending_count,  price: data.pending_price  },
    accepted: { count: data.accepted_count, price: data.accepted_price },
    declined: { count: data.declined_count, price: data.declined_price },
  };

  const budgetUsed   = budget ? parseFloat(budget.budget_used) : 0;
  const budgetLimit  = budget?.budget_amount ? parseFloat(budget.budget_amount) : null;
  const budgetPct    = budgetLimit ? Math.min((budgetUsed / budgetLimit) * 100, 100) : 0;
  const budgetColor  = budgetPct >= 100 ? 'error' : budgetPct >= 80 ? 'warning' : 'primary';

  const now          = new Date();
  const currentMonth = filters.month ?? now.getMonth() + 1;
  const currentYear  = filters.year  ?? now.getFullYear();

  return (
    <>
      {/* ── Stats strip ── */}
      <Box
        sx={{
          display: 'flex',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          overflow: 'hidden',
          mb: budget ? 1.5 : 3,
        }}
      >
        {STATS_CONFIG.map(({ key, label, color }, i) => (
          <Box
            key={key}
            sx={{
              flex: 1,
              px: { xs: 1.5, sm: 2.5 },
              py: 1.75,
              borderRight: i < STATS_CONFIG.length - 1 ? '1px solid' : 'none',
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
                fontSize: { xs: '1.625rem', sm: '2rem' },
                fontWeight: 700,
                lineHeight: 1,
                color: color ?? 'text.primary',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {values[key].count}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: 'text.secondary',
                fontVariantNumeric: 'tabular-nums',
                mt: 0.5,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              ₺{formatPrice(values[key].price)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ── Budget bar ── */}
      {budget && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 2,
            py: 1.25,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Box flex={1}>
            <Box display="flex" justifyContent="space-between" mb={0.75}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                {currentMonth}/{currentYear} Bütçe
              </Typography>
              <Typography variant="caption" fontWeight={700} color={`${budgetColor}.main`}>
                ₺{formatPrice(budget.budget_used)}
                {budgetLimit ? ` / ₺${formatPrice(budget.budget_amount!)}` : ''}
              </Typography>
            </Box>
            {budgetLimit ? (
              <Tooltip title={`%${budgetPct.toFixed(1)} kullanıldı`}>
                <LinearProgress
                  variant="determinate"
                  value={budgetPct}
                  color={budgetColor}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Tooltip>
            ) : (
              <Typography variant="caption" color="text.disabled">Bütçe belirlenmemiş</Typography>
            )}
          </Box>
          {user?.role === 'admin' && (
            <Button size="small" variant="outlined" onClick={() => setShowBudgetDialog(true)} sx={{ flexShrink: 0 }}>
              Düzenle
            </Button>
          )}
        </Box>
      )}

      {/* ── Budget dialog ── */}
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
