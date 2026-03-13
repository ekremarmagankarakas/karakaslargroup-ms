import { Box, Card, CardContent, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface StatCardProps {
  label: string;
  value: string | number;
  Icon?: SvgIconComponent;
  iconColor?: string;
  trend?: { value: number; direction: 'up' | 'down' };
  /** If provided, renders a left border accent in this color */
  accentColor?: string;
  sublabel?: string;
}

export function StatCard({
  label,
  value,
  Icon,
  iconColor,
  trend,
  accentColor,
  sublabel,
}: StatCardProps) {
  const trendColor = trend
    ? trend.direction === 'up'
      ? '#16a34a'
      : '#dc2626'
    : undefined;

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.10)' },
      }}
    >
      <CardContent sx={{ p: '16px !important' }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box flex={1} minWidth={0}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', display: 'block', mb: 0.5, lineHeight: 1.4 }}
            >
              {label}
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, mb: 0.25 }}
            >
              {value}
            </Typography>
            {sublabel && (
              <Typography variant="caption" color="text.secondary">
                {sublabel}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" gap={0.25} mt={0.5}>
                {trend.direction === 'up' ? (
                  <ArrowUpwardIcon sx={{ fontSize: 12, color: trendColor }} />
                ) : (
                  <ArrowDownwardIcon sx={{ fontSize: 12, color: trendColor }} />
                )}
                <Typography variant="caption" sx={{ color: trendColor, fontWeight: 600 }}>
                  {Math.abs(trend.value)}%
                </Typography>
              </Box>
            )}
          </Box>
          {Icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: iconColor ? `${iconColor}14` : 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                ml: 1,
              }}
            >
              <Icon sx={{ fontSize: 20, color: iconColor ?? 'text.secondary' }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
