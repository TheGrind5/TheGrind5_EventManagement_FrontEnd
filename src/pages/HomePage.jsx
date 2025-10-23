// React & Router
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Material-UI Components
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid, 
  Chip, 
  Paper,
  Alert,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';

// Material-UI Icons
import { 
  LocationOn, 
  Person, 
  AccessTime,
  People,
  Business,
  Event,
  TrendingUp
} from '@mui/icons-material';

// Components & Services
import Header from '../components/layout/Header';
import { eventsAPI } from '../services/apiClient';

const HomePage = () => {
  //State declaration để quản lý trạng thái của component
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  //useEffect hook để fetch events từ backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventsAPI.getAll();
        console.log('HomePage - Events loaded:', response);
        setEvents(response.data || []);
      } catch (err) {
        setError('Failed to load events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  //Hàm constants để format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Hàm để xác định trạng thái event dựa trên thời gian
  const getEventStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;
    
    // Nếu có endTime, so sánh với endTime
    if (end) {
      if (now < start) {
        return 'Upcoming';
      } else if (now >= start && now <= end) {
        return 'Active';
      } else {
        return 'Completed';
      }
    } else {
      // Nếu không có endTime, chỉ so sánh với startTime
      if (now < start) {
        return 'Upcoming';
      } else {
        return 'Completed';
      }
    }
  };

  // Hàm để lấy text hiển thị cho status
  const getStatusText = (status) => {
    switch (status) {
      case 'Active':
        return 'Đang diễn ra';
      case 'Upcoming':
        return 'Sắp diễn ra';
      case 'Completed':
        return 'Đã kết thúc';
      default:
        return 'Không xác định';
    }
  };

  // Hàm để lấy màu cho status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Upcoming':
        return 'warning';
      case 'Completed':
        return 'default';
      default:
        return 'default';
    }
  };

  // Hàm constants để filter valid events (eventId > 0)
  const validEvents = events.filter(event => event.eventId && event.eventId > 0);

  // Get unique categories for filter dropdown
  const categories = [...new Set(validEvents.map(event => event.category).filter(Boolean))];

  // Filter events based on search and filter criteria
  const filteredEvents = validEvents.filter(event => {
    // Search filter
    const matchesSearch = !searchTerm || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;

    // Status filter - sử dụng status được tính toán thực tế
    const currentEventStatus = getEventStatus(event.startTime, event.endTime);
    const matchesStatus = statusFilter === 'all' || currentEventStatus === statusFilter;

    // Date filter
    const eventDate = new Date(event.startTime);
    const now = new Date();
    let matchesDate = true;
    
    if (dateFilter === 'upcoming') {
      matchesDate = eventDate > now;
    } else if (dateFilter === 'past') {
      matchesDate = eventDate < now;
    } else if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      matchesDate = eventDate >= today && eventDate < tomorrow;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDate;
  });

  // Hàm constants để render individual event card
  const renderEventCard = (event) => {
    // Tính toán status dựa trên thời gian thực tế
    const currentStatus = getEventStatus(event.startTime, event.endTime);
    
    // Lấy ảnh sự kiện từ EventDetails hoặc sử dụng ảnh mặc định
    const eventImage = event.eventDetails?.eventImage || event.eventImage || null;
    const imageUrl = eventImage ? 
      (eventImage.startsWith('http') ? eventImage : `http://localhost:5000${eventImage}`) : 
      null;
    
    return (
    <Grid 
      item 
      xs={12} 
      sm={6} 
      md={4} 
      lg={3}
      key={event.eventId}
      sx={{
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <Card 
        component={Link}
        to={`/event/${event.eventId}`}
        sx={{ 
          width: '100%',
          maxWidth: 320,
          height: 420,
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 3,
          transition: 'all 0.3s ease',
          boxShadow: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          textDecoration: 'none',
          color: 'inherit',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 12px 30px rgba(0, 0, 0, 0.4)' 
              : '0 12px 30px rgba(0, 0, 0, 0.2)',
            borderColor: 'primary.main',
            '& img': {
              transform: 'scale(1.05)'
            }
          }
        }}
      >
        {/* Event Image */}
        <Box sx={{ 
          height: 200,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Placeholder khi không có ảnh */}
          {!eventImage && (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <Event sx={{ fontSize: 48, mb: 1, opacity: 0.8 }} />
              <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Sự Kiện</Typography>
            </Box>
          )}
          
          {imageUrl && (
            <img
              src={imageUrl}
              alt={event.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
              onLoad={(e) => {
                // Nếu ảnh load thành công, ẩn placeholder
                e.target.style.display = 'block';
              }}
            />
          )}
          {/* Overlay with chips */}
          <Box sx={{ 
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <Chip 
              label={event.category} 
              color="primary" 
              size="small"
              sx={{ 
                fontWeight: 600,
                borderRadius: 2,
                fontSize: '0.75rem',
                height: 26,
                px: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: 'primary.main',
                '& .MuiChip-label': {
                  color: 'primary.main'
                }
              }}
            />
            <Chip 
              label={getStatusText(currentStatus)}
              color={getStatusColor(currentStatus)}
              size="small"
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                fontSize: '0.75rem',
                height: 26,
                px: 1,
                fontWeight: 500,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.8)',
                '& .MuiChip-label': {
                  color: currentStatus === 'Active' ? 'success.main' : 
                         currentStatus === 'Upcoming' ? 'warning.main' : 'text.secondary'
                }
              }}
            />
          </Box>
        </Box>

        <CardContent sx={{ 
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}>
          
          {/* Title - Fixed height */}
          <Typography 
            variant="h6" 
            component="h3" 
            sx={{ 
              fontWeight: 700,
              lineHeight: 1.3,
              mb: 2,
              minHeight: 44,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '1.1rem',
              color: 'text.primary'
            }}
          >
            {event.title}
          </Typography>
          
          {/* Description - Fixed height */}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2.5, 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.5,
              minHeight: 44,
              fontSize: '0.9rem'
            }}
          >
            {event.description}
          </Typography>
          
          {/* Event Details - Fixed height */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <AccessTime fontSize="small" color="action" sx={{ fontSize: '1rem', mt: 0.2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ 
                  lineHeight: 1.4,
                  fontSize: '0.85rem',
                  flex: 1
                }}>
                  {formatDate(event.startTime)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <LocationOn fontSize="small" color="action" sx={{ fontSize: '1rem', mt: 0.2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ 
                  lineHeight: 1.4,
                  fontSize: '0.85rem',
                  flex: 1
                }}>
                  {event.location}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Person fontSize="small" color="action" sx={{ fontSize: '1rem', mt: 0.2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ 
                  lineHeight: 1.4,
                  fontSize: '0.85rem',
                  flex: 1
                }}>
                  Host: {event.hostName || 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Grid>
    );
  };

  // Hàm constants để render filter UI (không còn search bar)
  const renderFilterControls = () => (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3,
        borderRadius: 2,
        boxShadow: 1
      }}
    >
      <Stack spacing={3}>
        {/* Filter Controls */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Danh mục</InputLabel>
              <Select
                value={categoryFilter}
                label="Danh mục"
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                label="Trạng thái"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="Active">Đang diễn ra</MenuItem>
                <MenuItem value="Upcoming">Sắp diễn ra</MenuItem>
                <MenuItem value="Completed">Đã kết thúc</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Thời gian</InputLabel>
              <Select
                value={dateFilter}
                label="Thời gian"
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="today">Hôm nay</MenuItem>
                <MenuItem value="upcoming">Sắp tới</MenuItem>
                <MenuItem value="past">Đã qua</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              sx={{ height: '56px' }}
            >
              Đặt lại
            </Button>
          </Grid>
        </Grid>

        {/* Results Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị {filteredEvents.length} / {validEvents.length} sự kiện
          </Typography>
          {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
            <Chip label="Đang lọc" color="primary" size="small" />
          )}
        </Box>
      </Stack>
    </Paper>
  );

  // Hàm constants để render events grid
  const renderEventsGrid = () => {
    if (filteredEvents.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Event sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Không tìm thấy sự kiện
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
              setDateFilter('all');
            }}
          >
            Đặt lại bộ lọc
          </Button>
        </Box>
      );
    }

    return (
      <Grid 
        container 
        spacing={3}
        sx={{
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}
      >
        {filteredEvents.map(renderEventCard)}
      </Grid>
    );
  };

  // Hàm constants để render loading state
  if (loading) {
    return (
      <Box>
        <Header />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh' 
        }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography>Loading events...</Typography>
          </Stack>
        </Box>
      </Box>
    );
  }

  // Hàm constants để render home page
  return (
    <Box>
      <Header 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={4} alignItems="center">
            <Typography variant="h2" component="h1" sx={{ fontWeight: 700 }}>
              Khám Phá Sự Kiện Tuyệt Vời
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, maxWidth: 600 }}>
              Tìm kiếm và tham gia những sự kiện thú vị nhất tại thành phố của bạn
            </Typography>
            <Stack 
              direction={isMobile ? 'column' : 'row'} 
              spacing={2} 
              sx={{ mt: 2 }}
            >
              <Button 
                component={Link} 
                to="/register" 
                variant="contained" 
                size="large"
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                Bắt Đầu Ngay
              </Button>
              <Button 
                component={Link} 
                to="/" 
                variant="outlined" 
                size="large"
                sx={{ 
                  borderColor: 'white', 
                  color: 'white',
                  '&:hover': { 
                    borderColor: 'white', 
                    bgcolor: 'rgba(255, 255, 255, 0.1)' 
                  }
                }}
              >
                Khám Phá Sự Kiện
              </Button>
            </Stack>
            
            <Grid container spacing={4} sx={{ mt: 4, maxWidth: 600 }}>
              <Grid item xs={4}>
                <Stack alignItems="center" spacing={1}>
                  <TrendingUp sx={{ fontSize: 40 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>100+</Typography>
                  <Typography variant="body2">Sự Kiện</Typography>
                </Stack>
              </Grid>
              <Grid item xs={4}>
                <Stack alignItems="center" spacing={1}>
                  <People sx={{ fontSize: 40 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>5000+</Typography>
                  <Typography variant="body2">Người Tham Gia</Typography>
                </Stack>
              </Grid>
              <Grid item xs={4}>
                <Stack alignItems="center" spacing={1}>
                  <Business sx={{ fontSize: 40 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>50+</Typography>
                  <Typography variant="body2">Đối Tác</Typography>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* Events Section */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom sx={{ mb: 4 }}>
          Sự Kiện Sắp Diễn Ra
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filter Section */}
        {renderFilterControls()}

        {/* Events Grid */}
        {renderEventsGrid()}
      </Container>
    </Box>
  );
};

export default HomePage;
