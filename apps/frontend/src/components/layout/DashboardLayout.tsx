import { Box, Toolbar } from '@mui/material';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

const DRAWER_WIDTH = 240;

interface Props {
  children: React.ReactNode;
  sidebarHidden: boolean;
  statisticsVisible: boolean;
  inboxVisible: boolean;
  favoritesVisible: boolean;
  onToggleSidebar: () => void;
  onToggleStatistics: () => void;
  onToggleInbox: () => void;
  onToggleFavorites: () => void;
}

export function DashboardLayout({
  children,
  sidebarHidden,
  statisticsVisible,
  inboxVisible,
  favoritesVisible,
  onToggleSidebar,
  onToggleStatistics,
  onToggleInbox,
  onToggleFavorites,
}: Props) {
  return (
    <Box sx={{ display: 'flex' }}>
      <AppHeader onToggleSidebar={onToggleSidebar} />
      <AppSidebar
        hidden={sidebarHidden}
        statisticsVisible={statisticsVisible}
        inboxVisible={inboxVisible}
        favoritesVisible={favoritesVisible}
        onToggleStatistics={onToggleStatistics}
        onToggleInbox={onToggleInbox}
        onToggleFavorites={onToggleFavorites}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: sidebarHidden ? 0 : `${DRAWER_WIDTH}px`,
          transition: 'margin 0.2s',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
