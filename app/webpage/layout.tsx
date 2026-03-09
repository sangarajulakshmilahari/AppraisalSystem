// app/webpage/layout.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Target,
  ClipboardList,
  Star,
  TrendingUp,
  MessageSquare,
  User,
  Bell,
  HelpCircle,
  CheckSquare,
  ClipboardCheck,
  BarChart2,
  Trophy,
  FileText,
  RefreshCw,
  Link2,
  Radio,
  Scale,
  DollarSign,
  CheckCircle,
  GraduationCap,
  PieChart,
  FileStack,
  Settings,
  Lock,
  Upload,
  Medal,
  Search,
  Users,
  KeyRound,
  ScrollText,
  Workflow,
  Plug,
  Shield,
  HardDrive,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Pin,
} from "lucide-react";

/* ─── menu_name → route + icon mapping ─── */
const MENU_MAP: Record<string, { href: string; icon: React.ReactNode }> = {
  // Employee (menu_id 1–9)
  Dashboard:               { href: "/webpage/dashboard",         icon: <LayoutDashboard size={16} /> },
  "My Goals":              { href: "/webpage/employee/goals",             icon: <Target size={16} /> },
  "Self Assessment":       { href: "/webpage/employee/self-assessment",   icon: <ClipboardList size={16} /> },
  "Competency Assessment": { href: "/webpage/employee/competency",        icon: <Star size={16} /> },
  "Development Plan":      { href: "/webpage/employee/development-plan",  icon: <TrendingUp size={16} /> },
  "Feedback & Results":    { href: "/webpage/employee/feedback",          icon: <MessageSquare size={16} /> },
  "My Profile":            { href: "/webpage/profile",           icon: <User size={16} /> },
  Notifications:           { href: "/webpage/notifications",     icon: <Bell size={16} /> },
  Help:                    { href: "/webpage/help",              icon: <HelpCircle size={16} /> },
  // Manager (menu_id 10–18)
  "Team Goals Approval":       { href: "/webpage/manager/team-goals",         icon: <CheckSquare size={16} /> },
  "Team Assessments":          { href: "/webpage/manager/team-assessments",   icon: <ClipboardCheck size={16} /> },
  "Competency Ratings": { href: "/webpage/manager/competency-ratings", icon: <Star size={16} /> },
  "Development Plans (Team)":  { href: "/webpage/manager/development-plans",  icon: <TrendingUp size={16} /> },
  "Final Recommendations":     { href: "/webpage/manager/recommendations",    icon: <Trophy size={16} /> },
  "Team Performance Summary":  { href: "/webpage/manager/team-summary",       icon: <BarChart2 size={16} /> },
  "Notifications / Tasks":     { href: "/webpage/notifications",              icon: <Bell size={16} /> },
  "Reports (Team-level)":      { href: "/webpage/manager/reports",            icon: <FileText size={16} /> },
  "Help / Support":            { href: "/webpage/help",                       icon: <HelpCircle size={16} /> },
  // HR Admin (menu_id 19–31)
  "Appraisal Cycle Management":         { href: "/webpage/hr/cycle-management",      icon: <RefreshCw size={16} /> },
  "Employee & Manager Mapping":      { href: "/webpage/hr/employee-mapping",      icon: <Link2 size={16} /> },
  "Workflow Monitoring":             { href: "/webpage/hr/workflow-monitoring",    icon: <Radio size={16} /> },
  "Calibration":                     { href: "/webpage/hr/calibration",           icon: <Scale size={16} /> },
  "Compensation Review":             { href: "/webpage/hr/compensation-review",   icon: <DollarSign size={16} /> },
  "Approval Management":             { href: "/webpage/hr/approval-management",   icon: <CheckCircle size={16} /> },
  "Development Program Management":  { href: "/webpage/hr/development-programs",  icon: <GraduationCap size={16} /> },
  "Reports & Analytics":             { href: "/webpage/hr/reports",               icon: <PieChart size={16} /> },
  "Templates & Forms Configuration": { href: "/webpage/hr/templates",             icon: <FileStack size={16} /> },
  "Rating Scale Configuration":      { href: "/webpage/hr/rating-config",         icon: <Settings size={16} /> },
  "Notification Configuration":      { href: "/webpage/hr/notification-config",   icon: <Bell size={16} /> },
  "Role & Access Management":        { href: "/webpage/hr/role-access",           icon: <Lock size={16} /> },
  "Data Import / Export":            { href: "/webpage/hr/data-import-export",    icon: <Upload size={16} /> },
  "System Settings":                 { href: "/webpage/hr/system-settings",       icon: <Settings size={16} /> },
  // HR Reviewer (menu_id 32–35+)
  "Final Rating Approvals":         { href: "/webpage/reviewer/rating-approvals",    icon: <CheckCircle size={16} /> },
  "Compensation Approval":          { href: "/webpage/reviewer/compensation",        icon: <DollarSign size={16} /> },
  "Promotion Approval":             { href: "/webpage/reviewer/promotion",           icon: <Medal size={16} /> },
  "Department Performance Summary": { href: "/webpage/reviewer/dept-summary",        icon: <BarChart2 size={16} /> },
  "Rating Distribution View":       { href: "/webpage/reviewer/rating-distribution", icon: <TrendingUp size={16} /> },
  "Workforce Performance Insights": { href: "/webpage/reviewer/insights",            icon: <Search size={16} /> },
  // Super Admin
  "User Management":        { href: "/webpage/admin/user-management", icon: <Users size={16} /> },
  "Role Configuration":     { href: "/webpage/admin/role-config",     icon: <KeyRound size={16} /> },
  "System Configuration":   { href: "/webpage/admin/system-config",   icon: <Settings size={16} /> },
  "Audit Logs":             { href: "/webpage/admin/audit-logs",      icon: <ScrollText size={16} /> },
  "Workflow Configuration": { href: "/webpage/admin/workflow-config",  icon: <Workflow size={16} /> },
  "Integration Settings":   { href: "/webpage/admin/integration",     icon: <Plug size={16} /> },
  "Security Settings":      { href: "/webpage/admin/security",        icon: <Shield size={16} /> },
  "Backup & Recovery":      { href: "/webpage/admin/backup",          icon: <HardDrive size={16} /> },
};

