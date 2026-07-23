// app/webpage/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart2,
  Bell,
  BellRing,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FileStack,
  FileText,
  GraduationCap,
  HardDrive,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Link2,
  Lock,
  LogOut,
  Menu,
  Medal,
  MessageSquare,
  PieChart,
  Pin,
  Plug,
  Radio,
  RefreshCw,
  Scale,
  ScrollText,
  Search,
  Settings,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  User,
  Users,
  Workflow,
} from "lucide-react";

const ICON_SIZE = 18;

const MENU_MAP: Record<string, { href: string; icon: React.ReactNode }> = {
  Dashboard: { href: "/webpage/dashboard", icon: <LayoutDashboard size={ICON_SIZE} /> },
  "My Goals": { href: "/webpage/employee/goals", icon: <Target size={ICON_SIZE} /> },
  "Self Assessment": {
    href: "/webpage/employee/self-assessment",
    icon: <ClipboardList size={ICON_SIZE} />,
  },
  "Competency Assessment": {
    href: "/webpage/employee/competency",
    icon: <Star size={ICON_SIZE} />,
  },
  "Development Plan": {
    href: "/webpage/employee/development-plan",
    icon: <TrendingUp size={ICON_SIZE} />,
  },
  "Feedback & Results": {
    href: "/webpage/employee/feedback",
    icon: <MessageSquare size={ICON_SIZE} />,
  },
  "My Profile": { href: "/webpage/profile", icon: <User size={ICON_SIZE} /> },
  Notifications: { href: "/webpage/notifications", icon: <Bell size={ICON_SIZE} /> },
  Help: { href: "/webpage/help", icon: <HelpCircle size={ICON_SIZE} /> },
  "Team Goals Approval": {
    href: "/webpage/manager/team-goals",
    icon: <CheckSquare size={ICON_SIZE} />,
  },
  "Team Assessments": {
    href: "/webpage/manager/team-assessments",
    icon: <ClipboardCheck size={ICON_SIZE} />,
  },
  "Competency Ratings": {
    href: "/webpage/manager/competency-ratings",
    icon: <Star size={ICON_SIZE} />,
  },
  "Development Plans (Team)": {
    href: "/webpage/manager/development-plans",
    icon: <TrendingUp size={ICON_SIZE} />,
  },
  "Final Recommendations": {
    href: "/webpage/manager/recommendations",
    icon: <Trophy size={ICON_SIZE} />,
  },
  "Team Performance Summary": {
    href: "/webpage/manager/team-summary",
    icon: <BarChart2 size={ICON_SIZE} />,
  },
  "Notifications / Tasks": {
    href: "/webpage/notifications",
    icon: <Bell size={ICON_SIZE} />,
  },
  "Reports (Team-level)": {
    href: "/webpage/manager/reports",
    icon: <FileText size={ICON_SIZE} />,
  },
  "Help / Support": { href: "/webpage/help", icon: <HelpCircle size={ICON_SIZE} /> },
  "Appraisal Cycle Management": {
    href: "/webpage/hr/cycle-management",
    icon: <RefreshCw size={ICON_SIZE} />,
  },
  "Employee & Manager Mapping": {
    href: "/webpage/hr/employee-mapping",
    icon: <Link2 size={ICON_SIZE} />,
  },
  "Workflow Monitoring": {
    href: "/webpage/hr/workflow-monitoring",
    icon: <Radio size={ICON_SIZE} />,
  },
  Calibration: { href: "/webpage/hr/calibration", icon: <Scale size={ICON_SIZE} /> },
  "Compensation Review": {
    href: "/webpage/hr/compensation-review",
    icon: <DollarSign size={ICON_SIZE} />,
  },
  "Approval Management": {
    href: "/webpage/hr/approval-management",
    icon: <CheckCircle size={ICON_SIZE} />,
  },
  "Development Program Management": {
    href: "/webpage/hr/development-programs",
    icon: <GraduationCap size={ICON_SIZE} />,
  },
  "Reports & Analytics": { href: "/webpage/hr/reports", icon: <PieChart size={ICON_SIZE} /> },
  "Templates & Forms Configuration": {
    href: "/webpage/hr/templates",
    icon: <FileStack size={ICON_SIZE} />,
  },
  "Rating Scale Configuration": {
    href: "/webpage/hr/rating-config",
    icon: <Settings size={ICON_SIZE} />,
  },
  "Notification Configuration": {
    href: "/webpage/hr/notification-config",
    icon: <Bell size={ICON_SIZE} />,
  },
  "Role & Access Management": {
    href: "/webpage/hr/role-access",
    icon: <Lock size={ICON_SIZE} />,
  },
  "Data Import / Export": {
    href: "/webpage/hr/data-import-export",
    icon: <Upload size={ICON_SIZE} />,
  },
  "System Settings": { href: "/webpage/hr/system-settings", icon: <Settings size={ICON_SIZE} /> },
  "Final Rating Approvals": {
    href: "/webpage/reviewer/rating-approvals",
    icon: <CheckCircle size={ICON_SIZE} />,
  },
  "Compensation Approval": {
    href: "/webpage/reviewer/compensation",
    icon: <DollarSign size={ICON_SIZE} />,
  },
  "Promotion Approval": {
    href: "/webpage/reviewer/promotion",
    icon: <Medal size={ICON_SIZE} />,
  },
  "Department Performance Summary": {
    href: "/webpage/reviewer/dept-summary",
    icon: <BarChart2 size={ICON_SIZE} />,
  },
  "Rating Distribution View": {
    href: "/webpage/reviewer/rating-distribution",
    icon: <TrendingUp size={ICON_SIZE} />,
  },
  "Workforce Performance Insights": {
    href: "/webpage/reviewer/insights",
    icon: <Search size={ICON_SIZE} />,
  },
  "User Management": { href: "/webpage/admin/user-management", icon: <Users size={ICON_SIZE} /> },
  "Role Configuration": { href: "/webpage/admin/role-config", icon: <KeyRound size={ICON_SIZE} /> },
  "System Configuration": {
    href: "/webpage/admin/system-config",
    icon: <Settings size={ICON_SIZE} />,
  },
  "Audit Logs": { href: "/webpage/admin/audit-logs", icon: <ScrollText size={ICON_SIZE} /> },
  "Workflow Configuration": {
    href: "/webpage/admin/workflow-config",
    icon: <Workflow size={ICON_SIZE} />,
  },
  "Integration Settings": { href: "/webpage/admin/integration", icon: <Plug size={ICON_SIZE} /> },
  "Security Settings": { href: "/webpage/admin/security", icon: <Shield size={ICON_SIZE} /> },
  "Backup & Recovery": { href: "/webpage/admin/backup", icon: <HardDrive size={ICON_SIZE} /> },
};

