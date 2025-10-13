// Toast notification utility
export const showToast = (message, type = 'success') => {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.toast-notification');
  existingToasts.forEach(toast => toast.remove());

  // Create new toast
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  
  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.success};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    animation: slideInRight 0.3s ease;
    max-width: 400px;
    word-wrap: break-word;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  `;
  
  toast.textContent = message;
  document.body.appendChild(toast);

  // Add animation styles if not already present
  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideInRight {
        from { 
          transform: translateX(100%); 
          opacity: 0; 
        }
        to { 
          transform: translateX(0); 
          opacity: 1; 
        }
      }
      @keyframes slideOutRight {
        from { 
          transform: translateX(0); 
          opacity: 1; 
        }
        to { 
          transform: translateX(100%); 
          opacity: 0; 
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 3000);

  return toast;
};

// Listen for custom toast events
window.addEventListener('toast', (event) => {
  const { type, message } = event.detail;
  showToast(message, type);
});
