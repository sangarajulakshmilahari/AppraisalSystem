// app/webpage/notifications/page.tsx
"use client";
import { useState, useEffect } from "react";

type Notif = {
  id: number;
  title: string;
  message: string;
  type: "action" | "info" | "success" | "warning";
  isRead: boolean;
  linkUrl: string | null;
  date: string;
  time: string;
};

const TYPE_STYLE: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  action:  { bg: "#fef9c3", border: "#fde047", color: "#854d0e", icon: "⚡" },
  success: { bg: "#dcfce7", border: "#86efac", color: "#166534", icon: "✅" },
  warning: { bg: "#fef3c7", border: "#fcd34d", color: "#92400e", icon: "⚠️" },
  info:    { bg: "#dbeafe", border: "#93c5fd", color: "#1e3a8a", icon: "ℹ️" },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employee/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.notifications) setNotifs(data.notifications);
      })
      .catch((e) => console.error("Notifications error:", e))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: number) => {
    setNotifs(notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await fetch(`/api/employee/notifications/${id}/read`, { method: "PUT" });
  };

  const markAllRead = async () => {
    setNotifs(notifs.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/employee/notifications/read-all", { method: "PUT" });
  };

  const deleteNotif = async (id: number) => {
    setNotifs(notifs.filter((n) => n.id !== id));
    await fetch(`/api/employee/notifications/${id}`, { method: "DELETE" });
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;
  const displayed = filter === "unread" ? notifs.filter((n) => !n.isRead) : notifs;

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af" }}>Loading notifications...</div>;
  }

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
          <button onClick={markAllRead} style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #c4b5fd", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Mark all as read
          </button>
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
          <p style={{ fontWeight: 700, color: "#374151", fontSize: 16 }}>
            {filter === "unread" ? "All caught up!" : "No notifications yet"}
          </p>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>
            {filter === "unread" ? "No unread notifications." : "Notifications will appear here as your appraisal progresses."}
          </p>
        </div>
      ) : (
        displayed.map((n) => {
          const s = TYPE_STYLE[n.type] || TYPE_STYLE.info;
          return (
            <div key={n.id} style={{ background: n.isRead ? "#fff" : s.bg, border: `1px solid ${n.isRead ? "#ede9fe" : s.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start", transition: "all 0.2s", boxShadow: n.isRead ? "none" : "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <p style={{ fontWeight: n.isRead ? 600 : 700, fontSize: 14, color: "#1f2937" }}>{n.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                    {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", display: "inline-block" }} />}
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{n.date} · {n.time}</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 10 }}>{n.message}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {!n.isRead && (
                    <button onClick={() => markRead(n.id)} style={{ background: "#fff", color: "#7c3aed", border: "1px solid #c4b5fd", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Mark as read
                    </button>
                  )}
                  {n.linkUrl && (
                    <a href={n.linkUrl} style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ede9fe", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>
                      View →
                    </a>
                  )}
                  <button onClick={() => deleteNotif(n.id)} style={{ background: "transparent", color: "#9ca3af", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}