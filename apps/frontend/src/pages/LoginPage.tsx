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
          bgcolor: '#0f172a',
          p: 6,
        }}
      >
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <Typography
            sx={{
              fontFamily: '"Fraunces", serif',
              fontWeight: 700,
              fontSize: '2.5rem',
              letterSpacing: '-0.04em',
              mb: 1,
              lineHeight: 1,
            }}
          >
            KG
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em', mb: 1 }}>
            KarakaslarGroup
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.5, fontWeight: 400 }}>
            Kurumsal Yönetim Sistemi
          </Typography>
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
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 4 }}>
            <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 700, fontSize: '1.25rem', color: 'primary.main', lineHeight: 1 }}>KG</Typography>
            <Typography variant="body1" fontWeight={700} color="text.primary">KarakaslarGroup</Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
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
                style={{ color: '#4338ca', textDecoration: 'none', fontSize: '0.875rem' }}
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
