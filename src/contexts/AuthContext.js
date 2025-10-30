import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/apiClient';
import config from '../config/environment';

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
              userData.avatar = `${config.BASE_URL}${userData.avatar}`;
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

      // Fix: Check response.data instead of response directly
      if (response.data && response.data.user && response.data.accessToken) {
        // Lưu token trước
        localStorage.setItem('token', response.data.accessToken);
        
        // Fetch profile đầy đủ với avatar
        const profileData = await fetchUserProfile(response.data.accessToken);
        if (profileData) {
          setUser(profileData);
          localStorage.setItem('user', JSON.stringify(profileData));
        } else {
          // Fallback nếu không fetch được profile
          const userData = { ...response.data.user };
          if (userData.avatar && userData.avatar.startsWith("/")) {
            userData.avatar = `${config.BASE_URL}${userData.avatar}`;
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
      // Backend trả về UserId, FullName, etc. (PascalCase)
      if (response.data && response.data.userId) {
        // Không tự động login sau khi register
        // Chỉ trả về thông báo thành công
        return { success: true, message: 'Đăng ký thành công. Vui lòng đăng nhập.' };
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
      const response = await authAPI.getCurrentUserProfile();
      const profile = response.data;
      
      // ✅ Fix đường dẫn avatar tuyệt đối
      if (profile.avatar && profile.avatar.startsWith("/")) {
        profile.avatar = `${config.BASE_URL}${profile.avatar}`;
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
