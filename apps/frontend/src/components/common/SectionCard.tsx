import { Box, Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  /** Extra sx passed to the Card root */
  sx?: object;
  /** Padding override for CardContent — defaults to 20px */
  padding?: number | string;
  noPadding?: boolean;
}

/**
 * Consistent section wrapper used for charts, tables, and grouped content.
 * Replaces raw <Paper> and ad-hoc bordered <Box> wrappers.
 */
export function SectionCard({
  title,
  subtitle,
  action,
  children,
  sx,
  padding,
  noPadding,
}: SectionCardProps) {
  const contentPadding = noPadding ? '0 !important' : padding ? `${padding}px !important` : '20px !important';

  return (
    <Card variant="outlined" sx={{ height: '100%', ...sx }}>
      <CardContent sx={{ p: contentPadding }}>
        {(title || action) && (
          <Box
            display="flex"
            alignItems={subtitle ? 'flex-start' : 'center'}
            justifyContent="space-between"
            mb={title ? 2 : 0}
          >
            {title && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
            )}
            {action && (
              <Box sx={{ flexShrink: 0, ml: 1 }}>{action}</Box>
            )}
          </Box>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
