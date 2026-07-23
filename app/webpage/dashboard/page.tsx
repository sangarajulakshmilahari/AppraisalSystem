// app/webpage/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  Gauge,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const PHASE_LABELS: Record<string, string> = {
  goal_setting: "Goal Setting",
  self_assessment: "Self Assessment",
  competency_assessment: "Competency",
  manager_review: "Manager Review",
  hr_review: "HR Review",
  completed: "Completed",
};

type PhaseStatus = "done" | "current" | "upcoming";

type DashboardPhase = {
  name: string;
  status: PhaseStatus;
};

type DashboardStat = {
  label: string;
  value: string | number;
};

type PendingAction = {
  id: string | number;
  href: string;
  title: string;
  due?: string;
  desc?: string;
  urgent?: boolean;
};

type EmployeeDashboardData = {
  hasCycle?: boolean;
  cycle?: {
    name?: string;
    periodStart?: string;
    periodEnd?: string;
    currentPhase?: string;
  };
  progress?: number;
  phases?: DashboardPhase[];
  stats?: DashboardStat[];
  pendingActions?: PendingAction[];
};

type ManagerMember = {
  appraisalId: string | number;
  employeeName: string;
  goalCount: number;
  phaseLabel: string;
  reviewCompleted?: boolean;
  overallRating?: string | number | null;
};

type ManagerDashboardData = {
  hasTeam?: boolean;
  message?: string;
  cycle?: {
    name?: string;
    periodStart?: string;
    periodEnd?: string;
  };
  stats?: DashboardStat[];
  members?: ManagerMember[];
  pendingActions?: PendingAction[];
};

const shell: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 18 },
  hero: {
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
    padding: 20,
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 14,
    alignItems: "center",
  },
  title: { margin: 0, fontSize: 28, color: "var(--color-text-heading)", letterSpacing: "-0.02em" },
  subtitle: { margin: "6px 0 0", color: "#64748b", fontSize: 13 },
  progressBadge: {
    minWidth: 168,
    minHeight: 112,
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    padding: 12,
  },
  stats: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 },
  card: {
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    background: "#fff",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
    padding: 16,
  },
  cardTitle: { margin: 0, fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", letterSpacing: ".04em" },
  cardValue: { margin: "8px 0 0", fontSize: 28, fontWeight: 800, color: "var(--color-text-heading)", letterSpacing: "-0.02em" },
  sectionGrid: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 14 },
  sectionTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "var(--color-text-heading)", letterSpacing: "-0.02em" },
  quickGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 },
};

type DashboardData = EmployeeDashboardData | ManagerDashboardData;

export default function DashboardPage() {
  const [activeRole, setActiveRole] = useState<string>(() => {
    if (typeof window === "undefined") return "Employee";
    return sessionStorage.getItem("activeRole") || "Employee";
  });
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = activeRole === "Manager" ? "/api/manager/dashboard" : "/api/employee/dashboard";
    fetch(apiUrl)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => console.error("Dashboard error:", e))
      .finally(() => setLoading(false));
  }, [activeRole]);

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
    const interval = setInterval(() => {
      const role = sessionStorage.getItem("activeRole") || "Employee";
      if (role !== activeRole) handleStorage();
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [activeRole]);

  if (loading) {
    return (
      <div style={{ ...shell.card, display: "grid", placeItems: "center", minHeight: 220, color: "var(--color-text-muted)" }}>
        Loading dashboard...
      </div>
    );
  }

  if (activeRole === "Manager") return <ManagerDashboard data={(data as ManagerDashboardData) ?? {}} />;
  return <EmployeeDashboard data={(data as EmployeeDashboardData) ?? {}} />;
}

