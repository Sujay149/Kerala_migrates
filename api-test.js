// Simple test to verify our API works with plain text
fetch('http://localhost:3001/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'sujayss149@gmail.com',
    subject: 'API Test - Clean Text Medication',
    medicationName: 'Aspirin',
    dosage: '100mg',
    message: 'Time to take your medication',
    userName: 'John Doe',
    instructions: 'Take with food'
  })
})
.then(r => r.json())
.then(d => console.log('✅ API Test Result:', d))
.catch(e => console.error('❌ API Test Error:', e));