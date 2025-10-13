import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

const CartIcon = () => {
  const { totalItems } = useCart();

  return (
    <Link to="/cart" className="cart-icon">
      <div className="cart-icon-container">
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="m1 1 4 4 13 1 4 8H7l-2-4"></path>
        </svg>
        {totalItems > 0 && (
          <span className="cart-badge">
            {totalItems}
          </span>
        )}
      </div>
    </Link>
  );
};

export default CartIcon;