const ROLE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Employee: { bg: "#eef6ff", text: "#1f3a68", border: "#dbe5f3" },
  Manager: { bg: "#eef6ff", text: "#1f3a68", border: "#dbe5f3" },
  "HR Admin": { bg: "#fff3ec", text: "#f26522", border: "#ffd7c2" },
  "HR Reviewer": { bg: "#fff8eb", text: "#d97706", border: "#fde3b3" },
  "Super Admin": { bg: "#f1f5f9", text: "#334155", border: "#d7dde5" },
};

type Role = { role_id: number; role_name: string; description: string };
type Menu = { menu_id: number; menu_name: string; menu_order: number };
type NavNode = {
  key: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
};

const ASSESSMENT_SOURCE_MENUS = new Set([
  "Self Assessment",
  "Competency Assessment",
  "Team Assessments",
  "Competency Ratings",
]);

const SIDEBAR_HIDDEN_MENUS = new Set([
  "Notifications",
  "Notifications / Tasks",
]);

function getInitials(name: string) {
  return name
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

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
  const [currentCycle, setCurrentCycle] = useState("Current Cycle");

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

  useEffect(() => {
    if (!activeRole) return;
    sessionStorage.setItem("activeRole", activeRole.role_name);
  }, [activeRole]);

  useEffect(() => {
    if (!activeRole) return;
    fetch(`/api/user/menus?roleId=${activeRole.role_id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.menus) setMenus(d.menus);
      })
      .catch((e) => console.error("Failed to load menus:", e));
  }, [activeRole]);

  useEffect(() => {
    if (!activeRole) return;
    const dashboardApi = activeRole.role_name === "Manager" ? "/api/manager/dashboard" : "/api/employee/dashboard";
    fetch(dashboardApi)
      .then((r) => r.json())
      .then((d) => {
        if (d?.cycle?.name) setCurrentCycle(d.cycle.name);
      })
      .catch(() => setCurrentCycle("Current Cycle"));
  }, [activeRole]);

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

  const hasEmployeeAssessment =
    activeRole?.role_name === "Employee" &&
    (menus.some((m) => m.menu_name === "Self Assessment") || menus.some((m) => m.menu_name === "Competency Assessment"));

  const hasManagerAssessment =
    activeRole?.role_name === "Manager" &&
    (menus.some((m) => m.menu_name === "Team Assessments") || menus.some((m) => m.menu_name === "Competency Ratings"));

  let navNodes: NavNode[] = [];
  menus.forEach((m) => {
    if (ASSESSMENT_SOURCE_MENUS.has(m.menu_name)) return;
    if (SIDEBAR_HIDDEN_MENUS.has(m.menu_name)) return;
    const mapped = MENU_MAP[m.menu_name];
    navNodes.push({
      key: `menu-${m.menu_id}`,
      label: m.menu_name,
      href: mapped?.href,
      icon: mapped?.icon ?? <Pin size={ICON_SIZE} />,
    });
  });

  const dashboardIndex = navNodes.findIndex((n) => n.label === "Dashboard");
  const assessmentNode: NavNode | null = hasEmployeeAssessment || hasManagerAssessment
    ? {
        key: "menu-assessment",
        label: "Assessment",
        icon: <ClipboardCheck size={ICON_SIZE} />,
        href: "/webpage/assessment",
      }
    : null;

  if (assessmentNode) {
    if (dashboardIndex >= 0) {
      navNodes.splice(dashboardIndex + 1, 0, assessmentNode);
    } else {
      navNodes.unshift(assessmentNode);
    }
  }

  if (activeRole?.role_name === "Employee") {
    const pick = (predicate: (n: NavNode) => boolean) => {
      const index = navNodes.findIndex(predicate);
      if (index < 0) return null;
      const [node] = navNodes.splice(index, 1);
      return node;
    };

    const dashboardNode = pick((n) => n.label === "Dashboard");
    const myGoalsNode = pick((n) => n.label === "My Goals");
    const assessmentSection = pick((n) => n.key === "menu-assessment");

    navNodes = [
      ...(dashboardNode ? [dashboardNode] : []),
      ...(myGoalsNode ? [myGoalsNode] : []),
      ...(assessmentSection ? [assessmentSection] : []),
      ...navNodes,
    ];
  }

  return (
    <div className="app-shell" style={{ display: "flex", background: "#f3f6fb", height: "100vh", overflow: "hidden" }}>
      <aside
        style={{
          width: collapsed ? 84 : 300,
          background: "#ffffff",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          transition: "width var(--duration-medium) var(--ease-enterprise)",
          overflow: "hidden",
          minHeight: "100vh",
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        <div
          style={{
            padding: collapsed ? "16px 12px" : "16px 16px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              minWidth: 32,
              minHeight: 32,
              border: "none",
              borderRadius: 8,
              background: "transparent",
              color: "var(--color-navy-700)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Menu size={20} />
          </button>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(135deg, var(--color-navy-700), #24457d)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            AA
          </div>
          {!collapsed && (
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-text-heading)" }}>AASA</p>
              <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>Performance Management</p>
            </div>
          )}
        </div>

        <div style={{ padding: collapsed ? "14px 12px" : "16px 18px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: collapsed ? 0 : 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#e7eef9",
                color: "var(--color-navy-700)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {loading ? "…" : getInitials(username || "U")}
            </div>
            {!collapsed && (
              <div style={{ overflow: "hidden" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-text-heading)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {loading ? "Loading…" : username || "User"}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: "var(--color-text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {email}
                </p>
              </div>
            )}
          </div>

          {!collapsed && activeRole && (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowRoles(!showRoles)}
                style={{
                  width: "100%",
                  background: rc.bg,
                  color: rc.text,
                  border: `1px solid ${rc.border}`,
                  borderRadius: 10,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{activeRole.role_name}</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: showRoles ? "rotate(180deg)" : "none",
                    transition: "transform var(--duration-fast) var(--ease-enterprise)",
                  }}
                />
              </button>

              {showRoles && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-soft)",
                    zIndex: 60,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 12px",
                      fontSize: 10,
                      color: "var(--color-text-muted)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    Switch Role
                  </div>
                  {roles.map((r) => {
                    const s = ROLE_STYLE[r.role_name] ?? ROLE_STYLE.Employee;
                    const active = activeRole.role_id === r.role_id;
                    return (
                      <button
                        key={r.role_id}
                        onClick={() => {
                          setActiveRole(r);
                          setShowRoles(false);
                        }}
                        style={{
                          width: "100%",
                          background: active ? s.bg : "#fff",
                          border: "none",
                          borderBottom: "1px solid var(--color-border)",
                          padding: "10px 12px",
                          fontSize: 12,
                          fontWeight: active ? 700 : 500,
                          color: active ? s.text : "var(--color-text-body)",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: active ? s.text : "#cbd5e1",
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <p style={{ margin: 0 }}>{r.role_name}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-muted)", fontWeight: 400 }}>
                            {r.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {navNodes.map((node) => {
            const href = node.href ?? "#";
            const isActive = pathname === href || (href !== "/webpage/dashboard" && pathname.startsWith(href + "/"));
            const clickable = !!node.href;

            if (!clickable) {
              return (
                <div
                  key={node.key}
                  title={node.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    marginBottom: 4,
                    fontSize: 13,
                    color: "#94a3b8",
                    cursor: "not-allowed",
                  }}
                >
                  <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{node.icon}</span>
                  {!collapsed && <span>{node.label}</span>}
                </div>
              );
            }

            return (
              <Link key={node.key} href={href} style={{ textDecoration: "none" }}>
                <div
                  title={node.label}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px 10px 14px",
                    borderRadius: 12,
                    marginBottom: 4,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "var(--color-text-heading)" : "var(--color-text-body)",
                    background: isActive ? "rgba(242,101,34,0.14)" : "transparent",
                    border: isActive ? "1px solid rgba(242,101,34,0.32)" : "1px solid transparent",
                    transition: "all var(--duration-fast) var(--ease-enterprise)",
                    cursor: "pointer",
                  }}
                >
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 7,
                        bottom: 7,
                        width: 3,
                        borderRadius: 3,
                        background: "var(--color-orange-500)",
                      }}
                    />
                  )}
                  <span
                    style={{
                      width: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: isActive ? "var(--color-orange-500)" : "var(--color-navy-700)",
                    }}
                  >
                    {node.icon}
                  </span>
                  {!collapsed && <span>{node.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

      </aside>

      <main style={{ flex: 1, minWidth: 0, height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <header
          style={{
            height: 76,
            background: "#f9fbff",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            position: "sticky",
            top: 0,
            zIndex: 40,
            flexShrink: 0,
          }}
        >
          <div />

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                minHeight: 40,
                borderRadius: 10,
                border: "1px solid var(--color-border)",
                padding: "0 12px",
                display: "inline-flex",
                alignItems: "center",
                color: "var(--color-text-body)",
                fontSize: 12,
                background: "#ffffff",
              }}
            >
              {currentCycle}
              <ChevronDown size={14} style={{ marginLeft: 10 }} />
            </div>

            <label style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <Search size={16} style={{ position: "absolute", left: 10, color: "#94a3b8" }} />
              <input
                type="search"
                placeholder="Search"
                style={{
                  width: 220,
                  minHeight: 40,
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  padding: "0 12px 0 32px",
                  fontSize: 13,
                  color: "var(--color-text-body)",
                  outline: "none",
                }}
              />
            </label>

            <Link href="/webpage/notifications" style={{ textDecoration: "none" }}>
              <div
                aria-label="Notifications"
                style={{
                  minHeight: 40,
                  minWidth: 40,
                  borderRadius: 10,
                  border: "1px solid var(--color-border)",
                  background: "#fff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BellRing size={18} color="var(--color-navy-700)" />
              </div>
            </Link>

            <Link href="/api/auth/logout" style={{ textDecoration: "none" }}>
              <div
                style={{
                  minHeight: 40,
                  borderRadius: 10,
                  border: "1px solid #fdba74",
                  color: "#f26522",
                  background: "#fff",
                  padding: "0 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <LogOut size={16} />
                Logout
              </div>
            </Link>
          </div>
        </header>

        <section style={{ padding: "20px 22px 24px", overflowY: "auto", flex: 1, minHeight: 0 }}>{children}</section>
      </main>
    </div>
  );
}
