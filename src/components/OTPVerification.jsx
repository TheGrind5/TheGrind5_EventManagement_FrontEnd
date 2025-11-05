import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './OTPVerification.css';

const OTPVerification = ({ email, onVerified, onClose, apiUrl = 'http://localhost:5000/api' }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Start countdown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i + index < 6) {
            newOtp[i + index] = digit;
          }
        });
        setOtp(newOtp);
        const nextIndex = Math.min(index + digits.length, 5);
        inputRefs.current[nextIndex]?.focus();
      });
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 số OTP');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const response = await axios.post(`${apiUrl}/Auth/verify-otp`, {
        email: email,
        code: otpCode
      });

      if (response.data) {
        // OTP verified successfully
        onVerified && onVerified();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn');
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setCanResend(false);
    setTimeLeft(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();

    try {
      const response = await axios.post(`${apiUrl}/Auth/resend-otp`, {
        email: email
      });

      if (response.data) {
        // Success - timer will reset automatically
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi lại OTP. Vui lòng thử lại sau.');
      setCanResend(true);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="otp-verification-modal">
      <div className="otp-verification-overlay" onClick={onClose}></div>
      <div className="otp-verification-content">
        <div className="otp-verification-header">
          <h2>Xác minh Email</h2>
          <button className="otp-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="otp-verification-body">
          <p className="otp-info-text">
            Chúng tôi đã gửi mã OTP đến email <strong>{email}</strong>
          </p>
          <p className="otp-subtext">
            Vui lòng nhập mã OTP 6 số để xác minh tài khoản
          </p>

          {error && (
            <div className="otp-error-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="otp-input-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                disabled={verifying || loading}
              />
            ))}
          </div>

          <div className="otp-timer-container">
            {timeLeft > 0 ? (
              <p className="otp-timer">
                Mã OTP sẽ hết hạn sau: <span className="otp-timer-value">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="otp-timer-expired">Mã OTP đã hết hạn</p>
            )}
          </div>

          <div className="otp-actions">
            <button
              type="button"
              onClick={handleVerify}
              className="otp-verify-btn"
              disabled={otp.join('').length !== 6 || verifying || loading}
            >
              {verifying ? 'Đang xác minh...' : 'Xác minh'}
            </button>

            {canResend && (
              <button
                type="button"
                onClick={handleResendOTP}
                className="otp-resend-btn"
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
