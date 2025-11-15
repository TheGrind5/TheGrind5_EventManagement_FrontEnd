import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../config/environment';

const OTPVerification = ({ email, onVerified, onClose, apiUrl }) => {
  const apiBaseUrl = apiUrl || `${config.API_URL}`;
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
      const response = await axios.post(`${apiBaseUrl}/Auth/verify-otp`, {
        email: email,
        code: otpCode
      });

      if (response.data) {
        // OTP verified successfully
        onVerified && onVerified();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn';
      
      // Nếu OTP hết hạn, hiển thị message rõ ràng hơn
      if (errorMessage.includes('hết hạn') || errorMessage.includes('expired')) {
        setError('Mã OTP đã hết hạn. Vui lòng gửi lại mã OTP mới.');
      } else {
        setError(errorMessage);
      }
      
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
      const response = await axios.post(`${apiBaseUrl}/Auth/resend-otp`, {
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
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        className="modal-content animate-slide-up"
        style={{
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(18, 18, 18, 0.95) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          border: '1px solid rgba(255, 122, 0, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 122, 0, 0.2)',
          animation: 'slideUp 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header với gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #0A1128 0%, #001F3F 100%)',
          padding: '24px 32px',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 122, 0, 0.2)'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.5px'
          }}>
            Xác minh Email
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#FFFFFF'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'rotate(0deg)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '32px' }}>
          <p style={{
            margin: '0 0 8px 0',
            color: 'var(--color-text-primary, #FFFFFF)',
            fontSize: '15px',
            lineHeight: '1.5'
          }}>
            Chúng tôi đã gửi mã OTP đến email <strong style={{ color: 'var(--color-primary, #FF7A00)', fontWeight: 600 }}>{email}</strong>
          </p>
          <p style={{
            margin: '0 0 24px 0',
            color: 'var(--color-text-secondary, rgba(255, 255, 255, 0.7))',
            fontSize: '14px'
          }}>
            Vui lòng nhập mã OTP 6 số để xác minh tài khoản
          </p>

          {error && (
            <div className="alert alert-danger animate-fade-in" style={{ marginBottom: '24px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </span>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
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
                disabled={verifying || loading}
                readOnly={false}
                style={{
                  width: '50px',
                  height: '60px',
                  textAlign: 'center',
                  fontSize: '24px',
                  fontWeight: 600,
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#FFFFFF',
                  transition: 'all 0.2s',
                  outline: 'none',
                  cursor: (verifying || loading) ? 'not-allowed' : 'text'
                }}
                onFocus={(e) => {
                  if (!verifying && !loading) {
                    e.target.style.borderColor = 'var(--color-primary, #FF7A00)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 122, 0, 0.2)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              />
            ))}
          </div>

          <div style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            {timeLeft > 0 ? (
              <p style={{
                margin: 0,
                color: 'var(--color-text-secondary, rgba(255, 255, 255, 0.7))',
                fontSize: '14px'
              }}>
                Mã OTP sẽ hết hạn sau: <span style={{
                  fontWeight: 700,
                  color: 'var(--color-primary, #FF7A00)',
                  fontSize: '16px'
                }}>{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p style={{
                margin: 0,
                color: '#dc2626',
                fontWeight: 600,
                fontSize: '14px'
              }}>
                Mã OTP đã hết hạn
              </p>
            )}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={handleVerify}
              className="auth-button"
              disabled={otp.join('').length !== 6 || verifying || loading}
              style={{
                width: '100%',
                marginTop: '8px',
                cursor: (otp.join('').length !== 6 || verifying || loading) ? 'not-allowed' : 'pointer'
              }}
            >
              {verifying ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    style={{ transformOrigin: 'center', animation: 'spin 1s linear infinite' }}
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="6 10"
                    />
                  </svg>
                  Đang xác minh...
                </span>
              ) : (
                'Xác minh'
              )}
            </button>

            {canResend && (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: 'transparent',
                  color: 'var(--color-primary, #FF7A00)',
                  border: '2px solid var(--color-primary, #FF7A00)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background = 'rgba(255, 122, 0, 0.1)';
                    e.target.style.borderColor = '#FF9500';
                    e.target.style.color = '#FF9500';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background = 'transparent';
                    e.target.style.borderColor = 'var(--color-primary, #FF7A00)';
                    e.target.style.color = 'var(--color-primary, #FF7A00)';
                  }
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#ffffff' }}>
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      style={{ transformOrigin: 'center', animation: 'spin 1s linear infinite' }}
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="6 10"
                      />
                    </svg>
                    Đang gửi...
                  </span>
                ) : (
                  'Gửi lại mã OTP'
                )}
              </button>
            )}
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .modal-content::-webkit-scrollbar {
            width: 8px;
          }

          .modal-content::-webkit-scrollbar-track {
            background: transparent;
          }

          .modal-content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
          }

          .modal-content::-webkit-scrollbar-thumb:hover {
            background: var(--color-primary, #FF7A00);
          }
        `}</style>
      </div>
    </div>
  );
};

export default OTPVerification;
