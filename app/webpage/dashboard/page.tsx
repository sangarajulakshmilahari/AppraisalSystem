"use client";
import Link from "next/link";

const cycle = { name: "FY 2025–26 Annual Appraisal", period: "Apr 2025 – Mar 2026", phase: "Self Assessment", progress: 40 };

const stats = [
  { label: "Goals Set",        value: "5 / 5",  sub: "All approved",           color: "#10b981", bg: "#ecfdf5" },
  { label: "Self Assessment",  value: "Pending", sub: "Due by 28 Feb 2026",    color: "#f59e0b", bg: "#fffbeb" },
  { label: "Competency",       value: "Not Started", sub: "Opens after SA",   color: "#6b7280", bg: "#f9fafb" },
  { label: "Overall Progress", value: "40%",     sub: "2 of 5 phases done",    color: "#7c3aed", bg: "#f5f3ff" },
];

const actions = [
  { id: 1, title: "Complete Self Assessment",       due: "28 Feb 2026", urgent: true  },
  { id: 2, title: "Complete Competency Assessment", due: "05 Mar 2026", urgent: false },
  { id: 3, title: "Review Development Plan",        due: "Anytime",     urgent: false },
];

const phases = ["Goal Setting", "Self Assessment", "Manager Review", "HR Review", "Results Released"];
const currentIdx = 1;

const quickLinks = [
  { href: "/webpage/goals",            label: "My Goals",              desc: "View & manage performance goals",     icon: "🎯", color: "#7c3aed" },
  { href: "/webpage/self-assessment",  label: "Self Assessment",       desc: "Submit your performance evaluation",  icon: "📝", color: "#4f46e5" },
  { href: "/webpage/competency",       label: "Competency",            desc: "Rate your competencies (1–5)",        icon: "⭐", color: "#0891b2" },
  { href: "/webpage/development-plan", label: "Development Plan",      desc: "Track learning & growth actions",     icon: "📈", color: "#059669" },
];

export default function DashboardPage() {
  return (
    <div style={{ maxWidth: 1200 }}>

      {/* Cycle Banner */}
      <div style={{ background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 50%,#0891b2 100%)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 30px rgba(124,58,237,0.3)" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Active Appraisal Cycle</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{cycle.name}</h2>
          <p style={{ opacity: 0.85, fontSize: 14 }}>{cycle.period} &nbsp;·&nbsp; Current Phase: <strong>{cycle.phase}</strong></p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "10px 20px" }}>
            <p style={{ fontSize: 28, fontWeight: 800 }}>{cycle.progress}%</p>
            <p style={{ fontSize: 12, opacity: 0.85 }}>Completed</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "20px 20px", border: "1px solid #ede9fe", boxShadow: "0 2px 8px rgba(124,58,237,0.06)" }}>
            <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#6b7280" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginBottom: 20 }}>

        {/* Phase Progress */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #ede9fe", boxShadow: "0 2px 8px rgba(124,58,237,0.06)" }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 20 }}>Appraisal Progress</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {phases.map((p, i) => (
              <div key={p} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, marginBottom: 8, background: i < currentIdx ? "#7c3aed" : i === currentIdx ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#f3f4f6", color: i <= currentIdx ? "#fff" : "#9ca3af", border: i === currentIdx ? "3px solid #c4b5fd" : "none", boxShadow: i === currentIdx ? "0 0 0 4px rgba(124,58,237,0.15)" : "none" }}>
                    {i < currentIdx ? "✓" : i + 1}
                  </div>
                  <p style={{ fontSize: 11, color: i === currentIdx ? "#7c3aed" : i < currentIdx ? "#10b981" : "#9ca3af", fontWeight: i === currentIdx ? 700 : 500, textAlign: "center" }}>{p}</p>
                </div>
                {i < phases.length - 1 && (
                  <div style={{ height: 2, flex: 0.3, background: i < currentIdx ? "#7c3aed" : "#e5e7eb", marginBottom: 22, marginTop: -4 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #ede9fe", boxShadow: "0 2px 8px rgba(124,58,237,0.06)" }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 16 }}>Pending Actions</h3>
          {actions.map((a) => (
            <div key={a.id} style={{ display: "flex", gap: 12, marginBottom: 14, padding: "12px 14px", borderRadius: 10, background: a.urgent ? "#fefce8" : "#fafaf9", border: `1px solid ${a.urgent ? "#fef08a" : "#e5e7eb"}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.urgent ? "#f59e0b" : "#9ca3af", marginTop: 5, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1f2937", marginBottom: 2 }}>{a.title}</p>
                <p style={{ fontSize: 11, color: a.urgent ? "#d97706" : "#9ca3af" }}>Due: {a.due}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1px solid #ede9fe", boxShadow: "0 2px 8px rgba(124,58,237,0.06)" }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, color: "#1f2937", marginBottom: 16 }}>Quick Access</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {quickLinks.map((q) => (
            <Link key={q.href} href={q.href} style={{ textDecoration: "none" }}>
              <div style={{ padding: "18px", borderRadius: 12, border: "1px solid #ede9fe", cursor: "pointer", transition: "all 0.2s", background: "#faf8ff" }}>
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