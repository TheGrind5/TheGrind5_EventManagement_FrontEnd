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
      
      // Check if user is banned (status 403)
      if (error.response?.status === 403 && error.response?.data?.isBanned) {
        return { 
          success: false, 
          message: error.response.data.message || 'Tài khoản của bạn đã bị cấm',
          isBanned: true
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      // Backend trả về UserId, FullName, requiresVerification, otpSent, etc.
      if (response.data && response.data.userId) {
        const requiresVerification = response.data.requiresVerification || false;
        const otpSent = response.data.otpSent || false;
        
        // Chỉ coi là thành công nếu không cần verify hoặc đã verify rồi
        // Nếu cần verify thì chưa thành công (chưa verify OTP)
        const isSuccess = !requiresVerification;
        
        return { 
          success: isSuccess, // Chỉ true nếu không cần verify
          accountCreated: true, // Tài khoản đã được tạo (nhưng chưa verify)
          message: response.data.message || 'Đăng ký thành công',
          requiresVerification: requiresVerification,
          otpSent: otpSent,
          email: response.data.email || userData.email,
          data: response.data
        };
      }
      return { success: false, accountCreated: false, message: 'Đăng ký thất bại' };
    } catch (error) {
      console.error('Register error:', error);
      
      // Xác định xem có phải network error không
      const errorMessage = error.message || error.response?.data?.message || 'Đăng ký thất bại';
      const isNetworkError = errorMessage.includes('Không thể kết nối đến server') || 
                            errorMessage.includes('Network Error') ||
                            errorMessage.includes('timeout') ||
                            (error.code === 0) ||
                            (!error.response && error.request); // Có request nhưng không có response
      
      // Handle email already exists error
      if (error.response?.status === 400 && error.response?.data?.message) {
        return { 
          success: false,
          accountCreated: false,
          message: error.response.data.message 
        };
      }
      
      // Với network error, có thể backend đã tạo account và gửi OTP nhưng response không về được
      // Trả về một object cho phép frontend xử lý tiếp (cho user nhập OTP)
      if (isNetworkError) {
        return {
          success: false,
          accountCreated: false, // Không chắc chắn, nhưng có thể đã tạo
          message: errorMessage,
          isNetworkError: true,
          email: userData.email // Cung cấp email để có thể thử OTP
        };
      }
      
      return { 
        success: false,
        accountCreated: false,
        message: errorMessage,
        isNetworkError: false
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
