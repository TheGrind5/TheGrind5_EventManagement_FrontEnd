import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { eventsAPI } from '../services/api';

const HomePage = () => {
  //State declaration để quản lý trạng thái của component
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Hàm constants để render individual event card
  const renderEventCard = (event) => (
    <div key={event.eventId} className="card">
      <div className="card-body">
        <h3 className="card-title">{event.title}</h3>
        <p className="card-text">{event.description}</p>
        <p><strong>Date:</strong> {formatDate(event.startTime)}</p>
        <p><strong>Location:</strong> {event.location}</p>
        <p><strong>Category:</strong> {event.category}</p>
        <Link 
          to={`/event/${event.eventId}`} 
          className="btn btn-primary"
          onClick={() => console.log('HomePage - Clicking event:', event.eventId, event.title)}
        >
          View Details
        </Link>
      </div>
    </div>
  );

  // Hàm constants để render events grid
  const renderEventsGrid = () => {
    if (validEvents.length === 0) {
      return (
        <div className="text-center">
          <p>No events available at the moment.</p>
          <p>Debug: Events array length = {events.length}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-3">
        {validEvents.map(renderEventCard)}
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
          <h1>Discover Amazing Events</h1>
          <p>Find and join the best events in your city</p>
          <Link to="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </section>

      {/* Events Section */}
      <section className="p-4">
        <div className="container">
          <h2 className="text-center mb-4">Upcoming Events</h2>
          
          {error && (
            <div className="alert alert-error text-center">
              {error}
            </div>
          )}

          {renderEventsGrid()}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
