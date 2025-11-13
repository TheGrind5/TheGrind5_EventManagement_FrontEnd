import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  Chip,
  Grid,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Stack,
  useTheme,
  alpha,
  Fade,
  Zoom
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  Payment as CheckoutIcon,
  Event as EventIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { wishlistAPI } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [user, navigate]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const data = await wishlistAPI.getWishlist();
      setWishlist(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await wishlistAPI.updateItem(itemId, newQuantity);
      fetchWishlist();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await wishlistAPI.deleteItem(itemId);
      fetchWishlist();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      await wishlistAPI.bulkDelete(selectedItems);
      setSelectedItems([]);
      fetchWishlist();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectItem = (itemId) => {
    const id = parseInt(itemId);
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(existingId => existingId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === wishlist?.items?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(wishlist?.items?.map(item => parseInt(item.id)) || []);
    }
  };

  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      setError('Vui lòng chọn ít nhất một item để checkout');
      return;
    }
    
    try {
      setCheckoutLoading(true);
      
      // Get event ID from selected items BEFORE clearing them
      const selectedWishlistItems = wishlist?.items?.filter(item => 
        selectedItems.includes(item.id)
      ) || [];
      
      // Validate selected items
      if (!selectedItems || selectedItems.length === 0) {
        setError('Không có item nào được chọn');
        return;
      }
      
      if (!wishlist?.items || wishlist.items.length === 0) {
        setError('Wishlist trống, không có item nào để checkout');
        return;
      }
      
      const result = await wishlistAPI.checkout(selectedItems);
      console.log('🔍 DEBUG: Wishlist checkout result:', result);
      
      setShowCheckoutDialog(false);
      setSelectedItems([]);
      
      // Backend trả về OrderDraftId và Next URL
      if (result?.data?.orderDraftId || result?.orderDraftId) {
        const orderDraftId = result?.data?.orderDraftId || result?.orderDraftId;
        const nextUrl = result?.data?.next || result?.next || `/checkout/${orderDraftId}`;
        
        console.log('🔍 DEBUG: OrderDraftId:', orderDraftId);
        console.log('🔍 DEBUG: Next URL:', nextUrl);
        
        // Navigate đến trang checkout với orderDraftId
        navigate(nextUrl);
      } else {
        setError('Không thể tạo order draft từ wishlist');
      }
    } catch (err) {
      setError(`Lỗi checkout: ${err.message}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <>
        <Header />
        <Box
          sx={{
            minHeight: '60vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)'
              : 'linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%)'
          }}
        >
          <Stack spacing={3} alignItems="center">
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body1" color="text.secondary">
              Đang tải danh sách yêu thích...
            </Typography>
          </Stack>
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              borderRadius: 2,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 4px 20px rgba(211, 47, 47, 0.2)'
                : '0 4px 20px rgba(211, 47, 47, 0.1)'
            }}
          >
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={fetchWishlist}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5
            }}
          >
            Thử lại
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Box
        sx={{
          minHeight: '100vh',
          background: theme.palette.mode === 'dark' 
            ? '#1a1a1a'
            : '#f5f5f5',
          pb: 6
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Header Section */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: theme.palette.mode === 'dark' 
                ? '#1f1f22'
                : '#ffffff',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.05)'
                : '1px solid rgba(0,0,0,0.08)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0,0,0,0.3)'
                : '0 4px 20px rgba(0,0,0,0.08)'
            }}
          >
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    fontWeight: 700,
                    mb: 0.5,
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a'
                  }}
                >
                  <FavoriteIcon sx={{ fontSize: '2rem', color: '#ff8c29' }} />
                  Danh sách yêu thích
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.7)' 
                      : 'rgba(0,0,0,0.6)'
                  }}
                >
                  {wishlist?.items?.length || 0} sản phẩm trong danh sách
                </Typography>
              </Box>
              
              {wishlist?.items?.length > 0 && (
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedItems.length === wishlist.items.length && wishlist.items.length > 0}
                        indeterminate={selectedItems.length > 0 && selectedItems.length < wishlist.items.length}
                        onChange={handleSelectAll}
                        sx={{
                          color: '#ff8c29',
                          '&.Mui-checked': {
                            color: '#ff8c29'
                          }
                        }}
                      />
                    }
                    label={
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          color: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.9)' 
                            : 'rgba(0,0,0,0.8)'
                        }}
                      >
                        Chọn tất cả
                      </Typography>
                    }
                  />
                  {selectedItems.length > 0 && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        onClick={handleBulkDelete}
                        sx={{
                          borderRadius: 2,
                          px: 2.5,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(0,0,0,0.2)',
                          color: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.9)'
                            : 'rgba(0,0,0,0.8)',
                          '&:hover': {
                            borderColor: '#ff8c29',
                            backgroundColor: alpha('#ff8c29', 0.1)
                          }
                        }}
                      >
                        Xóa ({selectedItems.length})
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<CheckoutIcon />}
                        onClick={() => setShowCheckoutDialog(true)}
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 600,
                          background: 'linear-gradient(90deg, #ffa94d 0%, #ff7a18 100%)',
                          boxShadow: '0 4px 15px rgba(255, 169, 77, 0.3)',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #ff7a18 0%, #ff6b00 100%)',
                            boxShadow: '0 6px 20px rgba(255, 169, 77, 0.4)',
                            transform: 'translateY(-1px)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Thanh toán ({selectedItems.length})
                      </Button>
                    </>
                  )}
                </Stack>
              )}
            </Box>
          </Paper>

      {wishlist?.items?.length === 0 ? (
        <Fade in={true}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 6, 
              textAlign: 'center',
              borderRadius: 3,
              background: theme.palette.mode === 'dark'
                ? '#1f1f22'
                : '#ffffff',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.05)'
                : '1px solid rgba(0,0,0,0.08)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                : '0 8px 32px rgba(0, 0, 0, 0.08)'
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: alpha('#ff8c29', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem',
              }}
            >
              <FavoriteIcon sx={{ fontSize: 64, color: '#ff8c29', opacity: 0.6 }} />
            </Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600, 
                mb: 1.5,
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a'
              }}
            >
              Danh sách yêu thích trống
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4, 
                maxWidth: 400, 
                mx: 'auto',
                color: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.7)' 
                  : 'rgba(0,0,0,0.6)'
              }}
            >
              Hãy thêm các sự kiện yêu thích vào danh sách để dễ dàng theo dõi và mua vé
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/')}
              size="large"
              startIcon={<EventIcon />}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(90deg, #ffa94d 0%, #ff7a18 100%)',
                boxShadow: '0 4px 15px rgba(255, 169, 77, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #ff7a18 0%, #ff6b00 100%)',
                  boxShadow: '0 6px 20px rgba(255, 169, 77, 0.4)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Khám phá sự kiện
            </Button>
          </Paper>
        </Fade>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              {wishlist?.items?.map((item, index) => (
                <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }} key={item.id}>
                  <Paper
                    elevation={0}
                    sx={{ 
                      borderRadius: 3,
                      overflow: 'hidden',
                      background: theme.palette.mode === 'dark'
                        ? '#1f1f22'
                        : '#ffffff',
                      border: theme.palette.mode === 'dark'
                        ? '1px solid rgba(255,255,255,0.05)'
                        : '1px solid rgba(0,0,0,0.08)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                        : '0 4px 20px rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 8px 30px rgba(0, 0, 0, 0.4)'
                          : '0 8px 30px rgba(0, 0, 0, 0.12)',
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 140, 41, 0.3)'
                          : 'rgba(255, 140, 41, 0.2)'
                      }
                    }}
                  >
                    <Box sx={{ p: 3 }}>
                      <Box display="flex" gap={2.5} alignItems="flex-start">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          sx={{
                            mt: 0.5,
                            color: '#ff8c29',
                            '&.Mui-checked': {
                              color: '#ff8c29'
                            }
                          }}
                        />
                        
                        {item.thumbnailUrl && (
                          <CardMedia
                            component="img"
                            sx={{ 
                              width: { xs: 100, sm: 140 },
                              height: { xs: 100, sm: 140 },
                              objectFit: 'cover',
                              borderRadius: 2,
                              flexShrink: 0,
                              border: theme.palette.mode === 'dark'
                                ? '1px solid rgba(255,255,255,0.05)'
                                : '1px solid rgba(0,0,0,0.08)'
                            }}
                            image={item.thumbnailUrl}
                            alt={item.title}
                          />
                        )}
                        
                        <Box flex={1} minWidth={0}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              mb: 0.5,
                              color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {item.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.7)' 
                                : 'rgba(0,0,0,0.6)'
                            }}
                          >
                            <EventIcon sx={{ fontSize: 16, color: '#ff8c29' }} />
                            {item.eventName}
                          </Typography>
                          
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 2, 
                              mb: 2,
                              flexWrap: 'wrap'
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 500,
                                color: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.9)' 
                                  : 'rgba(0,0,0,0.8)'
                              }}
                            >
                              Số lượng:
                            </Typography>
                            <Box 
                              display="flex" 
                              alignItems="center" 
                              gap={0.5}
                              sx={{
                                border: theme.palette.mode === 'dark'
                                  ? '1px solid rgba(255,255,255,0.1)'
                                  : '1px solid rgba(0,0,0,0.15)',
                                borderRadius: 2,
                                px: 0.5,
                                py: 0.25,
                                background: theme.palette.mode === 'dark'
                                  ? 'rgba(255,255,255,0.02)'
                                  : 'rgba(0,0,0,0.02)'
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                sx={{
                                  color: '#ff8c29',
                                  '&:disabled': {
                                    opacity: 0.3
                                  },
                                  '&:hover': {
                                    backgroundColor: alpha('#ff8c29', 0.1)
                                  }
                                }}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  minWidth: 40, 
                                  textAlign: 'center',
                                  fontWeight: 600,
                                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a'
                                }}
                              >
                                {item.quantity}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.maxQuantity}
                                sx={{
                                  color: '#ff8c29',
                                  '&:disabled': {
                                    opacity: 0.3
                                  },
                                  '&:hover': {
                                    backgroundColor: alpha('#ff8c29', 0.1)
                                  }
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <Chip 
                              label={`Tối đa: ${item.maxQuantity}`} 
                              size="small" 
                              variant="outlined"
                              sx={{
                                borderRadius: 1.5,
                                borderColor: alpha('#ff8c29', 0.3),
                                color: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.7)' 
                                  : 'rgba(0,0,0,0.6)',
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                          
                          <Typography 
                            variant="caption" 
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.5)' 
                                : 'rgba(0,0,0,0.5)'
                            }}
                          >
                            <CalendarIcon sx={{ fontSize: 14, color: '#ff8c29' }} />
                            Thêm vào: {formatDate(item.createdAt)}
                          </Typography>
                        </Box>
                        
                        <Box 
                          display="flex" 
                          flexDirection="column" 
                          alignItems="flex-end" 
                          gap={2}
                          sx={{ minWidth: 120 }}
                        >
                          <Box textAlign="right">
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block', 
                                mb: 0.5,
                                color: theme.palette.mode === 'dark' 
                                  ? 'rgba(255,255,255,0.6)' 
                                  : 'rgba(0,0,0,0.6)'
                              }}
                            >
                              Tổng
                            </Typography>
                            <Typography 
                              variant="h6" 
                              sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(90deg, #ffa94d 0%, #ff7a18 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                              }}
                            >
                              {formatPrice(item.price * item.quantity)}
                            </Typography>
                            {item.price > 0 && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  display: 'block', 
                                  mt: 0.5,
                                  color: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.5)' 
                                    : 'rgba(0,0,0,0.5)'
                                }}
                              >
                                {formatPrice(item.price)}/vé
                              </Typography>
                            )}
                          </Box>
                          <IconButton
                            onClick={() => handleDeleteItem(item.id)}
                            sx={{
                              borderRadius: 2,
                              color: theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.7)'
                                : 'rgba(0,0,0,0.6)',
                              '&:hover': {
                                backgroundColor: alpha('#ff4444', 0.1),
                                color: '#ff4444',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Zoom>
              ))}
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                position: 'sticky', 
                top: 20,
                borderRadius: 3,
                background: theme.palette.mode === 'dark'
                  ? '#1f1f22'
                  : '#ffffff',
                border: theme.palette.mode === 'dark'
                  ? '1px solid rgba(255,255,255,0.05)'
                  : '1px solid rgba(0,0,0,0.08)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                  : '0 8px 32px rgba(0, 0, 0, 0.08)'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a'
                }}
              >
                <CheckoutIcon sx={{ color: '#ff8c29' }} />
                Tóm tắt đơn hàng
              </Typography>
              <Divider sx={{ mb: 3, borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              
              <Stack spacing={2} mb={3}>
                <Box 
                  display="flex" 
                  justifyContent="space-between"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: alpha('#ff8c29', 0.08),
                    border: `1px solid ${alpha('#ff8c29', 0.2)}`
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 500,
                      color: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.9)' 
                        : 'rgba(0,0,0,0.8)'
                    }}
                  >
                    Số lượng sản phẩm:
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#ff8c29'
                    }}
                  >
                    {wishlist?.totals?.count || 0}
                  </Typography>
                </Box>
                
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  sx={{
                    pt: 2,
                    borderTop: theme.palette.mode === 'dark'
                      ? '1px solid rgba(255,255,255,0.1)'
                      : '1px solid rgba(0,0,0,0.1)'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a'
                    }}
                  >
                    Tổng cộng:
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{
                      fontWeight: 700,
                      background: 'linear-gradient(90deg, #ffa94d 0%, #ff7a18 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {formatPrice(wishlist?.totals?.sum || 0)}
                  </Typography>
                </Box>
              </Stack>
              
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<CheckoutIcon />}
                  onClick={() => setShowCheckoutDialog(true)}
                  disabled={selectedItems.length === 0}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    background: selectedItems.length > 0
                      ? 'linear-gradient(90deg, #ffa94d 0%, #ff7a18 100%)'
                      : undefined,
                    boxShadow: selectedItems.length > 0
                      ? '0 4px 15px rgba(255, 169, 77, 0.3)'
                      : undefined,
                    '&:hover': selectedItems.length > 0 ? {
                      background: 'linear-gradient(90deg, #ff7a18 0%, #ff6b00 100%)',
                      boxShadow: '0 6px 20px rgba(255, 169, 77, 0.4)',
                      transform: 'translateY(-1px)'
                    } : {},
                    transition: 'all 0.2s ease',
                    '&:disabled': {
                      opacity: 0.5
                    }
                  }}
                >
                  Thanh toán ({selectedItems.length} sản phẩm)
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<ShoppingCartIcon />}
                  onClick={() => navigate('/')}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(0,0,0,0.2)',
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.9)'
                      : 'rgba(0,0,0,0.8)',
                    '&:hover': {
                      borderColor: '#ff8c29',
                      backgroundColor: alpha('#ff8c29', 0.1),
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Tiếp tục mua sắm
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Checkout Dialog */}
      <Dialog 
        open={showCheckoutDialog} 
        onClose={() => setShowCheckoutDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? '#1f1f22'
              : '#ffffff',
            border: theme.palette.mode === 'dark'
              ? '1px solid rgba(255,255,255,0.05)'
              : '1px solid rgba(0,0,0,0.08)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 700, 
            pb: 2,
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a'
          }}
        >
          Xác nhận thanh toán
        </DialogTitle>
        <DialogContent>
          <Typography 
            variant="body1" 
            gutterBottom 
            sx={{ 
              mb: 3,
              color: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.9)' 
                : 'rgba(0,0,0,0.8)'
            }}
          >
            Bạn có chắc chắn muốn thanh toán <strong>{selectedItems.length}</strong> sản phẩm đã chọn?
          </Typography>
          <List 
            sx={{ 
              bgcolor: alpha('#ff8c29', 0.08), 
              borderRadius: 2, 
              p: 1,
              border: `1px solid ${alpha('#ff8c29', 0.2)}`
            }}
          >
            {wishlist?.items
              ?.filter(item => selectedItems.includes(item.id))
              ?.map(item => (
                <ListItem 
                  key={item.id}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600,
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a'
                        }}
                      >
                        {item.title}
                      </Typography>
                    }
                    secondary={`${item.quantity} x ${formatPrice(item.price)}`}
                  />
                  <ListItemSecondaryAction>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, #ffa94d 0%, #ff7a18 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {formatPrice(item.price * item.quantity)}
                    </Typography>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
          <Box 
            sx={{ 
              mt: 3,
              p: 2.5,
              borderRadius: 2,
              bgcolor: alpha('#ff8c29', 0.1),
              border: `1px solid ${alpha('#ff8c29', 0.3)}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a'
              }}
            >
              Tổng cộng:
            </Typography>
            <Typography 
              variant="h6" 
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(90deg, #ffa94d 0%, #ff7a18 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {formatPrice(
                wishlist?.items
                  ?.filter(item => selectedItems.includes(item.id))
                  ?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
              )}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setShowCheckoutDialog(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              color: theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.9)'
                : 'rgba(0,0,0,0.8)'
            }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleCheckout} 
            variant="contained"
            disabled={checkoutLoading}
            startIcon={checkoutLoading ? <CircularProgress size={20} color="inherit" /> : <CheckoutIcon />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(90deg, #ffa94d 0%, #ff7a18 100%)',
              boxShadow: '0 4px 15px rgba(255, 169, 77, 0.3)',
              '&:hover': {
                background: 'linear-gradient(90deg, #ff7a18 0%, #ff6b00 100%)',
                boxShadow: '0 6px 20px rgba(255, 169, 77, 0.4)'
              }
            }}
          >
            {checkoutLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
        </Container>
      </Box>
    </>
  );
};

export default WishlistPage;
