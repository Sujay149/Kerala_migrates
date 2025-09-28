import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import * as CryptoJS from 'crypto-js';

// Encryption key for QR data
const QR_ENCRYPTION_KEY = process.env.NEXT_PUBLIC_QR_ENCRYPTION_KEY || 'medibot-qr-key-32-characters-long';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kerala-migrates-r4io.onrender.com/';

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 QR Generation API: Creating user data QR code...');

    // Get authorization token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }

    // Parse JWT token to get user information
    let userId, userEmail, userDisplayName;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.user_id || payload.sub;
      userEmail = payload.email;
      userDisplayName = payload.name || payload.display_name;
      
      console.log('👤 Generating QR for user:', { userId, userEmail, userDisplayName });
      
      if (!userId || !userEmail) {
        throw new Error('Invalid token: missing user information');
      }
    } catch (error) {
      console.error('Token parsing error:', error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Create encrypted payload for QR code
    const qrPayload = {
      userId,
      userEmail,
      userDisplayName: userDisplayName || 'Unknown User',
      type: 'comprehensive_user_data',
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
      version: '1.0'
    };

    console.log('🔒 Creating encrypted QR payload...');
    
    // Encrypt the payload
    const encryptedPayload = CryptoJS.AES.encrypt(
      JSON.stringify(qrPayload),
      QR_ENCRYPTION_KEY
    ).toString();

    // Create access URL - Updated to match existing page structure
    const accessUrl = `${BASE_URL}/qr/${encodeURIComponent(encryptedPayload)}`;
    
    console.log('🎯 QR Access URL generated:', accessUrl);

    // Generate QR code
    console.log('📱 Generating QR code image...');
    const qrCodeDataUrl = await QRCode.toDataURL(accessUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1f2937',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });

    console.log('✅ QR code generated successfully');

    // Return QR code data
    return NextResponse.json({
      success: true,
      qrData: {
        qrCodeDataUrl,
        accessUrl,
        encryptedToken: encryptedPayload,
        generatedAt: qrPayload.generatedAt,
        expiresAt: qrPayload.expiresAt,
        userInfo: {
          userId,
          userEmail,
          userDisplayName: userDisplayName || 'Unknown User'
        }
      },
      message: 'QR code generated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error generating QR code:', error);
    return NextResponse.json({
      error: error.message || 'Failed to generate QR code',
      success: false
    }, { status: 500 });
  }
}