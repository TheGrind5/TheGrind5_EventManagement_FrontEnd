// Debug script cho Add to Wishlist
console.log('=== ADD TO WISHLIST DEBUG ===');

// Function để kiểm tra authentication
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('🔐 Authentication Check:');
  console.log('- Token exists:', !!token);
  console.log('- User exists:', !!user);
  
  if (token) {
    console.log('- Token preview:', token.substring(0, 50) + '...');
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('- User data:', userData);
    } catch (e) {
      console.log('- User data invalid JSON');
    }
  }
  
  return { hasToken: !!token, hasUser: !!user };
}

// Function để test API connection
async function testAPIConnection() {
  console.log('🌐 Testing API Connection...');
  
  try {
    const response = await fetch('http://localhost:5000/api/Event', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('- API Status:', response.status);
    console.log('- API OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('- Events count:', data.length);
      return { success: true, events: data };
    } else {
      console.log('- API Error:', response.status);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log('- Network Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Function để test add to wishlist với authentication
async function testAddToWishlistWithAuth() {
  console.log('💝 Testing Add to Wishlist with Auth...');
  
  const auth = checkAuth();
  if (!auth.hasToken) {
    console.log('❌ No authentication token found!');
    return false;
  }
  
  const apiTest = await testAPIConnection();
  if (!apiTest.success) {
    console.log('❌ API connection failed!');
    return false;
  }
  
  // Get first event with ticket types
  const eventWithTickets = apiTest.events.find(e => e.ticketTypes && e.ticketTypes.length > 0);
  if (!eventWithTickets) {
    console.log('❌ No events with ticket types found!');
    return false;
  }
  
  console.log('✅ Found event with tickets:', eventWithTickets.title);
  console.log('✅ Ticket types:', eventWithTickets.ticketTypes.length);
  
  const ticketTypeId = eventWithTickets.ticketTypes[0].ticketTypeId;
  console.log('✅ Using ticket type ID:', ticketTypeId);
  
  // Test add to wishlist
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/Wishlist/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ticketTypeId: ticketTypeId,
        quantity: 1
      })
    });
    
    console.log('✅ Add to wishlist response status:', response.status);
    console.log('✅ Add to wishlist response ok:', response.ok);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Successfully added to wishlist:', result);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Add to wishlist failed:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Add to wishlist error:', error.message);
    return false;
  }
}

// Function để kiểm tra button state
function checkButtonState() {
  console.log('🔘 Checking Button State...');
  
  const buttons = document.querySelectorAll('button[aria-label="Add to Wishlist"]');
  console.log('- Found buttons:', buttons.length);
  
  buttons.forEach((button, index) => {
    console.log(`- Button ${index + 1}:`);
    console.log('  - Disabled:', button.disabled);
    console.log('  - Class:', button.className);
    console.log('  - Style:', button.style.cssText);
    console.log('  - Text:', button.textContent);
  });
}

// Function để force enable button (for testing)
function forceEnableButton() {
  console.log('🔧 Force Enabling Button...');
  
  const buttons = document.querySelectorAll('button[aria-label="Add to Wishlist"]');
  buttons.forEach((button, index) => {
    button.disabled = false;
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
    console.log(`✅ Button ${index + 1} enabled`);
  });
}

// Main debug function
async function debugAddToWishlist() {
  console.log('🚀 Starting Add to Wishlist Debug...');
  
  // Step 1: Check authentication
  const auth = checkAuth();
  
  // Step 2: Test API connection
  const apiTest = await testAPIConnection();
  
  // Step 3: Check button state
  checkButtonState();
  
  // Step 4: Test add to wishlist if authenticated
  if (auth.hasToken && apiTest.success) {
    await testAddToWishlistWithAuth();
  }
  
  console.log('🏁 Debug completed!');
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.debugAddToWishlist = debugAddToWishlist;
  window.checkAuth = checkAuth;
  window.testAPIConnection = testAPIConnection;
  window.testAddToWishlistWithAuth = testAddToWishlistWithAuth;
  window.checkButtonState = checkButtonState;
  window.forceEnableButton = forceEnableButton;
  
  console.log('🔧 Debug functions available:');
  console.log('- window.debugAddToWishlist() - Run complete debug');
  console.log('- window.checkAuth() - Check authentication');
  console.log('- window.testAPIConnection() - Test API connection');
  console.log('- window.testAddToWishlistWithAuth() - Test add to wishlist');
  console.log('- window.checkButtonState() - Check button state');
  console.log('- window.forceEnableButton() - Force enable button');
}

export { debugAddToWishlist, checkAuth, testAPIConnection, testAddToWishlistWithAuth, checkButtonState, forceEnableButton };
