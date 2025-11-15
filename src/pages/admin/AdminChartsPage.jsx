import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import adminService from '../../services/adminService';
import '../../styles/AdminUsers.css';

const AdminChartsPage = ({ type = 'bar' }) => {
  const [statistics, setStatistics] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    if (type === 'bar' || type === 'line') {
      fetchStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, type]);

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

  // Format dữ liệu cho biểu đồ
  const getChartData = () => {
    if (!statistics || !statistics.monthlyStats) return [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return statistics.monthlyStats.map(stat => ({
      month: monthNames[stat.month - 1],
      eventCount: stat.eventCount
    }));
  };

  // Custom Tooltip
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

  const getPageTitle = () => {
    switch(type) {
      case 'line': return '📈 Biểu Đồ Đường Thẳng';
      default: return '📊 Biểu Đồ Cột';
    }
  };

  if (loading && !statistics && (type === 'bar' || type === 'line')) {
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

      {/* Bar Chart Content */}
      {type === 'bar' && !error && statistics && (
        <div style={{ 
          background: isDark ? '#111827' : '#fff', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.12)',
          marginTop: '20px'
        }}>
          {/* Title and Year Selector */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: isDark ? '#fff' : '#333' }}>
              Thống Kê Số Sự Kiện Diễn Ra Trong Năm
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
        </div>
      )}

      {/* Line Chart Content */}
      {type === 'line' && !error && statistics && (
        <div style={{ 
          background: isDark ? '#111827' : '#fff', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.12)',
          marginTop: '20px'
        }}>
          {/* Title and Year Selector */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: isDark ? '#fff' : '#333' }}>
              Thống Kê Số Sự Kiện Diễn Ra Trong Năm
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
        </div>
      )}

    </div>
  );
};

export default AdminChartsPage;

