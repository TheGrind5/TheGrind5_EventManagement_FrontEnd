import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { eventsAPI } from '../services/api';
import '../styles/EventDetailsPage.css';

const EventDetailsPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);

  // Mock function to generate ticket types based on event
  const generateMockTicketTypes = (eventData) => {
    if (!eventData) return [];
    
    return [
      {
        id: 1,
        name: 'Vé Tiêu Chuẩn',
        price: 370000,
        description: 'Vé tham gia sự kiện với đầy đủ quyền lợi',
        available: true,
        quantity: 100
      },
      {
        id: 2,
        name: 'Vé VIP',
        price: 750000,
        description: 'Vé VIP với ưu đãi đặc biệt và chỗ ngồi ưu tiên',
        available: true,
        quantity: 20
      },
      {
        id: 3,
        name: 'Vé Early Bird',
        price: 290000,
        description: 'Vé giá ưu đãi cho những người đăng ký sớm',
        available: false,
        quantity: 0
      }
    ];
  };

  useEffect(() => {
    // Check if id is valid
    if (!id || id === 'undefined' || id === '0') {
      setError('Invalid event ID - Event ID cannot be 0 or undefined');
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        console.log('Fetching event with ID:', id);
        const response = await eventsAPI.getById(id);
        console.log('Event response:', response);
        setEvent(response);
        // Generate mock ticket types based on event
        setTicketTypes(generateMockTicketTypes(response));
      } catch (err) {
        setError('Failed to load event details');
        console.error('Error fetching event:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  if (loading) {
    return (
      <div>
        <Header />
        <div className="loading-container">
          <div className="loading-spinner">Loading event details...</div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div>
        <Header />
        <div className="container p-4">
          <div className="alert alert-error text-center">
            {error || 'Event not found'}
          </div>
          <div className="text-center">
            <Link to="/" className="btn btn-primary">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      
      <div className="container p-4">
        <div className="card">
          <div className="card-body">
            <h1 className="card-title">{event.title}</h1>
            
            <div className="mb-4">
              <p><strong>Description:</strong></p>
              <p>{event.description}</p>
            </div>

            <div className="grid grid-2">
              <div>
                <p><strong>Start Time:</strong> {formatDate(event.startTime)}</p>
                <p><strong>End Time:</strong> {formatDate(event.endTime)}</p>
              </div>
              <div>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Category:</strong> {event.category}</p>
                <p><strong>Status:</strong> {event.status}</p>
              </div>
            </div>

            {event.hostName && (
              <div className="mt-4">
                <p><strong>Hosted by:</strong> {event.hostName}</p>
                <p><strong>Contact:</strong> {event.hostEmail}</p>
              </div>
            )}

            {/* Ticket Information Section */}
            <div className="mt-6">
              <h2 className="text-2xl font-bold mb-4 text-white">🎫 Thông tin vé</h2>
              <div className="grid gap-4">
                {ticketTypes.map((ticket) => (
                  <div key={ticket.id} className={`ticket-card ${!ticket.available ? 'ticket-unavailable' : ''}`}>
                    <div className="ticket-header">
                      <div className="ticket-info">
                        <h3 className="ticket-name">{ticket.name}</h3>
                        <p className="ticket-description">{ticket.description}</p>
                      </div>
                      <div className="ticket-price">
                        <span className="price-amount">{formatPrice(ticket.price)}</span>
                        {!ticket.available && (
                          <span className="sold-out-badge">Hết vé</span>
                        )}
                      </div>
                    </div>
                    <div className="ticket-footer">
                      <span className="ticket-quantity">
                        {ticket.available ? `Còn lại: ${ticket.quantity} vé` : 'Đã hết vé'}
                      </span>
                      {ticket.available && (
                        <Link 
                          to={`/event/${id}/order/create?ticketType=${ticket.id}`}
                          className="btn btn-success"
                        >
                          Mua vé ngay
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-6">
              <Link to="/" className="btn btn-secondary">Back to Events</Link>
              <Link to={`/event/${id}/order/create`} className="btn btn-primary ml-2">
                Xem tất cả vé
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
