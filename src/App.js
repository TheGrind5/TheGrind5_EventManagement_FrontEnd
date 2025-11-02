// React & Router
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Material-UI
import { CssBaseline, StyledEngineProvider, CircularProgress, Box } from '@mui/material';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { CustomThemeProvider } from './contexts/ThemeContext';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load pages để giảm bundle size ban đầu và cải thiện performance
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CreateOrderPage = lazy(() => import('./pages/CreateOrderPage'));
const TicketSelectionPage = lazy(() => import('./pages/TicketSelectionPage'));
const OrderInformationPage = lazy(() => import('./pages/OrderInformationPage'));
const RecipientInformationPage = lazy(() => import('./pages/RecipientInformationPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const VNPayPaymentPage = lazy(() => import('./pages/VNPayPaymentPage'));
const VNPayReturnPage = lazy(() => import('./pages/VNPayReturnPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const MyTicketsPage = lazy(() => import('./pages/MyTicketsPage'));
const MyEventsPage = lazy(() => import('./pages/MyEventsPage'));
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Loading component để hiển thị khi lazy load
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <CircularProgress />
  </Box>
);

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
    <Suspense fallback={<LoadingFallback />}>
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
          path="/notifications" 
          element={
            <ProtectedRoute>
              <NotificationsPage />
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
            <WishlistProvider>
              <Router>
                <div className="App" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
                  <AppRoutes />
                </div>
              </Router>
            </WishlistProvider>
          </AuthProvider>
        </ErrorBoundary>
      </CustomThemeProvider>
    </StyledEngineProvider>
  );
}