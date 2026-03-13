import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import {
  AppBar,
  Badge,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { useMarkAllRead, useNotifications } from '../../hooks/useNotifications';
import { formatDate } from '../../utils/formatters';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':            'Ana Sayfa',
  '/analytics':            'Analitik',
  '/budget':               'Bütçe Yönetimi',
  '/users':                'Kullanıcılar',
  '/locations':            'Lokasyonlar',
  '/construction':         'İnşaat Projeleri',
  '/construction/analytics': 'İnşaat Analitik',
};

interface Props {
  onMenuClick: () => void;
}

export function AppHeader({ onMenuClick }: Props) {
  const { logout } = useAuth();
  const location = useLocation();
  const { mode, toggleMode } = useThemeMode();
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const { data: notifications } = useNotifications();
  const markAllRead = useMarkAllRead();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
    key === location.pathname || (key !== '/' && location.pathname.startsWith(key + '/'))
  )?.[1] ?? '';

  const handleOpenNotifs = (e: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(e.currentTarget);
    if (unreadCount > 0) markAllRead.mutate();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: '56px !important', px: { xs: 1.5, sm: 2 } }}>
        {/* Hamburger */}
        <IconButton
          size="small"
          onClick={onMenuClick}
          sx={{ color: 'text.secondary', mr: 0.5 }}
          aria-label="Menüyü aç"
        >
          <MenuIcon sx={{ fontSize: 20 }} />
        </IconButton>

        {/* Page title — mobile only */}
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ display: { xs: 'block', md: 'none' }, flexGrow: 1 }}
        >
          {pageTitle}
        </Typography>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

        {/* Right controls */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <Tooltip title={mode === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}>
            <IconButton size="small" onClick={toggleMode} sx={{ color: 'text.secondary' }}>
              {mode === 'dark'
                ? <LightModeIcon sx={{ fontSize: 18 }} />
                : <DarkModeIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Bildirimler">
            <IconButton size="small" onClick={handleOpenNotifs} sx={{ color: 'text.secondary' }}>
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon sx={{ fontSize: 18 }} />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            PaperProps={{ sx: { width: 320, maxHeight: 400, overflow: 'auto' } }}
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
                    borderLeft: n.read ? 'none' : '2px solid',
                    borderColor: n.read ? 'transparent' : 'primary.main',
                    bgcolor: n.read ? 'transparent' : 'action.selected',
                  }}
                >
                  <Box>
                    <Typography variant="body2">{n.message}</Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatDate(n.created_at)}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>

          <Tooltip title="Çıkış Yap">
            <IconButton onClick={logout} size="small" sx={{ color: 'text.secondary' }}>
              <LogoutIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
