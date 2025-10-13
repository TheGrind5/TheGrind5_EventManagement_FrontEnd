import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { eventsAPI } from '../services/api';

const HomePage = () => {
  //State declaration để quản lý trạng thái của component
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  //useEffect hook để fetch events từ backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventsAPI.getAll();
        console.log('HomePage - Events loaded:', response);
        setEvents(response || []);
      } catch (err) {
        setError('Failed to load events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  //Hàm constants để format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Hàm constants để filter valid events (eventId > 0)
  const validEvents = events.filter(event => event.eventId && event.eventId > 0);

  // Get unique categories for filter dropdown
  const categories = [...new Set(validEvents.map(event => event.category).filter(Boolean))];

  // Filter events based on search and filter criteria
  const filteredEvents = validEvents.filter(event => {
    // Search filter
    const matchesSearch = !searchTerm || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;

    // Date filter
    const eventDate = new Date(event.startTime);
    const now = new Date();
    let matchesDate = true;
    
    if (dateFilter === 'upcoming') {
      matchesDate = eventDate > now;
    } else if (dateFilter === 'past') {
      matchesDate = eventDate < now;
    } else if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      matchesDate = eventDate >= today && eventDate < tomorrow;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDate;
  });

  // Hàm constants để render individual event card
  const renderEventCard = (event) => (
    <div key={event.eventId} className="event-card">
      <div className="event-card-header">
        <div className="event-category-badge">
          {event.category}
        </div>
        <div className="event-status-badge">
          {event.status === 'Active' ? 'Đang diễn ra' : 
           event.status === 'Upcoming' ? 'Sắp diễn ra' : 
           'Đã kết thúc'}
        </div>
      </div>
      
      <div className="event-card-body">
        <h3 className="event-title">{event.title}</h3>
        <p className="event-description">{event.description}</p>
        
        <div className="event-details">
          <div className="event-detail-item">
            <span className="detail-text">{formatDate(event.startTime)}</span>
          </div>
          <div className="event-detail-item">
            <span className="detail-text">{event.location}</span>
          </div>
          {event.hostName && (
            <div className="event-detail-item">
              <span className="detail-text">Host: {event.hostName}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="event-card-footer">
        <Link 
          to={`/event/${event.eventId}`} 
          className="btn btn-primary event-btn"
          onClick={() => console.log('HomePage - Clicking event:', event.eventId, event.title)}
        >
          Xem Chi Tiết
        </Link>
        <Link 
          to={`/event/${event.eventId}/order/create`} 
          className="btn btn-secondary event-btn"
        >
          Mua Vé
        </Link>
      </div>
    </div>
  );

  // Hàm constants để render search and filter UI
  const renderSearchAndFilter = () => (
    <div className="search-filter-section">
      <div className="search-filter-container">
        {/* Search Bar */}
        <div className="search-group">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện..."
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

        {/* Filter Controls */}
        <div className="filter-controls">
          <div className="filter-group">
            <label>Danh mục</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả</option>
              <option value="Active">Đang diễn ra</option>
              <option value="Upcoming">Sắp diễn ra</option>
              <option value="Completed">Đã kết thúc</option>
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
              <option value="today">Hôm nay</option>
              <option value="upcoming">Sắp tới</option>
              <option value="past">Đã qua</option>
            </select>
          </div>

          <button
            className="reset-filters"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
              setDateFilter('all');
            }}
            title="Đặt lại bộ lọc"
          >
            Đặt lại
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <span>
          Hiển thị {filteredEvents.length} / {validEvents.length} sự kiện
        </span>
        {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
          <span className="filter-active">
            Đang lọc
          </span>
        )}
      </div>
    </div>
  );

  // Hàm constants để render events grid
  const renderEventsGrid = () => {
    if (filteredEvents.length === 0) {
      return (
        <div className="text-center no-results">
          <div className="no-results-icon"></div>
          <h3>Không tìm thấy sự kiện</h3>
          <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
              setDateFilter('all');
            }}
          >
            Đặt lại bộ lọc
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-3">
        {filteredEvents.map(renderEventCard)}
      </div>
    );
  };

  // Hàm constants để render loading state
  if (loading) {
    return (
      <div>
        <Header />
        <div className="loading-container">
          <div className="loading-spinner">Loading events...</div>
        </div>
      </div>
    );
  }

  // Hàm constants để render home page
  return (
    <div>
      <Header />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Khám Phá Sự Kiện Tuyệt Vời
            </h1>
            <p className="hero-subtitle">
              Tìm kiếm và tham gia những sự kiện thú vị nhất tại thành phố của bạn
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-large">
                Bắt Đầu Ngay
              </Link>
              <Link to="/" className="btn btn-secondary btn-large">
                Khám Phá Sự Kiện
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">100+</span>
                <span className="stat-label">Sự Kiện</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">5000+</span>
                <span className="stat-label">Người Tham Gia</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Đối Tác</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="p-4">
        <div className="container">
          <h2 className="text-center mb-4">Sự Kiện Sắp Diễn Ra</h2>
          
          {error && (
            <div className="alert alert-error text-center">
              {error}
            </div>
          )}

          {/* Search and Filter Section */}
          {renderSearchAndFilter()}

          {/* Events Grid */}
          {renderEventsGrid()}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
