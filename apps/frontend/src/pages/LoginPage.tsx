import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Kullanıcı adı veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ minHeight: '100vh' }}>
      {/* Left branding panel */}
      <Grid
        size={{ xs: 0, md: 6 }}
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #0891b2 100%)',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)',
            top: -100,
            left: -100,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
            bottom: -60,
            right: -60,
          }}
        />

        <Box sx={{ position: 'relative', textAlign: 'center', color: 'white' }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '18px',
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.04em' }}>KG</Typography>
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.03em', mb: 1 }}>
            KarakaslarGroup
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.75, fontWeight: 400, mb: 4 }}>
            Kurumsal Yönetim Sistemi
          </Typography>
          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
              p: 3,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)',
              maxWidth: 320,
              mx: 'auto',
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.85, lineHeight: 1.7 }}>
              Satın alma taleplerini yönetin, onaylayın ve takip edin. Tüm süreçlerinizi tek bir yerden kontrol altında tutun.
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* Right form panel */}
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 6 },
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>KG</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              KarakaslarGroup
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'primary.main',
                mb: 2,
              }}
            >
              <LockOutlinedIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Hoş Geldiniz
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Devam etmek için giriş yapın.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Kullanıcı Adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              autoFocus
              autoComplete="username"
            />
            <TextField
              label="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
            />

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 1, py: 1.5 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Giriş Yap'}
            </Button>

            <Box textAlign="center" mt={1}>
              <Link
                to="/forgot-password"
                style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}
              >
                Şifremi Unuttum
              </Link>
            </Box>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}
