import { NextResponse } from "next/server";
import getAdmin from '@/lib/firebase-admin';

const admin = getAdmin();

export async function POST(req: Request) {
  try {
    const { token, title, body } = await req.json();

    console.log("Push notification request:", { token: token ? "***" : "missing", title, body });

    if (!token || !title || !body) {
      console.log("Missing required fields:", { token: !!token, title: !!title, body: !!body });
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const message = {
      token,
      notification: { title, body },
      data: { timestamp: Date.now().toString() },
    };

    if (!admin) {
      console.warn('Firebase Admin not initialized - send-push cannot send notifications');
      return NextResponse.json({ success: false, error: 'Firebase Admin not configured' }, { status: 503 });
    }

    console.log("Sending FCM message:", message);
    const response = await admin.messaging().send(message);
    console.log("FCM response:", response);
    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("FCM Push Error:", error);
    const errorMessage = typeof error === "object" && error !== null && "message" in error
      ? (error as { message?: string }).message
      : String(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
