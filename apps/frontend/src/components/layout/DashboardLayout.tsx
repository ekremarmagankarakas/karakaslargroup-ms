import { Box, useMediaQuery, useTheme } from '@mui/material';
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
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
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
          overflow: 'hidden',
        }}
      >
        <AppHeader onMenuClick={() => (isMobile ? setMobileOpen(true) : handleToggleMini())} />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: { xs: 2, sm: 3 },
            pt: { xs: 2, sm: 2.5 },
            pb: 4,
          }}
        >
          <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>

      {!hideChatWidget && <ChatWidget />}
    </Box>
  );
}
