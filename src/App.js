import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventDetailsPage from './pages/EventDetailsPage';
import DashboardPage from './pages/DashboardPage';

import ProfilePage from './pages/ProfilePage';

//Thêm trang create order
import CreateOrderPage from './pages/CreateOrderPage';
//Thêm trang wallet
import WalletPage from './pages/WalletPage';


import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
      />
      <Route path="/event/:id" element={<EventDetailsPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />


      {/* Thêm route tới trang create order */}
      <Route path="/event/:id/order/create" element={<CreateOrderPage />} />
      
      {/* Thêm route tới trang wallet */}
      <Route 
        path="/wallet" 
        element={
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        } 
      />

      //Route mặc định, nếu người dùng nhập sai link thì sẽ redirect về trang home

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}