import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: BreadcrumbItem[];
}

/**
 * Consistent page-level header used across all pages.
 * Title on the left (with optional breadcrumb above), actions on the right.
 */
export function PageHeader({ title, subtitle, actions, breadcrumb }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 0 },
        mb: 3,
        mt: 0.5,
      }}
    >
      <Box>
        {breadcrumb && breadcrumb.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNextIcon sx={{ fontSize: 14 }} />}
            sx={{ mb: 0.75 }}
          >
            {breadcrumb.map((item, i) =>
              item.href ? (
                <Link
                  key={i}
                  href={item.href}
                  underline="hover"
                  variant="caption"
                  color="text.secondary"
                >
                  {item.label}
                </Link>
              ) : (
                <Typography key={i} variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h2" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexShrink: 0,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  );
}
