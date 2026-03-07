import BarChartIcon from '@mui/icons-material/BarChart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import InboxIcon from '@mui/icons-material/Inbox';
import { Box, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';

const DRAWER_WIDTH = 240;

interface Props {
  hidden: boolean;
  statisticsVisible: boolean;
  inboxVisible: boolean;
  favoritesVisible: boolean;
  onToggleStatistics: () => void;
  onToggleInbox: () => void;
  onToggleFavorites: () => void;
}

export function AppSidebar({
  hidden,
  statisticsVisible,
  inboxVisible,
  favoritesVisible,
  onToggleStatistics,
  onToggleInbox,
  onToggleFavorites,
}: Props) {
  if (hidden) return null;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListItemButton onClick={onToggleInbox} selected={inboxVisible}>
            <ListItemIcon>
              <InboxIcon />
            </ListItemIcon>
            <ListItemText primary="Talepler" />
          </ListItemButton>
          <ListItemButton onClick={onToggleStatistics} selected={statisticsVisible}>
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText primary="İstatistikler" />
          </ListItemButton>
          <Divider />
          <ListItemButton onClick={onToggleFavorites} selected={favoritesVisible}>
            <ListItemIcon>
              <FavoriteIcon />
            </ListItemIcon>
            <ListItemText primary="Favoriler" />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
}
