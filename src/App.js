import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import GuestLandingPage from "./pages/guest/GuestLandingPage";
import EventDetailsPage from "./pages/guest/EventDetailsPage";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import "./index.css";

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
      <Route 
        path="/" 
        element={user ? <Navigate to="/customer" replace /> : <GuestLandingPage />} 
      />
      <Route 
        path="/event/:id" 
        element={<EventDetailsPage />} 
      />
      <Route 
        path="/customer" 
        element={
          <ProtectedRoute>
            <CustomerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
