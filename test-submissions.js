// Test script to check submissions API response structure
async function testSubmissionsAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/documents/submissions', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testSubmissionsAPI();