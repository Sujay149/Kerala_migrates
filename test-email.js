// Test script to verify Web3Forms email functionality
const testEmailAPI = async () => {
  const testPayload = {
    to: "test-user@example.com",
    subject: "Test Medication Reminder - Aspirin",
    medicationName: "Aspirin",
    dosage: "100mg",
    message: "Time to take your medication",
    userName: "John Doe",
    instructions: "Take with food after meals"
  };

  console.log("🧪 Testing Web3Forms Email API...");
  console.log("📧 Test payload:", testPayload);
  
  try {
    const response = await fetch("http://localhost:3002/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    console.log("📬 API Response:", result);
    
    if (result.success) {
      console.log("✅ Email API test PASSED");
      console.log("🎯 Email sent to:", result.recipient);
    } else {
      console.log("❌ Email API test FAILED");
      console.log("🔍 Error:", result.error);
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
};

// Run the test
testEmailAPI();