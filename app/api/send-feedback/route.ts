import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, message, rating } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.warn("Email credentials not configured. Feedback will be logged instead.");
      console.log("FEEDBACK RECEIVED:", {
        timestamp: new Date().toISOString(),
        email: email || "Anonymous",
        rating: rating || 0,
        message: message,
      });

      return NextResponse.json({
        success: true,
        message: "Feedback received and logged successfully"
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailUser, pass: emailPass }
    });

    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error("Email verification failed:", verifyError);
      console.log("FEEDBACK RECEIVED (Email unavailable):", {
        timestamp: new Date().toISOString(),
        email: email || "Anonymous", 
        rating: rating || 0,
        message: message,
      });

      return NextResponse.json({
        success: true,
        message: "Feedback received (email service temporarily unavailable)"
      });
    }

    await transporter.sendMail({
      from: `"MigrantBot Feedback" <${emailUser}>`,
      to: "sujayss149@gmail.com", 
      subject: "New Feedback from MigrantBot User",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>MigrantBot Feedback</h2>
          <p><strong>From:</strong> ${email || "Anonymous"}</p>
          <p><strong>Rating:</strong> ${rating || 0}/5</p>
          <p><strong>Message:</strong></p>
          <blockquote style="margin: 16px 0; padding: 16px; background: #f3f4f6; border-left: 4px solid #3b82f6;">
            ${message}
          </blockquote>
          <p style="color: #6b7280; font-size: 12px;">Received at: ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    console.log("Feedback sent successfully via email");
    return NextResponse.json({
      success: true,
      message: "Feedback sent successfully"
    });

  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}