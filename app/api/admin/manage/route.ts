import { NextRequest, NextResponse } from 'next/server';
import getAdmin from '@/lib/firebase-admin';

const admin = getAdmin();

export async function POST(req: NextRequest) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;

    if (!admin) return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 503 });

    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if current user is already an admin
    const currentUserRecord = await admin.auth().getUser(decodedToken.uid);
    const currentUserClaims = currentUserRecord.customClaims;
    
    if (!currentUserClaims?.admin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action } = body; // action: 'grant' or 'revoke'

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
    }

    if (action !== 'grant' && action !== 'revoke') {
      return NextResponse.json({ error: 'Invalid action. Must be "grant" or "revoke"' }, { status: 400 });
    }

    // Get target user
    const targetUserRecord = await admin.auth().getUser(userId);
    
    // Set or remove admin claim
    const newClaims = { ...targetUserRecord.customClaims };
    if (action === 'grant') {
      newClaims.admin = true;
    } else {
      delete newClaims.admin;
    }

    await admin.auth().setCustomUserClaims(userId, newClaims);

    return NextResponse.json({
      success: true,
      message: `Admin privileges ${action === 'grant' ? 'granted to' : 'revoked from'} ${targetUserRecord.email}`,
      user: {
        uid: targetUserRecord.uid,
        email: targetUserRecord.email,
        isAdmin: action === 'grant'
      }
    });

  } catch (error: any) {
    console.error('Admin management error:', error);
    
    if (error?.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}