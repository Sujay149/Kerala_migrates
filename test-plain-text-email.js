// Test direct Web3Forms API with plain text only
const ACCESS_KEY = "bbfdd300-0a27-49d6-8999-f97857ebd39f";

const testDirectPlainText = async () => {
  const plainTextMessage = `Kerala Digital Health - MediBot
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
• Keep track of your medication schedule in the MediBot app

This message was sent by Kerala Digital Health - MediBot
🏥 Government of Kerala Digital Health Initiative`;

  const testPayload = {
    access_key: ACCESS_KEY,
    to: "sujayss149@gmail.com",
    from: "MediBot Kerala Digital Health <noreply@medibot-kerala.gov.in>",
    subject: "PLAIN TEXT TEST - Medication Reminder",
    message: plainTextMessage // ONLY plain text, NO HTML field
  };

  console.log("🧪 Testing Direct Web3Forms Plain Text API...");
  console.log("📧 Plain text message:", plainTextMessage.substring(0, 200) + "...");
  
  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    console.log("📬 Web3Forms Response:", result);
    
    if (result.success) {
      console.log("✅ Plain text direct test PASSED");
      console.log("🎯 Email should arrive as CLEAN TEXT (no HTML)");
      console.log("📧 Check your Gmail inbox for clean medication details");
    } else {
      console.log("❌ Plain text direct test FAILED");
      console.log("🔍 Error:", result.error);
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
};

// Run the test
testDirectPlainText();