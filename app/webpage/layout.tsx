"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getUserFromCookie, getInitials } from "../api/lib/auth";

/* ─── SVG Icons ─────────────────────────────────────────── */
const IC = {
  dashboard: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  goals:    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  self:     <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  comp:     <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  dev:      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  feedback: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  profile:  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  bell:     <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  help:     <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  logout:   <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevron:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  menu:     <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
};

const NAV = [
  { href: "/webpage/dashboard",        label: "Dashboard",             icon: IC.dashboard },
  { href: "/webpage/goals",            label: "My Goals",              icon: IC.goals     },
  { href: "/webpage/self-assessment",  label: "Self Assessment",       icon: IC.self      },
  { href: "/webpage/competency",       label: "Competency Assessment", icon: IC.comp      },
  { href: "/webpage/development-plan", label: "Development Plan",      icon: IC.dev       },
  { href: "/webpage/feedback",         label: "Feedback & Results",    icon: IC.feedback  },
  { href: "/webpage/profile",          label: "My Profile",            icon: IC.profile   },
  { href: "/webpage/notifications",    label: "Notifications",         icon: IC.bell, badge: 3 },
  { href: "/webpage/help",             label: "Help / Support",        icon: IC.help      },
];

export default function WebpageLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState("Sriram Kumar");
  const pathname = usePathname();

  useEffect(() => {
    const u = getUserFromCookie();
    if (u && u !== "User") setUser(u);
  }, []);

  const initials = getInitials(user);
  const pageTitle = NAV.find((n) => pathname.startsWith(n.href))?.label ?? "Appraisal";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f3ff", fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: collapsed ? 72 : 260,
        minHeight: "100vh",
        background: "linear-gradient(175deg,#1e0a3c 0%,#0f0924 60%,#070514 100%)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s cubic-bezier(.4,0,.2,1)",
        position: "sticky",
        top: 0,
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "4px 0 24px rgba(124,58,237,0.15)",
      }}>

        {/* Logo */}
        <div style={{ padding: "24px 16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(124,58,237,0.2)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 15px rgba(124,58,237,0.4)" }}>
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          {!collapsed && (
            <div>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Adroitent</p>
              <p style={{ color: "#a78bfa", fontSize: 11, fontWeight: 500 }}>Appraisal Portal</p>
            </div>
          )}
        </div>

        {/* User card */}
        {!collapsed && (
          <div style={{ margin: "16px 12px", padding: "12px 14px", background: "rgba(124,58,237,0.15)", borderRadius: 12, border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initials}</div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ color: "#fff", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user}</p>
              <p style={{ color: "#a78bfa", fontSize: 11 }}>Employee</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ margin: "12px auto", width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>{initials}</div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 10px", overflowY: "auto", overflowX: "hidden" }}>
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "11px" : "11px 14px",
                  borderRadius: 10, marginBottom: 2, cursor: "pointer", position: "relative",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: active ? "linear-gradient(90deg,rgba(124,58,237,0.35),rgba(124,58,237,0.1))" : "transparent",
                  color: active ? "#c4b5fd" : "#7c6fa0",
                  transition: "all 0.2s",
                  borderLeft: active ? "3px solid #7c3aed" : "3px solid transparent",
                }}>
                  <span style={{ flexShrink: 0, color: active ? "#a78bfa" : "#7c6fa0" }}>{item.icon}</span>
                  {!collapsed && <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span style={{ marginLeft: "auto", background: "#7c3aed", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{item.badge}</span>
                  )}
                  {collapsed && item.badge && (
                    <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: "#7c3aed", borderRadius: "50%", border: "2px solid #0f0924" }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(124,58,237,0.2)" }}>
          <Link href="/api/auth/logout" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "11px" : "11px 14px", borderRadius: 10, cursor: "pointer", color: "#f87171", justifyContent: collapsed ? "center" : "flex-start", transition: "all 0.2s" }}>
              <span>{IC.logout}</span>
              {!collapsed && <span style={{ fontSize: 13.5, fontWeight: 500 }}>Logout</span>}
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <header style={{ height: 64, background: "#fff", borderBottom: "1px solid #ede9fe", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 8px rgba(124,58,237,0.06)" }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed", display: "flex", padding: 4, borderRadius: 8 }}>
            {IC.menu}
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Appraisal Portal</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1f2937", lineHeight: 1 }}>{pageTitle}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/webpage/notifications" style={{ position: "relative", display: "flex", color: "#6b7280", textDecoration: "none" }}>
              {IC.bell}
              <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, background: "#7c3aed", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>3</span>
            </Link>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>{initials}</div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: "28px 28px", overflow: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}