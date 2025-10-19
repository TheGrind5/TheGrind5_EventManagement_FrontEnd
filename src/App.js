// React & Router
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Material-UI
import { CssBaseline, StyledEngineProvider } from '@mui/material';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { CustomThemeProvider } from './contexts/ThemeContext';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import CartPage from './components/cart/CartPage';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventDetailsPage from './pages/EventDetailsPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CreateOrderPage from './pages/CreateOrderPage';
import WalletPage from './pages/WalletPage';
import MyTicketsPage from './pages/MyTicketsPage';
import CheckoutPage from './pages/CheckoutPage';
import CreateEventPage from './pages/CreateEventPage';

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
      {/* Public Routes */}
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
      <Route path="/cart" element={<CartPage />} />
      <Route path="/event/:id/order/create" element={<CreateOrderPage />} />
      
      {/* Protected Routes */}
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
      <Route 
        path="/wallet" 
        element={
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-tickets" 
        element={
          <ProtectedRoute>
            <MyTicketsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/checkout" 
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-event" 
        element={
          <ProtectedRoute>
            <CreateEventPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <StyledEngineProvider injectFirst>
      <CustomThemeProvider>
        <CssBaseline />
        <AuthProvider>
          <CartProvider>
            <Router>
              <div className="App">
                <AppRoutes />
              </div>
            </Router>
          </CartProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </StyledEngineProvider>
  );
}