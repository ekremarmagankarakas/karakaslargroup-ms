import { Box, Button, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  Icon?: SvgIconComponent;
  title: string;
  description?: string;
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
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 0.5,
        }}
      >
        <Icon sx={{ fontSize: 28, color: 'text.disabled' }} />
      </Box>
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
