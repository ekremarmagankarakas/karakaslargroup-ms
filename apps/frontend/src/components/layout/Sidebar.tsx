import AnalyticsIcon from '@mui/icons-material/Analytics';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ConstructionIcon from '@mui/icons-material/Construction';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const SIDEBAR_FULL = 240;
export const SIDEBAR_MINI = 56;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  roles?: string[];
}

interface NavSection {
  title: string;
  icon: React.ReactElement;
  items: NavItem[];
  prefix: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin:      'Yönetici',
  manager:    'Müdür',
  accountant: 'Muhasebe',
  employee:   'Çalışan',
};

const ROLE_COLORS: Record<string, string> = {
  admin:      'rgba(220,38,38,0.1)',
  manager:    'rgba(217,119,6,0.1)',
  accountant: 'rgba(8,145,178,0.1)',
  employee:   'rgba(100,116,139,0.1)',
};

const ROLE_TEXT: Record<string, string> = {
  admin:      '#dc2626',
  manager:    '#d97706',
  accountant: '#0891b2',
  employee:   '#64748b',
};

interface Props {
  open: boolean;
  mini: boolean;
  onToggleMini: () => void;
  onClose: () => void;
  isMobile: boolean;
}

export function Sidebar({ open, mini, onToggleMini, onClose, isMobile }: Props) {
  const { user } = useAuth();
  const location = useLocation();
  const collapsed = mini && !isMobile;

  const procurementItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
    { label: 'Analitik', path: '/analytics', icon: <AnalyticsIcon sx={{ fontSize: 18 }} /> },
    ...(user?.role === 'manager' || user?.role === 'admin' || user?.role === 'accountant'
      ? [{ label: 'Bütçe', path: '/budget', icon: <AttachMoneyIcon sx={{ fontSize: 18 }} /> }]
      : []),
    ...(user?.role === 'admin'
      ? [
          { label: 'Kullanıcılar', path: '/users', icon: <PeopleIcon sx={{ fontSize: 18 }} /> },
          { label: 'Lokasyonlar', path: '/locations', icon: <LocationOnIcon sx={{ fontSize: 18 }} /> },
        ]
      : []),
  ];

  const constructionItems: NavItem[] = [
    { label: 'Projeler', path: '/construction', icon: <ApartmentIcon sx={{ fontSize: 18 }} /> },
    { label: 'Analitik', path: '/construction/analytics', icon: <AnalyticsIcon sx={{ fontSize: 18 }} /> },
  ];

  const sections: NavSection[] = [
    {
      title: 'Tedarik',
      prefix: '/dashboard|/analytics|/budget|/users|/locations',
      icon: <AssignmentIcon sx={{ fontSize: 16 }} />,
      items: procurementItems,
    },
    {
      title: 'İnşaat',
      prefix: '/construction',
      icon: <ConstructionIcon sx={{ fontSize: 16 }} />,
      items: constructionItems,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/construction') return location.pathname === '/construction';
    return location.pathname.startsWith(path);
  };

  const width = collapsed ? SIDEBAR_MINI : SIDEBAR_FULL;
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? '??';

  const content = (
    <Box
      sx={{
        width,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
      }}
    >
      {/* Logo area */}
      <Box
        sx={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          px: collapsed ? 1.5 : 2,
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '7px',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.6rem', letterSpacing: '-0.01em' }}>
            KG
          </Typography>
        </Box>
        {!collapsed && (
          <Typography
            variant="subtitle2"
            fontWeight={700}
            color="primary.main"
            sx={{ letterSpacing: '-0.02em', flexGrow: 1, whiteSpace: 'nowrap' }}
          >
            KarakaslarGroup
          </Typography>
        )}
        {!isMobile && (
          <IconButton
            size="small"
            onClick={onToggleMini}
            sx={{ color: 'text.secondary', ml: collapsed ? 'auto' : 0 }}
          >
            {collapsed
              ? <ChevronRightIcon sx={{ fontSize: 16 }} />
              : <ChevronLeftIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        )}
      </Box>

      {/* Nav sections */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1.5 }}>
        {sections.map((section) => (
          <Box key={section.title} sx={{ mb: 1.5 }}>
            {!collapsed && (
              <Box
                display="flex"
                alignItems="center"
                gap={0.75}
                sx={{ px: 2, mb: 0.5 }}
              >
                <Box sx={{ color: 'text.disabled' }}>{section.icon}</Box>
                <Typography
                  variant="overline"
                  sx={{ color: 'text.disabled', lineHeight: 1.5 }}
                >
                  {section.title}
                </Typography>
              </Box>
            )}
            {section.items.map((item) => {
              const active = isActive(item.path);
              const navItem = (
                <Box
                  key={item.path}
                  component={Link}
                  to={item.path}
                  onClick={isMobile ? onClose : undefined}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: collapsed ? 0 : 1.5,
                    py: 0.75,
                    mx: 1,
                    borderRadius: 1.5,
                    textDecoration: 'none',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    bgcolor: active ? 'primary.main' : 'transparent',
                    color: active ? 'primary.contrastText' : 'text.secondary',
                    transition: 'background 0.12s, color 0.12s',
                    '&:hover': {
                      bgcolor: active ? 'primary.dark' : 'action.hover',
                      color: active ? 'primary.contrastText' : 'text.primary',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', flexShrink: 0, opacity: active ? 1 : 0.7 }}>
                    {item.icon}
                  </Box>
                  {!collapsed && (
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: active ? 600 : 400,
                        lineHeight: 1.4,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.label}
                    </Typography>
                  )}
                </Box>
              );

              return collapsed ? (
                <Tooltip title={item.label} placement="right" key={item.path}>
                  {navItem}
                </Tooltip>
              ) : navItem;
            })}
          </Box>
        ))}
      </Box>

      <Divider />

      {/* User footer */}
      <Box
        sx={{
          px: collapsed ? 1 : 1.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: 'primary.main',
            fontSize: '0.7rem',
            flexShrink: 0,
          }}
        >
          {initials}
        </Avatar>
        {!collapsed && (
          <Box minWidth={0}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.username}
            </Typography>
            {user?.role && (
              <Box
                sx={{
                  display: 'inline-block',
                  mt: 0.25,
                  px: 0.75,
                  py: 0.125,
                  borderRadius: 1,
                  bgcolor: ROLE_COLORS[user.role] ?? 'action.hover',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: ROLE_TEXT[user.role] ?? 'text.secondary', fontWeight: 600, lineHeight: 1.4 }}
                >
                  {ROLE_LABELS[user.role] ?? user.role}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: SIDEBAR_FULL, border: 'none' } }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        flexShrink: 0,
        width,
        transition: 'width 0.2s ease',
      }}
    >
      {content}
    </Box>
  );
}
