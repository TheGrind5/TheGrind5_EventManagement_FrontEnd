// Payment Integration Service
// Tích hợp thanh toán với ví điện tử và các phương thức khác

export class PaymentService {
  // Process payment using wallet
  static async processWalletPayment(orderId, amount) {
    try {
      const response = await fetch(`/api/Payment/wallet-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId,
          amount,
          paymentMethod: 'wallet'
        })
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing wallet payment:', error);
      throw error;
    }
  }

  // Process payment using external gateway (mock)
  static async processExternalPayment(orderId, amount, paymentMethod = 'card') {
    try {
      // Mock external payment processing
      const mockResponse = {
        success: Math.random() > 0.1, // 90% success rate
        transactionId: `txn_${Date.now()}`,
        paymentMethod,
        amount,
        timestamp: new Date().toISOString()
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!mockResponse.success) {
        throw new Error('Payment gateway declined the transaction');
      }

      return mockResponse;
    } catch (error) {
      console.error('Error processing external payment:', error);
      throw error;
    }
  }

  // Refund payment
  static async refundPayment(transactionId, amount) {
    try {
      const response = await fetch(`/api/Payment/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          transactionId,
          amount,
          reason: 'Customer request'
        })
      });

      if (!response.ok) {
        throw new Error('Refund failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  // Get payment methods
  static getAvailablePaymentMethods() {
    return [
      {
        id: 'wallet',
        name: 'Ví điện tử',
        description: 'Thanh toán bằng số dư trong ví',
        icon: '💰',
        enabled: true
      },
      {
        id: 'card',
        name: 'Thẻ tín dụng/ghi nợ',
        description: 'Visa, Mastercard, JCB',
        icon: '💳',
        enabled: true
      },
      {
        id: 'bank_transfer',
        name: 'Chuyển khoản ngân hàng',
        description: 'Chuyển khoản qua ngân hàng',
        icon: '🏦',
        enabled: false // Not implemented yet
      },
      {
        id: 'momo',
        name: 'Ví MoMo',
        description: 'Thanh toán qua MoMo',
        icon: '📱',
        enabled: false // Not implemented yet
      }
    ];
  }

  // Validate payment amount
  static validatePaymentAmount(amount, walletBalance, paymentMethod) {
    const errors = [];

    if (amount <= 0) {
      errors.push('Số tiền phải lớn hơn 0');
    }

    if (paymentMethod === 'wallet' && amount > walletBalance) {
      errors.push('Số dư ví không đủ');
    }

    if (amount > 10000000) { // 10M VND limit
      errors.push('Số tiền vượt quá giới hạn cho phép');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Calculate payment fees
  static calculateFees(amount, paymentMethod) {
    const fees = {
      wallet: 0, // No fee for wallet
      card: Math.round(amount * 0.03), // 3% fee for card
      bank_transfer: Math.round(amount * 0.01), // 1% fee for bank transfer
      momo: Math.round(amount * 0.02) // 2% fee for MoMo
    };

    return {
      amount,
      fee: fees[paymentMethod] || 0,
      total: amount + (fees[paymentMethod] || 0)
    };
  }
}

export default PaymentService;
