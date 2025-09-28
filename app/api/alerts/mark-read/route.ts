import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, doc, setDoc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.userId || !data.alertId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Create or update the read status in Firebase
    const alertReadStatusRef = doc(collection(db, "alertReadStatus"), data.id)
    
    await setDoc(alertReadStatusRef, {
      userId: data.userId,
      alertId: data.alertId,
      read: true,
      readAt: data.readAt || new Date().toISOString()
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking alert as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}