function Hero({
  greeting,
  eyebrow,
  title,
  subtitle,
  progress,
}: {
  greeting: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  progress: number;
}) {
  const safeProgress = Math.max(0, Math.min(100, progress || 0));
  return (
    <div style={shell.hero}>
      <div>
        <p style={{ margin: 0, fontSize: 13, color: "#475569", fontWeight: 600 }}>{greeting}</p>
        <h1 className="font-display" style={shell.title}>{title}</h1>
        <p style={{ ...shell.subtitle, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <CalendarDays size={14} /> {subtitle}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--color-orange-500)", fontWeight: 700 }}>{eyebrow}</p>
      </div>
      <div style={shell.progressBadge}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: "50%",
              background: `conic-gradient(var(--color-orange-500) ${safeProgress * 3.6}deg, #f2f2f2 ${safeProgress * 3.6}deg)`,
              display: "grid",
              placeItems: "center",
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)" }}>Overall Progress</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: "var(--color-orange-500)", lineHeight: 1 }}>{safeProgress}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getEmployeeStatVisual(label: string) {
  const l = label.toLowerCase();
  if (l.includes("goal")) return { icon: <Target size={18} />, cta: "View goals" };
  if (l.includes("self")) return { icon: <ClipboardList size={18} />, cta: "Start now" };
  if (l.includes("compet")) return { icon: <Star size={18} />, cta: "Start now" };
  if (l.includes("overall") || l.includes("progress")) return { icon: <TrendingUp size={18} />, cta: "View details" };
  return { icon: <Gauge size={18} />, cta: "Open" };
}

function Stepper({ phases }: { phases: DashboardPhase[] }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginTop: 12 }}>
      {phases?.map((p, i: number) => {
        const done = p.status === "done";
        const current = p.status === "current";
        return (
          <div key={p.name} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "grid", justifyItems: "center", gap: 8, width: "100%" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: current ? "2px solid #ffd7c2" : "1px solid var(--color-border)",
                  background: done ? "#16a34a" : current ? "var(--color-orange-500)" : "#fff",
                  color: done || current ? "#fff" : "#94a3b8",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                {done ? <Check size={16} /> : i + 1}
              </div>
              <span style={{ fontSize: 11, color: current ? "var(--color-orange-500)" : done ? "#16a34a" : "var(--color-text-muted)", textAlign: "center", fontWeight: current ? 700 : 500 }}>
                {p.name}
              </span>
            </div>
            {i < (phases?.length || 0) - 1 && (
              <div
                style={{
                  height: 2,
                  width: "100%",
                  marginBottom: 28,
                  background: done ? "#16a34a" : "#d1d5db",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PendingActions({ pendingActions, dueLabel = "Due" }: { pendingActions: PendingAction[]; dueLabel?: string }) {
  if (!pendingActions || pendingActions.length === 0) {
    return <div style={{ ...shell.card, color: "var(--color-text-muted)", textAlign: "center" }}>No pending actions</div>;
  }

  return (
    <div style={{ ...shell.card, display: "grid", gap: 10 }}>
      {pendingActions.map((a) => (
        <Link key={a.id} href={a.href} style={{ textDecoration: "none" }}>
          <div
            style={{
              padding: 12,
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              display: "grid",
              gap: 4,
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-heading)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.urgent ? "#fb923c" : "#cbd5e1" }} />
                {a.title}
              </span>
              <span className="status-pill" style={{ background: a.urgent ? "rgba(217,119,6,.12)" : "#f1f5f9", color: a.urgent ? "#d97706" : "#475569" }}>
                {a.urgent ? "High" : "Normal"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              {dueLabel}: {a.due || a.desc}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-orange-500)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
              Open action <ArrowRight size={14} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function QuickAccess({ links }: { links: { href: string; label: string; desc: string; icon: React.ReactNode }[] }) {
  return (
    <div style={shell.quickGrid}>
      {links.map((q) => (
        <Link key={q.href} href={q.href} style={{ textDecoration: "none" }}>
          <div style={{ ...shell.card, minHeight: 158, display: "grid", alignContent: "space-between", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #ffd7c2", background: "#fff7f3", color: "var(--color-orange-500)", display: "grid", placeItems: "center" }}>
              {q.icon}
            </div>
            <div>
              <p style={{ margin: 0, color: "var(--color-text-heading)", fontWeight: 700 }}>{q.label}</p>
              <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 13, lineHeight: 1.5 }}>{q.desc}</p>
            </div>
            <div style={{ color: "var(--color-orange-500)", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
              Open <ArrowRight size={14} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function EmployeeDashboard({ data }: { data: EmployeeDashboardData }) {
  if (!data || data.hasCycle === false) {
    return (
      <div style={{ ...shell.card, maxWidth: 700, margin: "24px auto", textAlign: "center" }}>
        <h3 style={{ margin: 0 }}>No Active Appraisal Cycle</h3>
        <p style={{ color: "var(--color-text-muted)" }}>There is no appraisal cycle active at the moment.</p>
      </div>
    );
  }

  const { cycle, progress, phases, stats, pendingActions } = data;
  const phaseKey = cycle?.currentPhase ?? "";
  const currentPhaseLabel = PHASE_LABELS[phaseKey] || phaseKey || "—";

  const quickLinks = [
    { href: "/webpage/employee/goals", label: "My Goals", desc: "View and manage performance goals", icon: <Target size={18} /> },
    {
      href: "/webpage/assessment/goals/self-assessment",
      label: "Assessment · Goals",
      desc: "Complete your goal self assessment",
      icon: <ClipboardList size={18} />,
    },
    {
      href: "/webpage/assessment/competency-assessment/self-assessment",
      label: "Assessment · Competency",
      desc: "Rate your competencies from 1 to 5",
      icon: <Star size={18} />,
    },
    { href: "/webpage/employee/development-plan", label: "Development Plan", desc: "Track learning and growth actions", icon: <TrendingUp size={18} /> },
    { href: "/webpage/employee/feedback", label: "Feedback & Results", desc: "View feedback and appraisal results", icon: <ArrowRight size={18} /> },
  ];

  return (
    <div style={shell.page}>
      <Hero
        greeting={`${new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}, User!`}
        eyebrow="Active Appraisal Cycle"
        title={cycle?.name || "Appraisal Cycle"}
        subtitle={`${cycle?.periodStart} – ${cycle?.periodEnd} · Current phase: ${currentPhaseLabel}`}
        progress={progress || 0}
      />

      <div style={shell.stats}>
        {stats?.map((s) => {
          const valueText = String(s.value ?? "");
          const compactValueSize = valueText.length > 10 ? 22 : valueText.length > 6 ? 24 : 28;
          return (
            <div key={s.label} style={{ ...shell.card, display: "grid", gap: 6, padding: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #fde3d5", background: "#fff7f3", color: "var(--color-orange-500)", display: "grid", placeItems: "center" }}>
                {getEmployeeStatVisual(s.label).icon}
              </div>
              <p style={{ ...shell.cardTitle, marginTop: 2, fontSize: 11 }}>{s.label}</p>
              <p style={{ ...shell.cardValue, color: "var(--color-text-heading)", fontSize: compactValueSize, lineHeight: 1.05, letterSpacing: "-0.01em" }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-orange-500)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                {getEmployeeStatVisual(s.label).cta} <ArrowRight size={13} />
              </p>
            </div>
          );
        })}
      </div>

      <div style={shell.sectionGrid}>
        <section style={shell.card}>
          <h3 style={shell.sectionTitle}>Appraisal Progress</h3>
          <Stepper phases={phases || []} />
        </section>
        <section>
          <h3 style={{ ...shell.sectionTitle, marginBottom: 10 }}>Pending Actions</h3>
          <PendingActions pendingActions={pendingActions || []} />
        </section>
      </div>

      <section style={shell.card}>
        <h3 style={{ ...shell.sectionTitle, marginBottom: 16 }}>Quick Access</h3>
        <QuickAccess links={quickLinks} />
      </section>
    </div>
  );
}

function ManagerDashboard({ data }: { data: ManagerDashboardData }) {
  if (!data || data.hasTeam === false) {
    return (
      <div style={{ ...shell.card, maxWidth: 700, margin: "24px auto", textAlign: "center" }}>
        <h3 style={{ margin: 0 }}>No Team Members Assigned</h3>
        <p style={{ color: "var(--color-text-muted)" }}>{data?.message || "You do not have team members for the active cycle."}</p>
      </div>
    );
  }

  const { cycle, stats, members, pendingActions } = data;
  const completedCount = Number(stats?.[0]?.value ?? 0) || 0;

  const quickLinks = [
    { href: "/webpage/manager/team-goals", label: "Team Goals", desc: "Approve team member goals", icon: <Target size={18} /> },
    {
      href: "/webpage/assessment/goals/manager-review",
      label: "Assessment · Goals",
      desc: "Review team goal self assessments",
      icon: <ClipboardList size={18} />,
    },
    {
      href: "/webpage/assessment/competency-assessment/manager-review",
      label: "Assessment · Competency",
      desc: "Evaluate team competency self assessments",
      icon: <Star size={18} />,
    },
    { href: "/webpage/manager/team-summary", label: "Team Summary", desc: "View overall team performance", icon: <Gauge size={18} /> },
  ];

  return (
    <div style={shell.page}>
      <Hero
        greeting={`${new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}, Manager!`}
        eyebrow="Manager Dashboard"
        title={cycle?.name || "Appraisal Cycle"}
        subtitle={`${cycle?.periodStart} – ${cycle?.periodEnd} · ${members?.length || 0} team members`}
        progress={Math.min(100, Math.round((completedCount / Math.max(members?.length || 1, 1)) * 100))}
      />

      <div style={shell.stats}>
        {stats?.map((s) => (
          <div key={s.label} style={{ ...shell.card, borderTop: "3px solid var(--color-orange-500)", paddingTop: 14 }}>
            <p style={shell.cardTitle}>{s.label}</p>
            <p style={{ ...shell.cardValue, fontSize: 24 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={shell.sectionGrid}>
        <section style={shell.card}>
          <h3 style={shell.sectionTitle}>Team Members</h3>
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {members?.map((m) => (
              <div key={m.appraisalId} style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: 12, display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 10, alignItems: "center", background: "#fff" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#eef6ff", color: "var(--color-navy-700)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>
                  {m.employeeName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-heading)", fontWeight: 700 }}>{m.employeeName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>{m.goalCount} goals</p>
                </div>
                <span className="status-pill" style={{ background: "#eef6ff", color: "var(--color-navy-700)" }}>
                  {m.phaseLabel}
                </span>
                {m.reviewCompleted && m.overallRating && (
                  <span className="status-pill" style={{ background: "rgba(22,163,74,.1)", color: "#16a34a" }}>
                    {Number(m.overallRating).toFixed(1)} ★
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 style={{ ...shell.sectionTitle, marginBottom: 12 }}>Pending Actions</h3>
          <PendingActions pendingActions={pendingActions || []} dueLabel="Action" />
        </section>
      </div>

      <section style={shell.card}>
        <h3 style={{ ...shell.sectionTitle, marginBottom: 16 }}>Quick Access</h3>
        <QuickAccess links={quickLinks} />
      </section>

      <section style={{ ...shell.card, display: "none" }} aria-hidden>
        <Users size={18} />
      </section>
    </div>
  );
}
