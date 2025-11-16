import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import auditLogService from '../../services/auditLogService';
import { formatVietnamDateTimeShort } from '../../utils/dateTimeUtils';
import '../../styles/AdminUsers.css';

const AdminAuditLogPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Selected log for detail modal
  const [selectedLog, setSelectedLog] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        pageNumber: currentPage,
        pageSize
      };

      if (action) params.action = action;
      if (entityType) params.entityType = entityType;
      if (fromDate) params.fromUtc = new Date(fromDate).toISOString();
      if (toDate) params.toUtc = new Date(toDate).toISOString();

      const response = await auditLogService.getAuditLogs(params);

      setAuditLogs(response.data.items || []);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      
      let errorMessage = 'Không thể tải audit logs. ';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.response.status === 403) {
          errorMessage += 'Bạn không có quyền truy cập.';
        } else {
          errorMessage += err.response.data?.message || 'Vui lòng thử lại.';
        }
      } else {
        errorMessage += 'Không thể kết nối đến server.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAuditLogs();
  };

  const handleClearFilter = () => {
    setAction('');
    setEntityType('');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  const formatDate = formatVietnamDateTimeShort;

  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'error':
        return 'badge-critical';
      case 'warning':
        return 'badge-warning';
      case 'info':
        return 'badge-info';
      default:
        return 'badge-default';
    }
  };

  const viewLogDetail = (log) => {
    setSelectedLog(log);
  };

  const closeModal = () => {
    setSelectedLog(null);
  };

  if (loading && auditLogs.length === 0) {
    return (
      <div className="admin-users-page">
        <div className="page-header">
          <h1>📋 Audit Logs</h1>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>📋 Audit Logs</h1>
          <p>Theo dõi các hoạt động quan trọng trong hệ thống</p>
        </div>
        <div className="header-actions">
          <Link to="/admin/users" className="btn-back">
            ← Về Dashboard
          </Link>
          <button onClick={handleLogout} className="btn-logout">
            🚪 Đăng xuất
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleFilter} style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Action</label>
            <input
              type="text"
              placeholder="Ví dụ: UserCreated, EventDeleted..."
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="search-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Entity Type</label>
            <input
              type="text"
              placeholder="Ví dụ: User, Event, Order..."
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="search-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Từ ngày</label>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="search-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Đến ngày</label>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="search-input"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <button type="submit" className="btn-search" style={{ flex: 1 }}>
              🔍 Lọc
            </button>
            <button 
              type="button" 
              onClick={handleClearFilter} 
              className="btn-retry"
              style={{ flex: 1 }}
            >
              ✖ Xóa bộ lọc
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="error-message">
          <h3>⚠️ Lỗi tải dữ liệu</h3>
          <p>{error}</p>
          <button onClick={fetchAuditLogs} className="btn-retry">
            🔄 Thử lại
          </button>
        </div>
      )}

      {/* Audit Logs Table */}
      {auditLogs.length === 0 && !loading ? (
        <div className="no-data">
          <p>📭 Không tìm thấy audit log nào</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>User ID</th>
                  <th>Role</th>
                  <th>Severity</th>
                  <th>Thời gian</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.auditLogId}>
                    <td>#{log.auditLogId}</td>
                    <td>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '13px',
                        color: '#6366f1'
                      }}>
                        {log.entityType}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {log.entityId || 'N/A'}
                      </span>
                    </td>
                    <td>{log.performedByUserId || 'System'}</td>
                    <td>
                      <span className={`role-badge ${log.performedByRole === 'Admin' ? 'badge-admin' : 'badge-default'}`}>
                        {log.performedByRole || 'System'}
                      </span>
                    </td>
                    <td>
                      <span className={`role-badge ${getSeverityBadgeClass(log.severity)}`}>
                        {log.severity || 'Info'}
                      </span>
                    </td>
                    <td>{formatDate(log.performedAt)}</td>
                    <td>
                      <button
                        onClick={() => viewLogDetail(log)}
                        className="btn-view"
                      >
                        👁️ Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Hiển thị {auditLogs.length} / {totalCount} logs
            </div>
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-page"
              >
                ← Trước
              </button>
              <span className="page-info">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-page"
              >
                Sau →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Audit Log Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Chi tiết Audit Log</h2>
              <button onClick={closeModal} className="btn-close">×</button>
            </div>
            <div className="modal-body">
              <div className="user-detail">
                <div className="detail-row">
                  <span className="detail-label">Log ID:</span>
                  <span className="detail-value">#{selectedLog.auditLogId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Action:</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                    {selectedLog.action}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Entity Type:</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                    {selectedLog.entityType}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Entity ID:</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                    {selectedLog.entityId || 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Performed By User ID:</span>
                  <span className="detail-value">{selectedLog.performedByUserId || 'System'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Role:</span>
                  <span className={`role-badge ${selectedLog.performedByRole === 'Admin' ? 'badge-admin' : 'badge-default'}`}>
                    {selectedLog.performedByRole || 'System'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Severity:</span>
                  <span className={`role-badge ${getSeverityBadgeClass(selectedLog.severity)}`}>
                    {selectedLog.severity || 'Info'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">IP Address:</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                    {selectedLog.ipAddress || 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Thời gian:</span>
                  <span className="detail-value">{formatDate(selectedLog.performedAt)}</span>
                </div>
                {selectedLog.metadataJson && (
                  <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="detail-label" style={{ marginBottom: '8px' }}>Metadata:</span>
                    <pre style={{ 
                      background: '#f1f5f9', 
                      padding: '12px', 
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      width: '100%',
                      overflow: 'auto',
                      maxHeight: '300px'
                    }}>
                      {JSON.stringify(JSON.parse(selectedLog.metadataJson), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogPage;
