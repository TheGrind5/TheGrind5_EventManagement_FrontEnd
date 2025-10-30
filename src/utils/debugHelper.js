/**
 * Debug Helper - Giúp kiểm tra connection và auth status
 */

export const checkBackendConnection = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('✅ Backend is running');
      return true;
    } else {
      console.error('❌ Backend responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot connect to Backend:', error.message);
    return false;
  }
};

export const checkAuthToken = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('🔐 Auth Status:');
  console.log('  - Token exists:', !!token);
  console.log('  - Token length:', token?.length || 0);
  console.log('  - Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
  console.log('  - User exists:', !!user);
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('  - User role:', userData.role);
      console.log('  - User email:', userData.email);
      console.log('  - User ID:', userData.userId);
    } catch (e) {
      console.error('  - Error parsing user data:', e);
    }
  }
  
  return { token: !!token, user: !!user };
};

export const testAdminAPI = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('❌ No token found. Please login first.');
    return;
  }
  
  console.log('🧪 Testing Admin API...');
  
  try {
    const response = await fetch('http://localhost:5000/api/admin/statistics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      return true;
    } else {
      const errorData = await response.text();
      console.error('❌ API Error:', errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ API Request failed:', error);
    return false;
  }
};

// Auto-run diagnostics when this module is imported
export const runDiagnostics = async () => {
  console.log('🔍 === ADMIN DEBUG DIAGNOSTICS ===');
  
  // 1. Check auth
  console.log('\n1️⃣ Checking Authentication...');
  const authStatus = checkAuthToken();
  
  // 2. Check backend
  console.log('\n2️⃣ Checking Backend Connection...');
  const backendStatus = await checkBackendConnection();
  
  // 3. Test admin API
  if (authStatus.token && backendStatus) {
    console.log('\n3️⃣ Testing Admin API...');
    await testAdminAPI();
  }
  
  console.log('\n🔍 === DIAGNOSTICS COMPLETE ===\n');
};

