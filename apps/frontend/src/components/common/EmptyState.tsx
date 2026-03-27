import { Box, Button, Typography } from '@mui/material';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        gap: 0.75,
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} color="text.secondary" textAlign="center">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={320}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="outlined" size="small" onClick={action.onClick} sx={{ mt: 1.5 }}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
