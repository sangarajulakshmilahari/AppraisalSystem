"use client";
import { useState } from "react";

type Notif = { id: string; title: string; message: string; type: "action" | "info" | "success" | "warning"; read: boolean; date: string; time: string };

const INIT_NOTIFS: Notif[] = [
  { id: "1", title: "Self Assessment Window Open",              message: "The self-assessment window is now open until 28 Feb 2026. Please complete your assessment for all 5 goals.", type: "action",  read: false, date: "Today",     time: "9:00 AM"  },
  { id: "2", title: "Goal Setting Approved",                    message: "Your reporting manager Rajesh Nair has approved all 5 of your goals for FY 2025–26.",                          type: "success", read: false, date: "Today",     time: "8:30 AM"  },
  { id: "3", title: "Development Plan Reminder",                message: "You have not updated your development plan in 30 days. Please review and update your progress.",               type: "warning", read: false, date: "Yesterday", time: "3:00 PM"  },
  { id: "4", title: "Competency Assessment Not Started",        message: "The competency assessment window opens on 1 Mar 2026. Please be prepared to rate yourself on all 7 areas.",    type: "info",    read: true,  date: "22 Feb",    time: "10:15 AM" },
  { id: "5", title: "Appraisal Cycle FY 2025–26 Initiated",    message: "The annual appraisal cycle for FY 2025–26 has been initiated. Goal setting window is now open.",              type: "info",    read: true,  date: "01 Apr",    time: "9:00 AM"  },
  { id: "6", title: "AWS Certification Reminder",               message: "Your development plan target to complete AWS certification by Dec 2025 is approaching. Status: In Progress.", type: "warning", read: true,  date: "15 Nov",    time: "11:00 AM" },
];

const TYPE_STYLE: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  action:  { bg: "#fef9c3", border: "#fde047", color: "#854d0e", icon: "⚡" },
  success: { bg: "#dcfce7", border: "#86efac", color: "#166534", icon: "✅" },
  warning: { bg: "#fef3c7", border: "#fcd34d", color: "#92400e", icon: "⚠️" },
  info:    { bg: "#dbeafe", border: "#93c5fd", color: "#1e3a8a", icon: "ℹ️" },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>(INIT_NOTIFS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const markRead = (id: string) => setNotifs(notifs.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifs(notifs.map((n) => ({ ...n, read: true })));
  const deleteNotif = (id: string) => setNotifs(notifs.filter((n) => n.id !== id));

  const unreadCount = notifs.filter((n) => !n.read).length;
  const displayed = filter === "unread" ? notifs.filter((n) => !n.read) : notifs;

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>Notifications</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>
            {unreadCount > 0 ? <span style={{ color: "#7c3aed", fontWeight: 600 }}>{unreadCount} unread</span> : "All caught up"} · {notifs.length} total
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #c4b5fd", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Mark all as read</button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["all", "unread"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? "#7c3aed" : "#fff", color: filter === f ? "#fff" : "#6b7280", border: "1px solid", borderColor: filter === f ? "#7c3aed" : "#e5e7eb", borderRadius: 20, padding: "6px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
            {f} {f === "unread" && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {displayed.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, padding: "40px", textAlign: "center", border: "1px solid #ede9fe" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <p style={{ fontWeight: 700, color: "#374151", fontSize: 16 }}>All caught up!</p>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>No unread notifications.</p>
        </div>
      ) : (
        displayed.map((n) => {
          const s = TYPE_STYLE[n.type];
          return (
            <div key={n.id} style={{ background: n.read ? "#fff" : s.bg, border: `1px solid ${n.read ? "#ede9fe" : s.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start", transition: "all 0.2s", boxShadow: n.read ? "none" : "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <p style={{ fontWeight: n.read ? 600 : 700, fontSize: 14, color: "#1f2937" }}>{n.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                    {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", display: "inline-block" }} />}
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{n.date} · {n.time}</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 10 }}>{n.message}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} style={{ background: "#fff", color: "#7c3aed", border: "1px solid #c4b5fd", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Mark as read</button>
                  )}
                  <button onClick={() => deleteNotif(n.id)} style={{ background: "transparent", color: "#9ca3af", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Dismiss</button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}