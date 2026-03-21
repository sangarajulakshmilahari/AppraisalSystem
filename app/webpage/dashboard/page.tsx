// app/webpage/dashboard/page.tsx
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const PHASE_LABELS: Record<string, string> = {
  goal_setting: "Goal Setting",
  self_assessment: "Self Assessment",
  competency_assessment: "Competency",
  manager_review: "Manager Review",
  hr_review: "HR Review",
  completed: "Completed",
};

// Role detection: sidebar stores activeRole in sessionStorage

export default function DashboardPage() {
  const [activeRole, setActiveRole] = useState<string>("Employee");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Detect role from sessionStorage (set by sidebar layout)
  useEffect(() => {
    const role = sessionStorage.getItem("activeRole") || "Employee";
    setActiveRole(role);

    const apiUrl = role === "Manager"
      ? "/api/manager/dashboard"
      : "/api/employee/dashboard";

    fetch(apiUrl)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => console.error("Dashboard error:", e))
      .finally(() => setLoading(false));
  }, []);

  // Listen for role changes via storage event
  useEffect(() => {
    const handleStorage = () => {
      const role = sessionStorage.getItem("activeRole") || "Employee";
      if (role !== activeRole) {
        setActiveRole(role);
        setLoading(true);
        const apiUrl = role === "Manager" ? "/api/manager/dashboard" : "/api/employee/dashboard";
        fetch(apiUrl)
          .then((r) => r.json())
          .then((d) => setData(d))
          .finally(() => setLoading(false));
      }
    };
    window.addEventListener("storage", handleStorage);
    // Also poll sessionStorage for same-tab changes
    const interval = setInterval(() => {
      const role = sessionStorage.getItem("activeRole") || "Employee";
      if (role !== activeRole) handleStorage();
    }, 500);
    return () => { window.removeEventListener("storage", handleStorage); clearInterval(interval); };
  }, [activeRole]);

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#9ca3af" }}>Loading dashboard...</div>;
  }

  if (activeRole === "Manager") {
    return <ManagerDashboard data={data} />;
  }

  return <EmployeeDashboard data={data} />;
}

