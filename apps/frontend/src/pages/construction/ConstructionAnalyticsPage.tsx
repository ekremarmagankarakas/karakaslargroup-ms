import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ConstructionChatWidget } from '../../components/construction/ConstructionChatWidget';
import SCurveChart from '../../components/construction/SCurveChart';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { StatCard } from '../../components/common/StatCard';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useConstructionAnalytics } from '../../hooks/construction/useConstructionAnalytics';
import { useProjects } from '../../hooks/construction/useConstruction';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#64748b'];

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planlama',
  active: 'Aktif',
  on_hold: 'Beklemede',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

const TYPE_LABELS: Record<string, string> = {
  shopping_mall: 'AVM',
  residential: 'Konut',
  office: 'Ofis',
  mixed_use: 'Karma',
  hotel: 'Otel',
  industrial: 'Endüstriyel',
  other: 'Diğer',
};

const MILESTONE_STATUS_LABELS: Record<string, string> = {
  not_started: 'Başlamadı',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  blocked: 'Engellendi',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

function ChartBox({ title, children, height = 260 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <SectionCard title={title} sx={{ height: '100%' }}>
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </SectionCard>
  );
}

export function ConstructionAnalyticsPage() {
  const { data, isLoading, isError } = useConstructionAnalytics();
  const { data: projectsData } = useProjects({ limit: 100 });
  const projects = projectsData?.items ?? [];
  const [sCurveProjectId, setSCurveProjectId] = useState<number | ''>('');

  if (isLoading) {
    return (
      <DashboardLayout hideChatWidget>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <Alert severity="error">Veriler yüklenirken bir hata oluştu.</Alert>
      </DashboardLayout>
    );
  }

  const statusData = (data?.projects_by_status ?? []).map((item) => ({
    name: STATUS_LABELS[item.status] ?? item.status,
    value: item.count,
  }));

  const typeData = (data?.projects_by_type ?? []).map((item) => ({
    name: TYPE_LABELS[item.project_type] ?? item.project_type,
    value: item.count,
  }));

  const budgetData = (data?.budget_by_project ?? []).map((item) => ({
    name: item.name.length > 14 ? item.name.slice(0, 14) + '…' : item.name,
    Bütçe: item.budget,
    Gerçekleşen: item.actual_cost,
  }));

  const materialCostData = (data?.material_cost_by_type ?? []).map((item) => ({
    name: item.material_type,
    value: item.total_cost,
  }));

  const milestoneData = (data?.milestone_status_counts ?? []).map((item) => ({
    name: MILESTONE_STATUS_LABELS[item.status] ?? item.status,
    value: item.count,
  }));

  return (
    <DashboardLayout>
      <PageHeader title="İnşaat Analitikleri" subtitle="Proje ve malzeme istatistikleri" />

      {/* Summary stat cards */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Toplam Bütçe" value={formatCurrency(data?.total_budget ?? 0)} accentColor="#2563eb" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Toplam Gerçekleşen Maliyet" value={formatCurrency(data?.total_actual_cost ?? 0)} accentColor="#d97706" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Ort. İlerleme" value={`%${(data?.avg_progress ?? 0).toFixed(1)}`} accentColor="#16a34a" />
        </Grid>
      </Grid>

      {/* Row 1: Status donut + Type bar */}
      <Grid container spacing={2.5} mb={2.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartBox title="Proje Durumları" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ChartBox>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartBox title="Proje Tipleri" height={260}>
            <BarChart data={typeData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Proje Sayısı" radius={[4, 4, 0, 0]}>
                {typeData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartBox>
        </Grid>
      </Grid>

      {/* Row 2: Budget vs actual per project (full width) */}
      <Box mb={2.5}>
        <ChartBox title="Proje Başına Bütçe" height={300}>
          <BarChart data={budgetData} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Bar dataKey="Bütçe" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Gerçekleşen" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartBox>
      </Box>

      {/* Row 3: Material cost by type + Milestone status */}
      <Grid container spacing={2.5} mb={6}>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartBox title="Malzeme Maliyeti (Tip)" height={260}>
            <PieChart>
              <Pie
                data={materialCostData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {materialCostData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
            </PieChart>
          </ChartBox>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartBox title="Aşama Durumları" height={260}>
            <BarChart data={milestoneData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Aşama Sayısı" radius={[4, 4, 0, 0]}>
                {milestoneData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartBox>
        </Grid>
      </Grid>
      {/* S-Curve section */}
      <Box mb={6}>
        <SectionCard
          title="S-Eğrisi Analizi"
          subtitle="Planlanan vs gerçekleşen ilerleme (aylık)"
          action={
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Proje Seçin</InputLabel>
              <Select
                value={sCurveProjectId}
                label="Proje Seçin"
                onChange={e => setSCurveProjectId(e.target.value as number | '')}
              >
                <MenuItem value=""><em>Seçiniz...</em></MenuItem>
                {projects.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          }
        >
          {sCurveProjectId ? (
            <SCurveChart projectId={sCurveProjectId as number} />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              S-eğrisini görmek için bir proje seçin.
            </Typography>
          )}
        </SectionCard>
      </Box>

      <ConstructionChatWidget />
    </DashboardLayout>
  );
}
