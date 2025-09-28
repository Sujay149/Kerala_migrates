import { NextResponse } from "next/server";
import { collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export async function POST(req: Request) {
  try {
    const { userId, medicationId, reminderTimes, medicationName, dosage } = await req.json();

    if (!userId || !medicationId || !reminderTimes?.length) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Validate time format (HH:MM) and filter invalid entries
    const validTimes = (reminderTimes || []).filter((t: string) => {
      if (typeof t !== 'string') return false;
      const match = t.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      return !!match;
    });

    if (!validTimes.length) {
      return NextResponse.json({ success: false, error: "No valid reminder times provided" }, { status: 400 });
    }

    console.log(` Scheduling reminders for ${medicationName} at times:`, validTimes);

    // Clear existing reminders for this medication using client SDK
    const existingReminders = query(
      collection(db, "scheduledReminders"),
      where("medicationId", "==", medicationId)
    );
    
    const existingSnapshot = await getDocs(existingReminders);
    const deletePromises = existingSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Schedule new reminders for each time using client SDK
    const schedulePromises = validTimes.map(async (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      
      // Create reminder document
      const reminderData = {
        userId,
        medicationId,
        medicationName: medicationName || 'Unnamed Medication',
        dosage: dosage || '',
        time,
        hours,
        minutes,
        active: true,
        createdAt: new Date(),
        lastTriggered: null,
        nextTrigger: null
      };

      return await addDoc(collection(db, "scheduledReminders"), reminderData);
    });

    await Promise.all(schedulePromises);

    console.log(` Successfully scheduled ${validTimes.length} reminders for ${medicationName}`);

    return NextResponse.json({ 
      success: true, 
      message: `Scheduled ${validTimes.length} reminders for ${medicationName}`,
      times: validTimes
    });

  } catch (error) {
    console.error(" Error scheduling reminders:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to schedule reminders",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
