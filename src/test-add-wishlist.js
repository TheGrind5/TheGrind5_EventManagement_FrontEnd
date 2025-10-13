// Test script để debug add to wishlist
const API_BASE_URL = 'http://localhost:5000/api';

// Test authentication và add to wishlist
async function testAddToWishlist() {
  console.log('=== TESTING ADD TO WISHLIST ===');
  
  try {
    // 1. Test login first
    console.log('1. Testing login...');
    const loginResponse = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'customer1@example.com',
        password: '123456'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status);
      const errorText = await loginResponse.text();
      console.error('Error:', errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful!');
    console.log('User:', loginData.user);
    console.log('Token preview:', loginData.accessToken.substring(0, 50) + '...');
    
    // Store token
    localStorage.setItem('token', loginData.accessToken);
    localStorage.setItem('user', JSON.stringify(loginData.user));
    
    // 2. Test get events to find ticket types
    console.log('\n2. Testing get events...');
    const eventsResponse = await fetch(`${API_BASE_URL}/Event`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!eventsResponse.ok) {
      console.error('Events API failed:', eventsResponse.status);
      return;
    }
    
    const events = await eventsResponse.json();
    console.log('Events loaded:', events.length);
    
    if (events.length === 0) {
      console.log('No events found!');
      return;
    }
    
    // Get first event with ticket types
    const eventWithTickets = events.find(e => e.ticketTypes && e.ticketTypes.length > 0);
    if (!eventWithTickets) {
      console.log('No events with ticket types found!');
      return;
    }
    
    console.log('Event with tickets:', eventWithTickets.title);
    console.log('Ticket types:', eventWithTickets.ticketTypes.length);
    
    const ticketTypeId = eventWithTickets.ticketTypes[0].ticketTypeId;
    console.log('Using ticket type ID:', ticketTypeId);
    
    // 3. Test add to wishlist
    console.log('\n3. Testing add to wishlist...');
    const addResponse = await fetch(`${API_BASE_URL}/Wishlist/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.accessToken}`
      },
      body: JSON.stringify({
        ticketTypeId: ticketTypeId,
        quantity: 1
      })
    });
    
    console.log('Add to wishlist response status:', addResponse.status);
    console.log('Add to wishlist response ok:', addResponse.ok);
    
    if (addResponse.ok) {
      const addData = await addResponse.json();
      console.log('✅ Item added to wishlist successfully:', addData);
    } else {
      const errorText = await addResponse.text();
      console.error('❌ Add to wishlist failed:', errorText);
    }
    
    // 4. Test get wishlist to verify
    console.log('\n4. Testing get wishlist...');
    const wishlistResponse = await fetch(`${API_BASE_URL}/Wishlist`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.accessToken}`
      }
    });
    
    if (wishlistResponse.ok) {
      const wishlistData = await wishlistResponse.json();
      console.log('✅ Wishlist data:', wishlistData);
      console.log('Items count:', wishlistData.items.length);
    } else {
      console.error('❌ Get wishlist failed:', wishlistResponse.status);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.testAddToWishlist = testAddToWishlist;
  console.log('Test function available as window.testAddToWishlist()');
}

export { testAddToWishlist };
