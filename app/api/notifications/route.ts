import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import admin from 'firebase-admin';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { documentId, message, type, recipientId } = body;

    // Validate required fields
    if (!documentId || !message || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate notification type
    if (!['status_update', 'admin_message', 'document_request'].includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    // Check if document exists
    const documentRef = doc(db, 'documents', documentId);
    const documentSnap = await getDoc(documentRef);

    if (!documentSnap.exists()) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const documentData = documentSnap.data();

    // Determine recipient - if not specified, send to document owner
    const finalRecipientId = recipientId || documentData.userId;

    // Create notification
    const notificationData = {
      documentId,
      documentName: documentData.fileName,
      senderId: decodedToken.uid,
      senderEmail: decodedToken.email,
      recipientId: finalRecipientId,
      message,
      type,
      isRead: false,
      timestamp: new Date(),
      createdAt: new Date().toISOString()
    };

    const notificationRef = await addDoc(collection(db, 'notifications'), notificationData);

    // In a real implementation, you might also send email notifications here
    // await sendEmailNotification(notificationData);

    return NextResponse.json({
      success: true,
      notificationId: notificationRef.id,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Get user's notifications
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // For simplicity, we'll use a basic query
    // In production, you'd want to add proper pagination and filtering
    const notificationsQuery = collection(db, 'notifications');
    const querySnapshot = await getDocs(notificationsQuery);
    
    let notifications = querySnapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      }))
      .filter((notif: any) => notif.recipientId === decodedToken.uid);

    // Apply filters
    if (unreadOnly) {
      notifications = notifications.filter((notif: any) => !notif.isRead);
    }

    // Sort by timestamp (newest first)
    notifications.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit results
    notifications = notifications.slice(0, limit);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: notifications.filter((notif: any) => !notif.isRead).length
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}