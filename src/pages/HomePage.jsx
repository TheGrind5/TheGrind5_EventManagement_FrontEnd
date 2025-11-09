// React & Router

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';



// Material-UI Components

import { 
  
  Container, 
  
  Typography, 
  
  Box, 
  
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
import { useDebounce } from '../hooks/useDebounce';


const HomePage = () => {

  //State declaration để quản lý trạng thái của component

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [page] = useState(1);

  const [pageSize] = useState(12);

  const [totalCount, setTotalCount] = useState(0);

  // Search and Filter states

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState('all');

  const [statusFilter, setStatusFilter] = useState('all');

  const [dateFilter, setDateFilter] = useState('all');

  const [campusFilter, setCampusFilter] = useState('all');

  const [priceFilter, setPriceFilter] = useState('all');



  const theme = useTheme();

  useMediaQuery(theme.breakpoints.down('md'));



  // Debounce search term để giảm số lượng API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);



  //useEffect hook để fetch events từ backend

  useEffect(() => {

    const fetchEvents = async () => {

      try {

        setLoading(true);

        // Build filters object for backend search
        const filters = {};
        
        if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
          filters.searchTerm = debouncedSearchTerm;
        }
        
        if (categoryFilter && categoryFilter !== 'all') {
          filters.category = categoryFilter;
        }
        
        if (campusFilter && campusFilter !== 'all') {
          filters.city = campusFilter; // Map campusFilter to city parameter
        }

        const response = await eventsAPI.getAll(page, pageSize, filters);

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

        console.error('Error fetching events:', err);
        
        // Hiển thị thông báo lỗi chi tiết hơn
        let errorMessage = 'Failed to load events';
        if (err.response) {
          console.error('Error response:', err.response);
          errorMessage = err.response.data?.message || `Failed to load events (Status: ${err.response.status})`;
        } else if (err.request) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa.';
        } else {
          errorMessage = err.message || 'Failed to load events';
        }
        
        setError(errorMessage);

      } finally {

        setLoading(false);

      }

    };



    fetchEvents();

  }, [page, pageSize, debouncedSearchTerm, categoryFilter, campusFilter]);



  // Determine event status based on time (align with EventCard) - Memoized

  const getEventStatus = useCallback((startTime, endTime) => {

    const now = new Date();

    const start = new Date(startTime);

    const end = endTime ? new Date(endTime) : null;

    if (end) {

      if (now < start) return 'Upcoming';

      if (now >= start && now <= end) return 'Active';

      return 'Completed';

    }

    return now < start ? 'Upcoming' : 'Completed';

  }, []);



  // Build absolute image URL from relative path - Memoized

  const buildImageUrl = useCallback((imagePath) => {

    if (!imagePath) return null;

    return imagePath.startsWith('http') ? imagePath : `http://localhost:5000${imagePath}`;

  }, []);



  // Filter valid events (eventId > 0) - ONLY FROM DATABASE, NO MOCK DATA - Memoized để tránh tính toán lại
  const validEvents = useMemo(() => 
    events.filter(event => event.eventId && event.eventId > 0),
    [events]
  );

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



  // Get unique categories for filter dropdown - Memoized để tránh tính toán lại
  const categories = useMemo(() => 
    [...new Set(validEvents.map(event => event.category).filter(Boolean))],
    [validEvents]
  );

  // FPT Campuses list

  const campuses = [

    { value: 'all', label: 'Tất cả campus' },

    { value: 'Hà Nội', label: 'Hà Nội' },

    { value: 'TP. Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },

    { value: 'Đà Nẵng', label: 'Đà Nẵng' },

    { value: 'Quy Nhơn', label: 'Quy Nhơn' },

    { value: 'Cần Thơ', label: 'Cần Thơ' }

  ];



  // Tạo lại categoryOptions chỉ chứa danh mục - Memoized để tránh tạo array mới mỗi render
  const categoryOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả' },
    ...categories.map(c => ({ value: c, label: c }))
  ], [categories]);

  // Tạo lại priceOptions riêng cho dropdown Giá Tiền

  const priceOptions = [

    { value: 'all', label: 'Tất cả' },

    { value: 'free', label: 'Miễn phí' },

    { value: 'below50', label: 'Dưới 50.000đ' },

    { value: '50to100', label: '50.000đ - 100.000đ' },

    { value: 'above100', label: 'Trên 100.000đ' }

  ];



  // Filter events based on search and filter criteria - Memoized để tránh filter lại mỗi render
  const filteredEvents = useMemo(() => validEvents.filter(event => {

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

  }), [validEvents, searchTerm, statusFilter, dateFilter, campusFilter, categoryFilter, priceFilter, getEventStatus]);



  // Render individual event card using EventCard component - Memoized để tránh tạo function mới
  const renderEventCard = useCallback((event, fixedWidth = false, index = 0) => (

    <Grid 

      item 

      xs={12} 

      sm={6} 

      md={4} 

      lg={3}

      key={event.eventId}

      sx={{

        display: 'flex',

        justifyContent: 'center',
        alignItems: 'stretch',
        height: '100%',
        animation: 'fadeInUp 0.5s ease-out',
        animationDelay: `${index * 0.1}s`,
        animationFillMode: 'both',
        '@keyframes fadeInUp': {
          '0%': {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}

    >

      <Box sx={{ 
        width: fixedWidth ? 300 : '100%', 
        maxWidth: 320,
        height: '100%',
        display: 'flex',
        position: 'relative',
        '&:hover': {
          zIndex: 10,
          '& > *': {
            position: 'relative',
            zIndex: 10
          }
        }
      }}>

        <EventCard event={event} />

      </Box>

    </Grid>

  ), []);



  // Use ONLY database events - NO MOCK DATA FALLBACK
  // Process database events to ensure image paths are preserved - Memoized để tránh tính toán lại
  const processedEvents = useMemo(() => validEvents.map(event => ({
    // Preserve original event structure and ensure image paths are maintained
    ...event,
    // Keep backgroundImage (1280x720) as main display image
    // eventImage (720x958) is saved but not displayed
    backgroundImage: event.eventDetails?.backgroundImage || event.backgroundImage || null,
    // Preserve eventDetails structure
    eventDetails: event.eventDetails || { backgroundImage: event.backgroundImage || null },
  })), [validEvents]);

  // Use ONLY database events for carousels - NO FALLBACK - Memoized
  const baseEventsForCarousel = processedEvents;

  // Hero events - Use validEvents (from database) if available for proper images - Memoized
  // FIXED: Hiển thị 5 sự kiện phù hợp nhất: ưu tiên sắp diễn ra > đang diễn ra > gần nhất
  const featuredEventsForHero = useMemo(() => {
    // Lấy thời gian thực hiện tại
    const now = new Date();
    
    // Lọc sự kiện có startTime hợp lệ
    const validEvents = baseEventsForCarousel.filter(event => {
      if (!event.startTime) {
        console.warn('Hero Section - Event missing startTime:', event.eventId, event.title);
        return false;
      }
      
      const start = new Date(event.startTime);
      if (isNaN(start.getTime())) {
        console.warn('Hero Section - Event has invalid startTime:', event.eventId, event.title, event.startTime);
        return false;
      }
      
      return true;
    });
    
    // Phân loại sự kiện: sắp diễn ra, đang diễn ra, đã qua
    const upcomingEvents = []; // startTime > now
    const activeEvents = [];   // startTime <= now && endTime >= now
    const pastEvents = [];     // endTime < now hoặc startTime < now && không có endTime
    
    validEvents.forEach(event => {
      const start = new Date(event.startTime);
      const end = event.endTime ? new Date(event.endTime) : null;
      
      if (start.getTime() > now.getTime()) {
        // Sự kiện sắp diễn ra
        upcomingEvents.push(event);
      } else if (end && end.getTime() >= now.getTime()) {
        // Sự kiện đang diễn ra
        activeEvents.push(event);
      } else {
        // Sự kiện đã qua
        pastEvents.push(event);
      }
    });
    
    // Sắp xếp:
    // - Sắp diễn ra: theo startTime tăng dần (gần nhất trước)
    // - Đang diễn ra: theo startTime giảm dần (mới nhất trước)
    // - Đã qua: theo startTime giảm dần (mới nhất trước)
    upcomingEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    activeEvents.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    pastEvents.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    // Ưu tiên: sắp diễn ra > đang diễn ra > gần nhất (nếu không có sự kiện sắp/đang diễn ra)
    let selectedEvents = [];
    
    if (upcomingEvents.length > 0) {
      // Có sự kiện sắp diễn ra: lấy 5 sự kiện sắp diễn ra gần nhất
      selectedEvents = upcomingEvents.slice(0, 5);
    } else if (activeEvents.length > 0) {
      // Không có sự kiện sắp diễn ra, nhưng có sự kiện đang diễn ra: lấy 5 sự kiện đang diễn ra
      selectedEvents = activeEvents.slice(0, 5);
    } else {
      // Không có sự kiện sắp/đang diễn ra: lấy 5 sự kiện gần nhất (mới nhất)
      selectedEvents = pastEvents.slice(0, 5);
    }
    
    // Debug log kết quả (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
      console.log('=== HERO SECTION DEBUG ===');
      console.log('Total events in baseEventsForCarousel:', baseEventsForCarousel.length);
      console.log('Valid events:', validEvents.length);
      console.log('Upcoming events:', upcomingEvents.length);
      console.log('Active events:', activeEvents.length);
      console.log('Past events:', pastEvents.length);
      console.log('Selected events for hero:', selectedEvents.length);
      if (selectedEvents.length > 0) {
        console.log('Hero Section - Selected events:', selectedEvents.map(e => ({
          eventId: e.eventId,
          title: e.title?.substring(0, 50),
          startTime: e.startTime,
          endTime: e.endTime,
          status: e.status
        })));
      } else {
        console.warn('Hero Section - No events selected!');
      }
      console.log('========================');
    }
    
    // Lấy 5 sự kiện (hoặc ít hơn nếu không đủ 5)
    return selectedEvents;
  }, [baseEventsForCarousel]);

  const featuredEvents = useMemo(() => filteredEvents
    .filter(event => {
      const start = new Date(event.startTime);
      return start > new Date();
    })
    .slice(0, 6),
    [filteredEvents]
  );



  // Get trending events - Use validEvents (from database) if available - Memoized
  const trendingEvents = useMemo(() => baseEventsForCarousel
    .filter(event => {
      const start = new Date(event.startTime);
      return start > new Date();
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 8),
    [baseEventsForCarousel]
  );


  // Get recommended events (random selection for now) - Memoized (với seed để tránh random mỗi render)
  const recommendedEvents = useMemo(() => {
    // Sử dụng length làm seed để random ổn định
    const sorted = [...baseEventsForCarousel].sort((a, b) => (a.eventId || 0) - (b.eventId || 0));
    return sorted.slice(0, 8);
  }, [baseEventsForCarousel]);



  // Get upcoming events (sorted by start time) - Memoized

  const upcomingEvents = useMemo(() => baseEventsForCarousel
    .filter(event => {
      const start = new Date(event.startTime);
      return start > new Date();
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 8),
    [baseEventsForCarousel]
  );



  // Get events by category for carousel sections - Memoized
  const workshopEvents = useMemo(() => 
    baseEventsForCarousel.filter(e => e.category === 'Workshop').slice(0, 10),
    [baseEventsForCarousel]
  );
  const musicEvents = useMemo(() => 
    baseEventsForCarousel.filter(e => e.category === 'Music').slice(0, 10),
    [baseEventsForCarousel]
  );
  const campusEvents = useMemo(() => 
    baseEventsForCarousel.filter(e => e.category === 'Campus Event').slice(0, 10),
    [baseEventsForCarousel]
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



  // Render event section with horizontal scroll - REMOVED: Not used
  // eslint-disable-next-line no-unused-vars
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

            overflowY: 'visible',

            scrollBehavior: 'smooth',

            pb: 4,

            pt: 2,

            px: { xs: 0, md: 0 },

            position: 'relative',

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

          {events.map((event, index) => (

            <Box

              key={event.eventId}

              sx={{

                minWidth: { xs: 280, sm: 320 },

                maxWidth: { xs: 280, sm: 320 },

                flexShrink: 0,

                height: '100%',

                display: 'flex',

                position: 'relative',

                '&:hover': {

                  zIndex: 10,

                  '& > *': {

                    position: 'relative',

                    zIndex: 10

                  }

                }

              }}

            >

              {renderEventCard(event, false, index)}

            </Box>

          ))}

        </Box>

      </Box>

    );

  };



  // Render featured events section with grid layout (3 columns) - REMOVED: Not used
  // eslint-disable-next-line no-unused-vars
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

            position: 'relative',

            overflow: 'visible',

            '& > .MuiGrid-item': {

              display: 'flex',

              height: 'auto'

            }

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

                alignItems: 'stretch',

                maxWidth: { md: '33.333%' }, // Đảm bảo đúng 3 cột

              }}

            >

              <Box sx={{ 
                width: '100%', 
                maxWidth: 380,
                height: '100%',
                display: 'flex',
                position: 'relative',
                '&:hover': {
                  zIndex: 10,
                  '& > *': {
                    position: 'relative',
                    zIndex: 10
                  }
                }
              }}>

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
    // Don't show results in main content if search dropdown is open
    const hasFilters = searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || campusFilter !== 'all' || priceFilter !== 'all';
    
    // Hide results in main content when search dropdown is open
    if (isSearchDropdownOpen && searchTerm) {
      return null;
    }



    // If filters are active, show filtered results

    if (hasFilters) {

      return (

        <Box sx={{ 
          mb: 6,
          animation: 'fadeIn 0.4s ease-in',
          '@keyframes fadeIn': {
            '0%': {
              opacity: 0,
            },
            '100%': {
              opacity: 1,
            },
          },
        }}>

          <Typography 

            variant="h5" 

            sx={{ 

              fontWeight: 700,

              color: 'text.primary',

              fontSize: { xs: '1.25rem', md: '1.5rem' },

              mb: 3,
              animation: 'slideInLeft 0.5s ease-out',
              '@keyframes slideInLeft': {
                '0%': {
                  opacity: 0,
                  transform: 'translateX(-20px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateX(0)',
                },
              },

            }}

          >

            Kết quả tìm kiếm ({filteredEvents.length})

          </Typography>

          <Grid 

            container 

            spacing={3}

            sx={{

              justifyContent: 'flex-start',

              alignItems: 'stretch',

              position: 'relative',

              overflow: 'visible',

              '& > .MuiGrid-item': {

                display: 'flex',

                height: 'auto'

              }

            }}

          >

            {filteredEvents.map((event, index) => renderEventCard(event, false, index))}

          </Grid>

        </Box>

      );

    }



    // Otherwise - Don't show anything if no filters are active
    // Sections are already shown in EventCarousel above
    return null;

  };

  // Helper để convert event format cho HeroEvents và EventCarousel
  // FIXED: Use backgroundImage (1280x720) as main display image everywhere
  // Memoized để tránh tạo function mới mỗi render
  // MUST be defined before early return to comply with React Hooks rules
  const convertEventForDisplay = useCallback((event) => {
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
    
    // Calculate price from ticketTypes - Only show "Miễn phí" if ALL tickets are free
    // If any ticket is paid, don't show price badge at all
    let displayPrice = null;
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      // Check if ALL tickets are free
      const allTicketsFree = event.ticketTypes.every(t => 
        (t.price === 0 || t.price === null || t.isFree === true)
      );
      
      if (allTicketsFree) {
        // Only set price to 0 if ALL tickets are free
        displayPrice = 0;
      } else {
        // Has paid tickets, don't show price badge (set to null)
        displayPrice = null;
      }
    } else if (event.price !== undefined && event.price !== null) {
      // Fallback to event.price if ticketTypes is not available
      // Only show "Miễn phí" if price is exactly 0
      if (event.price === 0) {
        displayPrice = 0;
      } else {
        // Has price, don't show badge
        displayPrice = null;
      }
    }
    
    // Get campus from event - check multiple possible locations
    // Match logic with EventDetailsPage: event.campus || event.eventDetails?.province
    const eventCampus = event.campus || 
                       event.eventDetails?.campus || 
                       event.eventDetails?.province || 
                       event.locationDetails?.campus || 
                       null;
    
    // Debug: Log campus detection for troubleshooting
    if (!eventCampus && event.eventId) {
      console.log('HomePage - Campus not found for event:', {
        eventId: event.eventId,
        title: event.title,
        hasCampus: !!event.campus,
        hasEventDetails: !!event.eventDetails,
        eventDetailsCampus: event.eventDetails?.campus,
        eventDetailsProvince: event.eventDetails?.province,
        fullEvent: event
      });
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
      price: displayPrice, // Only 0 if all free, null otherwise (don't show badge)
      campus: eventCampus // Use campus from database, not location
    };
  }, []);

  // Hàm constants để render loading state với giao diện đẹp và chuyên nghiệp

  if (loading) {

    return (

      <Box sx={{ 
        backgroundColor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#FFFFFF',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative'
      }}>

        <Header />

        <Box sx={{ 

          display: 'flex', 

          justifyContent: 'center', 

          alignItems: 'center', 

          minHeight: 'calc(100vh - 64px)',
          position: 'relative',
          overflow: 'hidden'
        }}>

          {/* Animated Background Gradient */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.palette.mode === 'dark' 
                ? 'radial-gradient(circle at 50% 50%, rgba(255, 122, 0, 0.1) 0%, transparent 70%)'
                : 'radial-gradient(circle at 50% 50%, rgba(255, 122, 0, 0.05) 0%, transparent 70%)',
              animation: 'pulse 3s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 0.5,
                  transform: 'scale(1)',
                },
                '50%': {
                  opacity: 1,
                  transform: 'scale(1.1)',
                },
              },
            }}
          />

          {/* Floating Particles */}
          {[...Array(6)].map((_, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF7A00 0%, #FF9500 100%)',
                opacity: 0.6,
                animation: `float${i} ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
                '@keyframes float0': {
                  '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(-30px) translateX(20px) scale(1.2)', opacity: 1 },
                },
                '@keyframes float1': {
                  '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(30px) translateX(-20px) scale(1.2)', opacity: 1 },
                },
                '@keyframes float2': {
                  '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(-40px) translateX(-15px) scale(1.2)', opacity: 1 },
                },
                '@keyframes float3': {
                  '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(40px) translateX(15px) scale(1.2)', opacity: 1 },
                },
                '@keyframes float4': {
                  '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(-25px) translateX(25px) scale(1.2)', opacity: 1 },
                },
                '@keyframes float5': {
                  '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: 0.6 },
                  '50%': { transform: 'translateY(25px) translateX(-25px) scale(1.2)', opacity: 1 },
                },
              }}
            />
          ))}

          <Stack alignItems="center" spacing={4} sx={{ position: 'relative', zIndex: 1 }}>

            {/* Multi-Ring Loading Animation */}
            <Box sx={{ position: 'relative', width: 120, height: 120 }}>
              {/* Outer Ring */}
              <CircularProgress
                size={120}
                thickness={2}
                sx={{
                  position: 'absolute',
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 122, 0, 0.3)' : 'rgba(255, 122, 0, 0.2)',
                  animation: 'spin 2s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              
              {/* Middle Ring */}
              <CircularProgress
                size={90}
                thickness={3}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 122, 0, 0.6)' : 'rgba(255, 122, 0, 0.4)',
                  animation: 'spinReverse 1.5s linear infinite',
                  '@keyframes spinReverse': {
                    '0%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
                    '100%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
                  },
                }}
              />
              
              {/* Inner Ring */}
              <CircularProgress
                size={60}
                thickness={4}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#FF7A00',
                  animation: 'spin 1s linear infinite',
                }}
              />

              {/* Center Dot */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF7A00 0%, #FF9500 100%)',
                  boxShadow: `0 0 20px ${theme.palette.mode === 'dark' ? 'rgba(255, 122, 0, 0.8)' : 'rgba(255, 122, 0, 0.5)'}`,
                  animation: 'pulseDot 1.5s ease-in-out infinite',
                  '@keyframes pulseDot': {
                    '0%, 100%': {
                      transform: 'translate(-50%, -50%) scale(1)',
                      opacity: 1,
                    },
                    '50%': {
                      transform: 'translate(-50%, -50%) scale(1.3)',
                      opacity: 0.7,
                    },
                  },
                }}
              />
            </Box>

            {/* Loading Text with Animation */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #FF7A00 0%, #FF9500 50%, #FFB84D 100%)'
                    : 'linear-gradient(135deg, #FF7A00 0%, #FF9500 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                  animation: 'fadeInUp 0.8s ease-out',
                  '@keyframes fadeInUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(20px)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                }}
              >
                Đang tải thông tin...
              </Typography>
              
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  animation: 'fadeInUp 0.8s ease-out 0.2s both',
                  opacity: 0.7,
                }}
              >
                Vui lòng đợi trong giây lát
              </Typography>

              {/* Animated Dots */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 0.5,
                  mt: 2,
                  '& > *': {
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: theme.palette.mode === 'dark' ? 'rgba(255, 122, 0, 0.6)' : 'rgba(255, 122, 0, 0.4)',
                  },
                }}
              >
                {[...Array(3)].map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      animation: `bounce 1.4s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                      '@keyframes bounce': {
                        '0%, 80%, 100%': {
                          transform: 'scale(0.8)',
                          opacity: 0.5,
                        },
                        '40%': {
                          transform: 'scale(1.2)',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

          </Stack>

        </Box>

      </Box>

    );

  }

  // Hàm constants để render home page

  return (

    <Box sx={{ 
      backgroundColor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#FFFFFF',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      <Header 

        searchTerm={searchTerm}

        onSearchChange={setSearchTerm}
        
        onDropdownOpenChange={setIsSearchDropdownOpen}

      />

      

      {/* Hero Featured Events Section - FPT Play Style */}
      {featuredEventsForHero.length > 0 && (
        <Box sx={{ 
          backgroundColor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#FFFFFF',
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden'
        }}>
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

      {/* Filter Bar Section - Positioned between Hero and "Sự kiện nổi bật" */}
      <Box sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#FFFFFF', py: { xs: 3, md: 4 }, px: { xs: 2, md: 4 }, borderTop: `1px solid ${theme.palette.divider}` }}>
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

      {/* Events Grid Section - Kết quả tìm kiếm - Positioned right below filter bar */}
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

      {/* Sự kiện nổi bật - Hiển thị sau filter bar */}
      {featuredEventsForHero.length > 0 && (
        <Box sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#FFFFFF', py: { xs: 4, md: 8 }, px: { xs: 2, md: 4 } }}>
          <Container maxWidth="xl" sx={{ px: { xs: 0, md: 2 } }}>
            <EventCarousel
              title="🔥 Sự kiện nổi bật"
              events={featuredEventsForHero.map(convertEventForDisplay)}
              icon={<TrendingUp sx={{ fontSize: 32 }} />}
              showAutoPlay={true}
            />
          </Container>
        </Box>
      )}

      {/* Event Carousels Section - FPT Play Style - Cải thiện spacing */}
      <Box sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#FFFFFF', py: { xs: 4, md: 8 }, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 0, md: 2 } }}>
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



      {/* Footer */}

      <Footer />

    </Box>

  );

};



export default HomePage;

