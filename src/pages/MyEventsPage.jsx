import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  Edit,
  Visibility,
  Delete,
  Event as EventIcon,
  AccessTime,
  LocationOn,
  People
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import { eventsAPI } from '../services/apiClient';
import { subscriptionHelpers } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';
import { decodeText } from '../utils/textDecoder';

const MyEventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventsAPI.getMyEvents();
      console.log('MyEvents data:', response.data);
      console.log('First event:', response.data?.[0]);
      setEvents(response.data || []);
    } catch (err) {
      console.error('Error fetching my events:', err);
      setError('Không thể tải danh sách sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEvent = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const handleEditEvent = async (eventId) => {
    try {
      // Kiểm tra xem có thể edit được không
      const statusResponse = await eventsAPI.getEditStatus(eventId);
      
      if (statusResponse.data.canEdit) {
        // Có thể edit - chuyển đến trang edit
        navigate(`/create-event?edit=${eventId}`);
      } else {
        alert(statusResponse.data.message);
      }
    } catch (err) {
      console.error('Error checking edit status:', err);
      alert('Không thể kiểm tra trạng thái chỉnh sửa');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      setDeletingEventId(eventId);
      await eventsAPI.delete(eventId);
      // Refresh danh sách
      fetchMyEvents();
      alert('Xóa sự kiện thành công');
    } catch (err) {
      console.error('Error deleting event:', err);
      
      // Extract error message from response
      let errorMessage = 'Không thể xóa sự kiện';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setDeletingEventId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'success';
      case 'Draft':
        return 'default';
      case 'Closed':
        return 'error';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Open':
        return 'Đang mở';
      case 'Draft':
        return 'Nháp';
      case 'Closed':
        return 'Đã đóng';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Header />
        <Container sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Sự Kiện Của Tôi
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lý và chỉnh sửa các sự kiện của bạn
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {events.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Bạn chưa có sự kiện nào
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Hãy tạo sự kiện đầu tiên của bạn
            </Typography>
            <Button
              variant="contained"
              onClick={async () => {
                await subscriptionHelpers.checkSubscriptionAndNavigate(navigate, user);
              }}
              sx={{ mt: 2 }}
            >
              Tạo Sự Kiện
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(3, 1fr)'
              },
              gap: 2,
              width: '100%'
            }}
          >
            {events.map((event) => {
              const backgroundImage = event.eventDetails?.backgroundImage || event.backgroundImage;
              const imageUrl = backgroundImage 
                ? (backgroundImage.startsWith('http') 
                    ? backgroundImage 
                    : `http://localhost:5000${backgroundImage.startsWith('/') ? '' : '/'}${backgroundImage}`)
                : '/default-event.svg';

              return (
                <Box
                  key={event.eventId}
                  sx={{
                    display: 'flex',
                    width: '100%'
                  }}
                >
                  <Card
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height={160}
                      image={imageUrl}
                      alt={decodeText(event.title)}
                      onError={(e) => { e.target.src = '/default-event.svg'; }}
                      sx={{ objectFit: 'cover' }}
                    />
                    
                    <CardContent sx={{ flexGrow: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1, gap: 0.5 }}>
                        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, flex: 1, fontSize: '0.95rem', lineHeight: 1.3 }}>
                          {decodeText(event.title)}
                        </Typography>
                        <Chip
                          label={getStatusLabel(event.status)}
                          color={getStatusColor(event.status)}
                          size="small"
                          sx={{ ml: 0.5, fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>

                      <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: '0.875rem' }} color="action" />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {formatDate(event.startTime)}
                          </Typography>
                        </Box>

                        {event.location && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn sx={{ fontSize: '0.875rem' }} color="action" />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }} noWrap>
                              {decodeText(event.location)}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <People sx={{ fontSize: '0.875rem' }} color="action" />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {decodeText(event.category) || 'Chưa phân loại'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: 1.5, pt: 0, justifyContent: 'space-between', gap: 0.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility sx={{ fontSize: '1rem' }} />}
                        onClick={() => handleViewEvent(event.eventId)}
                        sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                      >
                        Xem
                      </Button>
                      
                      <Box>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditEvent(event.eventId)}
                          title="Chỉnh sửa"
                          sx={{ padding: '4px' }}
                        >
                          <Edit sx={{ fontSize: '1rem' }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteEvent(event.eventId)}
                          title="Xóa"
                          disabled={deletingEventId === event.eventId}
                          sx={{ padding: '4px' }}
                        >
                          <Delete sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}

      </Container>
    </Box>
  );
};

export default MyEventsPage;

