// React & Router
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

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
  const [campusFilter, setCampusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const isInitialMount = useRef(true);
  const prevPathname = useRef(location.pathname);

  // Hàm để fetch events từ backend
  const fetchEvents = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      console.log('HomePage - Fetching events...');
      const response = await eventsAPI.getAll();
      console.log('HomePage - Full response:', response);
      console.log('HomePage - Response data:', response.data);
      console.log('HomePage - Response data type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
      
      // Handle both array and paginated response
      let events = [];
      if (Array.isArray(response.data)) {
        events = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        events = response.data.data;
      } else if (response.data && Array.isArray(response)) {
        events = response;
      }
      
      console.log('HomePage - Parsed events count:', events.length);
      setEvents(events);
      setError(null);
    } catch (err) {
      console.error('HomePage - Error fetching events:', err);
      console.error('HomePage - Error details:', JSON.stringify(err, null, 2));
      
      // Cải thiện error message
      let errorMessage = 'Không thể tải danh sách sự kiện';
      if (err.message) {
        if (err.message.includes('Network') || err.message.includes('connection')) {
          errorMessage = 'Lỗi kết nối - Vui lòng kiểm tra backend có đang chạy không. Đảm bảo backend đang chạy tại http://localhost:5000';
        } else {
          errorMessage = err.message;
        }
      } else if (err.code === 0 || !err.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy tại http://localhost:5000 không.';
      }
      
      setError(errorMessage);
      setEvents([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  //useEffect hook để fetch events từ backend khi component mount
  useEffect(() => {
    fetchEvents(true);
    isInitialMount.current = false;
  }, []);

  // Refetch events khi quay lại trang HomePage (để cập nhật dữ liệu mới sau khi chỉnh sửa)
  useEffect(() => {
    // Kiểm tra xem có event nào vừa được update không
    const eventUpdatedFlag = sessionStorage.getItem('eventUpdated');
    if (eventUpdatedFlag && location.pathname === '/') {
      console.log('HomePage - Event was updated, force reloading events...');
      sessionStorage.removeItem('eventUpdated'); // Xóa flag sau khi dùng
      fetchEvents(false);
      return;
    }
    
    // Chỉ refetch khi:
    // 1. Đang ở trang home (pathname === '/')
    // 2. Không phải lần mount đầu tiên
    // 3. Đã có events (tránh refetch khi chưa có dữ liệu)
    // 4. Pathname thay đổi từ trang khác về home (prevPathname !== '/')
    if (
      location.pathname === '/' && 
      !isInitialMount.current && 
      prevPathname.current !== '/'
    ) {
      console.log('HomePage - Returning to home page, refetching events to get updates...');
      fetchEvents(false); // Không hiển thị loading khi refetch
    }
    
    // Cập nhật prevPathname
    prevPathname.current = location.pathname;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Thêm listener để refetch khi trang được focus lại (khi người dùng quay lại tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && location.pathname === '/') {
        // Chỉ refetch nếu đã mount xong (có events) để tránh refetch ngay khi mount
        setTimeout(() => {
          console.log('HomePage - Page became visible, checking if refetch needed...');
          fetchEvents(false);
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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

    // Category/Price filter
    if (categoryFilter === 'free') {
      if (!event.ticketTypes || !event.ticketTypes.some(t => t.price === 0 || t.isFree)) return false;
    } else if (categoryFilter === 'below50') {
      if (!event.ticketTypes || !event.ticketTypes.some(t => t.price > 0 && t.price < 50000)) return false;
    } else if (categoryFilter === '50to100') {
      if (!event.ticketTypes || !event.ticketTypes.some(t => t.price >= 50000 && t.price <= 100000)) return false;
    } else if (categoryFilter === 'above100') {
      if (!event.ticketTypes || !event.ticketTypes.some(t => t.price > 100000)) return false;
    } else if (categoryFilter !== 'all') {
      // các danh mục khác
      if (event.category !== categoryFilter) return false;
    }

    // Price filter
    if (priceFilter === 'free') {
      if (!event.ticketTypes || !event.ticketTypes.some(t => t.price === 0 || t.isFree)) return false;
    } else if (priceFilter === 'below50') {
      if (!event.ticketTypes || !event.ticketTypes.some(t => t.price > 0 && t.price < 50000)) return false;
    } else if (priceFilter === '50to100') {
      if (!event.ticketTypes || !event.ticketTypes.some(t => t.price >= 50000 && t.price <= 100000)) return false;
    } else if (priceFilter === 'above100') {
      if (!event.ticketTypes || !event.ticketTypes.some(t => t.price > 100000)) return false;
    }

    return matchesSearch && matchesStatus && matchesDate && matchesCampus;
  });

  // Chuẩn hóa đường dẫn ảnh từ API (xử lý dấu \\ của Windows, thiếu dấu / đầu)
  const buildImageUrl = (rawPath) => {
    if (!rawPath) return null;
    if (rawPath.startsWith('http')) return rawPath;
    // thay \\ -> / và đảm bảo có leading '/'
    const normalized = rawPath.replace(/\\/g, '/');
    const withLeading = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `http://localhost:5000${withLeading}`;
  };

  // Hàm constants để render individual event card
  const renderEventCard = (event) => {
    // Tính toán status dựa trên thời gian thực tế
    const currentStatus = getEventStatus(event.startTime, event.endTime);
    
    // Đơn giản hóa: Lấy ảnh trực tiếp từ database giống EventDetailsPage
    // Ưu tiên backgroundImage, fallback về eventImage (lấy từ eventDetails hoặc root level)
    const backgroundImage = event.eventDetails?.backgroundImage || event.backgroundImage || null;
    const eventImage = event.eventDetails?.eventImage || event.eventImage || null;
    const imageToUse = backgroundImage || eventImage;
    
    
    // Build URL đơn giản - giống EventDetailsPage (lấy trực tiếp từ database)
    const imageUrl = buildImageUrl(imageToUse);
    
    // Dùng cùng imageUrl cho cả default và hover
    const backgroundImageUrl = imageUrl;
    
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
            borderColor: 'primary.main'
          }
        }}
      >
        {/* Event Image Container with Hover Effect */}
        <Box 
          sx={{ 
            height: 200,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover .hover-overlay': {
              opacity: 1
            },
            '&:hover .default-image': {
              opacity: 0,
              transform: 'scale(1.05)'
            },
            '&:hover .hover-image': {
              opacity: 1,
              transform: 'scale(1.1)'
            }
          }}
        >
          {/* Placeholder - luôn hiển thị, sẽ hiện khi không có ảnh hoặc ảnh lỗi */}
          <Box 
            className="event-placeholder"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              zIndex: imageUrl ? 1 : 2  // Hiển thị trên cùng nếu không có ảnh
            }}
          >
            <Event sx={{ fontSize: 48, mb: 1, opacity: 0.8 }} />
            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>Sự Kiện</Typography>
          </Box>
          
          {/* Default Image - Ảnh nền (1280x720) - mặc định ở danh sách */}
          {imageUrl && (
            <img
              className="default-image"
              src={imageUrl}
              alt={event.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 2,
                display: 'block',
                opacity: 1
              }}
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                // Ẩn ảnh và hiển thị placeholder
                e.target.style.display = 'none';
                e.target.style.opacity = '0';
                // Hiển thị placeholder
                const placeholder = e.target.parentElement?.querySelector('.event-placeholder');
                if (placeholder) {
                  placeholder.style.zIndex = '10';
                }
              }}
              onLoad={(e) => {
                console.log('Default image loaded:', imageUrl);
                e.target.style.display = 'block';
                e.target.style.opacity = '1';
                // Ẩn placeholder khi ảnh load thành công
                const placeholder = e.target.parentElement?.querySelector('.event-placeholder');
                if (placeholder) {
                  placeholder.style.zIndex = '1';
                }
              }}
            />
          )}
          
          {/* Hover Image - Vẫn dùng backgroundImage (1280x720) với hiệu ứng zoom */}
          {backgroundImageUrl && (
            <img
              className="hover-image"
              src={backgroundImageUrl}
              alt={event.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 3,
                display: 'block',
                opacity: 0,
                transform: 'scale(1.05)'
              }}
              onError={(e) => {
                console.error('Background image failed to load:', backgroundImageUrl);
                e.target.style.display = 'none';
              }}
              onLoad={(e) => {
                console.log('Hover image loaded:', backgroundImageUrl);
                e.target.style.display = 'block';
              }}
            />
          )}
          
          {/* Hover Overlay - Hiển thị thông tin sự kiện khi hover */}
          <Box 
            className="hover-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
              zIndex: 4,
              opacity: 0,
              transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              p: 2,
              color: 'white'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                fontSize: '1.1rem'
              }}
            >
              {event.title}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 1.5,
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: '0.85rem',
                lineHeight: 1.4
              }}
            >
              {event.description}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <AccessTime sx={{ fontSize: '0.9rem' }} />
              <Typography variant="caption" sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {formatDate(event.startTime)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn sx={{ fontSize: '0.9rem' }} />
              <Typography variant="caption" sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {event.location || 'Địa điểm chưa cập nhật'}
              </Typography>
            </Box>
          </Box>
          {/* Overlay with chips - Always visible on top */}
          <Box sx={{ 
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            zIndex: 5 // Above hover overlay
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
        {/* Filter bar (dòng dưới Search) */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          {/* Dropdown Danh mục riêng biệt */}
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Danh mục</InputLabel>
            <Select
              value={categoryFilter}
              label="Danh mục"
              onChange={e => setCategoryFilter(e.target.value)}
            >
              {categoryOptions.map(o => <MenuItem value={o.value} key={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>
          {/* Dropdown Giá tiền riêng biệt */}
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Giá tiền</InputLabel>
            <Select
              value={priceFilter}
              label="Giá tiền"
              onChange={e => setPriceFilter(e.target.value)}
            >
              {priceOptions.map(o => <MenuItem value={o.value} key={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>

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

          <Grid item xs={12} sm={6} md={2}>
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
            <FormControl fullWidth>
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
              sx={{ height: '56px' }}
            >
              Đặt lại
            </Button>
          </Grid>
        </Box>

        {/* Results Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Hiển thị {filteredEvents.length} / {validEvents.length} sự kiện
          </Typography>
          {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || campusFilter !== 'all') && (
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
              setCampusFilter('all');
              setPriceFilter('all');
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

      {/* Featured Events Section - Poster Row with Slider */}
      {(() => {
        // Chọn các sự kiện sắp diễn ra (featured)
        const featuredEvents = validEvents
          .filter(event => {
            const now = new Date();
            const start = new Date(event.startTime);
            return start > now;
          })
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        if (featuredEvents.length === 0) return null;

        const sliderRef = React.createRef();
        const cardGap = 16;
        const scrollByCards = (num) => {
          const container = sliderRef.current;
          if (!container) return;
          const card = container.querySelector('.featured-card');
          if (!card) return;
          const cardWidth = card.getBoundingClientRect().width + cardGap;
          container.scrollBy({ left: num * cardWidth, behavior: 'smooth' });
        };

        return (
          <Box sx={{ bgcolor: 'background.default', py: 6 }}>
            <Container maxWidth="xl">
              <Typography variant="h4" component="h2" textAlign="center" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
                Sự Kiện Nổi Bật
              </Typography>

              <Box sx={{ position: 'relative' }}>
                {/* Nút trái */}
                <Button
                  aria-label="prev"
                  onClick={() => scrollByCards(-1)}
                  sx={{
                    minWidth: 0,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    position: 'absolute',
                    left: -4,
                    top: '40%',
                    zIndex: 2
                  }}
                >
                  {'<'}
                </Button>

                {/* Dải poster một hàng, có thể cuộn */}
                <Box
                  ref={sliderRef}
                  sx={{
                    display: 'flex',
                    gap: cardGap,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollBehavior: 'smooth',
                    px: 0.5,
                    '::-webkit-scrollbar': { display: 'none' }
                  }}
                >
                  {featuredEvents.map((event) => {
                    const eventImage = event.eventDetails?.eventImage || event.eventImage || null;
                    const imageUrl = buildImageUrl(eventImage);

                    return (
                      <Card
                        className="featured-card"
                        key={event.eventId}
                        component={Link}
                        to={`/event/${event.eventId}`}
                        sx={{
                          flex: '0 0 auto',
                          width: { xs: 180, sm: 200, md: 220, lg: 240 },
                          bgcolor: 'transparent',
                          boxShadow: 'none',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                          '&:hover': {
                            transform: 'translateY(-6px)',
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 12px 24px rgba(0,0,0,0.45)' 
                              : '0 12px 24px rgba(0,0,0,0.2)'
                          }
                        }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            aspectRatio: '720 / 958',
                            borderRadius: 2,
                            overflow: 'hidden',
                            backgroundColor: 'grey.100',
                            position: 'relative',
                            '& img': {
                              transition: 'transform 0.35s ease, opacity 0.35s ease'
                            },
                            '&:after': {
                              content: '""',
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.25), rgba(0,0,0,0))',
                              opacity: 0,
                              transition: 'opacity 0.35s ease'
                            },
                            '&:hover img': {
                              transform: 'scale(1.06)'
                            },
                            '&:hover:after': {
                              opacity: 1
                            }
                          }}
                        >
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={event.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                              <Event sx={{ fontSize: 48, opacity: 0.85 }} />
                            </Box>
                          )}
                        </Box>
                        <CardContent sx={{ px: 0 }}>
                          <Typography variant="subtitle1" component="h3" sx={{ mt: 1.5, fontWeight: 700, textAlign: 'center' }}>
                            {event.title}
                          </Typography>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>

                {/* Nút phải */}
                <Button
                  aria-label="next"
                  onClick={() => scrollByCards(1)}
                  sx={{
                    minWidth: 0,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    position: 'absolute',
                    right: -4,
                    top: '40%',
                    zIndex: 2
                  }}
                >
                  {'>'}
                </Button>
              </Box>
            </Container>
          </Box>
        );
      })()}

      {/* Events Section */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom sx={{ mb: 4 }}>
          Sự Kiện Sắp Diễn Ra
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              {error.split('\n')[0]}
            </Typography>
            {error.split('\n').length > 1 && (
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
                {error.split('\n').slice(1).map((line, index) => (
                  <li key={index}>
                    <Typography variant="body2">{line}</Typography>
                  </li>
                ))}
              </Box>
            )}
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
