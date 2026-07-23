// app/webpage/notifications/page.tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, LucideIcon, PartyPopper, TriangleAlert, Zap } from "lucide-react";

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

const TYPE_STYLE: Record<string, { bg: string; border: string; color: string; icon: LucideIcon }> = {
  action: { bg: "#fff7ed", border: "#fed7aa", color: "#c2410c", icon: Zap },
  success: { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d", icon: CheckCircle2 },
  warning: { bg: "#fffbeb", border: "#fde68a", color: "#a16207", icon: TriangleAlert },
  info: { bg: "#eff6ff", border: "#bfdbfe", color: "#1e3a8a", icon: Info },
};

const ui: Record<string, React.CSSProperties> = {
  page: { maxWidth: 900, display: "grid", gap: 14 },
  card: {
    background: "#fff",
    border: "1px solid var(--color-border)",
    borderRadius: 16,
    boxShadow: "var(--shadow-soft)",
  },
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
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await fetch(`/api/employee/notifications/${id}/read`, { method: "PUT" });
  };

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/employee/notifications/read-all", { method: "PUT" });
  };

  const deleteNotif = async (id: number) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/employee/notifications/${id}`, { method: "DELETE" });
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;
  const displayed = filter === "unread" ? notifs.filter((n) => !n.isRead) : notifs;

  if (loading) {
    return (
      <div style={{ ...ui.card, minHeight: 180, display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        Loading notifications...
      </div>
    );
  }

  return (
    <div style={ui.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 30, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Notifications</h1>
          <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
            {unreadCount > 0 ? <span style={{ color: "var(--color-orange-500)", fontWeight: 600 }}>{unreadCount} unread</span> : "All caught up"} · {notifs.length} total
          </p>
        </div>

        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? "btn btn-primary" : "btn btn-secondary"}
            style={{ minHeight: 36, textTransform: "capitalize", padding: "0 14px" }}
          >
            {f} {f === "unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div style={{ ...ui.card, padding: "40px", textAlign: "center" }}>
          <div style={{ marginBottom: 12, display: "grid", placeItems: "center" }}>
            <PartyPopper size={40} color="var(--color-orange-500)" />
          </div>
          <p style={{ margin: 0, fontWeight: 700, color: "var(--color-text-heading)", fontSize: 16 }}>
            {filter === "unread" ? "All caught up" : "No notifications yet"}
          </p>
          <p style={{ marginTop: 4, color: "var(--color-text-muted)", fontSize: 13 }}>
            {filter === "unread" ? "No unread notifications." : "Notifications will appear here as your appraisal progresses."}
          </p>
        </div>
      ) : (
        displayed.map((n) => {
          const s = TYPE_STYLE[n.type] || TYPE_STYLE.info;
          const Icon = s.icon;

          return (
            <div key={n.id} style={{ ...ui.card, background: n.isRead ? "#fff" : s.bg, borderColor: n.isRead ? "var(--color-border)" : s.border, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                <Icon size={20} color={s.color} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, gap: 8 }}>
                  <p style={{ margin: 0, fontWeight: n.isRead ? 600 : 700, fontSize: 14, color: "var(--color-text-heading)" }}>
                    {n.title}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {!n.isRead ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-orange-500)", display: "inline-block" }} /> : null}
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{n.date} · {n.time}</span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.6 }}>{n.message}</p>

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {!n.isRead && (
                    <button className="btn btn-secondary" onClick={() => markRead(n.id)} style={{ minHeight: 34, padding: "0 10px" }}>
                      Mark as read
                    </button>
                  )}

                  {n.linkUrl && (
                    <a href={n.linkUrl} className="btn btn-primary" style={{ minHeight: 34, padding: "0 10px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                      View →
                    </a>
                  )}

                  <button className="btn btn-ghost" onClick={() => deleteNotif(n.id)} style={{ minHeight: 34, padding: "0 10px", color: "var(--color-text-muted)" }}>
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
