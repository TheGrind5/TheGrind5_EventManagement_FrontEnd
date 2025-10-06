import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import { eventsAPI } from '../services/api';

const EventDetailsPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await eventsAPI.getById(id);
        setEvent(response);
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
            <h1 className="card-title">{event.Title}</h1>
            
            <div className="mb-4">
              <p><strong>Description:</strong></p>
              <p>{event.Description}</p>
            </div>

            <div className="grid grid-2">
              <div>
                <p><strong>Start Time:</strong> {formatDate(event.StartTime)}</p>
                <p><strong>End Time:</strong> {formatDate(event.EndTime)}</p>
              </div>
              <div>
                <p><strong>Location:</strong> {event.Location}</p>
                <p><strong>Category:</strong> {event.Category}</p>
                <p><strong>Status:</strong> {event.Status}</p>
              </div>
            </div>

            {event.HostName && (
              <div className="mt-4">
                <p><strong>Hosted by:</strong> {event.HostName}</p>
                <p><strong>Contact:</strong> {event.HostEmail}</p>
              </div>
            )}

            <div className="text-center mt-4">
              <Link to="/" className="btn btn-secondary">Back to Events</Link>
              <button className="btn btn-primary ml-2">
                Buy Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
