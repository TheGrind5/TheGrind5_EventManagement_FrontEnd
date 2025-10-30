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
  ListItemSecondaryAction
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  Payment as CheckoutIcon
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
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={fetchWishlist}>
            Thử lại
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FavoriteIcon color="primary" />
          Danh sách yêu thích
        </Typography>
        
        {wishlist?.items?.length > 0 && (
          <Box display="flex" gap={1}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedItems.length === wishlist.items.length && wishlist.items.length > 0}
                  indeterminate={selectedItems.length > 0 && selectedItems.length < wishlist.items.length}
                  onChange={handleSelectAll}
                />
              }
              label="Chọn tất cả"
            />
            {selectedItems.length > 0 && (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleBulkDelete}
                >
                  Xóa ({selectedItems.length})
                </Button>
                <Button
                  variant="contained"
                  startIcon={<CheckoutIcon />}
                  onClick={() => setShowCheckoutDialog(true)}
                >
                  Thanh toán ({selectedItems.length})
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>

      {wishlist?.items?.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FavoriteIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Danh sách yêu thích trống
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Hãy thêm các sự kiện yêu thích vào danh sách để dễ dàng theo dõi và mua vé
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Khám phá sự kiện
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {wishlist?.items?.map((item) => (
              <Card key={item.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" gap={2}>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                    
                    {item.thumbnailUrl && (
                      <CardMedia
                        component="img"
                        sx={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 1 }}
                        image={item.thumbnailUrl}
                        alt={item.title}
                      />
                    )}
                    
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {item.eventName}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatPrice(item.price)}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" gap={2} mt={2}>
                        <Typography variant="body2">Số lượng:</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography variant="body1" sx={{ minWidth: 30, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.maxQuantity}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                        <Chip 
                          label={`Tối đa: ${item.maxQuantity}`} 
                          size="small" 
                          variant="outlined" 
                        />
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary">
                        Thêm vào: {formatDate(item.createdAt)}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <Typography variant="h6" color="primary">
                        {formatPrice(item.price * item.quantity)}
                      </Typography>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom>
                Tóm tắt
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Số lượng sản phẩm:</Typography>
                <Typography>{wishlist?.totals?.count || 0}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Tổng cộng:</Typography>
                <Typography variant="h6" color="primary">
                  {formatPrice(wishlist?.totals?.sum || 0)}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                fullWidth
                startIcon={<CheckoutIcon />}
                onClick={() => setShowCheckoutDialog(true)}
                disabled={selectedItems.length === 0}
                sx={{ mb: 2 }}
              >
                Thanh toán ({selectedItems.length} sản phẩm)
              </Button>
              
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ShoppingCartIcon />}
                onClick={() => navigate('/')}
              >
                Tiếp tục mua sắm
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onClose={() => setShowCheckoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Xác nhận thanh toán</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Bạn có chắc chắn muốn thanh toán {selectedItems.length} sản phẩm đã chọn?
          </Typography>
          <List>
            {wishlist?.items
              ?.filter(item => selectedItems.includes(item.id))
              ?.map(item => (
                <ListItem key={item.id}>
                  <ListItemText
                    primary={item.title}
                    secondary={`${item.quantity} x ${formatPrice(item.price)}`}
                  />
                  <ListItemSecondaryAction>
                    <Typography variant="body2" color="primary">
                      {formatPrice(item.price * item.quantity)}
                    </Typography>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCheckoutDialog(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleCheckout} 
            variant="contained"
            disabled={checkoutLoading}
            startIcon={checkoutLoading ? <CircularProgress size={20} /> : <CheckoutIcon />}
          >
            {checkoutLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </>
  );
};

export default WishlistPage;
