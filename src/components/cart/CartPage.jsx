import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../layout/Header';
import { useCart } from '../../contexts/CartContext';
import CartItem from './CartItem';

const CartPage = () => {
  const { items, totalAmount, isEmpty, clearCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price) + ' ₫';
  };

  if (isEmpty) {
    return (
      <div>
        <Header />
        <div className="container p-4">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">Giỏ hàng trống</h1>
            <p className="text-gray-600 mb-6">Bạn chưa có vé nào trong giỏ hàng</p>
            <Link to="/" className="btn btn-primary">
              Xem sự kiện
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container p-4">
        <div className="cart-page">
          <div className="cart-header">
            <h1 className="text-2xl font-bold">🛒 Giỏ hàng của bạn</h1>
            <button 
              className="btn btn-secondary"
              onClick={clearCart}
            >
              Xóa tất cả
            </button>
          </div>

          <div className="cart-content">
            <div className="cart-items">
              {items.map((item) => (
                <CartItem key={item.ticketTypeId} item={item} />
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-card">
                <h3 className="summary-title">Tóm tắt đơn hàng</h3>
                
                <div className="summary-row">
                  <span>Tổng số vé:</span>
                  <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                
                <div className="summary-row">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                
                <div className="summary-row total">
                  <span>Tổng cộng:</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>

                <div className="summary-actions">
                  <Link to="/" className="btn btn-secondary">
                    Tiếp tục mua sắm
                  </Link>
                  <Link to="/checkout" className="btn btn-primary">
                    Thanh toán
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
