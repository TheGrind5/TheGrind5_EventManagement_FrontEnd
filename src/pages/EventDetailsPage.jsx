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
  Collapse
} from '@mui/material';
import { 
  LocationOn, 
  AccessTime, 
  Person, 
  ConfirmationNumber,
  ShoppingCart,
  ArrowBack,
  Business,
  Flag
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import WishlistButton from '../components/common/WishlistButton';
import StageViewer from '../components/stage/StageViewer';
import AIChatbot from '../components/ai/AIChatbot';
import FeedbackSection from '../components/common/FeedbackSection';
import { eventsAPI, ticketsAPI } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { decodeText } from '../utils/textDecoder';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const currentUserId = user && (user.userId ?? user.id);
  const reportedKey = currentUserId && id ? `reported:${currentUserId}:${id}` : null;
  const [isReporting, setIsReporting] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  
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
      
      <Container maxWidth="lg" sx={{ py: 4, width: '100%', maxWidth: '100%' }}>
        <Card>
          {/* Event Image Header */}
          <Box sx={{ 
            height: 400,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Placeholder khi không có ảnh */}
            {!imageToUse && (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                width: '100%'
              }}>
                <Typography variant="h2" sx={{ fontSize: '4rem', fontWeight: 700, mb: 2 }}>
                  EVENT
                </Typography>
                <Typography variant="h5" sx={{ opacity: 0.9 }}>
                  {decodeText(event.title)}
                </Typography>
              </Box>
            )}
            
            {imageUrl && (
              <img
                src={imageUrl}
                alt={decodeText(event.title)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            {/* Overlay with title and chips - chỉ hiển thị khi có ảnh */}
            {imageToUse && (
              <Box sx={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                p: 3,
                color: 'white'
              }}>
                <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
                  {decodeText(event.title)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={decodeText(event.category)} 
                    color="primary" 
                    sx={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      color: 'primary.main'
                    }}
                  />
                  <Chip 
                    label={event.status} 
                    color={event.status === 'Active' ? 'success' : 
                           event.status === 'Upcoming' ? 'warning' : 'default'}
                    sx={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      color: event.status === 'Active' ? 'success.main' : 
                             event.status === 'Upcoming' ? 'warning.main' : 'text.secondary'
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>

          <CardContent sx={{ p: { xs: 2, md: 4 }, position: 'relative' }}>
            {/* Report Button - Top Right */}
            {user && (
              <Box sx={{ 
                position: 'absolute', 
                top: { xs: 16, md: 24 }, 
                right: { xs: 16, md: 24 },
                zIndex: 10
              }}>
                {hasReported ? (
                  <Button
                    variant="contained"
                    disabled
                    startIcon={<Flag />}
                    size="small"
                    sx={{
                      backgroundColor: 'grey.500',
                      color: '#fff',
                      pointerEvents: 'none',
                      '&:hover': { backgroundColor: 'grey.600' }
                    }}
                  >
                    Đã báo cáo
                  </Button>
                ) : (
                  <Button 
                    onClick={handleReportEvent}
                    variant="contained"
                    color="error"
                    disabled={isReporting}
                    startIcon={<Flag />}
                    size={isReporting ? 'small' : 'medium'}
                    sx={{
                      boxShadow: 2,
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isReporting ? 'Đang báo cáo...' : 'Báo cáo sự kiện'}
                  </Button>
                )}
              </Box>
            )}
            
            <Grid container spacing={4}>
              {/* Left Column - Description and Details */}
              <Grid item xs={12} md={8}>
                <Stack spacing={4}>
                  {/* Title và Category khi không có ảnh */}
                  {!imageToUse && (
                    <Box>
                      <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
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
                                 event.status === 'Upcoming' ? 'warning' : 'default'}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Description - With max height and scroll */}
                  <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
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
                                      sx={{ whiteSpace: 'pre-line' }}
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
                                    sx={{ whiteSpace: 'pre-line' }}
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
                        sx={{ whiteSpace: 'pre-line' }}
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
                    <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
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
              {event.hostName && (
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

              {/* Virtual Stage 2D */}
              {(() => {
                console.log('Checking venue layout:', event.venueLayout);
                console.log('Has virtual stage:', event.venueLayout?.hasVirtualStage);
                console.log('Areas:', event.venueLayout?.areas);
                
                if (event.venueLayout && event.venueLayout.hasVirtualStage) {
                  return (
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Sơ đồ sân khấu
                      </Typography>
                      <StageViewer 
                        layout={event.venueLayout}
                        ticketTypes={ticketTypes.map(t => ({
                          id: t.ticketTypeId,
                          ...t
                        }))}
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
                                {(!isAvailable || !isOnSale) && (
                                  <Chip 
                                    label={!isOnSale ? 'Chưa mở bán' : 'Hết vé'} 
                                    color="error" 
                                    size="small" 
                                    sx={{ mt: 0.5 }}
                                  />
                                )}
                              </Box>
                            </Box>
                            
                            {isAvailable && isOnSale && (
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
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
                      </Box>

                      {/* Quick Action Button */}
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

            {/* Feedback Section */}
            <FeedbackSection eventId={id} />
          </CardContent>
        </Card>
      </Container>

      {/* AI Chatbot */}
      <AIChatbot eventId={id} />
    </Box>
  );
};

export default EventDetailsPage;
