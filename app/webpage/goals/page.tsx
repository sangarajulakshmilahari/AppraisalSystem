"use client";
import { useState } from "react";

type Goal = { id: string; no: number; area: string; description: string; metric: string; target: string; timeline: string; weight: number; status: "draft" | "submitted" | "approved" };

const INIT_GOALS: Goal[] = [
  { id: "1", no: 1, area: "Code Quality",        description: "Deliver high quality, defect-free code with proper documentation", metric: "Defect density, Code review score", target: "< 0.5 defects/KLOC", timeline: "Mar 2026", weight: 25, status: "approved" },
  { id: "2", no: 2, area: "Client Delivery",     description: "Complete client deliverables on time per project milestones",     metric: "On-time delivery %",              target: "> 95%",            timeline: "Mar 2026", weight: 25, status: "approved" },
  { id: "3", no: 3, area: "Learning & Growth",   description: "Complete at least one certification in cloud / AI technologies", metric: "Certifications obtained",         target: "1 certification",  timeline: "Dec 2025", weight: 20, status: "approved" },
  { id: "4", no: 4, area: "Team Collaboration",  description: "Actively contribute to knowledge sharing sessions and reviews",   metric: "Sessions conducted",              target: "≥ 6 sessions",     timeline: "Mar 2026", weight: 15, status: "draft"    },
  { id: "5", no: 5, area: "Process Adherence",   description: "Follow CMMI Level 3 processes for all project activities",        metric: "Process compliance audit score",  target: "> 90%",            timeline: "Mar 2026", weight: 15, status: "submitted" },
];

const AREAS = ["Code Quality", "Client Delivery", "Learning & Growth", "Team Collaboration", "Process Adherence", "Innovation", "Leadership", "Customer Satisfaction"];

const BADGE = { approved: { bg: "#dcfce7", color: "#16a34a", label: "Approved" }, submitted: { bg: "#dbeafe", color: "#1d4ed8", label: "Submitted" }, draft: { bg: "#f3f4f6", color: "#6b7280", label: "Draft" } };

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(INIT_GOALS);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Goal>>({});

  const totalWeight = goals.reduce((s, g) => s + g.weight, 0);
  const canEdit = (g: Goal) => g.status === "draft";

  const startEdit = (g: Goal) => { setEditId(g.id); setForm({ ...g }); };
  const cancelEdit = () => { setEditId(null); setForm({}); };
  const saveEdit = () => {
    setGoals(goals.map((g) => g.id === editId ? { ...g, ...form } as Goal : g));
    setEditId(null);
  };

  const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid #d8b4fe", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none", background: "#faf8ff" };

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>My Goals</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>FY 2025–26 · Total Weight: <span style={{ color: totalWeight === 100 ? "#10b981" : "#f59e0b", fontWeight: 700 }}>{totalWeight}%</span></p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 10, padding: "6px 14px", fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>Goal window: <span style={{ color: "#f59e0b" }}>Open</span></div>
          <button style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Add Goal</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", overflow: "hidden", boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "48px 130px 1fr 160px 130px 110px 90px 120px", background: "linear-gradient(90deg,#7c3aed,#4f46e5)", color: "#fff", padding: "14px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", gap: 8 }}>
          {["#", "Area", "Goal Description", "Measurement Metric", "Target", "Timeline", "Weight", "Status"].map((h) => (
            <div key={h}>{h}</div>
          ))}
        </div>

        {goals.map((g, idx) => (
          <div key={g.id} style={{ display: "grid", gridTemplateColumns: "48px 130px 1fr 160px 130px 110px 90px 120px", padding: "14px 16px", gap: 8, alignItems: "center", background: idx % 2 === 0 ? "#fff" : "#faf8ff", borderBottom: "1px solid #f3f0ff" }}>
            {editId === g.id ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>{g.no}</div>
                <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} style={inputStyle}>
                  {AREAS.map((a) => <option key={a}>{a}</option>)}
                </select>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
                <input value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} style={inputStyle} />
                <input value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} style={inputStyle} />
                <input value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} style={inputStyle} />
                <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: +e.target.value })} style={inputStyle} min={0} max={100} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={saveEdit} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Save</button>
                  <button onClick={cancelEdit} style={{ background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>✕</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>{g.no}</div>
                <div>
                  <span style={{ background: "#f5f3ff", color: "#7c3aed", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>{g.area}</span>
                </div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}>{g.description}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{g.metric}</div>
                <div style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{g.target}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{g.timeline}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 6, background: "#f3f0ff", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${g.weight}%`, height: "100%", background: "linear-gradient(90deg,#7c3aed,#4f46e5)", borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>{g.weight}%</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: BADGE[g.status].bg, color: BADGE[g.status].color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{BADGE[g.status].label}</span>
                  {canEdit(g) && (
                    <button onClick={() => startEdit(g)} style={{ background: "none", border: "1px solid #d8b4fe", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#7c3aed", cursor: "pointer" }}>Edit</button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {/* Weight total row */}
        <div style={{ display: "grid", gridTemplateColumns: "48px 130px 1fr 160px 130px 110px 90px 120px", padding: "12px 16px", gap: 8, background: "#f5f3ff", borderTop: "2px solid #ede9fe" }}>
          <div /><div /><div /><div /><div />
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Total Weight</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: totalWeight === 100 ? "#10b981" : "#f59e0b" }}>{totalWeight}%</div>
          <div />
        </div>
      </div>
    </div>
  );
}