import { Box, Button, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  /** MUI icon component to display */
  Icon?: SvgIconComponent;
  title: string;
  description?: string;
  /** Optional CTA button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ Icon = InboxIcon, title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        gap: 1,
        color: 'text.secondary',
      }}
    >
      <Icon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
      <Typography variant="subtitle1" fontWeight={600} color="text.primary" textAlign="center">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={320}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" size="small" onClick={action.onClick} sx={{ mt: 1.5 }}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
