// React & Router
import React, { useState, useEffect, useRef } from 'react';
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
  IconButton,
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
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';

// Components & Services
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import CategoryTabs from '../components/ui/CategoryTabs';
import EventCard from '../components/ui/EventCard';
import { eventsAPI } from '../services/apiClient';
import Pagination from '@mui/material/Pagination';

const HomePage = () => {
  //State declaration để quản lý trạng thái của component
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Refs for horizontal scroll containers
  const trendingScrollRef = useRef(null);
  const recommendedScrollRef = useRef(null);
  const upcomingScrollRef = useRef(null);

  //useEffect hook để fetch events từ backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await eventsAPI.getAll(page, pageSize);
        // response.data có thể là PagedResponse hoặc mảng
        const payload = response.data;
        if (payload && Array.isArray(payload.data)) {
          setEvents(payload.data);
          setTotalCount(payload.totalCount || payload.data.length || 0);
        } else if (Array.isArray(payload)) {
          setEvents(payload);
          setTotalCount(payload.length);
        } else {
          setEvents([]);
          setTotalCount(0);
        }
      } catch (err) {
        setError('Failed to load events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [page, pageSize]);

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
  const renderEventCard = (event, fixedWidth = false) => (
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
      <Box sx={{ width: fixedWidth ? 300 : '100%', maxWidth: 320 }}>
        <EventCard event={event} />
      </Box>
    </Grid>
  );

  // Get featured events (top 6 events for grid display)
  const featuredEvents = filteredEvents
    .filter(event => {
      const start = new Date(event.startTime);
      return start > new Date();
    })
    .slice(0, 6);

  // Get trending events (upcoming events with most recent start time)
  const trendingEvents = filteredEvents
    .filter(event => {
      const start = new Date(event.startTime);
      return start > new Date();
    })
    .slice(0, 6);

  // Get recommended events (random selection for now)
  const recommendedEvents = filteredEvents
    .sort(() => 0.5 - Math.random())
    .slice(0, 8);

  // Get upcoming events (sorted by start time)
  const upcomingEvents = filteredEvents
    .filter(event => {
      const start = new Date(event.startTime);
      return start > new Date();
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 8);

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

  // Render event section with horizontal scroll
  const renderEventSection = (title, events, icon, scrollRef) => {
    if (events.length === 0) return null;

    const scroll = (direction) => {
      if (scrollRef.current) {
        const scrollAmount = 350; // Width of card + gap
        const currentScroll = scrollRef.current.scrollLeft;
        const targetScroll = direction === 'left' 
          ? currentScroll - scrollAmount 
          : currentScroll + scrollAmount;
        
        scrollRef.current.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
    };

    return (
      <Box sx={{ mb: 6, position: 'relative' }}>
        {/* Section Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, px: { xs: 0, md: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {icon}
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                color: 'text.primary',
                fontSize: { xs: '1.25rem', md: '1.5rem' }
              }}
            >
              {title}
            </Typography>
            <Chip 
              label={`${events.length}`} 
              size="small" 
              sx={{ 
                fontWeight: 600,
                backgroundColor: theme.palette.mode === 'dark' ? '#1C1C1C' : '#F5F5F5',
                color: 'text.secondary'
              }} 
            />
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <IconButton
              onClick={() => scroll('left')}
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? '#1C1C1C' : '#F5F5F5',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#262626' : '#E5E5E5',
                  borderColor: 'primary.main',
                }
              }}
              size="small"
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              onClick={() => scroll('right')}
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? '#1C1C1C' : '#F5F5F5',
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#262626' : '#E5E5E5',
                  borderColor: 'primary.main',
                }
              }}
              size="small"
            >
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        {/* Horizontal Scroll Container */}
        <Box
          ref={scrollRef}
          sx={{
            display: 'flex',
            gap: 3,
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollBehavior: 'smooth',
            pb: 2,
            px: { xs: 0, md: 0 },
            // Hide scrollbar for cleaner look
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.mode === 'dark' ? '#1C1C1C' : '#F5F5F5',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.mode === 'dark' ? '#404040' : '#D4D4D4',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? '#525252' : '#A3A3A3',
              }
            }
          }}
        >
          {events.map((event) => (
            <Box
              key={event.eventId}
              sx={{
                minWidth: { xs: 280, sm: 320 },
                maxWidth: { xs: 280, sm: 320 },
                flexShrink: 0,
              }}
            >
              {renderEventCard(event)}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  // Render featured events section with grid layout (3 columns)
  const renderFeaturedEventsGrid = () => {
    if (featuredEvents.length === 0) return null;

    return (
      <Box sx={{ mb: 6 }}>
        {/* Section Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3DBE29 0%, #2FA320 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Event sx={{ fontSize: 18, color: '#FFFFFF' }} />
          </Box>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              color: 'text.primary',
              fontSize: { xs: '1.25rem', md: '1.5rem' }
            }}
          >
            🔥 Sự kiện nổi bật
          </Typography>
          <Chip 
            label={`${featuredEvents.length}`} 
            size="small" 
            sx={{ 
              fontWeight: 600,
              backgroundColor: theme.palette.mode === 'dark' ? '#1C1C1C' : '#F5F5F5',
              color: 'text.secondary'
            }} 
          />
        </Box>

        {/* Grid Layout - 3 columns */}
        <Grid 
          container 
          spacing={{ xs: 2, md: 3 }}
          sx={{
            justifyContent: 'center',
            alignItems: 'stretch',
          }}
        >
          {featuredEvents.map((event) => (
            <Grid 
              item 
              xs={12}   // 1 column on mobile
              sm={6}    // 2 columns on tablet
              md={4}    // 3 columns on desktop
              key={event.eventId}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                maxWidth: { md: '33.333%' }, // Đảm bảo đúng 3 cột
              }}
            >
              <Box sx={{ width: '100%', maxWidth: 380 }}>
                <EventCard event={event} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

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

    // Check if filters are active
    const hasFilters = searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all';

    // If filters are active, show filtered results
    if (hasFilters) {
      return (
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              color: 'text.primary',
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              mb: 3
            }}
          >
            Kết quả tìm kiếm ({filteredEvents.length})
          </Typography>
          <Grid 
            container 
            spacing={3}
            sx={{
              justifyContent: 'flex-start',
              alignItems: 'stretch'
            }}
          >
            {filteredEvents.map(renderEventCard)}
          </Grid>
        </Box>
      );
    }

    // Otherwise show sections
    return (
      <Box>
        {/* Featured Events Grid - 3 columns */}
        {renderFeaturedEventsGrid()}

        {/* Trending Events - Horizontal Scroll */}
        {renderEventSection(
          '⚡ Sự kiện xu hướng',
          trendingEvents,
          <TrendingUp sx={{ fontSize: 28, color: 'primary.main' }} />,
          trendingScrollRef
        )}

        {/* Recommended Events - Horizontal Scroll */}
        {renderEventSection(
          '✨ Dành cho bạn',
          recommendedEvents,
          <Event sx={{ fontSize: 28, color: 'primary.main' }} />,
          recommendedScrollRef
        )}

        {/* Upcoming Events - Horizontal Scroll */}
        {renderEventSection(
          '📅 Sự kiện sắp diễn ra',
          upcomingEvents,
          <AccessTime sx={{ fontSize: 28, color: 'primary.main' }} />,
          upcomingScrollRef
        )}
      </Box>
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
