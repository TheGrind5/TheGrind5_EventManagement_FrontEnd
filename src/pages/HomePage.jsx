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

  AccessTime,

  Event,

  TrendingUp,

  ChevronLeft,

  ChevronRight,
  LocationOn
} from '@mui/icons-material';



// Components & Services

import Header from '../components/layout/Header';

import Footer from '../components/layout/Footer';

import EventCard from '../components/ui/EventCard';

import HeroEvents from '../components/ui/HeroEvents';
import EventCarousel from '../components/ui/EventCarousel';
import { eventsAPI } from '../services/apiClient';


const HomePage = () => {

  //State declaration để quản lý trạng thái của component

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [page] = useState(1);

  const [pageSize] = useState(12);

  const [totalCount, setTotalCount] = useState(0);

  
  
  // Tính tổng số trang
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  
  // Search and Filter states

  const [searchTerm, setSearchTerm] = useState('');

  const [categoryFilter, setCategoryFilter] = useState('all');

  const [statusFilter, setStatusFilter] = useState('all');

  const [dateFilter, setDateFilter] = useState('all');

  const [campusFilter, setCampusFilter] = useState('all');

  const [priceFilter, setPriceFilter] = useState('all');



  const theme = useTheme();

  useMediaQuery(theme.breakpoints.down('md'));



  // Debounce search term để giảm số lượng API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Trạng thái có đang dùng bộ lọc (đặt sau khi khai báo state filter)
  const filtersActive = debouncedSearchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || campusFilter !== 'all' || priceFilter !== 'all';

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



  // Determine event status based on time (align with EventCard)

  const getEventStatus = (startTime, endTime) => {

    const now = new Date();

    const start = new Date(startTime);

    const end = endTime ? new Date(endTime) : null;

    if (end) {

      if (now < start) return 'Upcoming';

      if (now >= start && now <= end) return 'Active';

      return 'Completed';

    }

    return now < start ? 'Upcoming' : 'Completed';

  };



  // Build absolute image URL from relative path

  const buildImageUrl = (imagePath) => {

    if (!imagePath) return null;

    return imagePath.startsWith('http') ? imagePath : `http://localhost:5000${imagePath}`;

  };



  // Filter valid events (eventId > 0) - ONLY FROM DATABASE, NO MOCK DATA
  const validEvents = events.filter(event => event.eventId && event.eventId > 0);

  // DEBUG: Log database connection status
  useEffect(() => {
    if (error) {
      console.error('=== DATABASE CONNECTION ERROR ===');
      console.error('API Error:', error);
      console.error('Backend URL: http://localhost:5000/api');
      console.error('Please ensure:');
      console.error('1. Backend server is running on port 5000');
      console.error('2. Database is connected');
      console.error('3. Events exist in database');
      console.error('================================');
    } else if (validEvents.length > 0) {
      console.log('=== DATABASE CONNECTION SUCCESS ===');
      console.log('Total events from database:', validEvents.length);
      console.log('==================================');
    } else {
      console.warn('=== NO EVENTS FOUND ===');
      console.warn('Database returned 0 events');
      console.warn('Please add events to database');
      console.warn('========================');
    }
  }, [events, validEvents, error]);



  // Get unique categories for filter dropdown

  const categories = [...new Set(validEvents.map(event => event.category).filter(Boolean))];

  
  
  // Fetch all categories when component mounts (without filters)
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        // Fetch first page of all events to get unique categories
        const response = await eventsAPI.getAll(1, 100); // Get first 100 events to get all categories
        const payload = response.data;
        if (payload && Array.isArray(payload.data)) {
          const cats = [...new Set(payload.data.map(event => event.category).filter(Boolean))];
          setAllCategories(cats);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchAllCategories();
  }, []); // Only run once on mount

  // FPT Campuses list

  const campuses = [

    { value: 'all', label: 'Tất cả campus' },

    { value: 'Hà Nội', label: 'Hà Nội' },

    { value: 'TP. Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },

    { value: 'Đà Nẵng', label: 'Đà Nẵng' },

    { value: 'Quy Nhơn', label: 'Quy Nhơn' },

    { value: 'Cần Thơ', label: 'Cần Thơ' }

  ];



  // Tạo lại categoryOptions chỉ chứa danh mục

  const categoryOptions = [

    { value: 'all', label: 'Tất cả' },

    ...categories.map(c => ({ value: c, label: c }))

  ];

  // Tạo lại priceOptions riêng cho dropdown Giá Tiền

  const priceOptions = [

    { value: 'all', label: 'Tất cả' },

    { value: 'free', label: 'Miễn phí' },

    { value: 'below50', label: 'Dưới 50.000đ' },

    { value: '50to100', label: '50.000đ - 100.000đ' },

    { value: 'above100', label: 'Trên 100.000đ' }

  ];



  // Filter events based on search and filter criteria

  const filteredEvents = validEvents.filter(event => {

    // Search filter

    const matchesSearch = !searchTerm || 

      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||

      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||

      event.category?.toLowerCase().includes(searchTerm.toLowerCase());



    // Status filter

    const matchesStatus = statusFilter === 'all' || getEventStatus(event.startTime, event.endTime) === statusFilter;



    // Date filter

    const now = new Date();

    const eventStart = new Date(event.startTime);

    let matchesDate = true;

    if (dateFilter === 'today') {

      matchesDate = eventStart.toDateString() === now.toDateString();

    } else if (dateFilter === 'upcoming') {

      matchesDate = eventStart > now;

    } else if (dateFilter === 'past') {

      matchesDate = eventStart < now;

    }



    // Campus filter

    const matchesCampus = campusFilter === 'all' || 

      event.location?.includes(campusFilter) || 

      event.campus?.includes(campusFilter);



    // Category filter - CHỈ filter theo danh mục thực tế (Music, Art, Workshop, etc.)
    const matchesCategory = categoryFilter === 'all' || 
      (event.category && event.category.toLowerCase() === categoryFilter.toLowerCase());



    // Price filter - Filter theo giá vé
    let matchesPrice = true;
    
    if (priceFilter !== 'all' && event.ticketTypes && event.ticketTypes.length > 0) {
      if (priceFilter === 'free') {
        matchesPrice = event.ticketTypes.some(t => (t.price === 0 || t.price === null) || t.isFree === true);
      } else if (priceFilter === 'below50') {
        matchesPrice = event.ticketTypes.some(t => t.price > 0 && t.price < 50000);
      } else if (priceFilter === '50to100') {
        matchesPrice = event.ticketTypes.some(t => t.price >= 50000 && t.price <= 100000);
      } else if (priceFilter === 'above100') {
        matchesPrice = event.ticketTypes.some(t => t.price > 100000);
      }
    } else if (priceFilter !== 'all') {
      // Nếu filter giá được chọn nhưng event không có ticketTypes, không hiển thị
      matchesPrice = false;
    }



    return matchesSearch && matchesStatus && matchesDate && matchesCampus && matchesCategory && matchesPrice;

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



  // Use ONLY database events - NO MOCK DATA FALLBACK
  // Process database events to ensure image paths are preserved
  const processedEvents = validEvents.map(event => ({
    // Preserve original event structure and ensure image paths are maintained
    ...event,
    // Keep backgroundImage (1280x720) as main display image
    // eventImage (720x958) is saved but not displayed
    backgroundImage: event.eventDetails?.backgroundImage || event.backgroundImage || null,
    // Preserve eventDetails structure
    eventDetails: event.eventDetails || { backgroundImage: event.backgroundImage || null },
  }));

  // Use ONLY database events for carousels - NO FALLBACK
  const baseEventsForCarousel = processedEvents;

  // Hero events - Use validEvents (from database) if available for proper images
  const featuredEventsForHero = baseEventsForCarousel
    .filter(event => {
      const start = new Date(event.startTime);
      return start > new Date();
    })
    .slice(0, 5); // Lấy 5 sự kiện cho Hero

  const featuredEvents = filteredEvents

    .filter(event => {

      const start = new Date(event.startTime);

      return start > new Date();

    })

    .slice(0, 6);



  // Get trending events - Use validEvents (from database) if available
  const trendingEvents = baseEventsForCarousel
    .filter(event => {

      const start = new Date(event.startTime);

      return start > new Date();

    })

    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 8);


  // Get recommended events (random selection for now)

  const recommendedEvents = baseEventsForCarousel
    .sort(() => 0.5 - Math.random())

    .slice(0, 8);



  // Get upcoming events (sorted by start time)

  const upcomingEvents = baseEventsForCarousel
    .filter(event => {

      const start = new Date(event.startTime);

      return start > new Date();

    })

    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

    .slice(0, 8);



  // Get events by category for carousel sections
  const workshopEvents = baseEventsForCarousel.filter(e => e.category === 'Workshop').slice(0, 10);
  const musicEvents = baseEventsForCarousel.filter(e => e.category === 'Music').slice(0, 10);
  const campusEvents = baseEventsForCarousel.filter(e => e.category === 'Campus Event').slice(0, 10);

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

        {/* Filter bar (dòng dưới Search) - Cải thiện labels và icons */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start', mb: 2 }}>
          {/* Dropdown Danh mục riêng biệt - Có icon và label rõ ràng */}
          <FormControl 
            sx={{ 
              minWidth: { xs: '100%', sm: 180 }, 
              maxWidth: { xs: '100%', sm: 200 } 
            }} 
            size="small"
          >
            <InputLabel id="category-filter-label">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Event sx={{ fontSize: 16 }} /> Danh mục
              </Box>
            </InputLabel>
            <Select

              value={categoryFilter}

              labelId="category-filter-label"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Event sx={{ fontSize: 16 }} /> Danh mục
                </Box>
              }
              onChange={e => setCategoryFilter(e.target.value)}

              sx={{
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }
              }}
            >
              {categoryOptions.map(o => (
                <MenuItem value={o.value} key={o.value}>
                  {o.value === 'all' ? '🏷️ ' : o.value === 'free' ? '🆓 ' : ''}
                  {o.label}
                </MenuItem>
              ))}
            </Select>

          </FormControl>

          
          {/* Dropdown Giá tiền riêng biệt - Có icon và label rõ ràng */}
          <FormControl 
            sx={{ 
              minWidth: { xs: '100%', sm: 180 }, 
              maxWidth: { xs: '100%', sm: 200 } 
            }} 
            size="small"
          >
            <InputLabel id="price-filter-label">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                💰 Giá tiền
              </Box>
            </InputLabel>
            <Select

              value={priceFilter}

              labelId="price-filter-label"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  💰 Giá tiền
                </Box>
              }
              onChange={e => setPriceFilter(e.target.value)}

            >

              {priceOptions.map(o => (
                <MenuItem value={o.value} key={o.value}>
                  {o.value === 'all' ? '💰 ' : o.value === 'free' ? '🆓 ' : o.value === 'below50' ? '💵 ' : o.value === '50to100' ? '💶 ' : '💷 '}
                  {o.label}
                </MenuItem>
              ))}
            </Select>

          </FormControl>



          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth>

              <InputLabel id="status-filter-label">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp sx={{ fontSize: 16 }} /> Trạng thái
                </Box>
              </InputLabel>
              <Select

                value={statusFilter}

                labelId="status-filter-label"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp sx={{ fontSize: 16 }} /> Trạng thái
                  </Box>
                }
                onChange={(e) => setStatusFilter(e.target.value)}

                sx={{ borderRadius: 2 }}

              >

                <MenuItem value="all">🔵 Tất cả</MenuItem>
                <MenuItem value="Active">🟢 Đang diễn ra</MenuItem>
                <MenuItem value="Upcoming">🟡 Sắp diễn ra</MenuItem>
                <MenuItem value="Completed">⚫ Đã kết thúc</MenuItem>
              </Select>

            </FormControl>

          </Grid>



          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth>

              <InputLabel id="date-filter-label">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTime sx={{ fontSize: 16 }} /> Thời gian
                </Box>
              </InputLabel>
              <Select

                value={dateFilter}

                labelId="date-filter-label"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTime sx={{ fontSize: 16 }} /> Thời gian
                  </Box>
                }
                onChange={(e) => setDateFilter(e.target.value)}

              >

                <MenuItem value="all">📅 Tất cả</MenuItem>
                <MenuItem value="today">📆 Hôm nay</MenuItem>
                <MenuItem value="upcoming">⏰ Sắp tới</MenuItem>
                <MenuItem value="past">📋 Đã qua</MenuItem>
              </Select>

            </FormControl>

          </Grid>



          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth>

              <InputLabel id="campus-filter-label">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn sx={{ fontSize: 16 }} /> Campus
                </Box>
              </InputLabel>
              <Select

                value={campusFilter}

                labelId="campus-filter-label"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn sx={{ fontSize: 16 }} /> Campus
                  </Box>
                }
                onChange={(e) => setCampusFilter(e.target.value)}

              >

                {campuses.map((campus) => (

                  <MenuItem key={campus.value} value={campus.value}>

                    {campus.value === 'all' ? '🌍 ' : '📍 '}
                    {campus.label}

                  </MenuItem>

                ))}

              </Select>

            </FormControl>

          </Grid>



          <Grid item xs={12} sm={6} md={2}>

            <Button

              variant="outlined"

              fullWidth

              onClick={() => {

                setSearchTerm('');

                setCategoryFilter('all');

                setStatusFilter('all');

                setDateFilter('all');

                setCampusFilter('all');

                setPriceFilter('all');

              }}

              sx={{ 
                height: '56px',
                fontWeight: 600,
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                '&:hover': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  transform: 'translateY(-1px)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 4px 12px rgba(0,0,0,0.3)' 
                    : '0 4px 12px rgba(0,0,0,0.1)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                transition: 'all 0.2s ease'
              }}
            >
              🔄 Đặt lại
            </Button>

          </Grid>

        </Box>



        {/* Results Summary */}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          <Typography variant="body2" color="text.secondary">

            Hiển thị {filteredEvents.length} / {validEvents.length} sự kiện

          </Typography>

          {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || campusFilter !== 'all' || priceFilter !== 'all') && (

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

              setCampusFilter('all');

              setPriceFilter('all');

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

    const hasFilters = searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || campusFilter !== 'all' || priceFilter !== 'all';



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



    // Otherwise - Don't show anything if no filters are active
    // Sections are already shown in EventCarousel above
    return null;

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


  // Helper để convert event format cho HeroEvents và EventCarousel
  // FIXED: Use backgroundImage (1280x720) as main display image everywhere
  const convertEventForDisplay = (event) => {
    // Get backgroundImage (1280x720) - main display image for all pages
    // eventImage (720x958) is saved but not displayed
    const rawImage = event.eventDetails?.backgroundImage || 
                     event.backgroundImage || 
                     null;
    
    // Build proper image URL with fallback
    let imageUrl = null;
    if (rawImage && rawImage.trim() !== '') {
      if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
        // Already a full URL
        imageUrl = rawImage;
      } else if (rawImage.startsWith('/')) {
        // Relative path starting with /
        imageUrl = `http://localhost:5000${rawImage}`;
      } else {
        // Relative path without leading /
        imageUrl = `http://localhost:5000/${rawImage}`;
      }
    }
    
    // Determine badge - chỉ set nếu thực sự có, không default
    let badgeValue = null;
    if (event.badge && event.badge.trim() !== '') {
      badgeValue = event.badge;
    } else {
      // Auto-detect badge based on event status
      const now = new Date();
      const start = event.startTime ? new Date(event.startTime) : null;
      if (start && start > now) {
        badgeValue = 'Sắp diễn ra';
      }
    }
    
    return {
      id: event.eventId || event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      hostName: event.hostName,
      image: imageUrl, // Use properly built URL - can be null if no image
      badge: badgeValue, // Only set if exists, prevent duplicates
      price: event.price || 0,
      campus: event.campus
    };
  };


  // Hàm constants để render home page

  return (

    <Box sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#0A0A0A' }}>
      <Header 

        searchTerm={searchTerm}

        onSearchChange={setSearchTerm}

      />

      

      {/* Hero Featured Events Section - FPT Play Style */}
      {featuredEventsForHero.length > 0 && (
        <Box sx={{ backgroundColor: '#000000' }}>
          <HeroEvents 
            events={featuredEventsForHero.map(event => {
              const converted = convertEventForDisplay(event);
              // Debug: Log to help troubleshoot image issues
              console.log('HomePage - Converting event for Hero:', {
                eventId: converted.id,
                title: converted.title,
                image: converted.image,
                rawEvent: event,
              });
              return converted;
            })} 
          />
        </Box>
      )}

      {/* Event Carousels Section - FPT Play Style - Cải thiện spacing */}
      <Box sx={{ backgroundColor: '#0A0A0A', py: { xs: 4, md: 8 }, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 0, md: 2 } }}>
          {/* Sự kiện nổi bật */}
          {featuredEventsForHero.length > 0 && (
            <EventCarousel
              title="🔥 Sự kiện nổi bật"
              events={featuredEventsForHero.map(convertEventForDisplay)}
              icon={<TrendingUp sx={{ fontSize: 32 }} />}
              showAutoPlay={true}
            />
          )}

          {/* Sự kiện xu hướng */}
          {trendingEvents.length > 0 && (
            <EventCarousel
              title="⚡ Sự kiện xu hướng"
              events={trendingEvents.map(convertEventForDisplay)}
              icon={<TrendingUp sx={{ fontSize: 32 }} />}
              showAutoPlay={true}
            />
          )}

          {/* Workshop Events */}
          {workshopEvents.length > 0 && (
            <EventCarousel
              title="🎓 Workshop"
              events={workshopEvents.map(convertEventForDisplay)}
              icon={<Event sx={{ fontSize: 32 }} />}
              showAutoPlay={false}
            />
          )}

          {/* Music Events */}
          {musicEvents.length > 0 && (
            <EventCarousel
              title="🎵 Music"
              events={musicEvents.map(convertEventForDisplay)}
              icon={<Event sx={{ fontSize: 32 }} />}
              showAutoPlay={false}
            />
          )}

          {/* Campus Events */}
          {campusEvents.length > 0 && (
            <EventCarousel
              title="🏫 Campus Event"
              events={campusEvents.map(convertEventForDisplay)}
              icon={<Event sx={{ fontSize: 32 }} />}
              showAutoPlay={false}
            />
          )}

          {/* Dành cho bạn */}
          {recommendedEvents.length > 0 && (
            <EventCarousel
              title="✨ Dành cho bạn"
              events={recommendedEvents.map(convertEventForDisplay)}
              icon={<Event sx={{ fontSize: 32 }} />}
              showAutoPlay={true}
            />
          )}

          {/* Sự kiện sắp diễn ra */}
          {upcomingEvents.length > 0 && (
            <EventCarousel
              title="📅 Sự kiện sắp diễn ra"
              events={upcomingEvents.map(convertEventForDisplay)}
              icon={<AccessTime sx={{ fontSize: 32 }} />}
              showAutoPlay={false}
            />
          )}
            </Container>

          </Box>



      {/* Filter Bar Section - Positioned between "Sự kiện sắp diễn ra" and "Kết quả tìm kiếm" */}
      <Box sx={{ backgroundColor: '#0A0A0A', py: { xs: 3, md: 4 }, px: { xs: 2, md: 4 }, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Container maxWidth="xl">
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {/* Filter Section */}
          {renderFilterControls()}
        </Container>

      </Box>



      {/* Events Grid Section - Only shows when there are filtered events */}
      {filteredEvents.length > 0 || (() => {
        const hasFilters = searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || campusFilter !== 'all' || priceFilter !== 'all';
        return hasFilters && filteredEvents.length === 0; // Show "Không tìm thấy" message when filters are active but no results
      })() ? (
        <Box

          sx={{

            backgroundColor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#FFFFFF',

          }}

        >

          <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        
            {/* Events Grid - Only shows filtered results or "not found" message */}
            {renderEventsGrid()}

          </Container>

        </Box>
      ) : null}



      {/* Footer */}

      <Footer />

    </Box>

  );

};



export default HomePage;

