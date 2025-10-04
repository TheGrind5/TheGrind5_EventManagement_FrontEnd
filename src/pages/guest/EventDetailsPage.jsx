import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEventById } from '../../api/events';

export default function EventDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventData();
  }, [id]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const data = await getEventById(id);
      setEventData(data);
    } catch (error) {
      console.error('Error loading event:', error);
      // Fallback to mock data
      setEventData({
        eventId: parseInt(id),
        title: "WATERSOME 2025",
        description: "Sự kiện âm nhạc và giải trí lớn nhất năm 2025 tại TP.HCM. Với sự tham gia của nhiều nghệ sĩ nổi tiếng và các hoạt động thú vị. Đây sẽ là một trải nghiệm không thể quên với những màn trình diễn đỉnh cao và không khí sôi động.",
        startTime: "2025-11-15T15:00:00",
        endTime: "2025-11-16T22:00:00",
        location: "VAN PHUC CITY",
        category: "Music",
        hostName: "TheGrind5 Entertainment",
        hostEmail: "info@thegrind5.com",
        ticketTypes: [
          {
            ticketTypeId: 1,
            typeName: "Vé thường",
            price: 500000,
            quantity: 200,
            status: "Active"
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="app-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h1>Không tìm thấy sự kiện</h1>
          <button onClick={() => navigate('/')}>Quay về trang chủ</button>
        </div>
      </div>
    );
  }

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleBuyTicket = () => {
    // Trong thực tế sẽ redirect đến trang mua vé
    alert('Tính năng mua vé sẽ được phát triển!');
  };

  const scheduleItems = [
    { time: "15:00", event: "Mở cửa" },
    { time: "16:00", event: "Biểu diễn mở đầu" },
    { time: "18:00", event: "Nghệ sĩ chính" },
    { time: "20:00", event: "Nghệ sĩ khách mời" },
    { time: "22:00", event: "Kết thúc" }
  ];

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
              onClick={handleBackClick}
              style={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)', borderRadius: '8px', padding: '8px 16px' }}
            >
              ← Quay lại
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Event Hero Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          borderRadius: '24px', 
          padding: '48px', 
          marginBottom: '48px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: '0', 
            right: '0', 
            width: '200px', 
            height: '200px', 
            background: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: '50%', 
            transform: 'translate(50%, -50%)' 
          }}></div>
          <div style={{ 
            position: 'absolute', 
            bottom: '0', 
            left: '0', 
            width: '150px', 
            height: '150px', 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '50%', 
            transform: 'translate(-50%, 50%)' 
          }}></div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.2)', 
                padding: '8px 16px', 
                borderRadius: '20px', 
                display: 'inline-block', 
                marginBottom: '16px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {eventData.category}
              </div>
              <h1 style={{ 
                fontSize: '48px', 
                fontWeight: '700', 
                marginBottom: '16px',
                lineHeight: '1.2'
              }}>
                {eventData.title}
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <div style={{ fontSize: '20px', fontWeight: '600' }}>
                  {new Date(eventData.startTime).toLocaleDateString('vi-VN')}
                </div>
                <div style={{ fontSize: '16px', opacity: 0.9 }}>
                  {new Date(eventData.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(eventData.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: '16px', opacity: 0.9 }}>{eventData.location}</div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '20px', 
                padding: '48px', 
                marginBottom: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '120px', marginBottom: '16px' }}>
                  {eventData.category === 'Music' ? '🎵' : 
                   eventData.category === 'Art' ? '🎭' : 
                   eventData.category === 'Sports' ? '⚽' : '🎉'}
                </div>
              </div>
              
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '16px', 
                padding: '24px', 
                marginBottom: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Giá vé</div>
                <div style={{ fontSize: '32px', fontWeight: '700' }}>
                  {eventData.ticketTypes && eventData.ticketTypes.length > 0 
                    ? `${eventData.ticketTypes[0].price.toLocaleString('vi-VN')} VND`
                    : 'Liên hệ'
                  }
                </div>
              </div>
              
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '16px', 
                padding: '24px', 
                marginBottom: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Vé còn lại</div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>
                  {eventData.ticketTypes && eventData.ticketTypes.length > 0 
                    ? `${eventData.ticketTypes[0].quantity} vé`
                    : 'Liên hệ'
                  }
                </div>
              </div>
              
              <button 
                onClick={handleBuyTicket}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  border: '2px solid rgba(255, 255, 255, 0.3)', 
                  borderRadius: '16px', 
                  padding: '16px 32px', 
                  color: 'white', 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Mua vé ngay
              </button>
            </div>
          </div>
        </div>

        {/* Event Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '48px', marginBottom: '48px' }}>
          {/* Description Section */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '20px', 
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              marginBottom: '24px',
              color: '#ffffff'
            }}>
              Mô tả sự kiện
            </h2>
            <p style={{ 
              fontSize: '16px', 
              lineHeight: '1.6', 
              color: '#9ca3af',
              marginBottom: '24px'
            }}>
              {eventData.description}
            </p>
            
            <div style={{ 
              background: 'rgba(102, 126, 234, 0.1)', 
              borderRadius: '12px', 
              padding: '20px',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '12px',
                color: '#ffffff'
              }}>
                Thông tin tổ chức
              </h3>
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Tổ chức:</strong> {eventData.hostName || 'TheGrind5 Entertainment'}
                </div>
                <div>
                  <strong>Liên hệ:</strong> {eventData.hostEmail || 'info@thegrind5.com'}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            borderRadius: '20px', 
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: 'fit-content'
          }}>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              marginBottom: '24px',
              color: '#ffffff'
            }}>
              Lịch trình
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {scheduleItems.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                    color: 'white', 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    fontWeight: '600',
                    fontSize: '14px',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {item.time}
                  </div>
                  <div style={{ 
                    color: '#ffffff', 
                    fontSize: '16px',
                    fontWeight: '500'
                  }}>
                    {item.event}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          borderRadius: '20px', 
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '48px'
        }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '600', 
            marginBottom: '24px',
            color: '#ffffff'
          }}>
            Thông tin bổ sung
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div style={{ 
              background: 'rgba(102, 126, 234, 0.1)', 
              borderRadius: '12px', 
              padding: '20px',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#ffffff' }}>
                🎫 Chính sách vé
              </h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.5' }}>
                Vé không được hoàn lại sau khi mua. Vui lòng kiểm tra kỹ thông tin trước khi thanh toán.
              </p>
            </div>
            
            <div style={{ 
              background: 'rgba(102, 126, 234, 0.1)', 
              borderRadius: '12px', 
              padding: '20px',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#ffffff' }}>
                📱 Hỗ trợ
              </h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.5' }}>
                Liên hệ hotline 1900-xxxx để được hỗ trợ 24/7 về vé và sự kiện.
              </p>
            </div>
            
            <div style={{ 
              background: 'rgba(102, 126, 234, 0.1)', 
              borderRadius: '12px', 
              padding: '20px',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#ffffff' }}>
                🚗 Địa điểm
              </h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.5' }}>
                Bãi đỗ xe miễn phí. Gần các tuyến xe buýt và taxi. Dễ dàng di chuyển.
              </p>
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