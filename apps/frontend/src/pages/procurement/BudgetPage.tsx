import React from 'react';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EditIcon from '@mui/icons-material/Edit';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useBudgetHistory, useBudgetStatus, useSetBudget } from '../../hooks/procurement/useBudget';
import { useLocations } from '../../hooks/useLocations';
import type { BudgetHistoryItem } from '../../types';
import { formatPrice } from '../../utils/formatters';

const currentDate = new Date().toLocaleDateString('tr-TR', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        p: 2.5,
        height: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
      }}
    >
      <Box sx={{ height: 3, bgcolor: color, borderRadius: 1, mb: 2 }} />
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, letterSpacing: '0.08em', fontSize: '0.63rem', textTransform: 'uppercase', color: 'text.secondary' }}
          >
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1.1, mt: 0.5, color, letterSpacing: '-0.03em' }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              {sub}
            </Typography>
          )}
        </Box>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </Box>
      </Box>
    </Box>
  );
}

function UtilizationChip({ pct }: { pct: number }) {
  const color = pct >= 100 ? 'error' : pct >= 80 ? 'warning' : 'success';
  return (
    <Chip
      label={`%${pct.toFixed(1)}`}
      color={color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 700, minWidth: 64 }}
    />
  );
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color?: string;
  stroke?: string;
  dataKey: string;
}

interface ChartTooltipComponentProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipComponentProps) {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={3} sx={{ p: 1.5, minWidth: 180 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>{label}</Typography>
      {payload.map((entry) => (
        <Typography key={entry.name} variant="caption" display="block" sx={{ color: entry.color ?? entry.stroke }}>
          {entry.name}: {entry.name === 'Kullanım (%)' ? `%${entry.value?.toFixed(1)}` : `₺${formatPrice(entry.value)}`}
        </Typography>
      ))}
    </Paper>
  );
}

function BudgetDialog({
  open,
  item,
  locationId,
  onClose,
}: {
  open: boolean;
  item: { month: number; year: number; month_label: string; budget_amount: string | null } | null;
  locationId: number | undefined;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const setBudget = useSetBudget();

  const handleOpen = () => {
    setAmount(item?.budget_amount ? parseFloat(item.budget_amount).toFixed(0) : '');
  };

  const handleSave = async () => {
    if (!item || !amount) return;
    await setBudget.mutateAsync({
      amount,
      period_month: item.month,
      period_year: item.year,
      location_id: locationId,
    });
    onClose();
    setAmount('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth TransitionProps={{ onEntered: handleOpen }}>
      <DialogTitle>
        <Typography fontWeight={700}>Bütçe Belirle</Typography>
        <Typography variant="body2" color="text.secondary">{item?.month_label}</Typography>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} pt={1}>
          <TextField
            label="Bütçe Limiti (₺)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            size="small"
            type="number"
            inputProps={{ min: 0, step: 1000 }}
            autoFocus
          />
          <Box display="flex" gap={1} justifyContent="flex-end">
            <Button onClick={onClose} color="inherit">İptal</Button>
            <Button
              variant="contained"
              disabled={!amount || setBudget.isPending}
              onClick={handleSave}
              startIcon={setBudget.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              Kaydet
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BudgetPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const now = new Date();

  const { data: locations = [] } = useLocations();
  // undefined = company-wide; number = specific location
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>(undefined);

  const { data: currentBudget, isLoading: budgetLoading, isError: budgetError } = useBudgetStatus(
    now.getMonth() + 1,
    now.getFullYear(),
    selectedLocationId,
  );
  const { data: history, isLoading: historyLoading, isError: historyError } = useBudgetHistory(12, selectedLocationId);

  const [dialogItem, setDialogItem] = useState<BudgetHistoryItem | null>(null);

  const used = currentBudget ? parseFloat(currentBudget.budget_used) : 0;
  const limit = currentBudget?.budget_amount ? parseFloat(currentBudget.budget_amount) : null;
  const remaining = limit !== null ? limit - used : null;
  const utilizationPct = limit && limit > 0 ? Math.min((used / limit) * 100, 999) : 0;
  const utilizationColor = utilizationPct >= 100 ? '#dc2626' : utilizationPct >= 80 ? '#d97706' : '#16a34a';

  const chartData = (history?.data ?? []).map((d) => ({
    name: d.month_label,
    Harcanan: parseFloat(d.budget_used),
    Bütçe: d.budget_amount ? parseFloat(d.budget_amount) : null,
    'Kullanım (%)': d.budget_amount ? d.utilization_pct : null,
  }));

  const selectedLocationName = locations.find((l) => l.id === selectedLocationId)?.name;
  const scopeLabel = selectedLocationName ?? 'Şirket Geneli';

  return (
    <DashboardLayout>
      {/* Header */}
      <Box mb={3} mt={1} display="flex" alignItems="flex-end" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.25 }}>Bütçe Yönetimi</Typography>
          <Typography variant="body2" color="text.secondary">{currentDate}</Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() =>
              setDialogItem({
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                month_label: `${now.toLocaleString('tr-TR', { month: 'long' })} ${now.getFullYear()}`,
                budget_amount: currentBudget?.budget_amount ?? null,
                budget_used: currentBudget?.budget_used ?? '0',
                utilization_pct: utilizationPct,
              })
            }
          >
            Bu Ay Bütçe Belirle
          </Button>
        )}
      </Box>

