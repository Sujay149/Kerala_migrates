import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

// Encryption key for QR data
const QR_ENCRYPTION_KEY = process.env.NEXT_PUBLIC_QR_ENCRYPTION_KEY || 'medibot-qr-key-32-characters-long';

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    console.log(' QR Access API: Decrypting token and fetching user data...');

    const token = decodeURIComponent(params.token);
    
    // Decrypt the token
    let decryptedData;
    try {
      const bytes = CryptoJS.AES.decrypt(token, QR_ENCRYPTION_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      decryptedData = JSON.parse(decryptedString);
      
      console.log(' Token decrypted successfully');
    } catch (error) {
      console.error(' Token decryption failed:', error);
      return NextResponse.json({ 
        error: 'Invalid or corrupted QR token',
        success: false 
      }, { status: 400 });
    }

    // Validate token structure and expiry
    if (!decryptedData.userId || !decryptedData.userEmail || !decryptedData.type) {
      return NextResponse.json({ 
        error: 'Invalid token format',
        success: false 
      }, { status: 400 });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(decryptedData.expiresAt);
    if (now > expiresAt) {
      return NextResponse.json({ 
        error: 'QR token has expired',
        success: false 
      }, { status: 400 });
    }

    console.log(' Token validated. Fetching user data for:', decryptedData.userId);

    // Fetch comprehensive user data using the user-data API
    try {
      // Create a mock JWT token for the internal API call
      // Note: In production, you might want to use service-to-service authentication
      const internalToken = Buffer.from(JSON.stringify({
        user_id: decryptedData.userId,
        email: decryptedData.userEmail,
        name: decryptedData.userDisplayName,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
      })).toString('base64');

      const userDataResponse = await fetch(`${req.nextUrl.origin}/api/qr/user-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer dummy.${internalToken}.dummy`,
          'Content-Type': 'application/json'
        }
      });

      if (!userDataResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userDataResult = await userDataResponse.json();
      
      console.log(' User data fetched successfully');

      // Add access information
      const accessInfo = {
        accessedAt: new Date().toISOString(),
        accessType: 'qr_scan',
        tokenInfo: {
          generatedAt: decryptedData.generatedAt,
          expiresAt: decryptedData.expiresAt,
          type: decryptedData.type,
          version: decryptedData.version
        }
      };

      return NextResponse.json({
        success: true,
        userData: userDataResult.userData,
        stats: userDataResult.stats,
        accessInfo,
        message: 'QR scan successful - user data retrieved'
      });

    } catch (error) {
      console.error(' Error fetching user data:', error);
      return NextResponse.json({
        error: 'Failed to retrieve user data',
        success: false
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error(' Error in QR access API:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error',
      success: false
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  // Redirect GET requests to POST for security
  return NextResponse.json({
    error: 'Please use POST method for QR access',
    success: false
  }, { status: 405 });
}
