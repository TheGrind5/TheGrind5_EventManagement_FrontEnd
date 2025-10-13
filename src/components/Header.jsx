import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            TheGrind5 Events
          </Link>
          
          <nav className="nav">
            <Link to="/" className="nav-link">Home</Link>
            
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/profile" className="nav-link">Profile</Link>
                <span className="nav-link">Welcome, {user.fullName}</span>
                <button onClick={logout} className="btn btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
