import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { eventsAPI, ticketsAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import '../styles/EventDetailsPage.css';

const EventDetailsPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const { addToCart } = useCart();

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
        
        // Fetch real ticket types from API
        try {
          const ticketTypesResponse = await ticketsAPI.getTicketTypesByEvent(id);
          console.log('Ticket types response:', ticketTypesResponse);
          setTicketTypes(ticketTypesResponse || []);
        } catch (ticketErr) {
          console.warn('Failed to fetch ticket types, using empty array:', ticketErr);
          setTicketTypes([]);
        }
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

  const handleAddToCart = (ticket) => {
    addToCart(ticket, 1);
    alert(`Đã thêm ${ticket.typeName} vào giỏ hàng!`);
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
              {ticketTypes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Chưa có loại vé nào cho sự kiện này</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {ticketTypes.map((ticket) => {
                    const isAvailable = ticket.availableQuantity > 0 && ticket.status === 'Active';
                    const isOnSale = new Date() >= new Date(ticket.saleStart) && new Date() <= new Date(ticket.saleEnd);
                    
                    return (
                      <div key={ticket.ticketTypeId} className={`ticket-card ${!isAvailable || !isOnSale ? 'ticket-unavailable' : ''}`}>
                        <div className="ticket-header">
                          <div className="ticket-info">
                            <h3 className="ticket-name">{ticket.typeName}</h3>
                            <p className="ticket-description">
                              {ticket.minOrder && `Tối thiểu: ${ticket.minOrder} vé`}
                              {ticket.maxOrder && ` | Tối đa: ${ticket.maxOrder} vé`}
                            </p>
                          </div>
                          <div className="ticket-price">
                            <span className="price-amount">{formatPrice(ticket.price)}</span>
                            {(!isAvailable || !isOnSale) && (
                              <span className="sold-out-badge">
                                {!isOnSale ? 'Chưa mở bán' : 'Hết vé'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ticket-footer">
                          <span className="ticket-quantity">
                            {isAvailable && isOnSale ? `Còn lại: ${ticket.availableQuantity} vé` : 'Không khả dụng'}
                          </span>
                          {isAvailable && isOnSale && (
                            <div className="ticket-actions">
                              <button 
                                className="btn btn-success"
                                onClick={() => handleAddToCart(ticket)}
                              >
                                Thêm vào giỏ
                              </button>
                              <Link 
                                to={`/event/${id}/order/create?ticketType=${ticket.ticketTypeId}`}
                                className="btn btn-primary"
                              >
                                Mua ngay
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
