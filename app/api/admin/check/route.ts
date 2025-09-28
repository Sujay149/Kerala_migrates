import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

export async function GET(req: NextRequest) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user record to check custom claims
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims;
    
    return NextResponse.json({
      isAdmin: !!customClaims?.admin,
      uid: decodedToken.uid,
      email: decodedToken.email
    });

  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}