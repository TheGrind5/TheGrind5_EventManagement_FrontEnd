import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, register } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra user đã đăng nhập chưa
    const savedUser = localStorage.getItem('ems:user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const loginUser = async (email, password) => {
    const response = await login(email, password);
    // Backend trả về { success, message, data: { accessToken, expiresAt, user } }
    const { data } = response;
    const userData = data.user;
    setUser(userData);
    localStorage.setItem('ems:user', JSON.stringify(userData));
    localStorage.setItem('ems:token', data.accessToken);
    localStorage.setItem('ems:tokenExpiry', data.expiresAt);
    return userData;
  };

  const registerUser = async (userData) => {
    const newUser = await register(userData);
    setUser(newUser);
    localStorage.setItem('ems:user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = async () => {
    try {
      // Call logout API to clear server-side session
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage regardless of API call result
      setUser(null);
      localStorage.removeItem('ems:user');
      localStorage.removeItem('ems:token');
      localStorage.removeItem('ems:tokenExpiry');
      localStorage.removeItem('ems:last_id');
    }
  };

  // Alias for backward compatibility
  const login = loginUser;

  return (
    <AuthContext.Provider value={{ user, login, loginUser, registerUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
