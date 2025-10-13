import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { ticketsAPI } from '../services/api';
import '../styles/MyTicketsPage.css';

const MyTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, available, used, refunded
  const [showNewTicketsAlert, setShowNewTicketsAlert] = useState(false);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getMyTickets();
      const newTickets = response.tickets || [];
      
      // Check if there are new tickets (recently created)
      const recentTickets = newTickets.filter(ticket => {
        const ticketDate = new Date(ticket.issuedAt);
        const now = new Date();
        const diffHours = (now - ticketDate) / (1000 * 60 * 60);
        return diffHours < 24; // Tickets created in last 24 hours
      });
      
      if (recentTickets.length > 0) {
        setShowNewTicketsAlert(true);
        // Auto-hide alert after 10 seconds
        setTimeout(() => setShowNewTicketsAlert(false), 10000);
      }
      
      setTickets(newTickets);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (ticketId) => {
    try {
      await ticketsAPI.checkInTicket(ticketId);
      // Refresh tickets after check-in
      await fetchTickets();
      alert('Check-in thành công!');
    } catch (err) {
      alert(`Lỗi check-in: ${err.message}`);
    }
  };

  const handleRefund = async (ticketId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hoàn tiền vé này?')) {
      return;
    }

    try {
      await ticketsAPI.refundTicket(ticketId);
      // Refresh tickets after refund
      await fetchTickets();
      alert('Hoàn tiền thành công!');
    } catch (err) {
      alert(`Lỗi hoàn tiền: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price) + ' ₫';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned': return '#22c55e';
      case 'Used': return '#3b82f6';
      case 'Refunded': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Assigned': return 'Có thể sử dụng';
      case 'Used': return 'Đã sử dụng';
      case 'Refunded': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  // Get unique events for filter dropdown
  const events = [...new Set(tickets.map(ticket => ticket.eventTitle).filter(Boolean))];

  const filteredTickets = tickets.filter(ticket => {
    // Status filter
    let matchesStatus = true;
    switch (filter) {
      case 'available':
        matchesStatus = ticket.status === 'Assigned';
        break;
      case 'used':
        matchesStatus = ticket.status === 'Used';
        break;
      case 'refunded':
        matchesStatus = ticket.status === 'Refunded';
        break;
      default:
        matchesStatus = true;
    }

    // Search filter
    const matchesSearch = !searchTerm || 
      ticket.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    // Event filter
    const matchesEvent = eventFilter === 'all' || ticket.eventTitle === eventFilter;

    // Date filter
    const ticketDate = new Date(ticket.issuedAt);
    const now = new Date();
    let matchesDate = true;
    
    if (dateFilter === 'recent') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = ticketDate >= weekAgo;
    } else if (dateFilter === 'old') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = ticketDate < weekAgo;
    }

    return matchesStatus && matchesSearch && matchesEvent && matchesDate;
  });

  if (loading) {
    return (
      <div>
        <Header />
        <div className="tickets-page">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang tải vé của bạn...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="tickets-page">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Lỗi tải vé</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchTickets}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="tickets-page">
        
        {/* New Tickets Alert */}
        {showNewTicketsAlert && (
          <div className="new-tickets-alert">
            <div className="alert-content">
              <span className="alert-icon">🎫</span>
              <div className="alert-text">
                <h4>Vé mới đã được tạo!</h4>
                <p>Bạn có vé mới trong tài khoản. Hãy kiểm tra bên dưới!</p>
              </div>
              <button 
                className="alert-close"
                onClick={() => setShowNewTicketsAlert(false)}
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <div className="tickets-header">
          <h1>Vé của tôi</h1>
          <p>Quản lý và theo dõi vé sự kiện của bạn</p>
        </div>

        {/* Search and Filter Section */}
        <div className="tickets-search-filter">
          <div className="search-group">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Tìm kiếm vé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                  title="Xóa tìm kiếm"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <label>Sự kiện</label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả sự kiện</option>
                {events.map(event => (
                  <option key={event} value={event}>{event}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Thời gian</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                <option value="recent">Gần đây (7 ngày)</option>
                <option value="old">Cũ hơn</option>
              </select>
            </div>

            <button
              className="reset-filters"
              onClick={() => {
                setSearchTerm('');
                setEventFilter('all');
                setDateFilter('all');
              }}
              title="Đặt lại bộ lọc"
            >
              Đặt lại
            </button>
          </div>

          <div className="results-summary">
            <span>
              Hiển thị {filteredTickets.length} / {tickets.length} vé
            </span>
            {(searchTerm || eventFilter !== 'all' || dateFilter !== 'all') && (
              <span className="filter-active">
                Đang lọc
              </span>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({tickets.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'Assigned' ? 'active' : ''}`}
            onClick={() => setFilter('Assigned')}
          >
            Có thể dùng ({tickets.filter(t => t.status === 'Assigned').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'Used' ? 'active' : ''}`}
            onClick={() => setFilter('Used')}
          >
            Đã dùng ({tickets.filter(t => t.status === 'Used').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'Refunded' ? 'active' : ''}`}
            onClick={() => setFilter('Refunded')}
          >
            Đã hoàn ({tickets.filter(t => t.status === 'Refunded').length})
          </button>
        </div>

        {/* Tickets List */}
        <div className="tickets-list">
          {filteredTickets.length === 0 ? (
            tickets.length === 0 ? (
              <div className="no-tickets">
                <div className="no-tickets-icon">🎫</div>
                <h3>Chưa có vé nào</h3>
                <p>Bạn chưa mua vé sự kiện nào. Hãy khám phá các sự kiện thú vị!</p>
                <Link to="/" className="btn btn-primary">
                  Xem sự kiện
                </Link>
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon"></div>
                <h3>Không tìm thấy vé</h3>
                <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setEventFilter('all');
                    setDateFilter('all');
                  }}
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            )
          ) : (
            filteredTickets.map((ticket) => (
              <div key={ticket.ticketId} className="ticket-card">
                <div className="ticket-header">
                  <div className="ticket-info">
                    <h3>{ticket.event.title}</h3>
                    <p className="ticket-type">{ticket.ticketType.typeName}</p>
                    <p className="serial-number">Số vé: {ticket.serialNumber}</p>
                  </div>
                  <div className="ticket-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(ticket.status) }}
                    >
                      {getStatusText(ticket.status)}
                    </span>
                    <p className="price">{formatPrice(ticket.ticketType.price)}</p>
                  </div>
                </div>

                <div className="ticket-details">
                  <div className="detail-row">
                    <span className="label">📅 Thời gian:</span>
                    <span>{formatDate(ticket.event.startTime)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">📍 Địa điểm:</span>
                    <span>{ticket.event.location}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">🕒 Phát hành:</span>
                    <span>{formatDate(ticket.issuedAt)}</span>
                  </div>
                  {ticket.usedAt && (
                    <div className="detail-row">
                      <span className="label">✅ Sử dụng:</span>
                      <span>{formatDate(ticket.usedAt)}</span>
                    </div>
                  )}
                </div>

                <div className="ticket-actions">
                  {ticket.status === 'Assigned' && (
                    <>
                      <button 
                        className="btn btn-success"
                        onClick={() => handleCheckIn(ticket.ticketId)}
                      >
                        Check-in
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleRefund(ticket.ticketId)}
                      >
                        Hoàn tiền
                      </button>
                    </>
                  )}
                  <Link 
                    to={`/event/${ticket.event.eventId}`}
                    className="btn btn-outline"
                  >
                    Xem sự kiện
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTicketsPage;
