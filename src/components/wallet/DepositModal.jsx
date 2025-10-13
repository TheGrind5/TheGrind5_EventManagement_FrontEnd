import React, { useState } from 'react';
import { walletAPI } from '../../services/api';
import '../../styles/Modal.css';

const DepositModal = ({ onClose, onSuccess }) => {
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
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await walletAPI.deposit({
        amount: parseFloat(formData.amount),
        description: formData.description || 'Nạp tiền vào ví'
      });

      // Success
      onSuccess(response.newBalance);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💰 Nạp tiền vào ví</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="amount">Số tiền nạp (VND)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Nhập số tiền..."
              min="1000"
              step="1000"
              required
            />
            
            {/* Quick Amount Buttons */}
            <div className="quick-amounts">
              <span className="quick-label">Chọn nhanh:</span>
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  type="button"
                  className="quick-amount-btn"
                  onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                >
                  {amount.toLocaleString('vi-VN')}₫
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Ghi chú (tùy chọn)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Ví dụ: Nạp tiền từ thẻ ngân hàng..."
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
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Nạp tiền'}
            </button>
          </div>
        </form>

        {/* Payment Info */}
        <div className="payment-info">
          <h4>💡 Thông tin thanh toán</h4>
          <p>• Nạp tiền tức thì, không mất phí</p>
          <p>• Số dư sẽ được cập nhật ngay sau khi nạp</p>
          <p>• Tất cả giao dịch đều được ghi nhận</p>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