      {/* Location selector */}
      {locations.length > 0 && (
        <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
          <Chip
            label="Şirket Geneli"
            onClick={() => setSelectedLocationId(undefined)}
            color={selectedLocationId === undefined ? 'primary' : 'default'}
            variant={selectedLocationId === undefined ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
          />
          {locations.map((loc) => (
            <Chip
              key={loc.id}
              label={loc.name}
              onClick={() => setSelectedLocationId(loc.id)}
              color={selectedLocationId === loc.id ? 'primary' : 'default'}
              variant={selectedLocationId === loc.id ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Box>
      )}

      {/* Scope label */}
      <Box mb={2} display="flex" alignItems="center" gap={1}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
          {scopeLabel}
        </Typography>
        {selectedLocationId !== undefined && (
          <Chip label="Lokasyon Bütçesi" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
        )}
      </Box>

      {/* Error states */}
      {(budgetError || historyError) && (
        <Alert severity="error" sx={{ mb: 2 }}>Veriler yüklenirken bir hata oluştu.</Alert>
      )}

      {/* Summary cards */}
      {budgetLoading ? (
        <Grid container spacing={2} mb={3}>
          {[0, 1, 2, 3].map((i) => <Grid size={{ xs: 6, md: 3 }} key={i}><Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} /></Grid>)}
        </Grid>
      ) : (
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryCard
              icon={<SavingsIcon sx={{ color: '#2563eb', fontSize: 20 }} />}
              label="Aylık Bütçe"
              value={limit !== null ? `₺${formatPrice(limit)}` : 'Belirsiz'}
              sub={`${now.toLocaleString('tr-TR', { month: 'long' })} ${now.getFullYear()}`}
              color="#2563eb"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryCard
              icon={<TrendingUpIcon sx={{ color: '#d97706', fontSize: 20 }} />}
              label="Harcanan"
              value={`₺${formatPrice(used)}`}
              sub="Onaylanan talepler"
              color="#d97706"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryCard
              icon={<AccountBalanceWalletIcon sx={{ color: remaining !== null && remaining < 0 ? '#dc2626' : '#16a34a', fontSize: 20 }} />}
              label="Kalan"
              value={remaining !== null ? `₺${formatPrice(Math.abs(remaining))}` : '—'}
              sub={remaining !== null && remaining < 0 ? 'Bütçe aşıldı' : 'Kullanılabilir'}
              color={remaining !== null && remaining < 0 ? '#dc2626' : '#16a34a'}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <SummaryCard
              icon={<TrendingDownIcon sx={{ color: utilizationColor, fontSize: 20 }} />}
              label="Kullanım Oranı"
              value={limit !== null ? `%${utilizationPct.toFixed(1)}` : '—'}
              sub={utilizationPct >= 100 ? 'Bütçe doldu' : utilizationPct >= 80 ? 'Uyarı seviyesi' : 'Normal'}
              color={utilizationColor}
            />
          </Grid>

          {limit !== null && (
            <Grid size={12}>
              <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    Bu Ay Bütçe Kullanımı — {scopeLabel}
                  </Typography>
                  <Typography variant="caption" fontWeight={700} color={utilizationColor}>
                    ₺{formatPrice(used)} / ₺{formatPrice(limit)} · %{utilizationPct.toFixed(1)}
                  </Typography>
                </Box>
                <Tooltip title={`%${utilizationPct.toFixed(1)} kullanıldı`}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(utilizationPct, 100)}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      '& .MuiLinearProgress-bar': { bgcolor: utilizationColor },
                    }}
                  />
                </Tooltip>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Budget vs Spend chart */}
      {historyLoading ? (
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3, mb: 2.5 }} />
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5, mb: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            Bütçe vs Harcama — {scopeLabel} (Son 12 Ay)
          </Typography>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="left"
                tickFormatter={(v) => `₺${formatPrice(v)}`}
                tick={{ fontSize: 11 }}
                width={90}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => `%${v}`}
                tick={{ fontSize: 11 }}
                width={50}
                domain={[0, 120]}
              />
              <RechartsTooltip content={<ChartTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="Harcanan" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Bütçe"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                connectNulls={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="Kullanım (%)"
                stroke="#d97706"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* History table */}
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 6, overflow: 'hidden' }}>
        <Box px={2.5} py={2} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Aylık Bütçe Geçmişi — {scopeLabel}
          </Typography>
        </Box>
        {historyLoading ? (
          <Box p={2.5}><Skeleton variant="rounded" height={200} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Dönem</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Bütçe</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Harcanan</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>Kalan</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem', minWidth: 140 }}>Kullanım</TableCell>
                  {isAdmin && <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>İşlem</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...(history?.data ?? [])].reverse().map((item) => {
                  const usedAmt = parseFloat(item.budget_used);
                  const budgetAmt = item.budget_amount ? parseFloat(item.budget_amount) : null;
                  const rem = budgetAmt !== null ? budgetAmt - usedAmt : null;
                  const pct = item.utilization_pct;
                  const barColor = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : '#16a34a';
                  const isCurrentMonth = item.month === now.getMonth() + 1 && item.year === now.getFullYear();

                  return (
                    <TableRow
                      key={`${item.year}-${item.month}`}
                      sx={{ bgcolor: isCurrentMonth ? 'action.selected' : 'transparent' }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight={isCurrentMonth ? 700 : 400}>
                            {item.month_label}
                          </Typography>
                          {isCurrentMonth && (
                            <Chip label="Bu Ay" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {budgetAmt !== null ? (
                          <Typography variant="body2" fontWeight={500}>₺{formatPrice(budgetAmt)}</Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">Belirlenmemiş</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500} color={usedAmt > 0 ? '#2563eb' : 'text.secondary'}>
                          ₺{formatPrice(usedAmt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {rem !== null ? (
                          <Typography variant="body2" fontWeight={500} color={rem < 0 ? '#dc2626' : '#16a34a'}>
                            {rem < 0 ? '-' : ''}₺{formatPrice(Math.abs(rem))}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {budgetAmt !== null ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box flex={1}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(pct, 100)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  '& .MuiLinearProgress-bar': { bgcolor: barColor },
                                }}
                              />
                            </Box>
                            <UtilizationChip pct={pct} />
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="center">
                          <Tooltip title="Bütçe düzenle">
                            <IconButton size="small" onClick={() => setDialogItem(item)}>
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <BudgetDialog
        open={Boolean(dialogItem)}
        item={dialogItem}
        locationId={selectedLocationId}
        onClose={() => setDialogItem(null)}
      />
    </DashboardLayout>
  );
}
