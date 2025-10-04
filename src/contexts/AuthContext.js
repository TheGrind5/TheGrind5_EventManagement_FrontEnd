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

  const loginUser = async (identifier, password) => {
    const response = await login(identifier, password);
    // Backend trả về { accessToken, expiresAt, user }
    const userData = response.user;
    setUser(userData);
    localStorage.setItem('ems:user', JSON.stringify(userData));
    localStorage.setItem('ems:token', response.accessToken);
    return userData;
  };

  const registerUser = async (userData) => {
    const newUser = await register(userData);
    setUser(newUser);
    localStorage.setItem('ems:user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ems:user');
    localStorage.removeItem('ems:token');
    localStorage.removeItem('ems:last_id');
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, registerUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
