import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
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
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useBudgetHistory, useBudgetStatus, useSetBudget } from '../../hooks/procurement/useBudget';
import { useLocations } from '../../hooks/useLocations';
import type { BudgetHistoryItem } from '../../types';
import { formatPrice } from '../../utils/formatters';

// ── Sub-components ────────────────────────────────────────────────────────────

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
      <PageHeader
        title="Bütçe Yönetimi"
        actions={isAdmin ? (
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
        ) : undefined}
      />

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
      <Box mb={2}>
        <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'text.disabled' }}>
          {scopeLabel}
        </Typography>
      </Box>

      {/* Error states */}
      {(budgetError || historyError) && (
        <Alert severity="error" sx={{ mb: 2 }}>Veriler yüklenirken bir hata oluştu.</Alert>
      )}

      {/* Summary strip */}
      {budgetLoading ? (
        <Skeleton variant="rounded" height={72} sx={{ mb: limit !== null ? 1.5 : 3 }} />
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              overflow: 'hidden',
              mb: limit !== null ? 1.5 : 3,
            }}
          >
            {([
              { label: 'Aylık Bütçe', value: limit !== null ? `₺${formatPrice(limit)}` : 'Belirsiz', color: undefined },
              { label: 'Harcanan', value: `₺${formatPrice(used)}`, color: '#d97706' },
              { label: 'Kalan', value: remaining !== null ? `${remaining < 0 ? '-' : ''}₺${formatPrice(Math.abs(remaining))}` : '—', color: remaining !== null ? (remaining < 0 ? '#dc2626' : '#16a34a') : undefined },
              { label: 'Kullanım', value: limit !== null ? `%${utilizationPct.toFixed(1)}` : '—', color: utilizationColor },
            ] as { label: string; value: string; color?: string }[]).map(({ label, value, color }, i, arr) => (
              <Box
                key={label}
                sx={{
                  flex: 1,
                  px: { xs: 1.5, sm: 2.5 },
                  py: 1.75,
                  borderRight: i < arr.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'text.disabled', mb: 0.5 }}>
                  {label}
                </Typography>
                <Typography sx={{ fontFamily: '"Fraunces", serif', fontSize: { xs: '1.25rem', sm: '1.5rem' }, fontWeight: 700, lineHeight: 1, color: color ?? 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
          {limit !== null && (
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 2, mb: 3 }}>
              <Box display="flex" justifyContent="space-between" mb={0.75}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Bu Ay — {scopeLabel}
                </Typography>
                <Typography variant="caption" fontWeight={700} color={utilizationColor}>
                  ₺{formatPrice(used)} / ₺{formatPrice(limit)} · %{utilizationPct.toFixed(1)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(utilizationPct, 100)}
                sx={{ height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: utilizationColor } }}
              />
            </Box>
          )}
        </>
      )}

      {/* Budget vs Spend chart */}
      {historyLoading ? (
        <Skeleton variant="rounded" height={300} sx={{ mb: 2.5 }} />
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 2.5, mb: 2.5 }}>
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
              <Bar yAxisId="left" dataKey="Harcanan" fill="#4338ca" radius={[4, 4, 0, 0]} maxBarSize={32} />
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
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 6, overflow: 'hidden' }}>
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
                        <Typography variant="body2" fontWeight={500} color={usedAmt > 0 ? 'primary.main' : 'text.secondary'}>
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
