import React, { useState, useEffect } from 'react';
import { walletAPI } from '../services/api';
import './TransactionHistory.css';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchTransactions();
    
    // Listen for refresh events
    const handleRefresh = () => {
      setPage(1);
      fetchTransactions(true);
    };
    
    window.addEventListener('refreshTransactions', handleRefresh);
    return () => window.removeEventListener('refreshTransactions', handleRefresh);
  }, []);

  const fetchTransactions = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const response = await walletAPI.getTransactions(currentPage, 10);
      
      if (reset) {
        setTransactions(response.transactions);
      } else {
        setTransactions(prev => [...prev, ...response.transactions]);
      }
      
      setHasMore(response.transactions.length === 10);
      setPage(currentPage + 1);
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + '₫';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'Deposit': return '💰';
      case 'Withdraw': return '💸';
      case 'Payment': return '💳';
      case 'Refund': return '🔄';
      default: return '📄';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'Deposit': return 'success';
      case 'Refund': return 'success';
      case 'Withdraw': return 'warning';
      case 'Payment': return 'info';
      default: return 'neutral';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'Failed': return 'error';
      case 'Cancelled': return 'neutral';
      default: return 'neutral';
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="transaction-history">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải lịch sử giao dịch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <div className="history-header">
        <h2>📋 Lịch sử giao dịch</h2>
        <button 
          className="refresh-btn"
          onClick={() => fetchTransactions(true)}
          disabled={loading}
        >
          🔄 Làm mới
        </button>
      </div>

      {error && (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={() => fetchTransactions(true)}
          >
            Thử lại
          </button>
        </div>
      )}

      {transactions.length === 0 && !loading && !error ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có giao dịch nào</h3>
          <p>Lịch sử giao dịch sẽ hiển thị ở đây khi bạn thực hiện nạp tiền, rút tiền hoặc thanh toán.</p>
        </div>
      ) : (
        <>
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div 
                key={transaction.transactionId} 
                className={`transaction-item ${getTransactionColor(transaction.transactionType)}`}
              >
                <div className="transaction-icon">
                  {getTransactionIcon(transaction.transactionType)}
                </div>
                
                <div className="transaction-details">
                  <div className="transaction-main">
                    <h4>{transaction.description || transaction.transactionType}</h4>
                    <span className={`status-badge ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                  
                  <div className="transaction-meta">
                    <span className="date">{formatDate(transaction.createdAt)}</span>
                    {transaction.referenceId && (
                      <span className="reference">#{transaction.referenceId}</span>
                    )}
                  </div>
                </div>

                <div className="transaction-amount">
                  <span className={`amount ${transaction.transactionType === 'Deposit' || transaction.transactionType === 'Refund' ? 'positive' : 'negative'}`}>
                    {transaction.transactionType === 'Deposit' || transaction.transactionType === 'Refund' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                  <span className="balance-after">
                    Số dư: {formatCurrency(transaction.balanceAfter)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button 
                className="load-more-btn"
                onClick={() => fetchTransactions()}
                disabled={loading}
              >
                {loading ? 'Đang tải...' : 'Tải thêm'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionHistory;
