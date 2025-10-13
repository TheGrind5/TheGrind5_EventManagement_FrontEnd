import React, { useState } from 'react';
import { walletAPI } from '../../services/api';
import '../../styles/Modal.css';

const WithdrawModal = ({ currentBalance, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    
    if (!formData.amount || amount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (amount > currentBalance) {
      setError(`Số tiền rút không được vượt quá số dư hiện tại (${currentBalance.toLocaleString('vi-VN')}₫)`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await walletAPI.withdraw({
        amount: amount,
        description: formData.description || 'Rút tiền từ ví'
      });

      // Success
      onSuccess(response.newBalance);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [
    Math.min(50000, currentBalance),
    Math.min(100000, currentBalance),
    Math.min(200000, currentBalance),
    Math.min(currentBalance * 0.5, currentBalance),
    currentBalance
  ].filter((amount, index, arr) => amount > 0 && arr.indexOf(amount) === index);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + '₫';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💸 Rút tiền từ ví</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="balance-info">
            <p>Số dư hiện tại: <strong>{formatCurrency(currentBalance)}</strong></p>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Số tiền rút (VND)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Nhập số tiền rút..."
              min="1000"
              max={currentBalance}
              step="1000"
              required
            />
            
            {/* Quick Amount Buttons */}
            {quickAmounts.length > 0 && (
              <div className="quick-amounts">
                <span className="quick-label">Chọn nhanh:</span>
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    className="quick-amount-btn"
                    onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Ghi chú (tùy chọn)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Ví dụ: Rút tiền về tài khoản ngân hàng..."
              rows="3"
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="submit-btn withdraw-submit"
              disabled={loading || currentBalance <= 0}
            >
              {loading ? 'Đang xử lý...' : 'Rút tiền'}
            </button>
          </div>
        </form>

        {/* Withdraw Info */}
        <div className="withdraw-info">
          <h4>⚠️ Lưu ý quan trọng</h4>
          <p>• Số tiền rút sẽ được trừ khỏi ví ngay lập tức</p>
          <p>• Không thể hoàn tác sau khi rút tiền</p>
          <p>• Vui lòng kiểm tra kỹ thông tin trước khi xác nhận</p>
          {currentBalance <= 0 && (
            <p className="warning">• Không thể rút tiền khi ví trống</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;
