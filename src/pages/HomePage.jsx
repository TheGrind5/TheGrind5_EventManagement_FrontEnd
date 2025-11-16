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
  const filteredEvents = useMemo(() => {
    return validEvents.filter(event => {
      // 1. SEARCH FILTER - Tìm kiếm trong title, description, category
      if (searchTerm && searchTerm.trim() !== '') {
        const search = searchTerm.toLowerCase().trim();
        const title = (event.title || '').toLowerCase();
        const desc = (event.description || '').toLowerCase();
        const cat = (event.category || '').toLowerCase();
        
        if (!title.includes(search) && !desc.includes(search) && !cat.includes(search)) {
          return false;
        }
      }

      // 2. CATEGORY FILTER - Lọc theo danh mục
      if (categoryFilter !== 'all') {
        const eventCategory = (event.category || '').toLowerCase();
        const filterCategory = categoryFilter.toLowerCase();
        
        if (eventCategory !== filterCategory) {
          return false;
        }
      }

      // 3. PRICE FILTER - Lọc theo giá vé
      if (priceFilter !== 'all') {
        const ticketTypes = event.ticketTypes || event.TicketTypes || [];
        
        if (ticketTypes.length === 0) {
          return false; // Không có vé thì không hiển thị khi filter giá
        }
        
        const prices = ticketTypes.map(t => t.price ?? t.Price ?? 0);
        
        let hasMatchingPrice = false;
        
        if (priceFilter === 'free') {
          hasMatchingPrice = prices.some(p => p === 0);
        } else if (priceFilter === 'below50') {
          hasMatchingPrice = prices.some(p => p > 0 && p < 50000);
        } else if (priceFilter === '50to100') {
          hasMatchingPrice = prices.some(p => p >= 50000 && p <= 100000);
        } else if (priceFilter === 'above100') {
          hasMatchingPrice = prices.some(p => p > 100000);
        }
        
        if (!hasMatchingPrice) {
          return false;
        }
      }

      // 4. STATUS FILTER - Lọc theo trạng thái sự kiện
      if (statusFilter !== 'all') {
        const eventStatus = getEventStatus(event.startTime, event.endTime);
        
        if (eventStatus !== statusFilter) {
          return false;
        }
      }

      // 5. DATE FILTER - Lọc theo thời gian
      if (dateFilter !== 'all') {
        const now = new Date();
        const startTime = new Date(event.startTime);
        
        if (dateFilter === 'today') {
          const isToday = startTime.toDateString() === now.toDateString();
          if (!isToday) {
            return false;
          }
        } else if (dateFilter === 'upcoming') {
          if (startTime <= now) {
            return false;
          }
        } else if (dateFilter === 'past') {
          if (startTime >= now) {
            return false;
          }
        }
      }

      // 6. CAMPUS FILTER - Lọc theo địa điểm
      if (campusFilter !== 'all') {
        const location = (event.location || '').toLowerCase();
        const campus = (event.campus || '').toLowerCase();
        const filterValue = campusFilter.toLowerCase();
        
        if (!location.includes(filterValue) && !campus.includes(filterValue)) {
          return false;
        }
      }

      // Tất cả filters đều pass
      return true;
    });
  }, [validEvents, searchTerm, categoryFilter, priceFilter, statusFilter, dateFilter, campusFilter, getEventStatus]);



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
  // FIXED: Hiển thị sự kiện CHƯA KẾT THÚC (check endTime > now), sắp xếp theo số lượng vé
  const featuredEventsForHero = useMemo(() => {
    // Lấy thời gian thực hiện tại
    const now = new Date();
    
    // Debug: Log tất cả events và thời gian của chúng
    console.log('=== HERO SECTION FULL DEBUG ===');
    console.log('Current time (now):', now.toISOString(), '|', now.toString());
    console.log('Total events in baseEventsForCarousel:', baseEventsForCarousel.length);
    
    // Log tất cả events với thông tin chi tiết
    baseEventsForCarousel.forEach((event, index) => {
      const start = event.startTime ? new Date(event.startTime) : null;
      const end = event.endTime ? new Date(event.endTime) : null;
      
      // FIXED: Sự kiện vẫn hợp lệ nếu chưa kết thúc (endTime > now)
      const isNotEnded = end ? end.getTime() > now.getTime() : (start ? start.getTime() > now.getTime() : false);
      
      const hasTicketTypes = event.ticketTypes && Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0;
      const activeTicketTypes = hasTicketTypes 
        ? event.ticketTypes.filter(tt => tt.status === 'Active')
        : [];
      const totalTickets = activeTicketTypes.reduce((sum, tt) => sum + (tt.quantity || 0), 0);
      
      console.log(`Event ${index + 1}:`, {
        eventId: event.eventId,
        title: event.title?.substring(0, 40),
        startTime: event.startTime,
        endTime: event.endTime,
        startTimeParsed: start ? start.toISOString() : 'Invalid',
        endTimeParsed: end ? end.toISOString() : 'Invalid',
        isNotEnded,
        timeDiff: start ? `${Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60))} hours until start` : 'N/A',
        timeUntilEnd: end ? `${Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60))} hours until end` : 'N/A',
        hasTicketTypes,
        ticketTypesCount: event.ticketTypes?.length || 0,
        activeTicketTypesCount: activeTicketTypes.length,
        totalTickets,
        status: event.status
      });
    });
    
    // FIXED: Lọc lấy sự kiện CHƯA KẾT THÚC (endTime > now HOẶC startTime > now nếu không có endTime)
    const upcomingEvents = baseEventsForCarousel.filter(event => {
      if (!event.startTime) {
        console.warn('❌ Hero Section - Event missing startTime:', event.eventId, event.title);
        return false;
      }
      
      const start = new Date(event.startTime);
      if (isNaN(start.getTime())) {
        console.warn('❌ Hero Section - Event has invalid startTime:', event.eventId, event.title, event.startTime);
        return false;
      }
      
      // FIXED: Check endTime thay vì startTime
      const end = event.endTime ? new Date(event.endTime) : null;
      
      let isNotEnded;
      if (end && !isNaN(end.getTime())) {
        // Nếu có endTime hợp lệ: kiểm tra endTime > now
        isNotEnded = end.getTime() > now.getTime();
        if (!isNotEnded) {
          console.log(`❌ Filtered out (already ended): ${event.title?.substring(0, 40)} - endTime: ${end.toISOString()}`);
        }
      } else {
        // Nếu không có endTime: fallback kiểm tra startTime > now
        isNotEnded = start.getTime() > now.getTime();
        if (!isNotEnded) {
          console.log(`❌ Filtered out (no endTime, already started): ${event.title?.substring(0, 40)} - startTime: ${start.toISOString()}`);
        }
      }
      
      return isNotEnded;
    });
    
    console.log('✅ Events NOT ENDED (endTime > now) after time filter:', upcomingEvents.length);
    
    // Tính tổng số lượng vé cho mỗi sự kiện
    const eventsWithTicketCount = upcomingEvents.map(event => {
      // Chỉ tính tổng số lượng vé từ ticketTypes có status "Active"
      const hasTicketTypes = event.ticketTypes && Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0;
      const activeTicketTypes = hasTicketTypes 
        ? event.ticketTypes.filter(tt => tt.status === 'Active')
        : [];
      const totalTickets = activeTicketTypes.reduce((sum, ticketType) => sum + (ticketType.quantity || 0), 0);
      
      const startTime = new Date(event.startTime);
      
      console.log(`Ticket count for ${event.title?.substring(0, 30)}:`, {
        hasTicketTypes,
        ticketTypesLength: event.ticketTypes?.length || 0,
        activeTicketTypesCount: activeTicketTypes.length,
        totalTickets,
        startTime: startTime.toISOString()
      });
      
      return {
        ...event,
        totalTickets,
        startTimeMs: startTime.getTime() // Lưu timestamp để sort
      };
    });
    
    // FIXED: Sắp xếp theo tiêu chí kép:
    // 1. Ưu tiên sự kiện có vé (totalTickets > 0)
    // 2. Trong cùng nhóm (có vé hoặc không có vé), sắp xếp theo số lượng vé giảm dần
    // 3. Nếu cùng số lượng vé, ưu tiên sự kiện gần hơn (startTime nhỏ hơn)
    eventsWithTicketCount.sort((a, b) => {
      // Ưu tiên events có vé trước
      const aHasTickets = a.totalTickets > 0;
      const bHasTickets = b.totalTickets > 0;
      
      if (aHasTickets !== bHasTickets) {
        return bHasTickets ? 1 : -1; // Events có vé lên trước
      }
      
      // Cùng có vé hoặc cùng không có vé: sắp xếp theo số lượng vé
      if (a.totalTickets !== b.totalTickets) {
        return b.totalTickets - a.totalTickets; // Nhiều vé hơn lên trước
      }
      
      // Cùng số lượng vé: ưu tiên event gần hơn
      return a.startTimeMs - b.startTimeMs; // Gần hơn lên trước
    });
    
    console.log('Events sorted by: has tickets > ticket count > nearest time:', eventsWithTicketCount.map(e => ({
      title: e.title?.substring(0, 30),
      startTime: e.startTime,
      totalTickets: e.totalTickets,
      hasTickets: e.totalTickets > 0
    })));
    
    // Lấy 5 sự kiện đầu tiên sau khi sắp xếp
    const selectedEvents = eventsWithTicketCount.slice(0, 5);
    
    console.log('✅ FINAL Selected events (sorted by ticket quantity):', selectedEvents.map(e => ({
      eventId: e.eventId,
      title: e.title?.substring(0, 40),
      startTime: e.startTime,
      totalTickets: e.totalTickets,
      ticketTypesCount: e.ticketTypes?.length || 0
    })));
    console.log('========================');
    
    return selectedEvents;
  }, [baseEventsForCarousel]);

  // ============================================================
  // HELPER FUNCTIONS - Xác định badge và trạng thái sự kiện
  // ============================================================
  
  const getEventBadgeType = useCallback((event) => {
    const now = new Date();
    const start = event.startTime ? new Date(event.startTime) : null;
    const end = event.endTime ? new Date(event.endTime) : null;
    const createdAt = event.createdAt ? new Date(event.createdAt) : null;
    
    if (!start) return null;
    
    const hoursUntilStart = start ? (start.getTime() - now.getTime()) / (1000 * 60 * 60) : Infinity;
    const daysUntilStart = hoursUntilStart / 24;
    const hoursSinceCreated = createdAt ? (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60) : Infinity;
    const hoursSinceEnded = end ? (now.getTime() - end.getTime()) / (1000 * 60 * 60) : -Infinity;
    
    // ĐÃ KẾT THÚC: đã qua thời gian kết thúc
    if (end && end < now) {
      return 'ĐÃ KẾT THÚC';
    }
    
    // ĐANG DIỄN RA: đã bắt đầu nhưng chưa kết thúc
    if (start <= now && end && end > now) {
      return 'ĐANG DIỄN RA';
    }
    
    // Calculate tickets info for other badges
    const hasTicketTypes = event.ticketTypes && Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0;
    const activeTickets = hasTicketTypes ? event.ticketTypes.filter(tt => tt.status === 'Active') : [];
    const totalAvailable = activeTickets.reduce((sum, tt) => sum + (tt.quantity || 0), 0);
    
    // TODO: Need originalQuantity from backend to calculate sold percentage
    // For now, assume if quantity < 30% of a high number (100), it's low stock
    // Real implementation needs: soldPercentage = (originalQuantity - currentQuantity) / originalQuantity
    const estimatedOriginal = totalAvailable > 0 ? Math.max(totalAvailable * 2, 100) : 100;
    const remainingPercentage = totalAvailable > 0 ? (totalAvailable / estimatedOriginal) * 100 : 0;
    const soldPercentage = 100 - remainingPercentage;
    
    // SẮP HẾT VÉ: < 20% vé còn lại (highest priority for upcoming events)
    if (hoursUntilStart > 0 && totalAvailable > 0 && remainingPercentage < 20) {
      return 'SẮP HẾT VÉ';
    }
    
    // HOT: > 70% vé đã bán (for upcoming events)
    if (hoursUntilStart > 0 && totalAvailable > 0 && soldPercentage > 70) {
      return 'HOT';
    }
    
    // MỚI: tạo trong 48h
    if (hoursSinceCreated <= 48) {
      return 'MỚI';
    }
    
    // SẮP DIỄN RA: trong vòng 7 ngày tới
    if (hoursUntilStart > 0 && daysUntilStart <= 7) {
      return 'SẮP DIỄN RA';
    }
    
    // Default: Không badge
    return null;
  }, []);
  
  const getDaysUntilEvent = useCallback((event) => {
    if (!event.startTime) return null;
    const now = new Date();
    const start = new Date(event.startTime);
    const days = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  }, []);
  
  const getRemainingTickets = useCallback((event) => {
    const hasTicketTypes = event.ticketTypes && Array.isArray(event.ticketTypes);
    
    // Debug: Log if ticketTypes is missing
    if (!hasTicketTypes && event.eventId) {
      console.log(`⚠️ Event ${event.eventId} (${event.title?.substring(0, 20)}) missing ticketTypes:`, {
        hasTicketTypes: !!event.ticketTypes,
        isArray: event.ticketTypes ? Array.isArray(event.ticketTypes) : false,
        ticketTypes: event.ticketTypes
      });
    }
    
    if (!hasTicketTypes) return null;
    
    const activeTickets = event.ticketTypes.filter(tt => tt.status === 'Active');
    const total = activeTickets.reduce((sum, tt) => sum + (tt.quantity || 0), 0);
    
    // Debug: Log ticket calculation
    if (event.eventId && total > 0) {
      console.log(`✅ Event ${event.eventId}: ${activeTickets.length} active ticket types, ${total} total tickets`);
    }
    
    return total;
  }, []);
  
  const isLowStock = useCallback((event) => {
    const remaining = getRemainingTickets(event);
    return remaining !== null && remaining > 0 && remaining <= 20;
  }, [getRemainingTickets]);

  // ============================================================
  // HELPER: Lọc events theo quy tắc hiển thị
  // Ẩn sự kiện đã qua > 1 ngày
  // ============================================================
  const filterValidEvents = useCallback((events) => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    return events.filter(event => {
      if (!event.endTime) return true; // Keep if no endTime
      
      const end = new Date(event.endTime);
      
      // Ẩn events đã kết thúc > 1 ngày
      if (end < oneDayAgo) {
        return false;
      }
      
      return true;
    });
  }, []);

  // ============================================================
  // SECTION 2: SỰ KIỆN NỔI BẬT
  // Sorting: Kết hợp thời gian + độ phổ biến
  // Badge: Thông minh dựa trên thời gian và metrics
  // ============================================================
  const featuredEvents = useMemo(() => {
    console.log('=== FEATURED EVENTS LOGIC ===');
    
    const now = new Date();
    
    // Filter: Chưa kết thúc, status Open, không quá 1 ngày sau kết thúc
    const validEvents = filterValidEvents(baseEventsForCarousel);
    const eligible = validEvents.filter(event => {
      if (!event.startTime || !event.endTime) return false;
      
      const end = new Date(event.endTime);
      
      // Chưa kết thúc, status Open
      return end > now && event.status === 'Open';
    });
    
    // Sort: Kết hợp độ phổ biến (vé) + thời gian gần
    const sorted = eligible.sort((a, b) => {
      const ticketsA = getRemainingTickets(a) || 0;
      const ticketsB = getRemainingTickets(b) || 0;
      const daysA = getDaysUntilEvent(a) || 999;
      const daysB = getDaysUntilEvent(b) || 999;
      
      // Score = tickets * 0.7 + (100 - days) * 0.3
      const scoreA = (ticketsA * 0.7) + ((100 - Math.min(daysA, 100)) * 0.3);
      const scoreB = (ticketsB * 0.7) + ((100 - Math.min(daysB, 100)) * 0.3);
      
      return scoreB - scoreA;
    });
    
    const selected = sorted.slice(0, 5);
    
    console.log('Featured events:', selected.map(e => ({
      title: e.title?.substring(0, 30),
      badge: getEventBadgeType(e),
      tickets: getRemainingTickets(e),
      daysUntil: getDaysUntilEvent(e)
    })));
    
    return selected;
  }, [baseEventsForCarousel, getEventBadgeType, getRemainingTickets, getDaysUntilEvent, filterValidEvents]);

  // ============================================================
  // SECTION 3: SỰ KIỆN XU HƯỚNG
  // Sorting: Tăng trưởng trong 7 ngày qua (mock: dựa vào tickets + recency)
  // Không duplicate với Featured
  // ============================================================
  const trendingEvents = useMemo(() => {
    console.log('=== TRENDING EVENTS LOGIC ===');
    
    const now = new Date();
    const featuredIds = new Set(featuredEvents.map(e => e.eventId));
    
    // Filter: Valid events, chưa kết thúc, status Open, không trùng Featured
    const validEvents = filterValidEvents(baseEventsForCarousel);
    const eligible = validEvents.filter(event => {
      if (!event.endTime) return false;
      if (featuredIds.has(event.eventId)) return false; // Không duplicate
      
      const end = new Date(event.endTime);
      return end > now && event.status === 'Open';
    });
    
    // Sort: Growth score (mock) = tickets * recency_factor
    const sorted = eligible.sort((a, b) => {
      const ticketsA = getRemainingTickets(a) || 0;
      const ticketsB = getRemainingTickets(b) || 0;
      const daysA = getDaysUntilEvent(a) || 999;
      const daysB = getDaysUntilEvent(b) || 999;
      
      // Recency bonus: events closer get higher multiplier (max 2x for < 7 days)
      const recencyA = daysA < 7 ? (2 - daysA / 7) : 1;
      const recencyB = daysB < 7 ? (2 - daysB / 7) : 1;
      
      const scoreA = ticketsA * recencyA;
      const scoreB = ticketsB * recencyB;
      
      return scoreB - scoreA;
    });
    
    const selected = sorted.slice(0, 8);
    
    console.log('Trending events count:', selected.length);
    
    return selected;
  }, [baseEventsForCarousel, featuredEvents, getRemainingTickets, getDaysUntilEvent, filterValidEvents]);

  // ============================================================
  // SECTION 4: MUSIC (và các categories khác)
  // Logic: Filter by category, sắp xếp theo thời gian gần → xa
  // Hiển thị: Countdown, sắp hết vé
  // ============================================================
  const musicEvents = useMemo(() => {
    console.log('=== MUSIC EVENTS LOGIC ===');
    
    const now = new Date();
    
    // Filter: Category = Music, valid events, chưa kết thúc
    const validEvents = filterValidEvents(baseEventsForCarousel);
    const eligible = validEvents.filter(event => {
      if (event.category !== 'Music') return false;
      if (!event.endTime) return false;
      
      const end = new Date(event.endTime);
      return end > now;
    });
    
    // Sort: Mặc định - Thời gian gần nhất trước
    const sorted = eligible.sort((a, b) => 
      new Date(a.startTime) - new Date(b.startTime)
    );
    
    const selected = sorted.slice(0, 10);
    
    console.log('Music events:', selected.length, '- Sorted by time (nearest first)');
    
    return selected;
  }, [baseEventsForCarousel, filterValidEvents]);
  
  const workshopEvents = useMemo(() => {
    const now = new Date();
    const validEvents = filterValidEvents(baseEventsForCarousel);
    const eligible = validEvents.filter(event => {
      if (event.category !== 'Workshop') return false;
      if (!event.endTime) return false;
      const end = new Date(event.endTime);
      return end > now;
    });
    
    return eligible
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 10);
  }, [baseEventsForCarousel, filterValidEvents]);
  
  const campusEvents = useMemo(() => {
    const now = new Date();
    const validEvents = filterValidEvents(baseEventsForCarousel);
    const eligible = validEvents.filter(event => {
      if (event.category !== 'Campus Event') return false;
      if (!event.endTime) return false;
      const end = new Date(event.endTime);
      return end > now;
    });
    
    return eligible
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 10);
  }, [baseEventsForCarousel, filterValidEvents]);

  // ============================================================
  // SECTION 5: DÀNH CHO BẠN
  // Sorting: Personalized ranking (location + preferences)
  // Không duplicate với Featured, Trending
  // ============================================================
  const recommendedEvents = useMemo(() => {
    console.log('=== RECOMMENDED EVENTS LOGIC ===');
    
    const now = new Date();
    const usedIds = new Set([
      ...featuredEvents.map(e => e.eventId),
      ...trendingEvents.map(e => e.eventId)
    ]);
    
    // Filter: Valid events, chưa kết thúc, status Open, không duplicate
    const validEvents = filterValidEvents(baseEventsForCarousel);
    const eligible = validEvents.filter(event => {
      if (!event.endTime) return false;
      if (usedIds.has(event.eventId)) return false;
      
      const end = new Date(event.endTime);
      return end > now && event.status === 'Open';
    });
    
    // TODO: Implement real user-based recommendation with history
    // Current: Location-based (Đà Nẵng) + Popular
    const sorted = eligible.sort((a, b) => {
      // Ưu tiên Đà Nẵng
      const aIsDN = a.location?.includes('Đà Nẵng') || a.campus?.includes('Đà Nẵng');
      const bIsDN = b.location?.includes('Đà Nẵng') || b.campus?.includes('Đà Nẵng');
      
      if (aIsDN && !bIsDN) return -1;
      if (!aIsDN && bIsDN) return 1;
      
      // Sau đó theo số lượng vé (popular)
      const ticketsA = getRemainingTickets(a) || 0;
      const ticketsB = getRemainingTickets(b) || 0;
      
      if (ticketsA !== ticketsB) return ticketsB - ticketsA;
      
      // Cuối cùng theo thời gian
      return new Date(a.startTime) - new Date(b.startTime);
    });
    
    const selected = sorted.slice(0, 8);
    
    console.log('Recommended events:', selected.length);
    
    return selected;
  }, [baseEventsForCarousel, featuredEvents, trendingEvents, getRemainingTickets, filterValidEvents]);

  // ============================================================
  // SECTION 6: SỰ KIỆN SẮP DIỄN RA
  // Sorting: Mặc định - Thời gian gần nhất trước
  // Hiển thị countdown cho events < 7 ngày
  // Không duplicate với các section khác
  // ============================================================
  const upcomingEvents = useMemo(() => {
    console.log('=== UPCOMING EVENTS LOGIC ===');
    
    const now = new Date();
    const usedIds = new Set([
      ...featuredEvents.map(e => e.eventId),
      ...trendingEvents.map(e => e.eventId),
      ...recommendedEvents.map(e => e.eventId)
    ]);
    
    // Filter: Valid events, chưa bắt đầu, trong 30 ngày, status Open, không duplicate
    const validEvents = filterValidEvents(baseEventsForCarousel);
    const eligible = validEvents.filter(event => {
      if (!event.startTime) return false;
      if (usedIds.has(event.eventId)) return false;
      
      const start = new Date(event.startTime);
      const daysUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      return start > now && 
             daysUntilStart <= 30 && 
             event.status === 'Open';
    });
    
    // Sort: Mặc định - Thời gian gần nhất trước
    const sorted = eligible.sort((a, b) => {
      const startA = new Date(a.startTime);
      const startB = new Date(b.startTime);
      return startA - startB;
    });
    
    const selected = sorted.slice(0, 8);
    
    console.log('Upcoming events (sorted by time):', selected.map(e => ({
      title: e.title?.substring(0, 30),
      startTime: e.startTime,
      daysUntil: getDaysUntilEvent(e),
      showCountdown: getDaysUntilEvent(e) <= 7 // Hiển thị countdown cho < 7 ngày
    })));
    
    return selected;
  }, [baseEventsForCarousel, featuredEvents, trendingEvents, recommendedEvents, getDaysUntilEvent, filterValidEvents]);

  // Render filter UI with TicketBox styling

  const renderFilterControls = () => (

    <Paper 

      sx={{ 

        p: { xs: 1, md: 1.5 }, 

        mb: 1,

        borderRadius: 2,

        border: `1px solid ${theme.palette.divider}`,

        boxShadow: 'none',

        backgroundColor: theme.palette.mode === 'dark' ? '#1C1C1C' : '#FFFFFF',

      }}

    >

      <Stack spacing={2}>

        {/* Filter bar - Clean professional design */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(6, 1fr)'
          },
          gap: 2,
          alignItems: 'start'
        }}>
          {/* Category Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>Danh mục</InputLabel>
            <Select
              value={categoryFilter}
              label="Danh mục"
              onChange={e => setCategoryFilter(e.target.value)}
            >
              {categoryOptions.map(o => (
                <MenuItem value={o.value} key={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Price Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>Giá tiền</InputLabel>
            <Select
              value={priceFilter}
              label="Giá tiền"
              onChange={e => setPriceFilter(e.target.value)}
            >
              {priceOptions.map(o => (
                <MenuItem value={o.value} key={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={statusFilter}
              label="Trạng thái"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="Active">Đang diễn ra</MenuItem>
              <MenuItem value="Upcoming">Sắp diễn ra</MenuItem>
              <MenuItem value="Completed">Đã kết thúc</MenuItem>
            </Select>
          </FormControl>

          {/* Date Filter */}
          <FormControl size="small" fullWidth>
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

          {/* Campus Filter */}
          <FormControl size="small" fullWidth>
            <InputLabel>Campus</InputLabel>
            <Select
              value={campusFilter}
              label="Campus"
              onChange={(e) => setCampusFilter(e.target.value)}
            >
              {campuses.map((campus) => (
                <MenuItem key={campus.value} value={campus.value}>
                  {campus.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Reset Button */}
          <Button
            variant="outlined"
            size="medium"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
              setDateFilter('all');
              setCampusFilter('all');
              setPriceFilter('all');
            }}
            sx={{ 
              height: '40px',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Đặt lại
          </Button>
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
      // Normalize Windows-style backslashes and trim quotes/spaces
      const normalized = String(rawImage).trim().replace(/^"+|"+$/g, '').replace(/\\/g, '/');
      if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
        // Already a full URL
        imageUrl = normalized;
      } else if (normalized.startsWith('/')) {
        // Relative path starting with /
        imageUrl = `http://localhost:5000${normalized}`;
      } else {
        // Relative path without leading /
        imageUrl = `http://localhost:5000/${normalized}`;
      }
    }
    
    // UPDATED: Determine badge using intelligent logic
    let badgeValue = null;
    if (event.badge && event.badge.trim() !== '') {
      // Use existing badge if provided
      badgeValue = event.badge;
    } else {
      // Auto-detect badge based on event status using helper function
      badgeValue = getEventBadgeType(event);
    }
    
    // Calculate days until event for countdown display
    const daysUntil = getDaysUntilEvent(event);
    
    // Calculate remaining tickets for "Sắp hết vé" indicator
    const remainingTickets = getRemainingTickets(event);
    const lowStock = isLowStock(event);
    
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
      badge: badgeValue, // Intelligent badge based on event state
      price: displayPrice, // Only 0 if all free, null otherwise (don't show badge)
      campus: eventCampus, // Use campus from database, not location
      // New fields for enhanced display
      daysUntil, // Days until event starts (for countdown)
      remainingTickets, // Number of tickets remaining
      lowStock, // Boolean: true if < 20 tickets remaining
    };
  }, [getEventBadgeType, getDaysUntilEvent, getRemainingTickets, isLowStock]);

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
      <Box sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#FFFFFF', py: { xs: 1, md: 1 }, px: { xs: 2, md: 4 }, borderTop: `1px solid ${theme.palette.divider}` }}>
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
          <Container maxWidth="xl" sx={{ py: { xs: 1, md: 3 } }}>
            {/* Events Grid - Only shows filtered results or "not found" message */}
            {renderEventsGrid()}
          </Container>
        </Box>
      ) : null}

      {/* Sự kiện nổi bật - Hiển thị sau filter bar */}
      {featuredEvents.length > 0 && (
        <Box sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#FFFFFF', py: { xs: 1, md: 1 }, px: { xs: 2, md: 4 } }}>
          <Container maxWidth="xl" sx={{ px: { xs: 0, md: 2 } }}>
            <EventCarousel
              title="🔥 Sự kiện nổi bật"
              events={featuredEvents.map(convertEventForDisplay)}
              badge={featuredEvents.length}
              icon={<TrendingUp sx={{ fontSize: 32 }} />}
              showAutoPlay={true}
            />
          </Container>
        </Box>
      )}

      {/* Event Carousels Section - FPT Play Style - Cải thiện spacing */}
      <Box sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#FFFFFF', py: { xs: 1, md: 1 }, px: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 0, md: 2 } }}>
          {/* Sự kiện xu hướng */}
          {trendingEvents.length > 0 && (
            <EventCarousel
              title="⚡ Sự kiện xu hướng"
              events={trendingEvents.map(convertEventForDisplay)}
              badge={trendingEvents.length}
              icon={<TrendingUp sx={{ fontSize: 32 }} />}
              showAutoPlay={true}
            />
          )}

          {/* Workshop Events */}
          {workshopEvents.length > 0 && (
            <EventCarousel
              title="🎓 Workshop"
              events={workshopEvents.map(convertEventForDisplay)}
              badge={workshopEvents.length}
              icon={<Event sx={{ fontSize: 32 }} />}
              showAutoPlay={false}
            />
          )}

          {/* Music Events */}
          {musicEvents.length > 0 && (
            <EventCarousel
              title="🎵 Music"
              events={musicEvents.map(convertEventForDisplay)}
              badge={musicEvents.length}
              icon={<Event sx={{ fontSize: 32 }} />}
              showAutoPlay={false}
            />
          )}

          {/* Campus Events */}
          {campusEvents.length > 0 && (
            <EventCarousel
              title="🏫 Campus Event"
              events={campusEvents.map(convertEventForDisplay)}
              badge={campusEvents.length}
              icon={<Event sx={{ fontSize: 32 }} />}
              showAutoPlay={false}
            />
          )}

          {/* Dành cho bạn */}
          {recommendedEvents.length > 0 && (
            <EventCarousel
              title="✨ Dành cho bạn"
              events={recommendedEvents.map(convertEventForDisplay)}
              badge={recommendedEvents.length}
              icon={<Event sx={{ fontSize: 32 }} />}
              showAutoPlay={true}
              bottomTight={true}
            />
          )}

          {/* Sự kiện sắp diễn ra */}
          {upcomingEvents.length > 0 && (
            <EventCarousel
              title="📅 Sự kiện sắp diễn ra"
              events={upcomingEvents.map(convertEventForDisplay)}
              badge={upcomingEvents.length}
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

