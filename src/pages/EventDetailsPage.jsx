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
import { eventsAPI, ticketsAPI } from '../services/api';

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
        setEvent(response);
        
        // Fetch real ticket types from API
        try {
          const ticketTypesResponse = await ticketsAPI.getTicketTypesByEvent(id);
          console.log('Ticket types response:', ticketTypesResponse);
          setTicketTypes(ticketTypesResponse || []);
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

  return (
    <Box>
      <Header />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* Header */}
              <Box>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                  {event.title}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip label={event.category} color="primary" />
                  <Chip 
                    label={event.status} 
                    color={event.status === 'Active' ? 'success' : 
                           event.status === 'Upcoming' ? 'warning' : 'default'} 
                  />
                </Box>
              </Box>

              {/* Description */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Mô tả
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {event.description}
                </Typography>
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
                          {event.location}
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
