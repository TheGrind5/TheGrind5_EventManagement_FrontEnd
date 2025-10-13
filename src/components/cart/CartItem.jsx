import React from 'react';
import { useCart } from '../../contexts/CartContext';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(item.ticketTypeId);
    } else {
      // Check max order limit
      if (item.maxOrder && newQuantity > item.maxOrder) {
        alert(`Tối đa ${item.maxOrder} vé cho loại này`);
        return;
      }
      
      // Check available quantity
      if (newQuantity > item.availableQuantity) {
        alert(`Chỉ còn ${item.availableQuantity} vé`);
        return;
      }
      
      updateQuantity(item.ticketTypeId, newQuantity);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price) + ' ₫';
  };

  return (
    <div className="cart-item">
      <div className="cart-item-info">
        <h4 className="cart-item-name">{item.typeName}</h4>
        <p className="cart-item-price">{formatPrice(item.price)}</p>
        {item.minOrder && (
          <p className="cart-item-constraint">
            Tối thiểu: {item.minOrder} vé
          </p>
        )}
        {item.maxOrder && (
          <p className="cart-item-constraint">
            Tối đa: {item.maxOrder} vé
          </p>
        )}
      </div>
      
      <div className="cart-item-controls">
        <div className="quantity-controls">
          <button 
            className="quantity-btn"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            -
          </button>
          <span className="quantity-display">{item.quantity}</span>
          <button 
            className="quantity-btn"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={
              item.quantity >= item.availableQuantity ||
              (item.maxOrder && item.quantity >= item.maxOrder)
            }
          >
            +
          </button>
        </div>
        
        <div className="cart-item-total">
          {formatPrice(item.price * item.quantity)}
        </div>
        
        <button 
          className="remove-btn"
          onClick={() => removeFromCart(item.ticketTypeId)}
          title="Xóa khỏi giỏ hàng"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default CartItem;
