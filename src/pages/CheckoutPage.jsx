import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI, walletAPI } from '../services/api';
import { OrderService } from '../services/orderService';
import { PaymentService } from '../services/paymentService';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  // Fetch wallet balance and payment methods
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await walletAPI.getBalance();
        setWalletBalance(response.balance);
        
        const methods = PaymentService.getAvailablePaymentMethods();
        setAvailablePaymentMethods(methods);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price) + ' ₫';
  };

  const handleCheckout = async () => {
    if (!user) {
      setError('Vui lòng đăng nhập để tiếp tục');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Group items by event and create orders
      const ordersByEvent = items.reduce((groups, item) => {
        if (!groups[item.eventId]) {
          groups[item.eventId] = [];
        }
        groups[item.eventId].push(item);
        return groups;
      }, {});

      const orderPromises = Object.entries(ordersByEvent).map(async ([eventId, eventItems]) => {
        const orderData = {
          ticketTypeId: eventItems[0].ticketTypeId,
          quantity: eventItems.reduce((sum, item) => sum + item.quantity, 0),
          seatNo: null
        };

        // Create order with inventory check
        const orderResult = await OrderService.createOrderWithInventoryCheck(orderData);
        
        // Process payment
        const paymentData = {
          amount: totalAmount,
          walletBalance,
          paymentMethod
        };

        const paymentResult = await OrderService.processOrderPayment(
          orderResult.order.orderId,
          paymentData
        );

        return paymentResult;
      });

      const completedOrders = await Promise.all(orderPromises);
      setCreatedOrder(completedOrders[0].order);
      setOrderSuccess(true);

      // Clear cart after successful order
      setTimeout(() => {
        clearCart();
        navigate('/my-tickets');
      }, 5000); // Tăng thời gian để user đọc thông báo

    } catch (error) {
      console.error('Error processing checkout:', error);
      setError(error.message || 'Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div>
        <Header />
        <div className="container p-4">
          <div className="checkout-success">
            <div className="success-card">
              <h1>Đặt hàng thành công!</h1>
              <p>Đơn hàng của bạn đã được tạo thành công.</p>
              <p>Mã đơn hàng: <strong>{createdOrder?.orderId}</strong></p>
              
              <div className="ticket-info">
                <h3>Vé của bạn đã được tạo!</h3>
                <p>Vé đã được gửi vào tài khoản của bạn</p>
                <p>Bạn có thể xem vé trong "My Tickets"</p>
                <p>Vé có thể được sử dụng để check-in tại sự kiện</p>
              </div>
              
              <p className="redirect-info">
                Đang chuyển hướng đến trang vé của bạn trong 5 giây...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container p-4">
        <div className="checkout-page">
          <h1>💳 Thanh toán</h1>
          
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="checkout-content">
            <div className="checkout-items">
              <h2>📋 Đơn hàng của bạn</h2>
              {items.map((item) => (
                <div key={item.ticketTypeId} className="checkout-item">
                  <div className="item-info">
                    <h4>{item.typeName}</h4>
                    <p>Số lượng: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout-summary">
              <div className="summary-card">
                <h3>Tóm tắt thanh toán</h3>
                
                <div className="summary-row">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                
                <div className="summary-row">
                  <span>Phí xử lý:</span>
                  <span>0 ₫</span>
                </div>
                
                <div className="summary-row total">
                  <span>Tổng cộng:</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>

                <div className="payment-methods">
                  <h4>💳 Phương thức thanh toán</h4>
                  {availablePaymentMethods.map((method) => (
                    <div key={method.id} className="payment-method">
                      <label className="payment-method-label">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          disabled={!method.enabled}
                        />
                        <span className="payment-method-info">
                          <span className="payment-icon">{method.icon}</span>
                          <span className="payment-name">{method.name}</span>
                          <span className="payment-description">{method.description}</span>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="wallet-info">
                  <p><strong>Số dư ví:</strong> {formatPrice(walletBalance)}</p>
                  {paymentMethod === 'wallet' && totalAmount > walletBalance && (
                    <p className="insufficient-balance">
                      ⚠️ Số dư không đủ. <a href="/wallet">Nạp thêm tiền</a>
                    </p>
                  )}
                </div>

                <button 
                  className="btn btn-primary checkout-btn"
                  onClick={handleCheckout}
                  disabled={loading || (paymentMethod === 'wallet' && totalAmount > walletBalance)}
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
