// React & Router
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Material-UI
import { CssBaseline, StyledEngineProvider, CircularProgress, Box } from '@mui/material';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { ModalProvider } from './contexts/ModalContext';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoginModal from './components/common/LoginModal';
import RegisterModal from './components/common/RegisterModal';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventDetailsPage from './pages/EventDetailsPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CreateOrderPage from './pages/CreateOrderPage';
import TicketSelectionPage from './pages/TicketSelectionPage';
import OrderInformationPage from './pages/OrderInformationPage';
import RecipientInformationPage from './pages/RecipientInformationPage';
import PaymentPage from './pages/PaymentPage';
import VNPayPaymentPage from './pages/VNPayPaymentPage';
import VNPayReturnPage from './pages/VNPayReturnPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import WalletPage from './pages/WalletPage';
import MyTicketsPage from './pages/MyTicketsPage';
import MyEventsPage from './pages/MyEventsPage';
import CreateEventPage from './pages/CreateEventPage';
import WishlistPage from './pages/WishlistPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/AdminDashboard';
import HostDashboard from './pages/HostDashboard';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage';

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
        element={
          user ? (
            user.role === 'Admin' ? <Navigate to="/admin/users" replace /> : <Navigate to="/dashboard" replace />
          ) : <LoginPage />
        } 
      />
      <Route 
        path="/register" 
        element={
          user ? (
            user.role === 'Admin' ? <Navigate to="/admin/users" replace /> : <Navigate to="/dashboard" replace />
          ) : <RegisterPage />
        } 
      />
      <Route path="/event/:id" element={<EventDetailsPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/event/:id/order/create" element={<CreateOrderPage />} />
      <Route path="/ticket-selection/:eventId" element={<TicketSelectionPage />} />
      
      {/* New Booking Flow Routes */}
      <Route
        path="/order-information/:orderId"
        element={
          <ProtectedRoute>
            <OrderInformationPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/recipient-info/:orderId"
        element={
          <ProtectedRoute>
            <RecipientInformationPage />
          </ProtectedRoute>
        }
      />
      
      {/* Payment Routes */}
      <Route
        path="/payment/:orderId"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/payment/vnpay/:orderId"
        element={
          <ProtectedRoute>
            <VNPayPaymentPage />
          </ProtectedRoute>
        }
      />
      
      {/* VNPay Return Page - Public route */}
      <Route path="/payment/vnpay/return" element={<VNPayReturnPage />} />
      
      <Route 
        path="/order-confirmation/:orderId" 
        element={
          <ProtectedRoute>
            <OrderConfirmationPage />
          </ProtectedRoute>
        } 
      />
      
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
        path="/my-events" 
        element={
          <ProtectedRoute>
            <MyEventsPage />
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
      <Route 
        path="/subscriptions/plans" 
        element={
          <ProtectedRoute>
            <SubscriptionPlansPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

        {/* Host Dashboard Route */}
        <Route 
          path="/host-dashboard" 
          element={
            <ProtectedRoute>
              <HostDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requiredRole="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <StyledEngineProvider injectFirst>
      <CustomThemeProvider>
        <CssBaseline />
        <ErrorBoundary>
          <AuthProvider>
            <ModalProvider>
              <WishlistProvider>
                <Router>
                  <div className="App">
                    <AppRoutes />
                    <LoginModal />
                    <RegisterModal />
                  </div>
                </Router>
              </WishlistProvider>
            </ModalProvider>
          </AuthProvider>
        </ErrorBoundary>
      </CustomThemeProvider>
    </StyledEngineProvider>
  );
}