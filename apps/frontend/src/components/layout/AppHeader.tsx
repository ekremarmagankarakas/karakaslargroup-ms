import LogoutIcon from '@mui/icons-material/Logout';
import { AppBar, Avatar, Box, Chip, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Yönetici',
  manager: 'Müdür',
  accountant: 'Muhasebe',
  employee: 'Çalışan',
};

const ROLE_COLORS: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  admin: 'error',
  manager: 'warning',
  accountant: 'info',
  employee: 'default',
};

export function AppHeader() {
  const { user, logout } = useAuth();
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '8px',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.65rem', letterSpacing: '-0.02em' }}>
              KG
            </Typography>
          </Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ letterSpacing: '-0.02em' }}>
            KarakaslarGroup
          </Typography>
          <Typography variant="subtitle1" color="text.disabled" sx={{ fontWeight: 300, ml: -0.5 }}>
            /
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 400 }}>
            Yönetim Paneli
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1.5}>
          {user?.role && (
            <Chip
              label={ROLE_LABELS[user.role] ?? user.role}
              size="small"
              color={ROLE_COLORS[user.role] ?? 'default'}
              variant="outlined"
              sx={{ height: 24 }}
            />
          )}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" fontWeight={500}>
              {user?.username}
            </Typography>
          </Box>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Tooltip title="Çıkış Yap">
            <IconButton onClick={logout} size="small" sx={{ color: 'text.secondary' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
