import { Box, Toolbar } from '@mui/material';
import { ChatWidget } from '../procurement/chat/ChatWidget';
import { AppHeader } from './AppHeader';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader />
      <Box component="main" sx={{ px: 3, pb: 4 }}>
        <Toolbar />
        {children}
      </Box>
      <ChatWidget />
    </Box>
  );
}
