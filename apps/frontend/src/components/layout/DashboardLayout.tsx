import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import { ChatWidget } from '../procurement/chat/ChatWidget';
import { AppHeader } from './AppHeader';
import { Sidebar } from './Sidebar';

export function DashboardLayout({
  children,
  hideChatWidget,
}: {
  children: React.ReactNode;
  hideChatWidget?: boolean;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mini, setMini] = useState(() => {
    const saved = localStorage.getItem('sidebar_mini');
    return saved === 'true';
  });

  const handleToggleMini = () => {
    setMini((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_mini', String(next));
      return next;
    });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Sidebar
        open={mobileOpen}
        mini={mini}
        onToggleMini={handleToggleMini}
        onClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />

      {/* Main area */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppHeader onMenuClick={() => (isMobile ? setMobileOpen(true) : handleToggleMini())} />
        <Toolbar sx={{ minHeight: '56px !important' }} />
        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, sm: 3 },
            pt: { xs: 2, sm: 2.5 },
            pb: 4,
            maxWidth: 1400,
            width: '100%',
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>

      {!hideChatWidget && <ChatWidget />}
    </Box>
  );
}
