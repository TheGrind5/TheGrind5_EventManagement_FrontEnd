import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllEvents } from '../../api/events';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await getAllEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      // Fallback to mock data if API fails
      setEvents([
        {
          eventId: 1,
          title: "WATERSOME 2025",
          description: "Sự kiện âm nhạc và giải trí lớn nhất năm",
          startTime: "2025-11-15T15:00:00",
          endTime: "2025-11-16T22:00:00",
          location: "VAN PHUC CITY",
          category: "Music"
        },
        {
          eventId: 2,
          title: "EXSH Concert",
          description: "EM XINH SAY HI CONCERT ĐÊM 2",
          startTime: "2025-10-11T19:00:00",
          endTime: "2025-10-11T22:00:00",
          location: "SÂN VẬN ĐỘNG QUỐC GIA MỸ ĐÌNH",
          category: "Music"
        },
        {
          eventId: 3,
          title: "TRANG TRANG A",
          description: "Biểu diễn nghệ thuật đặc sắc",
          startTime: "2025-10-30T19:30:00",
          endTime: "2025-10-30T21:30:00",
          location: "CAPITAL THEATRE",
          category: "Art"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <a href="#" className="logo">TicketHub</a>
          
          <nav className="nav-links">
            <a href="#" className="nav-link">Sự kiện</a>
            <a href="#" className="nav-link">Tin tức</a>
            <a href="#" className="nav-link">Vé của tôi</a>
            <div className="user-menu">
              <span className="user-name">Xin chào, {user?.fullName || user?.username}</span>
              <button className="logout-btn" onClick={logout}>Đăng xuất</button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Welcome Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          borderRadius: '24px', 
          padding: '48px', 
          marginBottom: '48px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: '700', 
            marginBottom: '16px' 
          }}>
            Chào mừng trở lại, {user?.fullName || user?.username}!
          </h1>
          <p style={{ 
            fontSize: '18px', 
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Khám phá các sự kiện thú vị và mua vé ngay hôm nay
          </p>
        </div>

        {/* Featured Events */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '600', 
            marginBottom: '24px',
            color: '#ffffff'
          }}>
            Sự kiện nổi bật
          </h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '16px', color: '#9ca3af' }}>Đang tải sự kiện...</p>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((event) => {
                const getEventIcon = (category) => {
                  switch (category?.toLowerCase()) {
                    case 'music': return '🎵';
                    case 'art': return '🎭';
                    case 'sports': return '⚽';
                    case 'conference': return '🎤';
                    default: return '🎉';
                  }
                };

                const getGradient = (index) => {
                  const gradients = [
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                  ];
                  return gradients[index % gradients.length];
                };

                return (
                  <div key={event.eventId} className="event-card" onClick={() => handleEventClick(event.eventId)}>
                    <div style={{ 
                      background: getGradient(events.indexOf(event)), 
                      height: '200px', 
                      borderRadius: '12px', 
                      marginBottom: '16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '48px' 
                    }}>
                      {getEventIcon(event.category)}
                    </div>
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-description">
                      {formatDate(event.startTime)} • {event.location}<br/>
                      {event.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Tickets Section */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '600', 
            marginBottom: '24px',
            color: '#ffffff'
          }}>
            Vé của tôi
          </h2>
          <div className="events-grid">
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '16px', 
              padding: '24px',
              borderLeft: '4px solid #10b981'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#ffffff' }}>
                WATERSOME 2025
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                15.11.2025 - 16.11.2025
              </p>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
                VAN PHUC CITY
              </p>
              <span style={{ 
                background: '#10b981', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: '600' 
              }}>
                Đã xác nhận
              </span>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '16px', 
              padding: '24px',
              borderLeft: '4px solid #f59e0b'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#ffffff' }}>
                EXSH Concert
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                11.10.2025
              </p>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
                SÂN VẬN ĐỘNG QUỐC GIA MỸ ĐÌNH
              </p>
              <span style={{ 
                background: '#f59e0b', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: '600' 
              }}>
                Chờ xác nhận
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer style={{ 
        background: 'rgba(255, 255, 255, 0.05)', 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
        padding: '40px 0',
        marginTop: '80px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '14px' }}>
            © 2025 TicketHub. Tất cả quyền được bảo lưu.
          </div>
          
          <div style={{ display: 'flex', gap: '32px' }}>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '14px' }}>Trợ giúp</a>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '14px' }}>Bảo mật</a>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '14px' }}>Điều khoản</a>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#" style={{ color: '#9ca3af', fontSize: '20px' }}>📘</a>
            <a href="#" style={{ color: '#9ca3af', fontSize: '20px' }}>🐦</a>
            <a href="#" style={{ color: '#9ca3af', fontSize: '20px' }}>📷</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
