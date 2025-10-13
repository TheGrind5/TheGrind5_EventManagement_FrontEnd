// Auto-login script for testing
export const autoLogin = async () => {
  const API_BASE_URL = 'http://localhost:5000/api';
  
  try {
    console.log('Auto-login starting...');
    
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'customer1@example.com',
        password: '123456'
      })
    });
    
    if (!response.ok) {
      console.error('Auto-login failed:', response.status);
      return false;
    }
    
    const data = await response.json();
    
    // Store in localStorage
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    console.log('Auto-login successful!');
    console.log('User:', data.user.fullName);
    
    // Trigger a custom event to notify the app
    window.dispatchEvent(new CustomEvent('autoLoginSuccess', { 
      detail: { user: data.user } 
    }));
    
    return true;
  } catch (error) {
    console.error('Auto-login error:', error);
    return false;
  }
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.autoLogin = autoLogin;
}
