import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';

import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Kiểm tra xem có thông báo từ register không
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Tự động điền email nếu có
      if (location.state.email) {
        setFormData(prev => ({ ...prev, email: location.state.email }));
      }
    }
  }, [location.state]);

  // Redirect based on user role after login
  useEffect(() => {
    if (user) {
      if (user.role === 'Admin') {
        navigate('/admin/users', { replace: true });
      } else if (user.role === 'Host') {
        navigate('/host-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Email không hợp lệ');
      return false;
    }
    if (!formData.password || formData.password.length < 1) {
      setError('Mật khẩu không được để trống');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // Redirect will be handled by useEffect when user state is updated
        // No need to navigate here
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default'
    }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
              Đăng Nhập
            </Typography>
            
            {successMessage && (
              <Alert severity="success">
                {successMessage}
              </Alert>
            )}

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <TextField
                  fullWidth
                  label="Mật khẩu"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <Button 
                  type="submit" 
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {loading ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={20} sx={{ color: '#ffffff' }} />
                      <Typography>Đang đăng nhập...</Typography>
                    </Stack>
                  ) : (
                    'Đăng Nhập'
                  )}
                </Button>
              </Stack>
            </Box>

            <Typography textAlign="center">
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
