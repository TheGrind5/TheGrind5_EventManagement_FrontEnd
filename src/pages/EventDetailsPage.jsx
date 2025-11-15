import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  Chip, 
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
  Collapse,
  Tooltip
} from '@mui/material';
import { 
  LocationOn, 
  AccessTime, 
  Person, 
  ConfirmationNumber,
  ShoppingCart,
  ArrowBack,
  Business,
  Flag,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import WishlistButton from '../components/common/WishlistButton';
import StageViewer from '../components/stage/StageViewer';
import AIChatbot from '../components/ai/AIChatbot';
import FeedbackSection from '../components/common/FeedbackSection';
import { eventsAPI, ticketsAPI, productsAPI } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { decodeText } from '../utils/textDecoder';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem: addToWishlist, deleteItem, isInWishlist, getWishlistItem, fetchWishlist, error: wishlistError } = useWishlist();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [imageErrors, setImageErrors] = useState(new Set());
  const currentUserId = user && (user.userId ?? user.id);
  const reportedKey = currentUserId && id ? `reported:${currentUserId}:${id}` : null;
  const [isReporting, setIsReporting] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  
  const theme = useTheme();

  const checkReportStatus = useCallback(async () => {
    if (!id || !user) return;
    try {
      const response = await eventsAPI.getReportStatus(id);
      if (response.data?.success) {
        const serverFlag = !!response.data.data.hasReported;
        const localFlag = reportedKey ? localStorage.getItem(reportedKey) === '1' : false;
        let finalFlag = serverFlag || localFlag;
        // Nếu server nói chưa báo cáo mà local có cờ → xóa cờ để đồng bộ
        if (!serverFlag && localFlag && reportedKey) {
          localStorage.removeItem(reportedKey);
          finalFlag = false;
        }
        setHasReported(finalFlag);
        setReportCount(response.data.data.reportCount || 0);
        if (finalFlag && reportedKey) {
          localStorage.setItem(reportedKey, '1');
        }
      }
    } catch (error) {
      console.error('Error checking report status:', error);
      // Không hiển thị lỗi cho user vì đây là optional check
    }
  }, [id, user, reportedKey]);

  // Reset trạng thái báo cáo khi chuyển event hoặc đổi user để tránh giữ state cũ
  useEffect(() => {
    setHasReported(false);
    setIsReporting(false);
  }, [id, user]);

  useEffect(() => {
    // Check if id is valid
    if (!id || id === 'undefined' || id === '0') {
      setError('Invalid event ID - Event ID cannot be 0 or undefined');
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        console.log('Fetching event with ID:', id);
        const response = await eventsAPI.getById(id);
        console.log('Event response:', response);
        console.log('Event venueLayout:', response.data?.venueLayout);
        console.log('Has virtual stage:', response.data?.venueLayout?.hasVirtualStage);
        setEvent(response.data);
        
        // Fetch real ticket types from API
        try {
          const ticketTypesResponse = await ticketsAPI.getTicketTypesByEvent(id);
          console.log('Ticket types response:', ticketTypesResponse);
          setTicketTypes(ticketTypesResponse.data || []);
        } catch (ticketErr) {
          console.warn('Failed to fetch ticket types, using empty array:', ticketErr);
          setTicketTypes([]);
        }

        // Fetch products from API
        try {
          const productsResponse = await productsAPI.getByEvent(id);
          console.log('Products response:', productsResponse);
          // Handle both direct array and wrapped response
          let productsArray = [];
          if (productsResponse?.data) {
            if (Array.isArray(productsResponse.data)) {
              productsArray = productsResponse.data;
            } else if (Array.isArray(productsResponse.data.data)) {
              productsArray = productsResponse.data.data;
            } else if (productsResponse.data.data && typeof productsResponse.data.data === 'object') {
              // Handle single product object
              productsArray = [productsResponse.data.data];
            }
          }
          setProducts(productsArray);
        } catch (productErr) {
          // 404 is OK - just means no products exist for this event
          if (productErr?.response?.status === 404 || productErr?.code === 404) {
            console.log('No products found for event (404) - this is normal if event has no accessories');
          } else {
            console.warn('Failed to fetch products, using empty array:', productErr);
          }
          setProducts([]);
        }
      } catch (err) {
        setError('Failed to load event details');
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
    
    // Check report status if user is logged in
    if (user) {
      // Ưu tiên trạng thái cache local để xám nút ngay sau khi báo cáo
      const localFlag = reportedKey ? localStorage.getItem(reportedKey) === '1' : false;
      if (localFlag) {
        setHasReported(true);
      }
      checkReportStatus();
    }
  }, [id, user, checkReportStatus, reportedKey]);
  
  const handleReportEvent = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (hasReported) {
      alert('Bạn đã báo cáo sự kiện này rồi.');
      return;
    }
    
    if (!window.confirm('Bạn có chắc chắn muốn báo cáo sự kiện này không?')) {
      return;
    }
    
    try {
      setIsReporting(true);
      // Optimistic UI: xám nút ngay
      setHasReported(true);
      if (reportedKey) {
        localStorage.setItem(reportedKey, '1');
      }
      const response = await eventsAPI.reportEvent(id);
      if (response.data?.success) {
        // Đồng bộ lại với server
        await checkReportStatus();
        alert('Báo cáo sự kiện thành công. Cảm ơn bạn đã báo cáo!');
      } else {
        // Revert nếu server từ chối
        setHasReported(false);
        if (reportedKey) localStorage.removeItem(reportedKey);
        alert(response.data?.message || 'Có lỗi xảy ra khi báo cáo sự kiện');
      }
    } catch (error) {
      console.error('Error reporting event:', error);
      // Revert nếu lỗi mạng
      setHasReported(false);
      if (reportedKey) localStorage.removeItem(reportedKey);
      alert(error?.response?.data?.message || 'Có lỗi xảy ra khi báo cáo sự kiện. Vui lòng thử lại sau.');
    } finally {
      setIsReporting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price) + ' ₫';
  };

  // Format: "20:00 - 23:00, 13 Tháng 11, 2025"
  const formatTimeRangeVN = (start, end) => {
    if (!start || !end) return '';
    const s = new Date(start);
    const e = new Date(end);
    const hoursMinutes = (d) =>
      `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const day = s.getDate();
    const month = s.getMonth() + 1;
    const year = s.getFullYear();
    const monthVN = [
      '', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ][month];
    return `${hoursMinutes(s)} - ${hoursMinutes(e)}, ${day} ${monthVN}, ${year}`;
  };

  const handleBuyNow = (ticket) => {
    // Navigate directly to order creation page
    navigate(`/event/${id}/order/create?ticketTypeId=${ticket.ticketTypeId}&quantity=1`);
  };

  // Hàm để đếm số dòng trong text
  const countLines = (text) => {
    if (!text) return 0;
    const lines = text.split('\n');
    return lines.length;
  };

  // --- Thêm logic tính nhãn giá tổng quát cho event: ---
  const getEventPriceSummary = () => {
    if (!ticketTypes.length) return '';
    const allFree = ticketTypes.every(t => (t.isFree || t.price === 0));
    if (allFree) return 'Miễn phí';
    const hasFree = ticketTypes.some(t => (t.isFree || t.price === 0));
    if (hasFree) return 'Chỉ từ 0đ';
    const minPrice = Math.min(...ticketTypes.map(t => t.price));
    return `Chỉ từ ${formatPrice(minPrice)}`;
  };

  // Kiểm tra xem event có trong wishlist không (kiểm tra xem có ticket type nào của event này trong wishlist)
  const isEventInWishlist = () => {
    if (!ticketTypes.length) return false;
    return ticketTypes.some(ticket => isInWishlist(ticket.ticketTypeId));
  };

  // Lấy ticket type đầu tiên có sẵn để thêm vào wishlist
  const getFirstAvailableTicketType = () => {
    if (!ticketTypes.length) return null;
    // Tìm ticket type đầu tiên có sẵn và đang bán
    const availableTicket = ticketTypes.find(ticket => {
      const isAvailable = ticket.availableQuantity > 0 && ticket.status === 'Active';
      const isOnSale = new Date() >= new Date(ticket.saleStart) && new Date() <= new Date(ticket.saleEnd);
      return isAvailable && isOnSale && ticket.ticketTypeId;
    });
    // Nếu không có ticket đang bán, lấy ticket type đầu tiên có ticketTypeId
    if (!availableTicket) {
      return ticketTypes.find(ticket => ticket.ticketTypeId) || ticketTypes[0];
    }
    return availableTicket;
  };

  // Xử lý thêm/xóa event vào wishlist
  const handleToggleEventWishlist = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào danh sách yêu thích!');
      navigate('/login');
      return;
    }

    if (!ticketTypes.length) {
      alert('Sự kiện này chưa có loại vé nào!');
      return;
    }

    try {
      setIsWishlistLoading(true);
      
      // Đảm bảo wishlist đã được fetch
      await fetchWishlist();
      
      const eventInWishlist = isEventInWishlist();
      
      if (eventInWishlist) {
        // Xóa tất cả ticket types của event này khỏi wishlist
        const itemsToDelete = [];
        
        for (const ticket of ticketTypes) {
          if (isInWishlist(ticket.ticketTypeId)) {
            const item = getWishlistItem(ticket.ticketTypeId);
            if (item && (item.id !== undefined || item.Id !== undefined)) {
              itemsToDelete.push(item.id ?? item.Id);
            }
          }
        }

        // Nếu không tìm thấy items, refresh lại wishlist
        if (itemsToDelete.length === 0) {
          await fetchWishlist();
          for (const ticket of ticketTypes) {
            if (isInWishlist(ticket.ticketTypeId)) {
              const item = getWishlistItem(ticket.ticketTypeId);
              if (item && (item.id !== undefined || item.Id !== undefined)) {
                itemsToDelete.push(item.id ?? item.Id);
              }
            }
          }
        }

        // Xóa từng item
        for (const itemId of itemsToDelete) {
          const success = await deleteItem(itemId);
          if (!success) {
            console.warn(`Failed to delete wishlist item ${itemId}`);
          }
        }
      } else {
        // Thêm ticket type đầu tiên có sẵn vào wishlist
        const ticketToAdd = getFirstAvailableTicketType();
        if (!ticketToAdd) {
          alert('Không có loại vé nào có sẵn để thêm vào danh sách yêu thích!');
          return;
        }

        // Kiểm tra ticketTypeId - có thể là ticketTypeId hoặc id
        const ticketTypeId = ticketToAdd.ticketTypeId || ticketToAdd.id;
        if (!ticketTypeId) {
          console.error('Ticket type missing ticketTypeId:', ticketToAdd);
          alert('Loại vé không hợp lệ!');
          return;
        }

        console.log('Adding ticket to wishlist:', {
          ticketTypeId,
          ticket: ticketToAdd,
          allTicketTypes: ticketTypes
        });
        
        const success = await addToWishlist(ticketTypeId, 1);
        if (!success) {
          // Lấy thông báo lỗi từ context nếu có
          const errorMessage = wishlistError || 'Có lỗi xảy ra khi thêm vào danh sách yêu thích!';
          alert(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error toggling event wishlist:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra! Vui lòng thử lại sau.';
      alert(errorMessage);
    } finally {
      setIsWishlistLoading(false);
    }
  };


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
            <Typography>Loading event details...</Typography>
          </Stack>
        </Box>
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Box>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Event not found'}
          </Alert>
          <Box textAlign="center">
            <Button component={Link} to="/" variant="contained">
              Back to Home
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  // Lấy ảnh nền (1280x720) - dùng cho EventDetailsPage
  // eventImage (720x958) được lưu nhưng không hiển thị
  const backgroundImage = event.eventDetails?.backgroundImage || event.backgroundImage || null;
  const imageToUse = backgroundImage;
  const imageUrl = imageToUse ? 
    (imageToUse.startsWith('http') ? imageToUse : `http://localhost:5000${imageToUse.startsWith('/') ? '' : '/'}${imageToUse}`) : 
    null;

  return (
    <Box sx={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden', position: 'relative' }}>
      <Header />
      
      {/* Container chính với maxWidth 1280px cho tất cả nội dung */}
      <Box sx={{ 
        width: '100%', 
        maxWidth: '1280px', 
        margin: '0 auto',
        px: { xs: 2, md: 0 },
        mt: { xs: 2, md: 4 }
      }}>
        {/* Ticket-style header: banner left (60%), info right (40%) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 3.5 },
            borderRadius: '24px',
            position: 'relative',
            overflow: 'visible',
            backgroundColor: '#1f1f22',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 28px 70px rgba(0,0,0,0.55)',
            mb: 4,
            fontFamily: `"Inter","Poppins",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif`
          }}
        >
          <Grid container spacing={0} alignItems="stretch" columns={{ xs: 12, sm: 12 }} wrap="nowrap">
            <Grid item xs={12} sm={5} sx={{ minWidth: 0 }}>
              <Stack
                spacing={2}
                sx={{
                  height: { xs: 240, md: 360 }, // force same height as image
                  bgcolor: '#2f3034',
                  borderRadius: '20px 0 0 20px',
                  p: { xs: 2, md: 3 },
                  pl: { xs: 2, md: 3 },
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  overflow: 'hidden'
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1.5,
                    mb: 0.5,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {decodeText(event.title)}
                </Typography>

                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <AccessTime sx={{ color: '#ff8c29', fontSize: '1.5rem', mt: 0.25, flexShrink: 0 }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'rgba(255,200,150,0.95)', lineHeight: 1.6 }}>
                      {formatTimeRangeVN(event.startTime, event.endTime)}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <LocationOn sx={{ color: '#ff8c29', fontSize: '1.5rem', mt: 0.25, flexShrink: 0 }} />
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          background: 'linear-gradient(90deg, #ffa94d 0%, #ff7a18 50%, #ff4d00 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          color: 'transparent',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {event.campus || event.eventDetails?.venueName || decodeText(event.location) || 'Địa điểm sẽ cập nhật'}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        pl: '38px',
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {(() => {
                        const eventDetails = event.eventDetails;
                        if (eventDetails) {
                          const addressParts = [];
                          if (eventDetails.streetAddress) addressParts.push(eventDetails.streetAddress);
                          if (eventDetails.ward) addressParts.push(eventDetails.ward);
                          if (eventDetails.district) addressParts.push(eventDetails.district);
                          if (eventDetails.province) addressParts.push(eventDetails.province);
                          if (addressParts.length > 0) return addressParts.join(', ');
                        }
                        return decodeText(event.location) || 'Địa chỉ sẽ cập nhật';
                      })()}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 2.5 }} />

                <Stack spacing={1.5} sx={{ mt: 'auto' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                      Giá từ
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        background: 'linear-gradient(90deg, #ffa94d 0%, #ff7a18 50%, #ff4d00 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'transparent'
                      }}
                    >
                      {getEventPriceSummary() || 'Miễn phí'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      component={event.status === 'Closed' ? 'div' : Link}
                      to={event.status === 'Closed' ? undefined : `/ticket-selection/${id}`}
                      fullWidth
                      size="large"
                      disabled={event.status === 'Closed'}
                      sx={{
                        py: 1.1,
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        color: event.status === 'Closed' ? 'rgba(255,255,255,0.5)' : '#1e1e1e',
                        background: event.status === 'Closed' 
                          ? 'linear-gradient(90deg, #666666 0%, #555555 40%, #444444 100%)'
                          : 'linear-gradient(90deg, #ffce54 0%, #ffa94d 40%, #ff7a18 100%)',
                        borderRadius: 999,
                        boxShadow: event.status === 'Closed'
                          ? '0 4px 12px rgba(0, 0, 0, 0.2)'
                          : '0 10px 28px rgba(255, 153, 0, 0.35)',
                        cursor: event.status === 'Closed' ? 'not-allowed' : 'pointer',
                        '&:hover': {
                          filter: event.status === 'Closed' ? 'none' : 'brightness(1.03)',
                          boxShadow: event.status === 'Closed'
                            ? '0 4px 12px rgba(0, 0, 0, 0.2)'
                            : '0 12px 32px rgba(255, 153, 0, 0.45)'
                        }
                      }}
                    >
                      {event.status === 'Closed' ? 'Sự kiện đã kết thúc' : 
                       (getEventPriceSummary() === 'Miễn phí' ? 'Tham gia sự kiện' : 'Mua vé ngay')}
                    </Button>
                    <Tooltip title={isEventInWishlist() ? 'Bỏ yêu thích' : 'Thêm vào danh sách yêu thích'}>
                      <Button
                        onClick={handleToggleEventWishlist}
                        disabled={isWishlistLoading || !ticketTypes.length || event.status === 'Closed'}
                        size="large"
                        variant={isEventInWishlist() ? 'contained' : 'outlined'}
                        sx={{
                          minWidth: '56px',
                          px: 1.5,
                          py: 1.1,
                          borderRadius: 999,
                          borderColor: isEventInWishlist() ? 'transparent' : 'rgba(255,255,255,0.3)',
                          backgroundColor: isEventInWishlist() 
                            ? 'rgba(255, 87, 87, 0.9)' 
                            : 'transparent',
                          color: isEventInWishlist() ? '#ffffff' : 'rgba(255,255,255,0.9)',
                          '&:hover': {
                            backgroundColor: isEventInWishlist() 
                              ? 'rgba(255, 87, 87, 1)' 
                              : 'rgba(255,255,255,0.1)',
                            borderColor: isEventInWishlist() ? 'transparent' : 'rgba(255,255,255,0.5)'
                          },
                          '&:disabled': {
                            opacity: 0.5
                          }
                        }}
                        startIcon={isWishlistLoading ? <CircularProgress size={20} color="inherit" /> : (isEventInWishlist() ? <Favorite /> : <FavoriteBorder />)}
                      >
                      </Button>
                    </Tooltip>
                  </Stack>
                  
                  {event.status === 'Closed' && (
                    <Button
                      fullWidth
                      size="large"
                      onClick={() => {
                        const feedbackSection = document.getElementById('feedback-section');
                        if (feedbackSection) {
                          feedbackSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      sx={{
                        mt: 1,
                        py: 1.1,
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        color: '#fff',
                        background: 'linear-gradient(90deg, #42f592 0%, #2fe580 50%, #21d773 100%)',
                        borderRadius: 999,
                        boxShadow: '0 10px 28px rgba(66, 245, 146, 0.35)',
                        '&:hover': {
                          filter: 'brightness(1.03)',
                          boxShadow: '0 12px 32px rgba(66, 245, 146, 0.45)'
                        }
                      }}
                    >
                      Gửi phản hồi về sự kiện
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Grid>
            {/* Perforated divider like a real ticket */}
            <Grid item sm={1} sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
              <Box
                aria-hidden
                sx={{
                  height: '100%',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 0.5,
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 20,
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '2px dashed rgba(255,193,7,0.8)'
                  }}
                />
                {/* notch circles */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    top: 20,
                    transform: 'translate(-50%, -100%)',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: '#111',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 20,
                    transform: 'translate(-50%, 100%)',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: '#111',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ pl: { sm: 0.1 }, minWidth: 0 }}>
              <Box
                sx={{
                  height: { xs: 240, md: 360 },
                  overflow: 'hidden',
                  borderRadius: '0 24px 24px 0',
                  position: 'relative',
                  background:
                    !imageToUse
                      ? 'linear-gradient(135deg, #232526 0%, #414345 100%)'
                      : 'transparent',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)'
                }}
              >
                {!imageToUse ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'white',
                      p: 2,
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {decodeText(event.title)}
                    </Typography>
                    <Chip label={decodeText(event.category)} color="primary" />
                  </Box>
                ) : (
                  <img
                    src={imageUrl}
                    alt={decodeText(event.title)}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      display: 'block',
                      borderRadius: '0 24px 24px 0'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

          {/* Nội dung bên dưới ảnh */}
          <Box sx={{ py: 4 }}>
            <Grid container spacing={4}>
              {/* Left Column - Description and Details */}
              <Grid item xs={12} md={8}>
                <Stack spacing={4}>
                  {/* Title và Category khi không có ảnh */}
                  {!imageToUse && (
                    <Box>
                      <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {decodeText(event.title)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                        <Chip 
                          label={decodeText(event.category)} 
                          color="primary" 
                        />
                        <Chip 
                          label={event.status} 
                          color={event.status === 'Active' ? 'success' : 
                                 event.status === 'Upcoming' ? 'warning' : 
                                 event.status === 'Closed' ? 'default' : 'default'}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Description - With max height and scroll */}
                  <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Mô tả
                </Typography>
                {(() => {
                  const description = event.description || '';
                  const lineCount = countLines(description);
                  const shouldShowExpandButton = lineCount > 10;
                  
                  // Check if description contains JSON-like content
                  if (description.includes('{') && description.includes('}')) {
                    try {
                      // Extract JSON part from the description
                      const jsonMatch = description.match(/\{.*\}/);
                      if (jsonMatch) {
                        const parsedDesc = JSON.parse(jsonMatch[0]);
                        const textPart = description.split('{')[0].trim();
                        const textLineCount = countLines(textPart);
                        const jsonDisplay = (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Show parsed JSON fields */}
                            {parsedDesc.eventStatus && (
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  Trạng thái sự kiện
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {parsedDesc.eventStatus}
                                </Typography>
                              </Box>
                            )}
                            
                            {parsedDesc.maxAttendees && (
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  Số lượng tham gia tối đa
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {parsedDesc.maxAttendees} người
                                </Typography>
                              </Box>
                            )}
                            
                            {parsedDesc.contactEmail && (
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  Email liên hệ
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {parsedDesc.contactEmail}
                                </Typography>
                              </Box>
                            )}
                            
                            {parsedDesc.paymentMethod && (
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  Phương thức thanh toán
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {parsedDesc.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : parsedDesc.paymentMethod}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        );
                        
                        return (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Show the text part before JSON */}
                            {textPart && (
                              <>
                                {shouldShowExpandButton && textLineCount > 10 ? (
                                  <>
                                    <Typography 
                                      variant="body1" 
                                      color="text.secondary" 
                                      sx={{ whiteSpace: 'pre-line', lineHeight: 1.75 }}
                                    >
                                      {descriptionExpanded 
                                        ? textPart 
                                        : textPart.split('\n').slice(0, 10).join('\n')}
                                    </Typography>
                                    <Button 
                                      variant="text" 
                                      onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                                      sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                                    >
                                      {descriptionExpanded ? 'Thu gọn' : 'Xem thêm'}
                                    </Button>
                                  </>
                                ) : (
                                  <Typography 
                                    variant="body1" 
                                    color="text.secondary" 
                                    sx={{ whiteSpace: 'pre-line', lineHeight: 1.75 }}
                                  >
                                    {textPart}
                                  </Typography>
                                )}
                              </>
                            )}
                            
                            {/* Show parsed JSON fields */}
                            {jsonDisplay}
                          </Box>
                        );
                      }
                    } catch (error) {
                      console.log('JSON parse error:', error);
                    }
                  }
                  
                  // Fallback: display as normal text with line breaks preserved
                  return shouldShowExpandButton ? (
                    <>
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ whiteSpace: 'pre-line', lineHeight: 1.75 }}
                      >
                        {descriptionExpanded 
                          ? description 
                          : description.split('\n').slice(0, 10).join('\n')}
                      </Typography>
                      <Button 
                        variant="text" 
                        onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                        sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                      >
                        {descriptionExpanded ? 'Thu gọn' : 'Xem thêm'}
                      </Button>
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.75 }}>
                      {description}
                    </Typography>
                  );
                })()}
                  </Box>

                  {/* Event Details */}
                  <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Thời gian bắt đầu</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {formatDate(event.startTime)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Thời gian kết thúc</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {formatDate(event.endTime)}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Campus</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {event.campus || event.eventDetails?.province || 'Chưa có thông tin campus'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Địa chỉ</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {(() => {
                            // Try to get location from eventDetails first
                            const eventDetails = event.eventDetails;
                            if (eventDetails) {
                              const addressParts = [];
                              if (eventDetails.venueName) addressParts.push(eventDetails.venueName);
                              if (eventDetails.streetAddress) addressParts.push(eventDetails.streetAddress);
                              if (eventDetails.ward) addressParts.push(eventDetails.ward);
                              if (eventDetails.district) addressParts.push(eventDetails.district);
                              if (eventDetails.province) addressParts.push(eventDetails.province);
                              
                              if (addressParts.length > 0) {
                                return addressParts.join(', ');
                              }
                            }
                            
                            // Fallback to direct location field
                            return decodeText(event.location) || 'Chưa có thông tin địa điểm';
                          })()}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              {/* Host Information */}
              {event.organizerInfo && (event.organizerInfo.organizerName || event.organizerInfo.organizerInfo) && (
                <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="action" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Thông tin người tổ chức
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      <strong>Tên:</strong> {decodeText(event.hostName)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Email:</strong> {event.hostEmail}
                    </Typography>
                  </Stack>
                </Paper>
              )}

              {/* Virtual Stage 2D - Căn giữa và tỉ lệ 1280x720 */}
              {(() => {
                console.log('Checking venue layout:', event.venueLayout);
                console.log('Has virtual stage:', event.venueLayout?.hasVirtualStage);
                console.log('Areas:', event.venueLayout?.areas);
                
                if (event.venueLayout && event.venueLayout.hasVirtualStage) {
                  return (
                    <Box sx={{ 
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      <StageViewer 
                        layout={event.venueLayout}
                        ticketTypes={ticketTypes.map(t => ({
                          id: t.ticketTypeId,
                          ...t
                        }))}
                        eventId={id}
                      />
                    </Box>
                  );
                } else {
                  return (
                    <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Debug: venueLayout = {JSON.stringify(event.venueLayout)}
                      </Typography>
                    </Box>
                  );
                }
              })()}

              {/* Products Section */}
              {products.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Phụ kiện sự kiện
                  </Typography>
                  <Grid container spacing={2}>
                    {products.map((product) => {
                      // Xử lý đường dẫn ảnh
                      const getImageUrl = () => {
                        if (!product.image) return null;
                        if (product.image.startsWith('http')) return product.image;
                        // Xử lý đường dẫn tương đối
                        const imagePath = product.image.startsWith('/') ? product.image : `/${product.image}`;
                        return `http://localhost:5000${imagePath}`;
                      };

                      const imageUrl = getImageUrl();
                      const hasImageError = imageErrors.has(product.productId);
                      const showPlaceholder = !imageUrl || hasImageError;

                      return (
                        <Grid item xs={12} sm={6} md={4} key={product.productId}>
                          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box
                              sx={{
                                width: '100%',
                                aspectRatio: '4/3',
                                overflow: 'hidden',
                                bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                              }}
                            >
                              {!showPlaceholder ? (
                                <img
                                  src={imageUrl}
                                  alt={product.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={() => {
                                    setImageErrors(prev => new Set([...prev, product.productId]));
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: 3,
                                    textAlign: 'center'
                                  }}
                                >
                                  <ShoppingCart 
                                    sx={{ 
                                      fontSize: 48, 
                                      color: theme.palette.mode === 'dark' ? 'grey.500' : 'grey.400',
                                      mb: 1
                                    }} 
                                  />
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ 
                                      fontSize: '0.75rem',
                                      opacity: 0.7
                                    }}
                                  >
                                    Chưa có ảnh
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                {product.name}
                              </Typography>
                              <Box sx={{ mt: 'auto', pt: 2 }}>
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                                  {product.price === 0 ? 'Miễn phí' : `${new Intl.NumberFormat('vi-VN').format(product.price)} VND`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Số lượng còn lại: {product.quantity}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

                  {/* ===== HIỂN THỊ GIÁ TỔNG QUÁT ===== */}
                  <Box mb={2}>
                    <Typography
                      variant="h4"
                      sx={{ color: getEventPriceSummary() === 'Miễn phí' ? '#7AC943' : 'primary.main', fontWeight: 'bold' }}
                      data-testid="event-price-summary"
                    >
                      {getEventPriceSummary()}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              {/* Right Column - Ticket Booking (Sticky) */}
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  position: { xs: 'static', md: 'sticky' },
                  top: { md: 100 },
                  maxHeight: { md: 'calc(100vh - 120px)' },
                  overflowY: { md: 'auto' }
                }}>
                  <Card sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 8px 30px rgba(0, 0, 0, 0.3)' 
                      : '0 8px 30px rgba(0, 0, 0, 0.1)'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      {/* Ticket Information Section */}
                      <Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ConfirmationNumber />
                  Thông tin vé
                </Typography>
                
                {ticketTypes.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ConfirmationNumber sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Chưa có loại vé nào cho sự kiện này
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {ticketTypes.map((ticket) => {
                      const isAvailable = ticket.availableQuantity > 0 && ticket.status === 'Active';
                      const isOnSale = new Date() >= new Date(ticket.saleStart) && new Date() <= new Date(ticket.saleEnd);
                      
                      return (
                        <Paper 
                          key={ticket.ticketTypeId}
                          sx={{ 
                            p: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            opacity: (!isAvailable || !isOnSale) ? 0.6 : 1,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: theme.palette.mode === 'dark' 
                                ? '0 4px 15px rgba(0, 0, 0, 0.3)' 
                                : '0 4px 15px rgba(0, 0, 0, 0.1)'
                            }
                          }}
                        >
                          <Stack spacing={1.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {ticket.typeName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {isAvailable && isOnSale ? `Còn lại: ${ticket.availableQuantity} vé` : 'Không khả dụng'}
                                  {ticket.minOrder && ` • Tối thiểu: ${ticket.minOrder} vé`}
                                  {ticket.maxOrder && ` • Tối đa: ${ticket.maxOrder} vé`}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                  {ticket.price === 0 ? 'Miễn phí' : formatPrice(ticket.price)}
                                </Typography>
                                {(!isAvailable || !isOnSale || event.status === 'Closed') && (
                                  <Chip 
                                    label={event.status === 'Closed' ? 'Đã kết thúc' : (!isOnSale ? 'Chưa mở bán' : 'Hết vé')} 
                                    color="error" 
                                    size="small" 
                                    sx={{ mt: 0.5 }}
                                  />
                                )}
                              </Box>
                            </Box>
                            
                            {isAvailable && isOnSale && event.status !== 'Closed' && (
                              <Button 
                                component={Link} 
                                to={`/event/${id}/order/create?ticketType=${ticket.ticketTypeId}`}
                                variant="contained"
                                fullWidth
                                size="small"
                                startIcon={<ShoppingCart />}
                              >
                                Chọn vé
                              </Button>
                            )}
                            {isAvailable && isOnSale && event.status === 'Closed' && (
                              <Button 
                                component="div"
                                variant="contained"
                                fullWidth
                                size="small"
                                disabled={true}
                                startIcon={<ShoppingCart />}
                                sx={{
                                  cursor: 'not-allowed',
                                  opacity: 0.6
                                }}
                              >
                                Chọn vé
                              </Button>
                            )}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
                      </Box>

                      {/* Quick Action Button */}
                      {event.status !== 'Closed' && (
                        <Button 
                          component={Link} 
                          to={`/ticket-selection/${id}`}
                          variant="contained"
                          fullWidth
                          size="large"
                          sx={{ 
                            mt: 3,
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 700
                          }}
                        >
                          Đặt vé ngay
                        </Button>
                      )}
                      {event.status === 'Closed' && (
                        <Button 
                          component="div"
                          variant="contained"
                          fullWidth
                          size="large"
                          disabled={true}
                          sx={{ 
                            mt: 3,
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            cursor: 'not-allowed',
                            opacity: 0.6
                          }}
                        >
                          Đặt vé ngay
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>

            {/* Action Buttons - Moved outside Grid */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 4 }}>
              <Button 
                component={Link} 
                to="/" 
                variant="outlined"
                startIcon={<ArrowBack />}
              >
                Back to Events
              </Button>
            </Box>

            {/* Organizer Information Section */}
            {event.organizerInfo && (event.organizerInfo.organizerName || event.organizerInfo.organizerInfo) && (
                <Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <Business />
                    Ban tổ chức
                  </Typography>
                  <Card 
                    sx={{ 
                      borderRadius: 2,
                      boxShadow: 2,
                      overflow: 'hidden',
                      bgcolor: 'background.paper'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Title */}
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                          Ban tổ chức
                        </Typography>
                        
                        {/* Divider */}
                        <Divider sx={{ mb: 2 }} />
                        
                        {/* Organizer Content */}
                        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                          {/* Logo */}
                          {event.organizerInfo.organizerLogo && (
                            <Box
                              sx={{
                                flexShrink: 0,
                                width: 120,
                                height: 120,
                                borderRadius: 2,
                                overflow: 'hidden',
                                backgroundColor: 'grey.100',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <img
                                src={
                                  event.organizerInfo.organizerLogo.startsWith('http')
                                    ? event.organizerInfo.organizerLogo
                                    : `http://localhost:5000${event.organizerInfo.organizerLogo.startsWith('/') ? '' : '/'}${event.organizerInfo.organizerLogo}`
                                }
                                alt={event.organizerInfo.organizerName || 'Logo ban tổ chức'}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </Box>
                          )}
                          
                          {/* Organizer Info */}
                          <Box sx={{ flex: 1 }}>
                            {event.organizerInfo.organizerName && (
                              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase' }}>
                                {event.organizerInfo.organizerName}
                              </Typography>
                            )}
                            {event.organizerInfo.organizerInfo && (
                              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                {event.organizerInfo.organizerInfo}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
            )}
          </Box>
        </Box>

        {/* Feedback Section */}
        <Box id="feedback-section">
          <FeedbackSection eventId={id} />
        </Box>

      {/* AI Chatbot */}
      <AIChatbot eventId={id} />
    </Box>
  );
};

export default EventDetailsPage;