// ═══════════════════════════════════════
// EMPLOYEE DASHBOARD
// ═══════════════════════════════════════
function EmployeeDashboard({ data }: { data: any }) {
  if (!data || data.hasCycle === false) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>📋</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1f2937", marginBottom: 8 }}>No Active Appraisal Cycle</h2>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>There is no appraisal cycle active at the moment.</p>
      </div>
    );
  }

  const { cycle, progress, phases, stats, pendingActions } = data;
  const currentPhaseLabel = PHASE_LABELS[cycle?.currentPhase] || cycle?.currentPhase || "—";

  const quickLinks = [
    { href: "/webpage/employee/goals",            label: "My Goals",         desc: "View & manage performance goals",    icon: "🎯", color: "#7c3aed" },
    { href: "/webpage/employee/self-assessment",   label: "Self Assessment",  desc: "Submit your performance evaluation", icon: "📝", color: "#4f46e5" },
    { href: "/webpage/employee/competency",        label: "Competency",       desc: "Rate your competencies (1–5)",      icon: "⭐", color: "#0891b2" },
    { href: "/webpage/employee/development-plan",  label: "Development Plan", desc: "Track learning & growth actions",   icon: "📈", color: "#059669" },
  ];

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Cycle Banner */}
      <div style={{ background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 50%,#0891b2 100%)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 30px rgba(124,58,237,0.3)" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Active Appraisal Cycle</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{cycle?.name}</h2>
          <p style={{ opacity: 0.85, fontSize: 14 }}>{cycle?.periodStart} – {cycle?.periodEnd} &nbsp;·&nbsp; Current Phase: <strong>{currentPhaseLabel}</strong></p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "10px 20px" }}>
            <p style={{ fontSize: 28, fontWeight: 800 }}>{progress}%</p>
            <p style={{ fontSize: 12, opacity: 0.85 }}>Completed</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {stats?.map((s: any) => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1px solid #ede9fe" }}>
            <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginBottom: 20 }}>
        {/* Phase Progress */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #ede9fe" }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 20 }}>Appraisal Progress</h3>
          <div style={{ display: "flex", alignItems: "center" }}>
            {phases?.map((p: any, i: number) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, marginBottom: 8, background: p.status === "done" ? "#7c3aed" : p.status === "current" ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#f3f4f6", color: p.status !== "upcoming" ? "#fff" : "#9ca3af", border: p.status === "current" ? "3px solid #c4b5fd" : "none" }}>
                    {p.status === "done" ? "✓" : i + 1}
                  </div>
                  <p style={{ fontSize: 10, color: p.status === "current" ? "#7c3aed" : p.status === "done" ? "#10b981" : "#9ca3af", fontWeight: p.status === "current" ? 700 : 500, textAlign: "center" }}>{p.name}</p>
                </div>
                {i < (phases?.length || 0) - 1 && <div style={{ height: 2, flex: 0.3, background: p.status === "done" ? "#7c3aed" : "#e5e7eb", marginBottom: 22 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #ede9fe" }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 16 }}>Pending Actions</h3>
          {(!pendingActions || pendingActions.length === 0) ? (
            <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>🎉 No pending actions</div>
          ) : pendingActions.map((a: any) => (
            <Link key={a.id} href={a.href} style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 10, padding: "12px 14px", borderRadius: 10, background: a.urgent ? "#fefce8" : "#fafaf9", border: `1px solid ${a.urgent ? "#fef08a" : "#e5e7eb"}`, cursor: "pointer" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.urgent ? "#f59e0b" : "#9ca3af", marginTop: 5, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1f2937", marginBottom: 2 }}>{a.title}</p>
                  <p style={{ fontSize: 11, color: a.urgent ? "#d97706" : "#9ca3af" }}>Due: {a.due}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #ede9fe" }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 16 }}>Quick Access</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {quickLinks.map((q) => (
            <Link key={q.href} href={q.href} style={{ textDecoration: "none" }}>
              <div style={{ padding: "18px", borderRadius: 12, border: "1px solid #ede9fe", background: "#faf8ff" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{q.icon}</div>
                <p style={{ fontWeight: 700, fontSize: 13, color: q.color, marginBottom: 4 }}>{q.label}</p>
                <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.4 }}>{q.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MANAGER DASHBOARD
// ═══════════════════════════════════════
function ManagerDashboard({ data }: { data: any }) {
  if (!data || data.hasTeam === false) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>👥</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1f2937", marginBottom: 8 }}>No Team Members Assigned</h2>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>{data?.message || "You don't have any team members for the active cycle."}</p>
      </div>
    );
  }

  const { cycle, stats, members, pendingActions } = data;

  const quickLinks = [
    { href: "/webpage/manager/team-goals",         label: "Team Goals",       desc: "Approve team member goals",           icon: "✅", color: "#10b981" },
    { href: "/webpage/manager/team-assessments",    label: "Team Assessments", desc: "Review self-assessments & rate",      icon: "📋", color: "#4f46e5" },
    { href: "/webpage/manager/competency-ratings",  label: "Competency Ratings", desc: "Rate team competencies",           icon: "⭐", color: "#0891b2" },
    { href: "/webpage/manager/team-summary",        label: "Team Summary",     desc: "View team performance overview",      icon: "📊", color: "#7c3aed" },
  ];

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#4f46e5 50%,#0891b2 100%)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 30px rgba(79,70,229,0.3)" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Manager Dashboard</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{cycle?.name}</h2>
          <p style={{ opacity: 0.85, fontSize: 14 }}>{cycle?.periodStart} – {cycle?.periodEnd} &nbsp;·&nbsp; {members?.length} team member{members?.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "10px 20px" }}>
            <p style={{ fontSize: 28, fontWeight: 800 }}>👥 {members?.length}</p>
            <p style={{ fontSize: 12, opacity: 0.85 }}>Team Members</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {stats?.map((s: any) => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1px solid #ede9fe" }}>
            <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginBottom: 20 }}>
        {/* Team Members */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #ede9fe" }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 16 }}>Team Members</h3>
          {members?.map((m: any) => (
            <div key={m.appraisalId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, marginBottom: 8, border: "1px solid #f3f0ff", background: "#faf8ff" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${m.phaseColor},#4f46e5)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {m.employeeName?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{m.employeeName}</p>
                <p style={{ fontSize: 11, color: "#9ca3af" }}>{m.goalCount} goals</p>
              </div>
              <span style={{ background: m.phaseColor + "18", color: m.phaseColor, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>
                {m.phaseLabel}
              </span>
              {m.reviewCompleted && m.overallRating && (
                <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
                  {Number(m.overallRating).toFixed(1)} ★
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Pending Actions */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #ede9fe" }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 16 }}>Pending Actions</h3>
          {(!pendingActions || pendingActions.length === 0) ? (
            <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              All caught up — no pending actions
            </div>
          ) : pendingActions.map((a: any) => (
            <Link key={a.id} href={a.href} style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 10, padding: "12px 14px", borderRadius: 10, background: a.urgent ? "#fefce8" : "#fafaf9", border: `1px solid ${a.urgent ? "#fef08a" : "#e5e7eb"}`, cursor: "pointer" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.urgent ? "#f59e0b" : "#9ca3af", marginTop: 5, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1f2937", marginBottom: 2 }}>{a.title}</p>
                  <p style={{ fontSize: 11, color: a.urgent ? "#d97706" : "#9ca3af" }}>{a.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #ede9fe" }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 16 }}>Quick Access</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {quickLinks.map((q) => (
            <Link key={q.href} href={q.href} style={{ textDecoration: "none" }}>
              <div style={{ padding: "18px", borderRadius: 12, border: "1px solid #ede9fe", background: "#faf8ff" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{q.icon}</div>
                <p style={{ fontWeight: 700, fontSize: 13, color: q.color, marginBottom: 4 }}>{q.label}</p>
                <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.4 }}>{q.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}