import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Box,
  Divider,
  Chip,
  Paper,
  useTheme,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  ConfirmationNumber as TicketIcon,
  AddCircle as AddIcon,
  RemoveCircle as RemoveIcon,
  CheckCircle as CheckIcon,
  CalendarToday,
  ArrowBack
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import VoucherSelector from '../components/common/VoucherSelector';
import StageViewer from '../components/stage/StageViewer';
import { useAuth } from '../contexts/AuthContext';
import { eventsAPI, ordersAPI, ticketsAPI } from '../services/apiClient';

const TicketSelectionPage = () => {
  const { eventId } = useParams();
  console.log('TicketSelectionPage - eventId from params:', eventId);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [quantity, setQuantity] = useState(1);
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTicketType, setSelectedTicketType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [venueLayout, setVenueLayout] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);

  const isFromWishlist = location.state?.fromWishlist || false;
  const selectedWishlistItems = location.state?.selectedWishlistItems || [];

  useEffect(() => {
    if (!authLoading && !user) {
      setError('Bạn cần đăng nhập để tạo đơn hàng');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Token không tồn tại. Vui lòng đăng nhập lại');
      setLoading(false);
      return;
    }

    const fetchEventData = async () => {
      try {
        setLoading(true);
        setError(null);

        const eventData = await eventsAPI.getById(eventId);
        console.log('Event data: ', eventData);
        setEvent(eventData?.data ?? eventData);

        let ticketTypesData;
        try {
          ticketTypesData = await ticketsAPI.getTicketTypesByEvent(eventId);
          const ticketTypesArray = ticketTypesData?.data || [];
          setTicketTypes(ticketTypesArray);

          if (ticketTypesArray.length === 0) {
            setError('Sự kiện này chưa có loại vé nào để đặt');
            return;
          }
        } catch (ticketTypesError) {
          setError('Không thể tải danh sách loại vé. Vui lòng thử lại sau.');
          return;
        }

        try {
          const layoutResponse = await eventsAPI.getVenueLayout(eventId);
          if (layoutResponse?.data && layoutResponse.data.hasVirtualStage) {
            setVenueLayout(layoutResponse.data);
          }
        } catch (layoutError) {
          console.log('No venue layout available');
        }

        const ticketTypeFromUrl = searchParams.get('ticketType');
        if (ticketTypeFromUrl) {
          const ticketTypeId = parseInt(ticketTypeFromUrl);
          const foundTicketType = ticketTypesData?.data?.find(tt => tt.ticketTypeId === ticketTypeId);
          if (foundTicketType) {
            setSelectedTicketType(ticketTypeFromUrl);
          }
        }

      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Không thể tải thông tin sự kiện. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId && user) {
      fetchEventData();
    }
  }, [eventId, user, authLoading, searchParams]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!selectedTicketType) {
      setError('Vui lòng chọn loại vé');
      return;
    }

    if (quantity <= 0) {
      setError('Số lượng vé phải lớn hơn 0');
      return;
    }

    if (!eventId || isNaN(parseInt(eventId))) {
      setError('ID sự kiện không hợp lệ');
      return;
    }

    const selectedTicket = ticketTypes.find(tt => tt.ticketTypeId == selectedTicketType);
    if (selectedTicket) {
      if (selectedTicket.status !== 'Active') {
        setError('Loại vé này hiện không khả dụng');
        return;
      }

      const now = new Date();
      if (selectedTicket.saleStart && new Date(selectedTicket.saleStart) > now) {
        setError(`Vé chưa được bán. Thời gian bán bắt đầu: ${new Date(selectedTicket.saleStart).toLocaleString('vi-VN')}`);
        return;
      }

      if (selectedTicket.saleEnd && new Date(selectedTicket.saleEnd) < now) {
        setError(`Hết thời gian bán vé. Thời gian bán kết thúc: ${new Date(selectedTicket.saleEnd).toLocaleString('vi-VN')}`);
        return;
      }

      if (selectedTicket.availableQuantity < quantity) {
        setError(`Chỉ còn ${selectedTicket.availableQuantity} vé. Vui lòng chọn số lượng ít hơn.`);
        return;
      }

      if (selectedTicket.minOrder && quantity < selectedTicket.minOrder) {
        setError(`Số lượng tối thiểu là ${selectedTicket.minOrder} vé.`);
        return;
      }

      if (selectedTicket.maxOrder && quantity > selectedTicket.maxOrder) {
        setError(`Số lượng tối đa là ${selectedTicket.maxOrder} vé.`);
        return;
      }
    } else {
      setError('Loại vé được chọn không tồn tại');
      return;
    }

    try {
      setCreatingOrder(true);
      setError(null);

      const orderData = {
        EventId: parseInt(eventId),
        TicketTypeId: parseInt(selectedTicketType),
        Quantity: quantity,
        SeatNo: null,
        VoucherCode: appliedVoucher?.voucherCode || null
      };

      const response = await ordersAPI.create(orderData);
      console.log('Order creation response:', response);

      setOrderSuccess(true);

      // Backend trả về: { message: "...", order: { OrderId: 123, ... } }
      // apiClient normalize: response.data = { message: "...", order: { OrderId/orderId: 123 } }
      let orderId;
      const order = response.data?.order || response.order || response.data;
      
      if (order) {
        // Check both PascalCase and camelCase
        orderId = order.OrderId || order.orderId || order.id || order.Id;
      }
      
      if (!orderId) {
        console.error('Cannot find orderId in response:', response);
        console.error('- response.data:', response.data);
        console.error('- response.data?.order:', response.data?.order);
        setError('Không thể lấy ID đơn hàng từ phản hồi. Vui lòng thử lại.');
        setCreatingOrder(false);
        return;
      }
      
      console.log('Extracted orderId:', orderId);

      setTimeout(() => {
        const selectedTicketForNav = ticketTypes.find(tt => tt.ticketTypeId == selectedTicketType);
        const orderDataForNav = response.data?.order || response.order || response.data;
        
        if (selectedTicketForNav && (selectedTicketForNav.isFree || selectedTicketForNav.price === 0)) {
          navigate(`/order-confirmation/${orderId}`, {
            state: {
              order: orderDataForNav,
              fromOrderCreation: true
            }
          });
        } else {
          // Navigate to OrderInformationPage thay vì PaymentPage
          navigate(`/order-information/${orderId}`, {
            state: {
              order: orderDataForNav,
              fromOrderCreation: true,
              orderData: orderData
            }
          });
        }
      }, 2000);

    } catch (error) {
      let errorMessage = 'Có lỗi xảy ra khi tạo đơn hàng';
      let errorCode = 500;

      if (error.success === false) {
        errorMessage = error.message || errorMessage;
        errorCode = error.code || 500;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        errorCode = error.response.status;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (errorCode === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        setTimeout(() => navigate('/login'), 3000);
      } else if (errorCode === 400) {
        // Keep specific error message
      } else if (errorCode === 0) {
        errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.';
      }

      setError(errorMessage);
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleVoucherApplied = (voucherData) => {
    setAppliedVoucher(voucherData);
    console.log('Voucher applied:', voucherData);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    console.log('Voucher removed');
  };

  const handleAreaSelection = (selection) => {
    setSelectedArea(selection.area);
    if (selection.area.ticketTypeId) {
      setSelectedTicketType(selection.area.ticketTypeId.toString());
    }
    if (selection.quantity > 0) {
      setQuantity(selection.quantity);
    }
  };

  const pricing = React.useMemo(() => {
    if (!selectedTicketType || !ticketTypes.length) return null;

    const ticketType = ticketTypes.find(tt => tt.ticketTypeId == selectedTicketType);
    if (!ticketType) return null;

    const originalAmount = ticketType.price * quantity;
    let finalAmount = originalAmount;
    let discountAmount = 0;

    if (appliedVoucher) {
      discountAmount = appliedVoucher.discountAmount;
      finalAmount = appliedVoucher.finalAmount;
    }

    return {
      originalAmount,
      discountAmount,
      finalAmount,
      ticketType
    };
  }, [selectedTicketType, ticketTypes, quantity, appliedVoucher]);

  const theme = useTheme();
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const selectedTicket = ticketTypes.find(tt => tt.ticketTypeId == selectedTicketType);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Header />

      {loading && (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Đang tải thông tin sự kiện...
            </Typography>
          </Box>
        </Container>
      )}

      {error && !loading && (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert
            severity="error"
            action={
              error.includes('đăng nhập') ? (
                <Button size="small" onClick={() => navigate('/login')} variant="contained">
                  Đăng nhập
                </Button>
              ) : (
                <Button size="small" onClick={() => window.location.reload()} variant="outlined">
                  Thử lại
                </Button>
              )
            }
          >
            {error}
          </Alert>
        </Container>
      )}

      {orderSuccess && !loading && !error && (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="success" icon={<CheckIcon />} sx={{ fontSize: '1.1rem' }}>
            <Typography variant="h5" gutterBottom>
              🎉 Tạo đơn hàng thành công!
            </Typography>
            <Typography>
              Đơn hàng của bạn đã được tạo thành công. Đang chuyển hướng...
            </Typography>
          </Alert>
        </Container>
      )}

      {!loading && !error && !orderSuccess && event && (
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
          {/* Back Button */}
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/event/${eventId}`)}
            sx={{ mb: 3 }}
          >
            Trở về
          </Button>

          {/* Main Content - Different layouts based on Virtual Stage */}
          {venueLayout && venueLayout.hasVirtualStage ? (
            // Layout with Virtual Stage (3 columns)
            <Grid container spacing={3}>
              {/* Left: Stage Map */}
              <Grid item xs={12} md={8}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                      Chọn vé
                    </Typography>
                    <StageViewer
                      layout={venueLayout}
                      ticketTypes={ticketTypes}
                      onAreaClick={handleAreaSelection}
                    />
                    {selectedArea && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        <Typography fontWeight={600}>
                          <strong>Khu vực đã chọn:</strong> {selectedArea.name}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Right: Event Details & Pricing Summary */}
              <Grid item xs={12} md={4}>
                {/* Event Info */}
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, mb: 2 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {event?.title || event?.Title}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <CalendarToday sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            {formatDate(event?.startTime)} - {formatTime(event?.startTime)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <LocationIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                        <Typography variant="body2" color="text.secondary">
                          {event?.location || event?.Location}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Pricing Summary */}
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="body2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                      Giá vé
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {ticketTypes.map(ticketType => (
                        <Box key={ticketType.ticketTypeId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">{ticketType.typeName}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(ticketType.price)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* Continue Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={!selectedTicketType || quantity <= 0}
                  onClick={handleCreateOrder}
                  sx={{
                    mt: 2,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 2
                  }}
                >
                  {selectedTicketType && quantity > 0
                    ? `Tiếp tục - ${formatCurrency(pricing?.finalAmount || 0)} ›`
                    : 'Vui lòng chọn vé ›'}
                </Button>
              </Grid>
            </Grid>
          ) : (
            // Layout without Virtual Stage (2 columns: Ticket List + Summary)
            <Grid container spacing={3}>
              {/* Left: Ticket Selection List */}
              <Grid item xs={12} md={7}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                      Chọn vé
                    </Typography>

                    <Divider sx={{ mb: 3 }} />

                    {/* Ticket Types List */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {ticketTypes.map((ticketType, index) => {
                        const isSelected = selectedTicketType == ticketType.ticketTypeId;
                        const quantityForThisType = isSelected ? quantity : 0;

                        return (
                          <Box key={ticketType.ticketTypeId}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: isSelected
                                  ? theme.palette.mode === 'dark'
                                    ? 'rgba(61, 190, 41, 0.15)'
                                    : 'rgba(61, 190, 41, 0.05)'
                                  : 'transparent',
                                border: `1px solid ${
                                  isSelected ? theme.palette.primary.main : theme.palette.divider
                                }`,
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                                  {ticketType.typeName}
                                </Typography>
                                <Typography variant="h6" fontWeight={700} color="primary.main">
                                  {formatCurrency(ticketType.price)}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <IconButton
                                  disabled={quantityForThisType <= 0}
                                  onClick={() => {
                                    if (isSelected) {
                                      setQuantity(q => Math.max(1, q - 1));
                                    }
                                  }}
                                  color="primary"
                                  size="small"
                                  sx={{
                                    border: `1px solid ${theme.palette.primary.main}`,
                                    width: 32,
                                    height: 32
                                  }}
                                >
                                  <RemoveIcon />
                                </IconButton>
                                <TextField
                                  type="number"
                                  value={quantityForThisType}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    if (val > 0) {
                                      setSelectedTicketType(ticketType.ticketTypeId.toString());
                                      setQuantity(val);
                                    } else if (val === 0) {
                                      setSelectedTicketType('');
                                    }
                                  }}
                                  inputProps={{ min: 0, max: ticketType.maxOrder || ticketType.availableQuantity }}
                                  sx={{ width: 60 }}
                                  size="small"
                                />
                                <IconButton
                                  disabled={quantityForThisType >= (ticketType.availableQuantity || 0)}
                                  onClick={() => {
                                    if (!isSelected) {
                                      setSelectedTicketType(ticketType.ticketTypeId.toString());
                                      setQuantity(1);
                                    } else {
                                      setQuantity(q => q + 1);
                                    }
                                  }}
                                  color="primary"
                                  size="small"
                                  sx={{
                                    border: `1px solid ${theme.palette.primary.main}`,
                                    width: 32,
                                    height: 32
                                  }}
                                >
                                  <AddIcon />
                                </IconButton>
                              </Box>
                            </Box>
                            {index < ticketTypes.length - 1 && <Divider sx={{ my: 2 }} />}
                          </Box>
                        );
                      })}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right: Order Summary & Details */}
              <Grid item xs={12} md={5}>
                <Box sx={{ position: 'sticky', top: 80 }}>
                  {/* Order Summary Card */}
                  <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, mb: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <EventIcon color="primary" />
                        <Typography variant="h6" fontWeight={700}>
                          {event?.title || event?.Title}
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />

                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <CalendarToday sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(event?.startTime)} - {formatTime(event?.startTime)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <LocationIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {event?.location || event?.Location}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="body2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                        Thông tin đặt vé
                      </Typography>

                      {selectedTicket ? (
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Loại vé</Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {selectedTicket.typeName}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Số lượng</Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {String(quantity).padStart(2, '0')}
                            </Typography>
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight={700}>
                              Tạm tính
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {formatCurrency(pricing?.originalAmount || 0)}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Chọn loại vé
                        </Alert>
                      )}

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="body2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                        Tổng tiền
                      </Typography>
                      <Typography variant="h5" fontWeight={800} color="primary.main">
                        {formatCurrency(pricing?.finalAmount || 0)}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Continue Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!selectedTicketType || quantity <= 0 || creatingOrder}
                    onClick={handleCreateOrder}
                    sx={{
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      borderRadius: 2,
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: `0 8px 24px rgba(61, 190, 41, 0.35)`,
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                    startIcon={creatingOrder ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                  >
                    {creatingOrder
                      ? 'Đang tạo đơn hàng...'
                      : `Tiếp tục - ${formatCurrency(pricing?.finalAmount || 0)} ›`}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </Container>
      )}
    </Box>
  );
};

export default TicketSelectionPage;

