import React, { useState, useEffect } from 'react';
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
  useMediaQuery
} from '@mui/material';
import { 
  LocationOn, 
  AccessTime, 
  Person, 
  ConfirmationNumber,
  ShoppingCart,
  ArrowBack
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import WishlistButton from '../components/common/WishlistButton';
import StageViewer from '../components/stage/StageViewer';
import { eventsAPI, ticketsAPI } from '../services/apiClient';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
  }, [id]);

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

  // Lấy ảnh sự kiện
  const eventImage = event.eventDetails?.eventImage || event.eventImage || null;
  const imageUrl = eventImage ? 
    (eventImage.startsWith('http') ? eventImage : `http://localhost:5000${eventImage}`) : 
    null;

  return (
    <Box>
      <Header />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
            {!eventImage && (
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
                  {event.title}
                </Typography>
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
            {imageUrl && (
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
                  {event.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={event.category} 
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

          <CardContent sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* Title và Category khi không có ảnh */}
              {!imageUrl && (
                <Box>
                  <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
                    {event.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    <Chip 
                      label={event.category} 
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

              {/* Description */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Mô tả
                </Typography>
                {(() => {
                  const description = event.description || '';
                  
                  // Check if description contains JSON-like content
                  if (description.includes('{') && description.includes('}')) {
                    try {
                      // Extract JSON part from the description
                      const jsonMatch = description.match(/\{.*\}/);
                      if (jsonMatch) {
                        const parsedDesc = JSON.parse(jsonMatch[0]);
                        return (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Show the text part before JSON */}
                            {description.split('{')[0].trim() && (
                              <Typography 
                                variant="body1" 
                                color="text.secondary" 
                                sx={{ mb: 2, whiteSpace: 'pre-line' }}
                              >
                                {description.split('{')[0].trim()}
                              </Typography>
                            )}
                            
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
                      }
                    } catch (error) {
                      console.log('JSON parse error:', error);
                    }
                  }
                  
                  // Fallback: display as normal text with line breaks preserved
                  return (
                    <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                      {event.description}
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
                        <Typography variant="body2" color="text.secondary">Địa điểm</Typography>
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
                            return event.location || 'Chưa có thông tin địa điểm';
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
                      <strong>Tên:</strong> {event.hostName}
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

              <Divider />

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
                  <Grid container spacing={3}>
                    {ticketTypes.map((ticket) => {
                      const isAvailable = ticket.availableQuantity > 0 && ticket.status === 'Active';
                      const isOnSale = new Date() >= new Date(ticket.saleStart) && new Date() <= new Date(ticket.saleEnd);
                      
                      return (
                        <Grid item xs={12} md={6} key={ticket.ticketTypeId}>
                          <Card 
                            sx={{ 
                              opacity: (!isAvailable || !isOnSale) ? 0.6 : 1,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.palette.mode === 'dark' 
                                  ? '0 8px 30px rgba(0, 0, 0, 0.3)' 
                                  : '0 8px 30px rgba(0, 0, 0, 0.15)'
                              }
                            }}
                          >
                            <CardContent>
                              <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                      {ticket.typeName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {ticket.minOrder && `Tối thiểu: ${ticket.minOrder} vé`}
                                      {ticket.maxOrder && ` | Tối đa: ${ticket.maxOrder} vé`}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                      {formatPrice(ticket.price)}
                                    </Typography>
                                    {(!isAvailable || !isOnSale) && (
                                      <Chip 
                                        label={!isOnSale ? 'Chưa mở bán' : 'Hết vé'} 
                                        color="error" 
                                        size="small" 
                                      />
                                    )}
                                  </Box>
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary">
                                  {isAvailable && isOnSale ? `Còn lại: ${ticket.availableQuantity} vé` : 'Không khả dụng'}
                                </Typography>
                                
                                {isAvailable && isOnSale && (
                                  <Stack direction="row" spacing={1}>
                                    <Button 
                                      variant="outlined"
                                      startIcon={<ShoppingCart />}
                                      onClick={() => handleBuyNow(ticket)}
                                      sx={{ flex: 1 }}
                                    >
                                      Mua ngay
                                    </Button>
                                    <Button 
                                      component={Link} 
                                      to={`/event/${id}/order/create?ticketType=${ticket.ticketTypeId}`}
                                      variant="contained"
                                      sx={{ flex: 1 }}
                                    >
                                      Mua ngay
                                    </Button>
                                    <WishlistButton 
                                      ticketTypeId={ticket.ticketTypeId}
                                      ticketName={ticket.typeName}
                                      size="medium"
                                      variant="outlined"
                                    />
                                  </Stack>
                                )}
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button 
                  component={Link} 
                  to="/" 
                  variant="outlined"
                  startIcon={<ArrowBack />}
                >
                  Back to Events
                </Button>
                <Button 
                  component={Link} 
                  to={`/event/${id}/order/create`}
                  variant="contained"
                >
                  Xem tất cả vé
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default EventDetailsPage;
