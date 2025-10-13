import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistAPI } from '../api';

const AddToWishlistButton = ({ 
  ticketTypeId, 
  className = "btn", 
  onSuccess, 
  onError,
  onAdded,
  disabled = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!ticketTypeId || loading || disabled) {
      console.log('AddToWishlistButton: Cannot add - ticketTypeId:', ticketTypeId, 'loading:', loading, 'disabled:', disabled);
      return;
    }
    
    console.log('AddToWishlistButton: Adding to wishlist - ticketTypeId:', ticketTypeId);
    
    try {
      setLoading(true);
      console.log('AddToWishlistButton: Calling wishlistAPI.addItem...');
      
      const result = await wishlistAPI.addItem(ticketTypeId, 1);
      console.log('AddToWishlistButton: API call successful:', result);
      
      setAdded(true);
      
      // Show toast notification
      window.dispatchEvent(new CustomEvent("toast", { 
        detail: { type: "success", message: "Đã thêm vào Wishlist" } 
      }));
      
      if (onSuccess) {
        onSuccess('Đã thêm vào wishlist!');
      }
      
      if (onAdded) {
        onAdded();
      }
      
      // Reset added state after 1.2 seconds
      setTimeout(() => setAdded(false), 1200);
      
    } catch (error) {
      console.error('AddToWishlistButton: Error adding to wishlist:', error);
      console.error('AddToWishlistButton: Error message:', error.message);
      console.error('AddToWishlistButton: Error stack:', error.stack);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('AddToWishlistButton: Unauthorized, redirecting to login');
        // Redirect to login if unauthorized
        navigate('/login', { state: { from: window.location.pathname } });
        return;
      }
      
      // Show error toast
      window.dispatchEvent(new CustomEvent("toast", { 
        detail: { type: "error", message: error.message || "Lỗi thêm Wishlist" } 
      }));
      
      if (onError) {
        onError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const buttonClasses = `wishlist-add-btn ${className} ${loading ? 'loading' : ''} ${added ? 'added' : ''}`;

  return (
    <button
      type="button"
      aria-label="Add to Wishlist"
      onClick={handleClick}
      disabled={loading || disabled}
      className={buttonClasses}
    >
      <HeartIcon filled={added} />
      {loading ? "Đang thêm..." : added ? "Đã thêm" : "Add to Wishlist"}
      {disabled && <span style={{fontSize: '10px', display: 'block'}}>(Disabled)</span>}
    </button>
  );
};

function HeartIcon({ filled }) {
  return (
    <svg 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      aria-hidden="true" 
      className="wishlist-heart-icon"
    >
      <path
        d="M12.1 21.35l-1.1-.99C5.14 15.36 2 12.5 2 8.9 2 6.2 4.2 4 6.9 4c1.6 0 3.1.75 4.1 1.92C12.9 4.75 14.4 4 16 4 18.8 4 21 6.2 21 8.9c0 3.6-3.14 6.46-8.99 11.46l-1.01.99z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default AddToWishlistButton;
