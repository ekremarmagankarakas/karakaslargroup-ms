import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/endpoints/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f1f5f9',
        p: 2,
      }}
    >
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          p: 4,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={0.5}>
          Şifremi Unuttum
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.
        </Typography>

        {success ? (
          <Alert severity="success">
            E-posta gönderildi! Gelen kutunuzu kontrol edin.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="E-posta"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !email}
              sx={{ py: 1.25 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sıfırlama Bağlantısı Gönder'}
            </Button>
          </Box>
        )}

        <Box mt={2} textAlign="center">
          <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}>
            Giriş sayfasına dön
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
