import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, Button, IconButton, Toolbar, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onToggleSidebar: () => void;
}

export function AppHeader({ onToggleSidebar }: Props) {
  const { user, logout } = useAuth();

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton color="inherit" edge="start" onClick={onToggleSidebar} sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          KarakaslarGroup Yönetim
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2">{user?.username}</Typography>
          <Button color="inherit" onClick={logout}>
            Çıkış
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
