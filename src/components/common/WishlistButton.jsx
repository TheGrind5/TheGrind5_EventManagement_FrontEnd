import React from 'react';
import { Button, Tooltip } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';

const WishlistButton = ({ ticketTypeId, ticketName, size = 'medium', variant = 'outlined' }) => {
  const { addItem: addToWishlist, deleteItem, isInWishlist, getWishlistItem, fetchWishlist } = useWishlist();
  const { user } = useAuth();

  const handleAddToWishlist = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào danh sách yêu thích!');
      return;
    }
    const currentlyIn = isInWishlistValue;
    if (currentlyIn) {
      let item = getWishlistItem(ticketTypeId);
      console.log('Wishlist item to delete (before refresh):', item);
      if (!item) {
        await fetchWishlist();
        item = getWishlistItem(ticketTypeId);
        console.log('Wishlist item to delete (after refresh):', item);
      }
      if (!item || (item.id === undefined && item.Id === undefined)) {
        alert('Không tìm thấy item trong wishlist');
        return;
      }
      const ok = await deleteItem(item.id ?? item.Id);
      if (!ok) alert('Có lỗi khi hủy yêu thích');
      return;
    }
    const success = await addToWishlist(ticketTypeId, 1);
    if (!success) alert('Có lỗi xảy ra khi thêm vào danh sách yêu thích!');
  };

  const isInWishlistValue = isInWishlist(ticketTypeId);

  return (
    <Tooltip title={isInWishlistValue ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}>
      <Button
        variant={isInWishlistValue ? 'contained' : variant}
        color="secondary"
        size={size}
        startIcon={isInWishlistValue ? <Favorite /> : <FavoriteBorder />}
        onClick={handleAddToWishlist}
        sx={{ 
          minWidth: 'auto',
          ...(isInWishlistValue && {
            backgroundColor: 'secondary.light',
            color: 'secondary.contrastText'
          })
        }}
      >
        {isInWishlistValue ? 'Đã yêu thích' : 'Yêu thích'}
      </Button>
    </Tooltip>
  );
};

export default WishlistButton;
