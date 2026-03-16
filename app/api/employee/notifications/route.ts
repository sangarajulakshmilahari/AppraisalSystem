// app/api/employee/notifications/route.ts
import { NextResponse } from "next/server";
import { getPool } from "../../lib/db";
import { getCurrentUser } from "../../lib/getuser";

function formatDate(d: any): string | null {
  if (!d) return null;
  const dt = new Date(d);
  const now = new Date();
  const diff = now.getTime() - dt.getTime();
  const dayMs = 86400000;

  if (diff < dayMs) return "Today";
  if (diff < dayMs * 2) return "Yesterday";
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function formatTime(d: any): string {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [user.id]
    );

    const notifications = (rows as any[]).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: !!n.is_read,
      linkUrl: n.link_url,
      date: formatDate(n.created_at),
      time: formatTime(n.created_at),
    }));

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error("GET /api/employee/notifications error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}