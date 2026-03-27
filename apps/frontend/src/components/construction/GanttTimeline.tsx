import { Box, Chip, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { ConstructionProject, ConstructionProjectStatus } from '../../types';

const STATUS_COLORS: Record<ConstructionProjectStatus, string> = {
  planning: '#4338ca',
  active: '#16a34a',
  on_hold: '#d97706',
  completed: '#64748b',
  cancelled: '#dc2626',
};

const STATUS_LABELS: Record<ConstructionProjectStatus, string> = {
  planning: 'Planlama',
  active: 'Aktif',
  on_hold: 'Beklemede',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
};

interface Props {
  projects: ConstructionProject[];
}

function getMonths(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= end) {
    months.push(new Date(d));
    d.setMonth(d.getMonth() + 1);
  }
  return months;
}

const MONTH_LABELS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export function GanttTimeline({ projects }: Props) {
  const navigate = useNavigate();
  const today = new Date();

  const projectsWithDates = projects.filter((p) => p.start_date && p.end_date);

  if (projectsWithDates.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={8}>
        <Typography variant="body2" color="text.secondary">
          Tarih bilgisi olan proje bulunamadı.
        </Typography>
      </Box>
    );
  }

  // Compute timeline range
  const allDates = projectsWithDates.flatMap((p) => [new Date(p.start_date!), new Date(p.end_date!)]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  minDate.setDate(1);
  maxDate.setMonth(maxDate.getMonth() + 1);
  maxDate.setDate(0);

  const totalMs = maxDate.getTime() - minDate.getTime();
  const months = getMonths(minDate, maxDate);

  const ROW_HEIGHT = 48;
  const LABEL_WIDTH = 200;
  const CELL_WIDTH = 80;
  const totalWidth = months.length * CELL_WIDTH;

  const pct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - minDate.getTime()) / totalMs) * 100));
  const todayPct = pct(today);

  return (
    <Box sx={{ overflowX: 'auto', overflowY: 'visible' }}>
      <Box sx={{ minWidth: LABEL_WIDTH + totalWidth, position: 'relative' }}>
        {/* Header row: month labels */}
        <Box display="flex" sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 0 }}>
          <Box sx={{ width: LABEL_WIDTH, flexShrink: 0, px: 1, py: 0.75, borderRight: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">Proje</Typography>
          </Box>
          <Box sx={{ display: 'flex', width: totalWidth }}>
            {months.map((m) => (
              <Box
                key={m.toISOString()}
                sx={{
                  width: CELL_WIDTH,
                  flexShrink: 0,
                  px: 0.5,
                  py: 0.75,
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  bgcolor: m.getMonth() === today.getMonth() && m.getFullYear() === today.getFullYear()
                    ? 'action.selected'
                    : 'transparent',
                }}
              >
                <Typography variant="caption" color="text.secondary" noWrap>
                  {MONTH_LABELS[m.getMonth()]} {m.getFullYear()}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Project rows */}
        {projectsWithDates.map((project) => {
          const start = new Date(project.start_date!);
          const end = new Date(project.end_date!);
          const barLeft = pct(start);
          const barRight = pct(end);
          const barWidth = Math.max(barRight - barLeft, 0.5);
          const color = STATUS_COLORS[project.status];
          const progressWidth = barWidth * (project.progress_pct / 100);

          return (
            <Box
              key={project.id}
              display="flex"
              sx={{
                height: ROW_HEIGHT,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {/* Project label */}
              <Box
                sx={{
                  width: LABEL_WIDTH,
                  flexShrink: 0,
                  px: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/construction/${project.id}`)}
              >
                <Typography variant="caption" fontWeight={600} noWrap title={project.name}>
                  {project.name}
                </Typography>
                <Chip
                  label={STATUS_LABELS[project.status]}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.6rem',
                    bgcolor: `${color}20`,
                    color,
                    border: 'none',
                    alignSelf: 'flex-start',
                    mt: 0.25,
                  }}
                />
              </Box>

              {/* Gantt bar area */}
              <Box sx={{ width: totalWidth, position: 'relative', flexShrink: 0 }}>
                {/* Month grid lines */}
                {months.map((m, i) => (
                  <Box
                    key={m.toISOString()}
                    sx={{
                      position: 'absolute',
                      left: i * CELL_WIDTH,
                      top: 0,
                      bottom: 0,
                      width: CELL_WIDTH,
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      bgcolor: m.getMonth() === today.getMonth() && m.getFullYear() === today.getFullYear()
                        ? 'action.selected'
                        : 'transparent',
                    }}
                  />
                ))}

                {/* Project bar */}
                <Box
                  onClick={() => navigate(`/construction/${project.id}`)}
                  sx={{
                    position: 'absolute',
                    left: `${barLeft}%`,
                    width: `${barWidth}%`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: 22,
                    borderRadius: 1,
                    bgcolor: `${color}30`,
                    border: `1px solid ${color}`,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.85 },
                  }}
                >
                  {/* Progress overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${progressWidth / barWidth * 100}%`,
                      bgcolor: color,
                      opacity: 0.5,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      left: 4,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color,
                      fontWeight: 700,
                      fontSize: '0.6rem',
                      whiteSpace: 'nowrap',
                      zIndex: 1,
                    }}
                  >
                    {project.progress_pct}%
                  </Typography>
                </Box>

                {/* Today marker */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${todayPct}%`,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    bgcolor: 'error.main',
                    opacity: 0.6,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
