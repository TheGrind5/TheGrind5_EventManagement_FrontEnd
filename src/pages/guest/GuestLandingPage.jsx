import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import { getAllEvents } from '../../api/events';

export default function GuestLandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await getAllEvents();
      setEvents(eventsData.slice(0, 3)); // Chỉ lấy 3 events đầu tiên
    } catch (error) {
      console.error('Error loading events:', error);
      // Fallback to mock data
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

  const handleAuthSuccess = (userData) => {
    console.log('Authentication successful:', userData);
    // Redirect to customer dashboard will be handled by routing
    window.location.href = '/customer';
  };

  const handleSwitchAuth = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  const handleBack = () => {
    setShowAuth(false);
  };

  const handleEventClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  if (showAuth) {
    return authMode === 'login' ? (
      <LoginForm 
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={handleSwitchAuth}
        onBack={handleBack}
      />
    ) : (
      <RegisterForm 
        onSuccess={handleAuthSuccess}
        onSwitchToLogin={handleSwitchAuth}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <a href="#" className="logo">TicketHub</a>
          
          <nav className="nav-links">
            <a href="#" className="nav-link">Sự kiện</a>
            <a href="#" className="nav-link">Tin tức</a>
            <a href="#" className="nav-link">Liên hệ</a>
            <button 
              className="nav-link"
              onClick={() => {
                setAuthMode('login');
                setShowAuth(true);
              }}
              style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '8px', padding: '8px 16px' }}
            >
              Đăng nhập
            </button>
            <button 
              className="nav-link"
              onClick={() => {
                setAuthMode('register');
                setShowAuth(true);
              }}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white' }}
            >
              Đăng ký
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Khám phá sự kiện tuyệt vời
          </h1>
          <p style={{ fontSize: '20px', color: '#9ca3af', maxWidth: '600px', margin: '0 auto' }}>
            Tìm kiếm và mua vé cho các sự kiện âm nhạc, thể thao, văn hóa và nhiều hơn nữa
          </p>
        </div>
        {/* Featured Events */}
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
                    {new Date(event.startTime).toLocaleDateString('vi-VN')} • {event.location}<br/>
                    {event.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '80px', padding: '40px 0', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '16px', color: '#ffffff' }}>
            Sẵn sàng tham gia?
          </h2>
          <p style={{ fontSize: '18px', color: '#9ca3af', marginBottom: '32px' }}>
            Đăng ký ngay để không bỏ lỡ bất kỳ sự kiện nào
          </p>
          <button 
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '16px 32px', 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: '600', 
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onClick={() => {
              setAuthMode('register');
              setShowAuth(true);
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Đăng ký miễn phí
          </button>
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
