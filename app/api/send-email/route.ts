import { NextRequest, NextResponse } from 'next/server';

// Web3Forms API endpoint
const WEB3FORMS_API_URL = 'https://api.web3forms.com/submit';

interface EmailRequest {
  to: string;
  subject: string;
  medicationName?: string;
  message?: string;
  userName?: string;
  dosage?: string;
  instructions?: string;
}

interface Web3FormsPayload {
  access_key: string;
  to: string;
  from: string;
  subject: string;
  message: string; // Only use plain text message, no HTML
}

// Enhanced email template that sends clean readable content instead of HTML
function createMedicationReminderTemplate(data: EmailRequest): string {
  const { 
    medicationName = 'your medication', 
    userName = 'Dear User', 
    message = '', 
    dosage = '',
    instructions = ''
  } = data;
  
  // Create a clean, readable email format with better medication details
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Medication Reminder - Kerala Digital Health</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0E7490 0%, #0D9488 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🏥 Kerala Digital Health</h1>
            <p style="color: #E0F2FE; margin: 10px 0 0 0; font-size: 16px;">MediBot - Your AI Health Assistant</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; border-left: 4px solid #0E7490;">
            <h2 style="color: #0F766E; margin: 0 0 20px 0; font-size: 24px;">💊 Medication Reminder</h2>
            <p style="font-size: 18px; margin: 0 0 15px 0;"><strong>Hello ${userName},</strong></p>
            <p style="font-size: 16px; margin: 0 0 15px 0;">This is a friendly reminder to take your medication:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin: 20px 0;">
                <h3 style="color: #0E7490; margin: 0 0 15px 0; font-size: 20px;">📋 ${medicationName}</h3>
                
                ${dosage ? `<div style="margin-bottom: 10px;">
                  <strong style="color: #0F766E;">💊 Dosage:</strong> 
                  <span style="color: #333;">${dosage}</span>
                </div>` : ''}
                
                ${message ? `<div style="margin-bottom: 10px;">
                  <strong style="color: #0F766E;">📝 Reminder Note:</strong> 
                  <span style="color: #666;">${message}</span>
                </div>` : ''}
                
                ${instructions ? `<div style="margin-bottom: 10px;">
                  <strong style="color: #0F766E;">� Instructions:</strong> 
                  <span style="color: #666;">${instructions}</span>
                </div>` : ''}
                
                <div style="margin-top: 15px; padding: 10px; background: #E0F2FE; border-radius: 6px;">
                  <strong style="color: #0E7490;">⏰ Time to take your medication now!</strong>
                </div>
            </div>
        </div>
        
        <div style="background: #E0F2FE; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #0E7490; margin: 0 0 15px 0; font-size: 18px;">📱 Important Reminders:</h3>
            <ul style="color: #0F766E; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Take your medication at the prescribed time</li>
                <li style="margin-bottom: 8px;">Follow the dosage instructions carefully</li>
                <li style="margin-bottom: 8px;">Contact your healthcare provider if you have concerns</li>
                <li style="margin-bottom: 0;">Keep track of your medication schedule in the MediBot app</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://medibot-kerala.gov.in/medications" style="background: #0E7490; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">📱 Open MediBot App</a>
        </div>
        
        <div style="border-top: 1px solid #e0e0e0; padding: 20px 0; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">This message was sent by <strong>Kerala Digital Health - MediBot</strong></p>
            <p style="margin: 0; font-size: 12px;">🏥 Government of Kerala Digital Health Initiative</p>
        </div>
    </body>
    </html>
  `;
}

// Validate email address format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  console.log('🌐 Web3Forms Email Service - Processing request...');
  
  try {
    // Parse request body
    const body: EmailRequest = await request.json();
    console.log('📧 Email request received:', { 
      to: body.to, 
      subject: body.subject,
      medicationName: body.medicationName,
      dosage: body.dosage,
      userName: body.userName
    });
    
    // Validate required fields
    if (!body.to || !body.subject) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to and subject' },
        { status: 400 }
      );
    }
    
    // Validate email format
    if (!isValidEmail(body.to)) {
      console.error('❌ Invalid email format:', body.to);
      return NextResponse.json(
        { success: false, error: 'Invalid email address format' },
        { status: 400 }
      );
    }
    
    // Get Web3Forms access key
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      console.error('❌ Web3Forms access key not configured');
      return NextResponse.json(
        { success: false, error: 'Email service not properly configured' },
        { status: 500 }
      );
    }
    
    console.log('🎯 Using recipient email:', body.to);
    console.log('🔐 Using Web3Forms access key ending with:', accessKey.slice(-8));
    
    // Create ONLY plain text content - NO HTML to avoid HTML code in emails
    const plainTextContent = `Kerala Digital Health - MediBot
💊 Medication Reminder

Hello ${body.userName || 'Dear User'},

This is a friendly reminder to take your medication:

📋 Medication: ${body.medicationName || 'your prescribed medication'}
${body.dosage ? `💊 Dosage: ${body.dosage}` : ''}
${body.message ? `📝 Note: ${body.message}` : ''}
${body.instructions ? `⚕️ Instructions: ${body.instructions}` : ''}

⏰ Time to take your medication now!

Important Reminders:
• Take your medication at the prescribed time
• Follow the dosage instructions carefully
• Contact your healthcare provider if you have concerns
• Keep track of your medication schedule in the MediBot app

This message was sent by Kerala Digital Health - MediBot
🏥 Government of Kerala Digital Health Initiative
    `;
    
    // Prepare Web3Forms payload with ONLY plain text - no HTML field
    const web3formsPayload = {
      access_key: accessKey,
      to: body.to,
      from: 'MediBot Kerala Digital Health <noreply@medibot-kerala.gov.in>',
      subject: body.subject,
      message: plainTextContent  // Only use message field, no html field
    };
    
    console.log('🚀 Sending email via Web3Forms API to:', body.to);
    console.log('📧 Email subject:', body.subject);
    
    // Send email via Web3Forms
    const response = await fetch(WEB3FORMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(web3formsPayload)
    });
    
    const result = await response.json();
    console.log('📬 Web3Forms API response:', { 
      status: response.status, 
      success: result.success,
      message: result.message,
      recipient: body.to
    });
    
    if (response.ok && result.success) {
      console.log('✅ Email sent successfully via Web3Forms to:', body.to);
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        service: 'Web3Forms',
        recipient: body.to,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Web3Forms API error:', result);
      return NextResponse.json(
        { 
          success: false, 
          error: result.message || 'Failed to send email via Web3Forms',
          details: result
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Email service error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        service: 'Web3Forms'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  
  return NextResponse.json({
    service: 'Web3Forms Email Service',
    status: 'active',
    configured: !!accessKey,
    features: [
      '✅ No authentication required',
      '✅ Reliable email delivery',
      '✅ Professional HTML templates',
      '✅ Kerala Digital Health branding',
      '✅ Medication reminder support'
    ],
    timestamp: new Date().toISOString()
  });
}