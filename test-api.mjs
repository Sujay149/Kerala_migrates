// Test script to check submissions API with mock authentication
import jwt from 'jsonwebtoken';

// Create a mock JWT token for testing
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  email_verified: true
};

// Create a test JWT token (this is just for testing the API logic)
const mockToken = jwt.sign(mockUser, 'test-secret', { expiresIn: '1h' });

console.log('Mock JWT Token created for user:', mockUser.email);
console.log('Token:', mockToken);

async function testSubmissionsAPI() {
  try {
    console.log('\n=== Testing Submissions API ===');
    
    const response = await fetch('http://localhost:3000/api/documents/submissions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! API Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

// Run the test
testSubmissionsAPI();