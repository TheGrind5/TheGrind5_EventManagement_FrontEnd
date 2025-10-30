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
import Footer from '../components/layout/Footer';
import CategoryTabs from '../components/ui/CategoryTabs';
import EventCard from '../components/ui/EventCard';
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

  // Filter valid events (eventId > 0)
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

    // Status filter - calculate status based on time
    const now = new Date();
    const start = new Date(event.startTime);
    const end = event.endTime ? new Date(event.endTime) : null;
    let currentEventStatus;
    if (end) {
      if (now < start) currentEventStatus = 'Upcoming';
      else if (now >= start && now <= end) currentEventStatus = 'Active';
      else currentEventStatus = 'Completed';
    } else {
      currentEventStatus = now < start ? 'Upcoming' : 'Completed';
    }
    const matchesStatus = statusFilter === 'all' || currentEventStatus === statusFilter;

    // Date filter
    const eventDate = new Date(event.startTime);
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

  // Render individual event card using EventCard component
  const renderEventCard = (event) => (
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
      <EventCard event={event} />
    </Grid>
  );

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
      
      {/* Hero Section - TicketBox Style */}
      <Box
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #2FA320 0%, #3DBE29 100%)'
            : 'linear-gradient(135deg, #3DBE29 0%, #5FD946 100%)',
          color: 'white',
          py: { xs: 6, md: 10 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={{ xs: 3, md: 4 }} alignItems="center">
            <Typography 
              variant="h2" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '3rem' },
                letterSpacing: '-0.02em',
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              Khám Phá Sự Kiện Tuyệt Vời
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                opacity: 0.95, 
                maxWidth: 600,
                fontSize: { xs: '1rem', md: '1.25rem' },
                fontWeight: 400,
              }}
            >
              Tìm kiếm và tham gia những sự kiện thú vị nhất tại thành phố của bạn
            </Typography>
            <Stack 
              direction={isMobile ? 'column' : 'row'} 
              spacing={2} 
              sx={{ mt: 2, width: isMobile ? '100%' : 'auto' }}
            >
              <Button 
                component={Link} 
                to="/register" 
                variant="contained" 
                size="large"
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  '&:hover': { 
                    bgcolor: 'grey.50',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
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
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  borderWidth: 2,
                  '&:hover': { 
                    borderColor: 'white',
                    borderWidth: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Khám Phá Sự Kiện
              </Button>
            </Stack>
            
            <Grid container spacing={4} sx={{ mt: { xs: 2, md: 4 }, maxWidth: 700 }}>
              <Grid item xs={4}>
                <Stack alignItems="center" spacing={1}>
                  <TrendingUp sx={{ fontSize: { xs: 32, md: 40 } }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                    100+
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    Sự Kiện
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={4}>
                <Stack alignItems="center" spacing={1}>
                  <People sx={{ fontSize: { xs: 32, md: 40 } }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                    5000+
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    Người Tham Gia
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={4}>
                <Stack alignItems="center" spacing={1}>
                  <Business sx={{ fontSize: { xs: 32, md: 40 } }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                    50+
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    Đối Tác
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* Category Tabs */}
      <CategoryTabs 
        categories={categories}
        selectedCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

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

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default HomePage;
