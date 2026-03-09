import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { AppBar, Avatar, Badge, Box, Chip, Divider, IconButton, Menu, MenuItem, Toolbar, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { useMarkAllRead, useNotifications } from '../../hooks/useNotifications';
import { formatDate } from '../../utils/formatters';

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
  const location = useLocation();
  const { mode, toggleMode } = useThemeMode();
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??';
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const { data: notifications } = useNotifications();
  const markAllRead = useMarkAllRead();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Analitik', path: '/analytics' },
    ...(user?.role === 'manager' || user?.role === 'admin' || user?.role === 'accountant'
      ? [{ label: 'Bütçe', path: '/budget' }]
      : []),
    ...(user?.role === 'admin' ? [{ label: 'Kullanıcılar', path: '/users' }] : []),
    ...(user?.role === 'admin' ? [{ label: 'Lokasyonlar', path: '/locations' }] : []),
  ];

  const handleOpenNotifs = (e: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(e.currentTarget);
    if (unreadCount > 0) {
      markAllRead.mutate();
    }
  };

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

          <Box display="flex" alignItems="center" gap={0.5} ml={2}>
            {navLinks.map(({ label, path }) => {
              const active = location.pathname === path;
              return (
                <Box
                  key={path}
                  component={Link}
                  to={path}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    textDecoration: 'none',
                    bgcolor: active ? 'primary.main' : 'transparent',
                    color: active ? 'white' : 'text.secondary',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    transition: 'background 0.15s',
                    '&:hover': {
                      bgcolor: active ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  {label}
                </Box>
              );
            })}
          </Box>
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

          {/* Dark Mode Toggle */}
          <Tooltip title={mode === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}>
            <IconButton size="small" onClick={toggleMode} sx={{ color: 'text.secondary' }}>
              {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Notification Bell */}
          <Tooltip title="Bildirimler">
            <IconButton size="small" onClick={handleOpenNotifs} sx={{ color: 'text.secondary' }}>
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            PaperProps={{ sx: { width: 340, maxHeight: 420, overflow: 'auto' } }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box px={2} py={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>Bildirimler</Typography>
            </Box>
            <Divider />
            {!notifications || notifications.length === 0 ? (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">Bildirim yok</Typography>
              </MenuItem>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <MenuItem
                  key={n.id}
                  sx={{
                    whiteSpace: 'normal',
                    alignItems: 'flex-start',
                    bgcolor: n.read ? 'transparent' : 'action.selected',
                    borderLeft: n.read ? 'none' : '3px solid',
                    borderColor: n.read ? 'transparent' : 'primary.main',
                  }}
                >
                  <Box>
                    <Typography variant="body2">{n.message}</Typography>
                    <Typography variant="caption" color="text.disabled">{formatDate(n.created_at)}</Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>

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
