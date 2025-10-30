import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery
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
import { useAuth } from '../contexts/AuthContext';

const MyEventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '2px dashed',
              borderColor: 'divider'
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
              onClick={() => navigate('/create-event')}
              sx={{ mt: 2 }}
            >
              Tạo Sự Kiện
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {events.map((event) => (
              <Grid item xs={12} sm={6} md={4} key={event.eventId}>
                <Card
                  sx={{
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
                    height={200}
                    image={(() => {
                      const eventImage = event.eventDetails?.eventImage || event.eventImage;
                      if (eventImage) {
                        return eventImage.startsWith('http') 
                          ? eventImage 
                          : `http://localhost:5000${eventImage}`;
                      }
                      return '/default-event.svg';
                    })()}
                    alt={event.title}
                    onError={(e) => {
                      e.target.src = '/default-event.svg';
                    }}
                    sx={{ objectFit: 'cover' }}
                  />
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                        {event.title}
                      </Typography>
                      <Chip
                        label={getStatusLabel(event.status)}
                        color={getStatusColor(event.status)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(event.startTime)}
                        </Typography>
                      </Box>

                      {event.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {event.location}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <People fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {event.category || 'Chưa phân loại'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewEvent(event.eventId)}
                    >
                      Xem
                    </Button>
                    
                    <Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditEvent(event.eventId)}
                        title="Chỉnh sửa"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteEvent(event.eventId)}
                        title="Xóa"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

      </Container>
    </Box>
  );
};

export default MyEventsPage;