/* ─── role colours ─── */
const ROLE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Employee:       { bg: "#dcfce7", text: "#16a34a", border: "#86efac" },
  Manager:        { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  "HR Admin":     { bg: "#fce7f3", text: "#be185d", border: "#f9a8d4" },
  "HR Reviewer":  { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  "Super Admin":  { bg: "#fae8ff", text: "#7c3aed", border: "#d8b4fe" },
};

/* ─── types ─── */
type Role = { role_id: number; role_name: string; description: string };
type Menu = { menu_id: number; menu_name: string; menu_order: number };

/* ─── helpers ─── */
function getInitials(name: string) {
  return name
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/* ════════════════════════════════════════════════════════════ */

export default function WebpageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoles, setShowRoles] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  /* ── fetch user on mount ── */
  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.username) setUsername(d.username);
        if (d.email) setEmail(d.email);
        if (d.roles?.length) {
          setRoles(d.roles);
          const emp = d.roles.find((r: Role) => r.role_name === "Employee");
          setActiveRole(emp || d.roles[0]);
        }
      })
      .catch((e) => console.error("Failed to load user:", e))
      .finally(() => setLoading(false));
  }, []);

  /* ── fetch menus when role changes ── */
  useEffect(() => {
    if (!activeRole) return;
    fetch(`/api/user/menus?roleId=${activeRole.role_id}`)
      .then((r) => r.json())
      .then((d) => { if (d.menus) setMenus(d.menus); })
      .catch((e) => console.error("Failed to load menus:", e));
  }, [activeRole]);

  /* ── close dropdown on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowRoles(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const rc = activeRole ? (ROLE_STYLE[activeRole.role_name] ?? ROLE_STYLE.Employee) : ROLE_STYLE.Employee;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f7ff" }}>

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside
        style={{
          width: collapsed ? 68 : 260,
          background: "linear-gradient(180deg,#1e1b4b 0%,#312e81 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          transition: "width .25s ease",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {/* ── App title ── */}
        <div style={{ padding: collapsed ? "20px 16px" : "20px 18px", borderBottom: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
            A
          </div>
          {!collapsed && (
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".02em" }}>Appraisal</p>
              <p style={{ fontSize: 10, opacity: .6 }}>Performance System</p>
            </div>
          )}
        </div>

        {/* ── User info + Role switcher ── */}
        <div style={{ padding: collapsed ? "14px 10px" : "14px 18px", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
          {/* avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: collapsed ? 0 : 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
              {loading ? "…" : getInitials(username || "U")}
            </div>
            {!collapsed && (
              <div style={{ overflow: "hidden" }}>
                <p style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {loading ? "Loading…" : username || "User"}
                </p>
                <p style={{ fontSize: 10, opacity: .6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {email}
                </p>
              </div>
            )}
          </div>

          {/* role switcher */}
          {!collapsed && activeRole && (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowRoles(!showRoles)}
                style={{
                  width: "100%",
                  background: rc.bg,
                  color: rc.text,
                  border: `1px solid ${rc.border}`,
                  borderRadius: 8,
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{activeRole.role_name}</span>
                <span style={{ fontSize: 10 }}>{showRoles ? "▴" : "▾"}</span>
              </button>

              {showRoles && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,.25)", zIndex: 60, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid #f3f4f6" }}>
                    Switch Role
                  </div>
                  {roles.map((r) => {
                    const s = ROLE_STYLE[r.role_name] ?? ROLE_STYLE.Employee;
                    const active = activeRole.role_id === r.role_id;
                    return (
                      <button
                        key={r.role_id}
                        onClick={() => { setActiveRole(r); setShowRoles(false); }}
                        style={{
                          width: "100%",
                          background: active ? s.bg : "#fff",
                          border: "none",
                          borderBottom: "1px solid #f3f4f6",
                          padding: "10px 12px",
                          fontSize: 12,
                          fontWeight: active ? 700 : 500,
                          color: active ? s.text : "#374151",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? s.text : "#d1d5db", flexShrink: 0 }} />
                        <div>
                          <p style={{ margin: 0 }}>{r.role_name}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>{r.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Menu items ── */}
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {menus.map((m) => {
            const mapped = MENU_MAP[m.menu_name];
            const href = mapped?.href ?? "#";
            const icon = mapped?.icon ?? <Pin size={16} />;
            const isActive = pathname === href || (href !== "/webpage/dashboard" && pathname.startsWith(href + "/"));

            if (!mapped) {
              return (
                <div
                  key={m.menu_id}
                  title={m.menu_name}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, marginBottom: 2, fontSize: 13, color: "rgba(255,255,255,.4)", cursor: "not-allowed" }}
                >
                  <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>
                  {!collapsed && <span>{m.menu_name}</span>}
                </div>
              );
            }

            return (
              <Link key={m.menu_id} href={href} style={{ textDecoration: "none" }}>
                <div
                  title={m.menu_name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 8,
                    marginBottom: 2,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#fff" : "rgba(255,255,255,.7)",
                    background: isActive ? "rgba(124,58,237,.3)" : "transparent",
                    transition: "all .15s",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>
                  {!collapsed && <span>{m.menu_name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* ── Logout + Collapse ── */}
        <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,.1)", display: "flex", flexDirection: "column", gap: 4 }}>
          <Link href="/api/auth/logout" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.6)", cursor: "pointer", transition: "all .15s" }}>
              <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}><LogOut size={16} /></span>
              {!collapsed && <span>Logout</span>}
            </div>
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ width: "100%", background: "rgba(255,255,255,.08)", border: "none", borderRadius: 8, padding: 8, color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}