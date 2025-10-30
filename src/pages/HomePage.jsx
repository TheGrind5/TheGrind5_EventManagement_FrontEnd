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

  // Render filter UI with TicketBox styling
  const renderFilterControls = () => (
    <Paper 
      sx={{ 
        p: { xs: 2, md: 3 }, 
        mb: 3,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        backgroundColor: theme.palette.mode === 'dark' ? '#1C1C1C' : '#FFFFFF',
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

  // Render events grid with TicketBox styling
  const renderEventsGrid = () => {
    if (filteredEvents.length === 0) {
      return (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: { xs: 6, md: 10 },
            px: 2
          }}
        >
          <Event 
            sx={{ 
              fontSize: { xs: 56, md: 72 }, 
              color: 'text.secondary', 
              mb: 2,
              opacity: 0.5
            }} 
          />
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{
              fontWeight: 600,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              mb: 1
            }}
          >
            Không tìm thấy sự kiện
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}
          >
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để xem thêm sự kiện
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
              setDateFilter('all');
            }}
            sx={{
              fontWeight: 600,
              px: 4,
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
      
      {/* Hero Section - Simple & Clean */}
      <Box
        sx={{
          background: theme.palette.mode === 'dark'
            ? '#0A0A0A'
            : '#FAFAFA',
          py: { xs: 4, md: 6 },
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={{ xs: 2, md: 3 }} alignItems="center">
            <Typography 
              variant="h2" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                color: 'text.primary',
              }}
            >
              Khám Phá Sự Kiện
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                maxWidth: 500,
                fontSize: { xs: '0.9rem', md: '1rem' },
                color: 'text.secondary',
                textAlign: 'center',
              }}
            >
              Tìm kiếm và tham gia sự kiện tại Việt Nam
            </Typography>
            <Button 
              component={Link} 
              to="/create-event" 
              variant="contained" 
              size="medium"
              sx={{ 
                fontWeight: 600,
                px: 3,
                mt: 1,
              }}
            >
              Tạo sự kiện mới
            </Button>
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
      <Box
        sx={{
          backgroundColor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#FFFFFF',
          minHeight: '60vh',
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
          <Typography 
            variant="h4" 
            component="h2" 
            textAlign="center" 
            gutterBottom 
            sx={{ 
              mb: 4,
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.125rem' },
              color: 'text.primary',
              letterSpacing: '-0.02em'
            }}
          >
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

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default HomePage;
