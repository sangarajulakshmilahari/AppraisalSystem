import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";

type ReminderRow = {
  ResumeId: number;
  UserId: number;
  username: string;
  email: string;
  UploadedAt: Date;
  IsCurrent: number;
};

function addMonths(base: Date, months: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

function canRun(req: Request) {
  const configured = process.env.RESUME_REMINDER_SECRET || "";
  if (!configured) return false;
  const header = req.headers.get("x-reminder-secret") || "";
  return header === configured;
}

export async function POST(req: Request) {
  try {
    if (!canRun(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT ur.ResumeId, ur.UserId, ur.UploadedAt, ur.IsCurrent, u.username, u.email
       FROM user_resumes ur
       JOIN users u ON u.id = ur.UserId
       WHERE ur.IsCurrent = 1`
    );

    const dueUsers = (rows as ReminderRow[]).filter((r) => {
      const dueDate = addMonths(new Date(r.UploadedAt), 6);
      const isDue = Date.now() >= dueDate.getTime();
      return isDue;
    });

    for (const row of dueUsers) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         VALUES (?, 'Resume Update Due', ?, 'warning', '/webpage/profile')`,
        [
          row.UserId,
          `Hi ${row.username}, your resume is older than 6 months. Please upload the latest version in your profile.`,
        ]
      );

      // Placeholder for external email service integration.
      // Current project does not yet include SMTP/Nodemailer provider.
      console.log(`[resume-reminder] Email to ${row.email}: resume update due`);

      // user_resumes schema has no ReminderSentAt column; latest resume upload resets due-state.
    }

    return NextResponse.json({
      success: true,
      remindersCreated: dueUsers.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run resume reminders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

