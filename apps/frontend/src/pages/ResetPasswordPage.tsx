import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/endpoints/auth';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch {
      setError('Geçersiz veya süresi dolmuş bağlantı.');
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
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          p: 4,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={0.5}>
          Yeni Şifre Belirle
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Hesabınız için yeni bir şifre girin.
        </Typography>

        {success ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Şifreniz başarıyla güncellendi!
            </Alert>
            <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}>
              Giriş yap
            </Link>
          </>
        ) : (
          <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Yeni Şifre"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Şifre Tekrarı"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !newPassword || !confirmPassword}
              sx={{ py: 1.25 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Şifreyi Güncelle'}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
