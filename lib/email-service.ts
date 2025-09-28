import nodemailer from 'nodemailer';

// Email transporter configuration
const createTransporter = () => {
  // For production, use a proper email service like Gmail, SendGrid, etc.
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

interface EmailNotificationData {
  recipientEmail: string;
  recipientName?: string;
  documentName: string;
  status: 'pending' | 'approved' | 'rejected';
  adminMessage?: string;
  reviewerName?: string;
  reviewDate?: string;
}

export const sendStatusUpdateEmail = async (data: EmailNotificationData) => {
  try {
    const transporter = createTransporter();
    
    const subject = `Kerala Health Document - ${data.status === 'approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : 'Update'}`;
    
    const statusColor = data.status === 'approved' ? '#16a34a' : data.status === 'rejected' ? '#dc2626' : '#eab308';
    const statusIcon = data.status === 'approved' ? '✅' : data.status === 'rejected' ? '❌' : '⏳';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kerala Health Document Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; margin: 10px 0; }
          .document-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
          .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e7ff; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
          .btn { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Kerala Migrant Workers Health System</h1>
            <p>Document Status Update</p>
          </div>
          
          <div class="content">
            <div style="text-align: center;">
              <h2>Hello ${data.recipientName || 'User'},</h2>
              <div class="status-badge" style="background-color: ${statusColor};">
                ${statusIcon} Document ${data.status.toUpperCase()}
              </div>
            </div>
            
            <div class="document-info">
              <h3>Document Details</h3>
              <p><strong>File Name:</strong> ${data.documentName}</p>
              <p><strong>Status:</strong> ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</p>
              ${data.reviewDate ? `<p><strong>Review Date:</strong> ${data.reviewDate}</p>` : ''}
              ${data.reviewerName ? `<p><strong>Reviewed By:</strong> ${data.reviewerName}</p>` : ''}
            </div>
            
            ${data.adminMessage ? `
              <div class="message-box">
                <h3>Message from Administrator</h3>
                <p>${data.adminMessage}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/user" class="btn">
                View My Documents
              </a>
            </div>
            
            <div class="footer">
              <p>This is an automated message from the Kerala Migrant Workers Health Documentation System.</p>
              <p>For assistance, please contact the health department administrator.</p>
              <p style="font-size: 12px; color: #9ca3af;">
                Kerala Government | Department of Health | Migrant Worker Support Program
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Kerala Migrant Workers Health System
      Document Status Update
      
      Hello ${data.recipientName || 'User'},
      
      Your document "${data.documentName}" has been ${data.status}.
      ${data.adminMessage ? `\nAdmin Message: ${data.adminMessage}` : ''}
      ${data.reviewerName ? `\nReviewed by: ${data.reviewerName}` : ''}
      ${data.reviewDate ? `\nReview Date: ${data.reviewDate}` : ''}
      
      Please visit ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/user to view your documents.
      
      This is an automated message from the Kerala Migrant Workers Health Documentation System.
    `;

    await transporter.sendMail({
      from: `"Kerala Health System" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Email notification sent to ${data.recipientEmail} for document status: ${data.status}`);
    return { success: true };
    
  } catch (error: any) {
    console.error('Email notification failed:', error);
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (userEmail: string, userName?: string) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Kerala Health System</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .btn { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Welcome to Kerala Health System</h1>
            <p>Your health documents are now secure with us</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName || 'User'},</h2>
            <p>Welcome to the Kerala Migrant Workers Health Documentation System. Your account has been successfully created.</p>
            
            <p>You can now:</p>
            <ul>
              <li>Upload your health documents securely</li>
              <li>Track the approval status of your submissions</li>
              <li>Receive updates from health administrators</li>
              <li>Access your documents anytime, anywhere</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/user" class="btn">
                Access Your Dashboard
              </a>
            </div>
            
            <div class="footer">
              <p>Kerala Government | Department of Health | Migrant Worker Support Program</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Kerala Health System" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Welcome to Kerala Health Documentation System',
      html: htmlContent,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Welcome email failed:', error);
    return { success: false, error: error.message };
  }
};