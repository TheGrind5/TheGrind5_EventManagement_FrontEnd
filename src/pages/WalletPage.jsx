import React, { useState, useEffect } from 'react';
import { walletAPI } from '../services/api';
import WalletBalance from '../components/WalletBalance';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import TransactionHistory from '../components/TransactionHistory';
import './WalletPage.css';

const WalletPage = () => {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('VND');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      setLoading(true);
      const response = await walletAPI.getBalance();
      setBalance(response.balance);
      setCurrency(response.currency || 'VND');
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching wallet balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSuccess = (newBalance) => {
    setBalance(newBalance);
    setShowDepositModal(false);
    // Refresh transaction history
    window.dispatchEvent(new CustomEvent('refreshTransactions'));
  };

  const handleWithdrawSuccess = (newBalance) => {
    setBalance(newBalance);
    setShowWithdrawModal(false);
    // Refresh transaction history
    window.dispatchEvent(new CustomEvent('refreshTransactions'));
  };

  if (loading) {
    return (
      <div className="wallet-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải thông tin ví...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Lỗi tải thông tin ví</h3>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={fetchWalletBalance}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <h1>💳 Quản lý ví của tôi</h1>
        <p>Quản lý số dư và giao dịch ví điện tử</p>
      </div>

      <div className="wallet-content">
        {/* Wallet Balance Section */}
        <div className="balance-section">
          <WalletBalance 
            balance={balance}
            currency={currency}
            onRefresh={fetchWalletBalance}
          />
          
          <div className="action-buttons">
            <button 
              className="deposit-btn"
              onClick={() => setShowDepositModal(true)}
            >
              💰 Nạp tiền
            </button>
            <button 
              className="withdraw-btn"
              onClick={() => setShowWithdrawModal(true)}
              disabled={balance <= 0}
            >
              💸 Rút tiền
            </button>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="transaction-section">
          <TransactionHistory />
        </div>
      </div>

      {/* Modals */}
      {showDepositModal && (
        <DepositModal
          onClose={() => setShowDepositModal(false)}
          onSuccess={handleDepositSuccess}
        />
      )}

      {showWithdrawModal && (
        <WithdrawModal
          currentBalance={balance}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={handleWithdrawSuccess}
        />
      )}
    </div>
  );
};

export default WalletPage;
