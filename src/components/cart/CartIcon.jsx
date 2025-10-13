import React from 'react';
import { Link } from 'react-router-dom';
import { IconButton, Badge, Tooltip } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';

const CartIcon = () => {
  const { totalItems } = useCart();

  return (
    <Tooltip title="Shopping Cart">
      <IconButton
        component={Link}
        to="/cart"
        color="inherit"
        sx={{
          borderRadius: 2,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <Badge 
          badgeContent={totalItems} 
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              height: 18,
              minWidth: 18,
            }
          }}
        >
          <ShoppingCart />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default CartIcon;
