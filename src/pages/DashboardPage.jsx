import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuth } from '../contexts/AuthContext';
import { eventsAPI } from '../services/apiClient';

const DashboardPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventsAPI.getAll();
        setEvents(response.data || []);
      } catch (err) {
        setError('Failed to load events');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
        <div className="loading-container">
          <div className="loading-spinner">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      
      <div className="container p-4">
        <h1>Welcome, {user?.fullName}!</h1>
        <p>Here's your dashboard with all available events.</p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="mt-4">
          <h2>Available Events</h2>
          
          {events.length === 0 ? (
            <div className="text-center">
              <p>No events available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-2">
              {events.map((event) => (
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
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
