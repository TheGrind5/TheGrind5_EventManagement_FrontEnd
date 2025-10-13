import React from 'react';
import '../../styles/WalletBalance.css';

const WalletBalance = ({ balance, currency, onRefresh }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getBalanceStatus = () => {
    if (balance === 0) return { status: 'empty', message: 'Ví trống' };
    if (balance < 100000) return { status: 'low', message: 'Số dư thấp' };
    return { status: 'good', message: 'Số dư khả dụng' };
  };

  const balanceInfo = getBalanceStatus();

  return (
    <div className="wallet-balance">
      <div className="balance-card">
        <div className="balance-header">
          <h2>💰 Số dư ví</h2>
          <button 
            className="refresh-btn"
            onClick={onRefresh}
            title="Làm mới"
          >
            🔄
          </button>
        </div>
        
        <div className="balance-amount">
          <span className="amount">{formatCurrency(balance)}</span>
          <span className="currency">{currency}</span>
        </div>

        <div className="balance-status">
          <span className={`status-indicator ${balanceInfo.status}`}>
            {balanceInfo.status === 'good' && '✅'}
            {balanceInfo.status === 'low' && '⚠️'}
            {balanceInfo.status === 'empty' && '❌'}
          </span>
          <span className="status-text">{balanceInfo.message}</span>
        </div>

        <div className="balance-details">
          <div className="detail-item">
            <span className="label">Trạng thái:</span>
            <span className="value">Hoạt động</span>
          </div>
          <div className="detail-item">
            <span className="label">Cập nhật:</span>
            <span className="value">Vừa xong</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <span className="stat-label">Tổng nạp</span>
            <span className="stat-value">-</span>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">📉</div>
          <div className="stat-content">
            <span className="stat-label">Tổng chi</span>
            <span className="stat-value">-</span>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <span className="stat-label">Giao dịch</span>
            <span className="stat-value">-</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletBalance;
