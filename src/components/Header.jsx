import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { walletAPI } from '../services/api';

const Header = () => {
  const { user, logout } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await walletAPI.getBalance();
      setWalletBalance(response.balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      // Don't show error to user in header, just log it
    } finally {
      setBalanceLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + '₫';
  };

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
                
                {/* Wallet Balance Display */}
                <Link to="/wallet" className="wallet-link">
                  <div className="wallet-balance-display">
                    <span className="wallet-icon">💰</span>
                    <span className="wallet-text">
                      {balanceLoading ? (
                        <span className="loading">...</span>
                      ) : (
                        formatCurrency(walletBalance)
                      )}
                    </span>
                  </div>
                </Link>
                
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
