import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Stack,
  useTheme,
  Divider
} from '@mui/material';
import {
  Queue as QueueIcon,
  Event as EventIcon,
  Cancel as CancelIcon,
  ShoppingCart as ShoppingCartIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { waitlistAPI } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';

const WaitlistPage = () => {
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWaitlists();
  }, [user, navigate]);

  const fetchWaitlists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await waitlistAPI.getMyWaitlists();
      console.log('Waitlist API response:', response);
      
      // Handle different response formats
      let waitlistsData = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          waitlistsData = response.data;
        } else if (response.data?.waitlists && Array.isArray(response.data.waitlists)) {
          waitlistsData = response.data.waitlists;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          waitlistsData = response.data.data;
        }
      } else if (Array.isArray(response)) {
        waitlistsData = response;
      }
      
      setWaitlists(waitlistsData);
    } catch (err) {
      console.error('Error fetching waitlists:', err);
      
      // If 404, it might mean no waitlists yet (not necessarily an error)
      if (err?.response?.status === 404) {
        setWaitlists([]);
        setError(null); // Don't show error for empty list
        return;
      }
      
      // Handle 500 or other server errors
      if (err?.response?.status === 500) {
        setError('Lỗi server. Vui lòng kiểm tra xem Waitlist table đã được tạo trong database chưa.');
      } else {
        const errorMessage = err?.response?.data?.message || err?.apiErrorMessage || err?.message || 'Có lỗi xảy ra khi tải danh sách chờ';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (waitlistId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký danh sách chờ này?')) {
      return;
    }

    try {
      await waitlistAPI.cancel(waitlistId);
      fetchWaitlists();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi hủy đăng ký');
    }
  };

  const handleBuyNow = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Notified':
        return 'success';
      case 'Fulfilled':
        return 'info';
      case 'Cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Pending':
        return 'Đang chờ';
      case 'Notified':
        return 'Đã được thông báo';
      case 'Fulfilled':
        return 'Đã nhận vé';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <Box
          sx={{
            minHeight: '60vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)'
              : 'linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%)'
          }}
        >
          <Stack spacing={3} alignItems="center">
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body1" color="text.secondary">
              Đang tải danh sách chờ...
            </Typography>
          </Stack>
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={fetchWaitlists}>
            Thử lại
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <QueueIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              Danh sách chờ của tôi
            </Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary">
            Quản lý các sự kiện bạn đã đăng ký danh sách chờ
          </Typography>
        </Box>

        {waitlists.length === 0 ? (
          <Card
            sx={{
              p: 4,
              textAlign: 'center',
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)'
            }}
          >
            <QueueIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Bạn chưa có danh sách chờ nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Đăng ký danh sách chờ để nhận thông báo khi vé có sẵn
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              startIcon={<EventIcon />}
            >
              Xem sự kiện
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {waitlists.map((waitlist) => (
              <Grid item xs={12} md={6} key={waitlist.waitlistId}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">
                          {waitlist.eventName || 'Sự kiện'}
                        </Typography>
                        {waitlist.ticketTypeName && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Loại vé: {waitlist.ticketTypeName}
                          </Typography>
                        )}
                        {waitlist.availableQuantity !== null && waitlist.availableQuantity !== undefined && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 1,
                              color: waitlist.availableQuantity > 0 ? 'success.main' : 'text.secondary',
                              fontWeight: waitlist.availableQuantity > 0 ? 'bold' : 'normal'
                            }}
                          >
                            {waitlist.availableQuantity > 0 
                              ? `✓ Còn ${waitlist.availableQuantity} vé` 
                              : 'Hết vé'}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={getStatusLabel(waitlist.status)}
                        color={getStatusColor(waitlist.status)}
                        size="small"
                      />
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={1.5}>
                      {waitlist.positionInQueue && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <QueueIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            <strong>Vị trí trong hàng:</strong> #{waitlist.positionInQueue}
                          </Typography>
                        </Stack>
                      )}
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <QueueIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Priority:</strong> #{waitlist.priority}
                        </Typography>
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={1}>
                        <ShoppingCartIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Số lượng:</strong> {waitlist.quantity}
                        </Typography>
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Đăng ký:</strong> {formatDate(waitlist.createdAt)}
                        </Typography>
                      </Stack>

                      {waitlist.notifiedAt && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CalendarIcon fontSize="small" color="success" />
                          <Typography variant="body2" color="success.main">
                            <strong>Đã thông báo:</strong> {formatDate(waitlist.notifiedAt)}
                          </Typography>
                        </Stack>
                      )}

                      {waitlist.fulfilledAt && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CalendarIcon fontSize="small" color="info" />
                          <Typography variant="body2" color="info.main">
                            <strong>Đã nhận vé:</strong> {formatDate(waitlist.fulfilledAt)}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                      <Button
                        size="small"
                        onClick={() => navigate(`/event/${waitlist.eventId}`)}
                        startIcon={<EventIcon />}
                      >
                        Xem sự kiện
                      </Button>
                      
                      {waitlist.status === 'Notified' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleBuyNow(waitlist.eventId)}
                          startIcon={<ShoppingCartIcon />}
                          sx={{ ml: 'auto' }}
                        >
                          Mua ngay
                        </Button>
                      )}
                      
                      {(waitlist.status === 'Pending' || waitlist.status === 'Notified') && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleCancel(waitlist.waitlistId)}
                          startIcon={<CancelIcon />}
                          sx={{ ml: 'auto' }}
                        >
                          Hủy
                        </Button>
                      )}
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
};

export default WaitlistPage;

