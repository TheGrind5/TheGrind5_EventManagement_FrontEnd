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
import ForgotPasswordModal from './components/common/ForgotPasswordModal';

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
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'transparent' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ transformOrigin: 'center', animation: 'appSpinnerRotate 1s linear infinite' }}>
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="#FF7A00"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="7 10"
            />
          </svg>
          <style>{`
            @keyframes appSpinnerRotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ transformOrigin: 'center', animation: 'appSpinnerRotate 1s linear infinite' }}>
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="#FF7A00"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="7 10"
            />
          </svg>
          <style>{`
            @keyframes appSpinnerRotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </Box>
    }>
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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
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
      
      {/* VNPay routes removed */}
      
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
                    <ForgotPasswordModal />
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