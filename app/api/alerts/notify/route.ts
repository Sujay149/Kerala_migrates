import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Alert } from '@/app/alerts/models'

// Use environment variable for the Web3Forms API key
const WEB3FORMS_API_KEY = process.env.WEB3FORMS_ACCESS_KEY || 'bbfdd300-0a27-49d6-8999-f97857ebd39f'

export async function POST(request: NextRequest) {
  console.log('🔔 Alert notification API route called')
  
  try {
    const data = await request.json()
    
    if (!data.alertId) {
      console.error('❌ Missing alert ID')
      return NextResponse.json({ error: 'Missing alert ID' }, { status: 400 })
    }
    
    console.log(`🔍 Looking for alert with ID: ${data.alertId}`)
    
    // Get the alert details directly using the document ID
    const alertRef = doc(db, 'alerts', data.alertId)
    const alertDoc = await getDoc(alertRef)
    
    if (!alertDoc.exists()) {
      console.error('❌ Alert not found')
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }
    
    // Get the alert data and add the ID to it
    const alertData = alertDoc.data();
    const alert: Alert = { 
      id: alertDoc.id, 
      ...alertData as Omit<Alert, 'id'>
    };
    console.log('✅ Alert found:', alert.title)
    
    // Initialize recipients array
    const recipients: string[] = []
    
    // Try to find users who want alert notifications
    console.log('🔍 Looking for users with alert notification preferences')
    // to determine who should receive the alert notification
    const usersRef = collection(db, 'users')
    const usersQuery = query(usersRef, where('alertNotifications', '==', true))
    const usersSnapshot = await getDocs(usersQuery)
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data()
      if (userData.email) {
        recipients.push(userData.email)
      }
    })
    
    // For testing purposes - use a fallback email if no users are found
    if (recipients.length === 0) {
      // Add a fallback email address for testing
      const fallbackEmail = "test@example.com" // Replace with your test email
      recipients.push(fallbackEmail)
      console.log('⚠️ No recipients found, using fallback email:', fallbackEmail)
    }
    
    // Format the email content
    const emailContent = {
      access_key: WEB3FORMS_API_KEY,
      subject: `Health Alert: ${alert.title}`,
      from_name: 'Health Alert System',
      to_name: 'Valued Patient',
      to_email: recipients.join(','), // Join all recipients with commas
      message: `
        <h2>${alert.title}</h2>
        <p><strong>Priority:</strong> ${alert.priority}</p>
        <p>${alert.message}</p>
        ${alert.imageUrl ? `<img src="${alert.imageUrl}" alt="${alert.title}" style="max-width: 100%; height: auto;" />` : ''}
        ${alert.actionLink ? `<p><a href="${alert.actionLink}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">Learn More</a></p>` : ''}
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          This is an automated notification from your healthcare provider. 
          Please do not reply to this email.
        </p>
      `,
      html: true
    }
    
    console.log('📧 Sending email to', recipients.length, 'recipients')
    
    // Send the email using Web3Forms API
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailContent)
    })
    
    const responseData = await response.json()
    
    if (response.status !== 200) {
      console.error('❌ Web3Forms API Error:', responseData)
      return NextResponse.json(
        { error: 'Failed to send email notifications', details: responseData }, 
        { status: 500 }
      )
    }
    
    console.log('✅ Email notification sent successfully')
    
    // Update the alert to mark as sent
    try {
      const alertRef = doc(db, 'alerts', alert.id)
      await updateDoc(alertRef, {
        emailSent: true,
        lastNotificationSent: new Date().toISOString()
      })
      console.log('✅ Alert updated with emailSent status')
    } catch (updateError) {
      console.error('⚠️ Could not update alert status:', updateError)
      // Continue execution even if update fails
    }
    
    return NextResponse.json({
      success: true,
      message: `Notification sent to ${recipients.length} recipients`,
      recipients: recipients
    })
    
  } catch (error) {
    console.error('❌ Error sending notifications:', error)
    
    // Send a detailed error response for debugging
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    )
  }
}