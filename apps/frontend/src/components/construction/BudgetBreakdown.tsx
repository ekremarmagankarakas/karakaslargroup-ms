import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
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
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  useCreateBudgetLine,
  useDeleteBudgetLine,
  useBudget,
  useUpdateBudgetLine,
} from '../../hooks/construction/useConstructionBudget';
import type { BudgetCategory, ConstructionBudgetLine, UserRole } from '../../types';

const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  labor: 'İşçilik',
  materials: 'Malzeme',
  equipment: 'Ekipman',
  subcontractors: 'Taşeronlar',
  overhead: 'Genel Giderler',
  contingency: 'Acil Ödenek',
  other: 'Diğer',
};

const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  labor: '#3b82f6',
  materials: '#f59e0b',
  equipment: '#8b5cf6',
  subcontractors: '#06b6d4',
  overhead: '#6b7280',
  contingency: '#ef4444',
  other: '#10b981',
};

const ALL_CATEGORIES: BudgetCategory[] = [
  'labor', 'materials', 'equipment', 'subcontractors', 'overhead', 'contingency', 'other',
];

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function StatCard({ label, value, sub, color }: StatCardProps) {
  return (
    <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: 'divider' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h6" fontWeight={700} sx={{ color: color || 'text.primary' }}>{value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

interface Props {
  projectId: number;
  userRole: UserRole;
}

const EMPTY_FORM = { category: 'labor' as BudgetCategory, description: '', planned_amount: '', actual_amount: '0', notes: '' };

export function BudgetBreakdown({ projectId, userRole }: Props) {
  const { data: summary, isLoading, isError } = useBudget(projectId);
  const createLine = useCreateBudgetLine();
  const updateLine = useUpdateBudgetLine();
  const deleteLine = useDeleteBudgetLine();
  const canEdit = userRole === 'admin' || userRole === 'manager';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConstructionBudgetLine | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (line: ConstructionBudgetLine) => {
    setEditTarget(line);
    setForm({
      category: line.category,
      description: line.description ?? '',
      planned_amount: line.planned_amount,
      actual_amount: line.actual_amount,
      notes: line.notes ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const body = {
      category: form.category,
      description: form.description || undefined,
      planned_amount: form.planned_amount,
      actual_amount: form.actual_amount || '0',
      notes: form.notes || undefined,
    };
    if (editTarget) {
      updateLine.mutate({ projectId, lineId: editTarget.id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createLine.mutate({ projectId, body }, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = (line: ConstructionBudgetLine) => {
    if (confirm(`"${CATEGORY_LABELS[line.category]}" kalemini silmek istediğinizden emin misiniz?`)) {
      deleteLine.mutate({ projectId, lineId: line.id });
    }
  };

  if (isLoading) {
    return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>;
  }

  if (isError) return <Alert severity="error">Veriler yüklenirken bir hata oluştu.</Alert>;

  if (!summary) return null;

  const totalPlanned = parseFloat(summary.total_planned);
  const totalActual = parseFloat(summary.total_actual);
  const variance = parseFloat(summary.variance);
  const util = summary.utilization_pct;

  const utilizationColor = util >= 100 ? '#ef4444' : util >= 80 ? '#f59e0b' : '#22c55e';

  const chartData = summary.lines.map((ln) => ({
    name: CATEGORY_LABELS[ln.category],
    Planlanan: parseFloat(ln.planned_amount),
    Gerçekleşen: parseFloat(ln.actual_amount),
  }));

  return (
    <Box>
      {/* Summary cards */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Toplam Planlanan" value={`₺${totalPlanned.toLocaleString('tr-TR')}`} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Toplam Gerçekleşen" value={`₺${totalActual.toLocaleString('tr-TR')}`} color={utilizationColor} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            label="Fark"
            value={`₺${Math.abs(variance).toLocaleString('tr-TR')}`}
            sub={variance >= 0 ? 'Tasarruf' : 'Aşım'}
            color={variance >= 0 ? '#22c55e' : '#ef4444'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Kullanım" value={`%${util}`} color={utilizationColor} />
        </Grid>
      </Grid>

      {/* Chart */}
      {chartData.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Typography variant="subtitle2" fontWeight={700} mb={2}>Kategoriye Göre Bütçe</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
              <RechartsTooltip formatter={(v: number) => `₺${v.toLocaleString('tr-TR')}`} />
              <Legend />
              <Bar dataKey="Planlanan" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Gerçekleşen" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Line items table */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" fontWeight={700}>Bütçe Kalemleri</Typography>
        {canEdit && (
          <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={openCreate}>
            Kalem Ekle
          </Button>
        )}
      </Box>

      {summary.lines.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Henüz bütçe kalemi eklenmemiş.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Kategori</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell align="right">Planlanan (₺)</TableCell>
                <TableCell align="right">Gerçekleşen (₺)</TableCell>
                <TableCell align="right">Fark (₺)</TableCell>
                <TableCell>Kullanım</TableCell>
                {canEdit && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.lines.map((ln) => {
                const planned = parseFloat(ln.planned_amount);
                const actual = parseFloat(ln.actual_amount);
                const lineVar = planned - actual;
                const linePct = planned > 0 ? Math.min(200, Math.round((actual / planned) * 100)) : 0;
                const lineColor = linePct >= 100 ? '#ef4444' : linePct >= 80 ? '#f59e0b' : '#22c55e';
                return (
                  <TableRow key={ln.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CATEGORY_COLORS[ln.category], flexShrink: 0 }} />
                        <Typography variant="body2" fontWeight={600}>{CATEGORY_LABELS[ln.category]}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{ln.description ?? '—'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{planned.toLocaleString('tr-TR')}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: lineColor }}>{actual.toLocaleString('tr-TR')}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ color: lineVar >= 0 ? '#22c55e' : '#ef4444' }}>
                        {lineVar >= 0 ? '+' : ''}{lineVar.toLocaleString('tr-TR')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 100 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: lineColor }}>{linePct}%</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, linePct)}
                          sx={{ height: 4, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: lineColor } }}
                        />
                      </Box>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Box display="flex">
                          <Tooltip title="Düzenle">
                            <IconButton size="small" onClick={() => openEdit(ln)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => handleDelete(ln)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTarget ? 'Bütçe Kalemi Düzenle' : 'Bütçe Kalemi Ekle'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            select
            label="Kategori"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as BudgetCategory })}
            size="small"
          >
            {ALL_CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Açıklama"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            size="small"
          />
          <TextField
            label="Planlanan Tutar (₺)"
            type="number"
            value={form.planned_amount}
            onChange={(e) => setForm({ ...form, planned_amount: e.target.value })}
            size="small"
            required
          />
          <TextField
            label="Gerçekleşen Tutar (₺)"
            type="number"
            value={form.actual_amount}
            onChange={(e) => setForm({ ...form, actual_amount: e.target.value })}
            size="small"
          />
          <TextField
            label="Notlar"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            size="small"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.planned_amount || createLine.isPending || updateLine.isPending}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
