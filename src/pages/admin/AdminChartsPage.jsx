import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import adminService from '../../services/adminService';
import '../../styles/AdminUsers.css';

const AdminChartsPage = ({ type = 'bar' }) => {
  const [statistics, setStatistics] = useState(null);
  const [revenueStatistics, setRevenueStatistics] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [error, setError] = useState(null);
  const [revenueError, setRevenueError] = useState(null);
  const [activeTab, setActiveTab] = useState(type === 'revenue' ? 'revenue' : 'events'); // 'events' hoặc 'revenue'
  const { logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Tạo danh sách các năm có thể chọn (từ 2020 đến năm hiện tại + 2)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2020 + 3 }, (_, i) => 2020 + i);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    // Nếu type='revenue', redirect đến bar chart với tab revenue
    if (type === 'revenue') {
      setActiveTab('revenue');
      navigate('/admin/charts/bar', { replace: true });
      // Load revenue statistics
      fetchRevenueStatistics();
      return;
    }
    
    if (type === 'bar') {
      // Kiểm tra nếu có query param để set tab
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab === 'revenue') {
        setActiveTab('revenue');
      }
      
      // Load cả 2 loại thống kê khi vào trang bar chart
      fetchStatistics();
      fetchRevenueStatistics();
    } else if (type === 'line') {
      // Kiểm tra nếu có query param để set tab
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab === 'revenue') {
        setActiveTab('revenue');
      }
      
      // Load cả 2 loại thống kê khi vào trang line chart
      fetchStatistics();
      fetchRevenueStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, type]);

  // Khi chuyển tab, load dữ liệu nếu chưa có và cập nhật URL
  useEffect(() => {
    if (type === 'bar' || type === 'line') {
      // Cập nhật URL khi chuyển tab
      const basePath = type === 'bar' ? '/admin/charts/bar' : '/admin/charts/line';
      const newUrl = activeTab === 'revenue' 
        ? `${basePath}?tab=revenue`
        : basePath;
      if (window.location.pathname + window.location.search !== newUrl) {
        navigate(newUrl, { replace: true });
      }
      
      // Load dữ liệu nếu chưa có
      if (activeTab === 'events' && !statistics) {
        fetchStatistics();
      } else if (activeTab === 'revenue' && !revenueStatistics) {
        fetchRevenueStatistics();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching event statistics for year:', selectedYear);
      
      const response = await adminService.getEventStatistics(selectedYear);
      console.log('✅ Statistics response:', response);

      const responseData = response.data;
      const statsData = responseData?.data || responseData;

      console.log('📊 Parsed stats data:', statsData);

      setStatistics(statsData);
    } catch (err) {
      console.error('❌ Error fetching statistics:', err);
      
      let errorMessage = 'Không thể tải thống kê sự kiện. ';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.response.status === 403) {
          errorMessage += 'Bạn không có quyền truy cập.';
        } else {
          errorMessage += err.response.data?.message || err.response.data?.error || `Status: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server.';
      } else {
        errorMessage += err.message || 'Unknown error';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueStatistics = async () => {
    try {
      setRevenueLoading(true);
      setRevenueError(null);

      console.log('🔍 Fetching platform revenue statistics for year:', selectedYear);
      console.log('🔍 API URL:', `/admin/platform-revenue-statistics?year=${selectedYear}`);
      
      const response = await adminService.getPlatformRevenueStatistics(selectedYear);
      console.log('✅ Revenue statistics response:', response);
      console.log('✅ Response data:', response.data);

      // Backend trả về: { success: true, message: "...", data: { Year, MonthlyStats, TotalRevenue } }
      const responseData = response.data;
      let statsData = null;
      
      if (responseData?.data) {
        // Format: { success: true, data: { Year, MonthlyStats, TotalRevenue } }
        statsData = responseData.data;
      } else if (responseData?.Year !== undefined) {
        // Format: { Year, MonthlyStats, TotalRevenue } (direct)
        statsData = responseData;
      } else {
        // Fallback: use responseData as is
        statsData = responseData;
      }

      console.log('📊 Parsed revenue stats data:', statsData);

      if (!statsData) {
        throw new Error('Dữ liệu thống kê không hợp lệ');
      }

      setRevenueStatistics(statsData);
    } catch (err) {
      console.error('❌ Error fetching revenue statistics:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error response data:', err.response?.data);
      
      let errorMessage = 'Không thể tải thống kê doanh thu sàn. ';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.response.status === 403) {
          errorMessage += 'Bạn không có quyền truy cập.';
        } else if (err.response.status === 404) {
          errorMessage += 'Endpoint không tìm thấy. Vui lòng kiểm tra backend đã được restart chưa.';
        } else {
          const backendMessage = err.response.data?.message || err.response.data?.error;
          errorMessage += backendMessage || `Lỗi server (Status: ${err.response.status})`;
        }
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa.';
      } else {
        errorMessage += err.message || 'Lỗi không xác định';
      }
      
      setRevenueError(errorMessage);
    } finally {
      setRevenueLoading(false);
    }
  };

  // Format dữ liệu cho biểu đồ sự kiện
  const getChartData = () => {
    if (!statistics || !statistics.monthlyStats) return [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return statistics.monthlyStats.map(stat => ({
      month: monthNames[stat.month - 1],
      eventCount: stat.eventCount
    }));
  };

  // Format dữ liệu cho biểu đồ doanh thu sàn
  const getRevenueChartData = () => {
    if (!revenueStatistics || !revenueStatistics.monthlyStats) return [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return revenueStatistics.monthlyStats.map(stat => ({
      month: monthNames[stat.month - 1],
      revenue: stat.revenue || 0
    }));
  };

  // Format số tiền VNĐ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Custom Tooltip cho biểu đồ sự kiện
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: isDark ? '#1f2937' : '#fff',
          border: `1px solid ${isDark ? '#374151' : '#ccc'}`,
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: isDark ? '#fff' : '#333' }}>
            {payload[0].payload.month}
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#f97316', fontWeight: 600 }}>
            {payload[0].value} sự kiện
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip cho biểu đồ doanh thu sàn
  const CustomRevenueTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: isDark ? '#1f2937' : '#fff',
          border: `1px solid ${isDark ? '#374151' : '#ccc'}`,
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: isDark ? '#fff' : '#333' }}>
            {payload[0].payload.month}
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#f97316', fontWeight: 600 }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const getPageTitle = () => {
    switch(type) {
      case 'line': return '📈 Biểu Đồ Đường Thẳng';
      case 'revenue': return '💰 Biểu Đồ Doanh Thu Sàn';
      default: return '📊 Biểu Đồ Cột';
    }
  };

  if (loading && !statistics && (type === 'bar' || type === 'line') && activeTab === 'events') {
    return (
      <div className="admin-users-page">
        <div className="page-header">
          <h1>{getPageTitle()}</h1>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (revenueLoading && !revenueStatistics && type === 'line' && activeTab === 'revenue') {
    return (
      <div className="admin-users-page">
        <div className="page-header">
          <h1>{getPageTitle()}</h1>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải thống kê doanh thu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <h1>{getPageTitle()}</h1>
        <div className="header-actions">
          <button onClick={handleLogout} className="btn-secondary">
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (type === 'bar' || type === 'line') && (
        <div className="error-container">
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={fetchStatistics} className="btn-retry">
              🔄 Thử lại
            </button>
          </div>
        </div>
      )}

      {revenueError && (type === 'bar' || type === 'line') && (
        <div className="error-container">
          <div className="error-message">
            <p>❌ {revenueError}</p>
            <button onClick={fetchRevenueStatistics} className="btn-retry">
              🔄 Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Bar Chart Content with Tabs */}
      {type === 'bar' && (
        <div style={{ 
          background: isDark ? '#111827' : '#fff', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.12)',
          marginTop: '20px'
        }}>
          {/* Tabs để chuyển đổi giữa Số sự kiện và Doanh thu sàn */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            borderBottom: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            paddingBottom: '12px'
          }}>
            <button
              onClick={() => setActiveTab('events')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                backgroundColor: activeTab === 'events' 
                  ? '#f97316' 
                  : 'transparent',
                color: activeTab === 'events' 
                  ? '#fff' 
                  : (isDark ? '#9ca3af' : '#666'),
                transition: 'all 0.2s',
                borderBottom: activeTab === 'events' 
                  ? '3px solid #f97316' 
                  : '3px solid transparent',
                marginBottom: activeTab === 'events' ? '-15px' : '0'
              }}
            >
              📊 Biểu Đồ Số Sự Kiện
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                backgroundColor: activeTab === 'revenue' 
                  ? '#f97316' 
                  : 'transparent',
                color: activeTab === 'revenue' 
                  ? '#fff' 
                  : (isDark ? '#9ca3af' : '#666'),
                transition: 'all 0.2s',
                borderBottom: activeTab === 'revenue' 
                  ? '3px solid #f97316' 
                  : '3px solid transparent',
                marginBottom: activeTab === 'revenue' ? '-15px' : '0'
              }}
            >
              💰 Biểu Đồ Doanh Thu Sàn
            </button>
          </div>

          {/* Title and Year Selector */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: isDark ? '#fff' : '#333' }}>
              {activeTab === 'events' 
                ? 'Thống Kê Số Sự Kiện Diễn Ra Trong Năm'
                : 'Thống Kê Doanh Thu Sàn Trong Năm'}
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: isDark ? '#9ca3af' : '#666' }}>
                Chọn năm:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#374151' : '#ddd'}`,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isDark ? '#fff' : '#333',
                  backgroundColor: isDark ? '#1f2937' : '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s',
                  minWidth: '100px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#f97316'}
                onBlur={(e) => e.target.style.borderColor = isDark ? '#374151' : '#ddd'}
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'events' && (
            <>
              {/* Loading state */}
              {loading && !statistics && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner"></div>
                  <p style={{ marginTop: '16px', color: isDark ? '#9ca3af' : '#666' }}>
                    Đang tải thống kê sự kiện...
                  </p>
                </div>
              )}

              {/* Events Chart Content */}
              {!loading && statistics && (
                <>
                  {/* Total Events Info */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    marginBottom: '24px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '32px' }}>📅</div>
                    <div>
                      <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
                        Tổng số sự kiện trong năm {selectedYear}
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 700 }}>
                        {statistics.totalEvents || 0}
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={getChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: isDark ? '#9ca3af' : '#666', fontSize: 13, fontWeight: 500 }}
                        axisLine={{ stroke: isDark ? '#374151' : '#ddd' }}
                      />
                      <YAxis 
                        tick={{ fill: isDark ? '#9ca3af' : '#666', fontSize: 13, fontWeight: 500 }}
                        axisLine={{ stroke: isDark ? '#374151' : '#ddd' }}
                        label={{ 
                          value: 'Số sự kiện', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fill: isDark ? '#9ca3af' : '#666', fontSize: 13, fontWeight: 600 }
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(249, 115, 22, 0.1)' }} />
                      <Bar 
                        dataKey="eventCount" 
                        fill="#f97316"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      >
                        {getChartData().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill="#f97316"
                            style={{ 
                              filter: 'drop-shadow(0 4px 6px rgba(249, 115, 22, 0.3))'
                            }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Stats Summary */}
                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: isDark ? '#1f2937' : '#fef3e7',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#374151' : '#fde4c9'}`
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '14px', 
                      color: isDark ? '#9ca3af' : '#666',
                      textAlign: 'center'
                    }}>
                      💡 <strong style={{ color: isDark ? '#fff' : '#333' }}>Gợi ý:</strong> Biểu đồ thống kê dựa trên thời gian bắt đầu của sự kiện (StartTime).
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'revenue' && (
            <>
              {/* Loading state */}
              {revenueLoading && !revenueStatistics && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner"></div>
                  <p style={{ marginTop: '16px', color: isDark ? '#9ca3af' : '#666' }}>
                    Đang tải thống kê doanh thu sàn...
                  </p>
                </div>
              )}

              {/* Revenue Chart Content */}
              {!revenueLoading && revenueStatistics && (
                <>
                  {/* Total Revenue Info */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    marginBottom: '24px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '32px' }}>💰</div>
                    <div>
                      <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
                        Tổng doanh thu sàn trong năm {selectedYear}
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 700 }}>
                        {formatCurrency(revenueStatistics.totalRevenue || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={getRevenueChartData()}
                      margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: isDark ? '#9ca3af' : '#666', fontSize: 13, fontWeight: 500 }}
                        axisLine={{ stroke: isDark ? '#374151' : '#ddd' }}
                      />
                      <YAxis 
                        tick={{ fill: isDark ? '#9ca3af' : '#666', fontSize: 13, fontWeight: 500 }}
                        axisLine={{ stroke: isDark ? '#374151' : '#ddd' }}
                        tickFormatter={(value) => {
                          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                          return value.toString();
                        }}
                        label={{ 
                          value: 'Doanh thu (VNĐ)', 
                          angle: -90, 
                          position: 'right',
                          offset: -40,
                          style: { fill: isDark ? '#9ca3af' : '#666', fontSize: 13, fontWeight: 600, textAnchor: 'middle' }
                        }}
                      />
                      <Tooltip content={<CustomRevenueTooltip />} cursor={{ fill: 'rgba(249, 115, 22, 0.1)' }} />
                      <Bar 
                        dataKey="revenue" 
                        fill="#f97316"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                      >
                        {getRevenueChartData().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill="#f97316"
                            style={{ 
                              filter: 'drop-shadow(0 4px 6px rgba(249, 115, 22, 0.3))'
                            }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Stats Summary */}
                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: isDark ? '#1f2937' : '#fef3e7',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#374151' : '#fde4c9'}`
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '14px', 
                      color: isDark ? '#9ca3af' : '#666',
                      textAlign: 'center'
                    }}>
                      💡 <strong style={{ color: isDark ? '#fff' : '#333' }}>Gợi ý:</strong> Doanh thu sàn bao gồm tiền mua gói subscription, 10% hoa hồng từ orders đã thanh toán, và trừ 10% từ orders đã hoàn tiền.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Line Chart Content with Tabs */}
      {type === 'line' && (
        <div style={{ 
          background: isDark ? '#111827' : '#fff', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.12)',
          marginTop: '20px'
        }}>
          {/* Tabs để chuyển đổi giữa Số sự kiện và Doanh thu sàn */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            borderBottom: `2px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            paddingBottom: '12px'
          }}>
            <button
              onClick={() => setActiveTab('events')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                backgroundColor: activeTab === 'events' 
                  ? '#f97316' 
                  : 'transparent',
                color: activeTab === 'events' 
                  ? '#fff' 
                  : (isDark ? '#9ca3af' : '#666'),
                transition: 'all 0.2s',
                borderBottom: activeTab === 'events' 
                  ? '3px solid #f97316' 
                  : '3px solid transparent',
                marginBottom: activeTab === 'events' ? '-15px' : '0'
              }}
            >
              📊 Biểu Đồ Số Sự Kiện
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                backgroundColor: activeTab === 'revenue' 
                  ? '#f97316' 
                  : 'transparent',
                color: activeTab === 'revenue' 
                  ? '#fff' 
                  : (isDark ? '#9ca3af' : '#666'),
                transition: 'all 0.2s',
                borderBottom: activeTab === 'revenue' 
                  ? '3px solid #f97316' 
                  : '3px solid transparent',
                marginBottom: activeTab === 'revenue' ? '-15px' : '0'
              }}
            >
              💰 Biểu Đồ Doanh Thu Sàn
            </button>
          </div>

          {/* Title and Year Selector */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: isDark ? '#fff' : '#333' }}>
              {activeTab === 'events' 
                ? 'Thống Kê Số Sự Kiện Diễn Ra Trong Năm'
                : 'Thống Kê Doanh Thu Sàn Trong Năm'}
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: isDark ? '#9ca3af' : '#666' }}>
                Chọn năm:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#374151' : '#ddd'}`,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isDark ? '#fff' : '#333',
                  backgroundColor: isDark ? '#1f2937' : '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s',
                  minWidth: '100px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#f97316'}
                onBlur={(e) => e.target.style.borderColor = isDark ? '#374151' : '#ddd'}
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'events' && (
            <>
              {/* Loading state */}
              {loading && !statistics && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner"></div>
                  <p style={{ marginTop: '16px', color: isDark ? '#9ca3af' : '#666' }}>
                    Đang tải thống kê sự kiện...
                  </p>
                </div>
              )}

              {/* Events Chart Content */}
              {!loading && statistics && (
                <>
                  {/* Total Events Info */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    marginBottom: '24px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '32px' }}>📅</div>
                    <div>
                      <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
                        Tổng số sự kiện trong năm {selectedYear}
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 700 }}>
                        {statistics.totalEvents || 0}
                      </div>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={getChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: isDark ? '#9ca3af' : '#666', fontSize: 13, fontWeight: 500 }}
                        axisLine={{ stroke: isDark ? '#374151' : '#ddd' }}
                      />
                      <YAxis 
                        tick={{ fill: isDark ? '#9ca3af' : '#666', fontSize: 13, fontWeight: 500 }}
                        axisLine={{ stroke: isDark ? '#374151' : '#ddd' }}
                        label={{ 
                          value: 'Số sự kiện', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fill: isDark ? '#9ca3af' : '#666', fontSize: 13, fontWeight: 600 }
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 2 }} />
                      <Line 
                        type="monotone"
                        dataKey="eventCount" 
                        stroke="#f97316"
                        strokeWidth={3}
                        dot={{ fill: '#f97316', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 8, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                        style={{ 
                          filter: 'drop-shadow(0 4px 6px rgba(249, 115, 22, 0.3))'
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Stats Summary */}
                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: isDark ? '#1f2937' : '#fef3e7',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#374151' : '#fde4c9'}`
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '14px', 
                      color: isDark ? '#9ca3af' : '#666',
                      textAlign: 'center'
                    }}>
                      💡 <strong style={{ color: isDark ? '#fff' : '#333' }}>Gợi ý:</strong> Biểu đồ đường giúp theo dõi xu hướng sự kiện theo thời gian.
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'revenue' && (
            <>
              {/* Loading state */}
              {revenueLoading && !revenueStatistics && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner"></div>
                  <p style={{ marginTop: '16px', color: isDark ? '#9ca3af' : '#666' }}>
                    Đang tải thống kê doanh thu sàn...
                  </p>
                </div>
              )}

              {/* Revenue Chart Content */}
              {!revenueLoading && revenueStatistics && (
                <>
                  {/* Total Revenue Info */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    marginBottom: '24px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '32px' }}>💰</div>
                    <div>
                      <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
                        Tổng doanh thu sàn trong năm {selectedYear}
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 700 }}>
                        {formatCurrency(revenueStatistics.totalRevenue || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={getRevenueChartData()}
                      margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: isDark ? '#9ca3af' : '#666', fontSize: 13, fontWeight: 500 }}
                        axisLine={{ stroke: isDark ? '#374151' : '#ddd' }}
                      />
                      <YAxis 
                        tick={{ fill: isDark ? '#9ca3af' : '#666', fontSize: 13, fontWeight: 500 }}
                        axisLine={{ stroke: isDark ? '#374151' : '#ddd' }}
                        tickFormatter={(value) => {
                          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                          return value.toString();
                        }}
                        label={{ 
                          value: 'Doanh thu (VNĐ)', 
                          angle: -90, 
                          position: 'left',
                          offset: -35,
                          style: { fill: isDark ? '#9ca3af' : '#666', fontSize: 13, fontWeight: 600, textAnchor: 'middle' }
                        }}
                      />
                      <Tooltip content={<CustomRevenueTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 2 }} />
                      <Line 
                        type="monotone"
                        dataKey="revenue" 
                        stroke="#f97316"
                        strokeWidth={3}
                        dot={{ fill: '#f97316', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 8, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                        style={{ 
                          filter: 'drop-shadow(0 4px 6px rgba(249, 115, 22, 0.3))'
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Stats Summary */}
                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: isDark ? '#1f2937' : '#fef3e7',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#374151' : '#fde4c9'}`
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '14px', 
                      color: isDark ? '#9ca3af' : '#666',
                      textAlign: 'center'
                    }}>
                      💡 <strong style={{ color: isDark ? '#fff' : '#333' }}>Gợi ý:</strong> Doanh thu sàn bao gồm tiền mua gói subscription, 10% hoa hồng từ orders đã thanh toán, và trừ 10% từ orders đã hoàn tiền.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}


    </div>
  );
};

export default AdminChartsPage;

