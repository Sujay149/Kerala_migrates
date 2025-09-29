// Direct Web3Forms API test
const testWeb3FormsDirect = async () => {
  const WEB3FORMS_API_URL = 'https://api.web3forms.com/submit';
  const ACCESS_KEY = 'bbfdd300-0a27-49d6-8999-f97857ebd39f';
  
  const testPayload = {
    access_key: ACCESS_KEY,
    to: "sujayss149@gmail.com", // Using a real email address for testing
    from: "MigrantBot Kerala Digital Health <noreply@MigrantBot-kerala.gov.in>",
    subject: "Direct Test - Medication Reminder",
    message: `Kerala Digital Health - MigrantBot
💊 Medication Reminder

Hello John Doe,

This is a friendly reminder to take your medication:

📋 Medication: Aspirin
💊 Dosage: 100mg
📝 Note: Time to take your medication
⚕️ Instructions: Take with food after meals

⏰ Time to take your medication now!

Important Reminders:
• Take your medication at the prescribed time
• Follow the dosage instructions carefully
• Contact your healthcare provider if you have concerns
• Keep track of your medication schedule in the MigrantBot app

This message was sent by Kerala Digital Health - MigrantBot
🏥 Government of Kerala Digital Health Initiative`
  };

  console.log("🧪 Testing Web3Forms API directly...");
  console.log("📧 Payload:", {
    ...testPayload,
    access_key: testPayload.access_key.slice(0, 8) + "..."
  });
  
  try {
    const response = await fetch(WEB3FORMS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    console.log("📬 Web3Forms Response:", result);
    
    if (result.success) {
      console.log("✅ Direct Web3Forms test PASSED");
      console.log("🎯 Email sent successfully");
    } else {
      console.log("❌ Direct Web3Forms test FAILED");
      console.log("🔍 Error:", result.message);
    }
  } catch (error) {
    console.error("❌ Direct test failed with error:", error);
  }
};

// Run in Node.js
if (typeof window === 'undefined') {
  testWeb3FormsDirect();
}

module.exports = { testWeb3FormsDirect };