import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const API_BASE_URL = 'http://localhost:5000/api';

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
    // Check if user is logged in on app start
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
          // Refresh profile để lấy avatar mới nhất
          const profileData = await fetchUserProfile(token);
          if (profileData) {
            setUser(profileData);
            localStorage.setItem('user', JSON.stringify(profileData));
          } else {
            // Fallback nếu không fetch được profile
            const userData = JSON.parse(savedUser);
            if (userData.avatar && userData.avatar.startsWith("/")) {
              userData.avatar = `${API_BASE_URL.replace('/api', '')}${userData.avatar}`;
            }
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.user && response.accessToken) {
        // Lưu token trước
        localStorage.setItem('token', response.accessToken);
        
        // Fetch profile đầy đủ với avatar
        const profileData = await fetchUserProfile(response.accessToken);
        if (profileData) {
          setUser(profileData);
          localStorage.setItem('user', JSON.stringify(profileData));
        } else {
          // Fallback nếu không fetch được profile
          const userData = { ...response.user };
          if (userData.avatar && userData.avatar.startsWith("/")) {
            userData.avatar = `${API_BASE_URL.replace('/api', '')}${userData.avatar}`;
          }
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        return { success: true };
      }
      return { success: false, message: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.userId) {
        // Tạo user object từ response
        const user = {
          userId: response.userId,
          fullName: response.fullName,
          email: response.email,
          phone: response.phone,
          role: response.role
        };
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true };
      }
      return { success: false, message: 'Registration failed' };
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        message: error.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const fetchUserProfile = async (token) => {
    try {
      const profile = await authAPI.getCurrentUserProfile(token);
      
      // ✅ Fix đường dẫn avatar tuyệt đối
      if (profile.avatar && profile.avatar.startsWith("/")) {
        profile.avatar = `${API_BASE_URL.replace('/api', '')}${profile.avatar}`;
      }
      
      return profile;
    } catch (error) {
      console.error("Lỗi lấy thông tin user:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const profileData = await fetchUserProfile(token);
      if (profileData) {
        setUser(profileData);
        localStorage.setItem('user', JSON.stringify(profileData));
      }
      return profileData;
    } catch (error) {
      console.error('Refresh profile error:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
