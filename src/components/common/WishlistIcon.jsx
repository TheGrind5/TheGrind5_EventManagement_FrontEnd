import React from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import { Favorite as FavoriteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';

const WishlistIcon = () => {
  const { user } = useAuth();
  const { getWishlistCount, loading } = useWishlist();
  const navigate = useNavigate();

  const wishlistCount = getWishlistCount();

  const handleClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/wishlist');
  };

  return (
    <Tooltip title="Danh sách yêu thích">
      <span>
        <IconButton 
          color="inherit" 
          onClick={handleClick}
          disabled={loading}
        >
          <Badge 
            badgeContent={wishlistCount} 
            color="error"
            max={99}
          >
            <FavoriteIcon />
          </Badge>
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default WishlistIcon;
