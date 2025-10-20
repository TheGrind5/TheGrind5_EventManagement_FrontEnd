import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { ordersAPI, ticketsAPI } from '../services/apiClient';

const OrderConfirmationPage = () => {
    const { orderId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    // State management
    const [order, setOrder] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Get data from navigation state or fetch from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Try to get data from navigation state first
                if (location.state?.order) {
                    setOrder(location.state.order);
                } else {
                    // Fetch order details from API
                    const orderData = await ordersAPI.getById(orderId);
                    setOrder(orderData);
                }
                
                // Fetch tickets for this order
                try {
                    const ticketsData = await ticketsAPI.getTicketsByOrder(orderId);
                    setTickets(ticketsData.tickets || []);
                } catch (ticketError) {
                    console.warn('Could not fetch tickets:', ticketError);
                    // Tickets might not be created yet, that's okay
                }
                
            } catch (err) {
                console.error('Error fetching data:', err);
                
                // 🔧 FIX: Cải thiện error handling với specific error messages
                let errorMessage = 'Không thể tải thông tin đơn hàng';
                let errorCode = 500;
                
                // Parse error từ apiClient response format
                if (err.success === false) {
                    errorMessage = err.message || errorMessage;
                    errorCode = err.code || 500;
                }
                // Parse error từ axios response
                else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                    errorCode = err.response.status;
                }
                // Parse error từ fetch response
                else if (err.data?.message) {
                    errorMessage = err.data.message;
                }
                // Parse error từ exception message
                else if (err.message) {
                    errorMessage = err.message;
                }
                
                // 🔧 FIX: Thêm specific error handling
                if (errorCode === 404) {
                    errorMessage = 'Không tìm thấy đơn hàng. Có thể đơn hàng đã bị xóa hoặc không tồn tại.';
                } else if (errorCode === 401) {
                    errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                } else if (errorCode === 0) {
                    errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.';
                }
                
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        
        if (orderId) {
            fetchData();
        }
    }, [orderId, location.state]);
    
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };
    
    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    if (loading) {
        return (
            <div>
                <Header />
                <div className="confirmation-container">
                    <div className="confirmation-card">
                        <div className="text-center">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Đang tải thông tin xác nhận...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (error || !order) {
        return (
            <div>
                <Header />
                <div className="confirmation-container">
                    <div className="confirmation-card">
                        <div className="alert alert-danger">
                            <h4>❌ Lỗi</h4>
                            <p>{error || 'Không tìm thấy thông tin đơn hàng'}</p>
                            <button 
                                className="btn btn-outline-danger"
                                onClick={() => navigate('/dashboard')}
                            >
                                Quay về Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <Header />
            <div className="confirmation-container">
                <div className="confirmation-card">
                    {/* Success Header */}
                    <div className="success-header text-center">
                        <div className="success-icon">🎉</div>
                        <h1 className="success-title">Thanh toán thành công!</h1>
                        <p className="success-message">
                            Đơn hàng của bạn đã được xử lý thành công. Vé đã được tạo và gửi đến tài khoản của bạn.
                        </p>
                    </div>
                    
                    {/* Order Summary */}
                    <div className="order-summary">
                        <h3>📋 Thông tin đơn hàng</h3>
                        <div className="order-details">
                            <div className="detail-row">
                                <span className="detail-label">Mã đơn hàng:</span>
                                <span className="detail-value">#{order.orderId}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Sự kiện:</span>
                                <span className="detail-value">{order.event?.title || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Loại vé:</span>
                                <span className="detail-value">{order.ticketType?.typeName || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Số lượng:</span>
                                <span className="detail-value">{order.quantity} vé</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Tổng tiền:</span>
                                <span className="detail-value amount">{formatCurrency(order.amount)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Trạng thái:</span>
                                <span className="detail-value">
                                    <span className={`badge ${order.status === 'Paid' ? 'bg-success' : 'bg-warning'}`}>
                                        {order.status === 'Paid' ? 'Đã thanh toán' : order.status}
                                    </span>
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Ngày tạo:</span>
                                <span className="detail-value">{formatDate(order.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Payment Information */}
                    {location.state?.paymentResult && (
                        <div className="payment-info">
                            <h3>💳 Thông tin thanh toán</h3>
                            <div className="payment-details">
                                <div className="detail-row">
                                    <span className="detail-label">Phương thức:</span>
                                    <span className="detail-value">
                                        {location.state.paymentMethod === 'wallet' ? 'Ví điện tử' : location.state.paymentMethod}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Mã giao dịch:</span>
                                    <span className="detail-value">{location.state.paymentResult.walletTransactionId || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Số dư còn lại:</span>
                                    <span className="detail-value">{formatCurrency(location.state.paymentResult.newWalletBalance || 0)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Tickets Information */}
                    {tickets.length > 0 ? (
                        <div className="tickets-info">
                            <h3>🎫 Vé của bạn</h3>
                            <div className="tickets-list">
                                {tickets.map((ticket, index) => (
                                    <div key={ticket.ticketId} className="ticket-item">
                                        <div className="ticket-header">
                                            <span className="ticket-number">Vé #{index + 1}</span>
                                            <span className="ticket-status">
                                                <span className="badge bg-success">Có thể sử dụng</span>
                                            </span>
                                        </div>
                                        <div className="ticket-details">
                                            <p><strong>Mã vé:</strong> {ticket.serialNumber}</p>
                                            <p><strong>Loại vé:</strong> {ticket.ticketType?.typeName}</p>
                                            <p><strong>Giá:</strong> {formatCurrency(ticket.ticketType?.price || 0)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="tickets-info">
                            <h3>🎫 Vé của bạn</h3>
                            <div className="alert alert-info">
                                <p>Vé đang được tạo. Bạn sẽ nhận được thông báo khi vé sẵn sàng.</p>
                                <p className="small text-muted">
                                    Thông thường vé sẽ được tạo trong vòng vài phút.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Next Steps */}
                    <div className="next-steps">
                        <h3>📝 Bước tiếp theo</h3>
                        <div className="steps-list">
                            <div className="step-item">
                                <span className="step-number">1</span>
                                <div className="step-content">
                                    <strong>Kiểm tra email</strong>
                                    <p>Chúng tôi đã gửi thông tin đơn hàng đến email của bạn</p>
                                </div>
                            </div>
                            <div className="step-item">
                                <span className="step-number">2</span>
                                <div className="step-content">
                                    <strong>Xem vé của bạn</strong>
                                    <p>Vé đã được lưu trong tài khoản của bạn</p>
                                </div>
                            </div>
                            <div className="step-item">
                                <span className="step-number">3</span>
                                <div className="step-content">
                                    <strong>Tham gia sự kiện</strong>
                                    <p>Mang vé đến sự kiện để check-in</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button 
                            className="btn btn-outline-primary me-3"
                            onClick={() => navigate('/my-tickets')}
                        >
                            Xem vé của tôi
                        </button>
                        
                        <button 
                            className="btn btn-primary me-3"
                            onClick={() => navigate('/dashboard')}
                        >
                            Về Dashboard
                        </button>
                        
                        <button 
                            className="btn btn-outline-secondary"
                            onClick={() => navigate('/')}
                        >
                            Xem sự kiện khác
                        </button>
                    </div>
                    
                    {/* Support Information */}
                    <div className="support-info">
                        <p className="text-muted small">
                            💬 Cần hỗ trợ? Liên hệ chúng tôi qua email hoặc hotline.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmationPage;
