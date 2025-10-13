import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistAPI } from '../api';

const SimpleAddToWishlistButton = ({ 
  ticketTypeId, 
  className = "btn", 
  onSuccess, 
  onError,
  disabled = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();

  const handleClick = async () => {
    console.log('🔴 SIMPLE BUTTON CLICKED!');
    console.log('🔴 ticketTypeId:', ticketTypeId);
    console.log('🔴 loading:', loading);
    console.log('🔴 disabled:', disabled);
    
    if (!ticketTypeId || loading || disabled) {
      console.log('🔴 Cannot proceed - missing data or disabled');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔴 Calling API...');
      
      const result = await wishlistAPI.addItem(ticketTypeId, 1);
      console.log('🔴 API Success:', result);
      
      setAdded(true);
      
      // Show toast notification
      window.dispatchEvent(new CustomEvent("toast", { 
        detail: { type: "success", message: "✅ Đã thêm vào Wishlist!" } 
      }));
      
      if (onSuccess) {
        onSuccess('Đã thêm vào wishlist!');
      }
      
      setTimeout(() => setAdded(false), 2000);
      
    } catch (error) {
      console.error('🔴 API Error:', error);
      
      // Show error toast notification
      window.dispatchEvent(new CustomEvent("toast", { 
        detail: { type: "error", message: "❌ Lỗi: " + error.message } 
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
      onClick={handleClick}
      disabled={loading || disabled}
      className={buttonClasses}
    >
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        aria-hidden="true" 
        className="wishlist-heart-icon"
        style={{ marginRight: '6px' }}
      >
        <path
          d="M12.1 21.35l-1.1-.99C5.14 15.36 2 12.5 2 8.9 2 6.2 4.2 4 6.9 4c1.6 0 3.1.75 4.1 1.92C12.9 4.75 14.4 4 16 4 18.8 4 21 6.2 21 8.9c0 3.6-3.14 6.46-8.99 11.46l-1.01.99z"
          fill={added ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      {loading ? "Đang thêm..." : added ? "Đã thêm" : "Add to Wishlist"}
    </button>
  );
};

export default SimpleAddToWishlistButton;
