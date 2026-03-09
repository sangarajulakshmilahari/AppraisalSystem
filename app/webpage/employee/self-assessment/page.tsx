"use client";
import { useState } from "react";

type Evidence = { id: string; month: string; description: string };
type GoalSA = { id: string; no: number; goal: string; selfAssessment: string; evidence: Evidence[]; managerFeedback: string; performanceRating: number | null };

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const INIT: GoalSA[] = [
  { id: "1", no: 1, goal: "Deliver high quality, defect-free code with proper documentation", selfAssessment: "", evidence: [], managerFeedback: "", performanceRating: null },
  { id: "2", no: 2, goal: "Complete client deliverables on time per project milestones",      selfAssessment: "", evidence: [], managerFeedback: "", performanceRating: null },
  { id: "3", no: 3, goal: "Complete at least one certification in cloud / AI technologies",  selfAssessment: "", evidence: [], managerFeedback: "", performanceRating: null },
  { id: "4", no: 4, goal: "Actively contribute to knowledge sharing sessions and reviews",    selfAssessment: "", evidence: [], managerFeedback: "", performanceRating: null },
  { id: "5", no: 5, goal: "Follow CMMI Level 3 processes for all project activities",         selfAssessment: "", evidence: [], managerFeedback: "", performanceRating: null },
];

export default function SelfAssessmentPage() {
  const [goals, setGoals] = useState<GoalSA[]>(INIT);
  const [expanded, setExpanded] = useState<string>("1");
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = (id: string, field: keyof GoalSA, val: string) =>
    setGoals(goals.map((g) => (g.id === id ? { ...g, [field]: val } : g)));

  const addEvidence = (id: string) =>
    setGoals(goals.map((g) =>
      g.id === id && g.evidence.length < 12
        ? { ...g, evidence: [...g.evidence, { id: Date.now().toString(), month: MONTHS[g.evidence.length] ?? "Apr", description: "" }] }
        : g
    ));

  const updateEvidence = (goalId: string, evId: string, field: keyof Evidence, val: string) =>
    setGoals(goals.map((g) =>
      g.id === goalId ? { ...g, evidence: g.evidence.map((e) => e.id === evId ? { ...e, [field]: val } : e) } : g
    ));

  const removeEvidence = (goalId: string, evId: string) =>
    setGoals(goals.map((g) => g.id === goalId ? { ...g, evidence: g.evidence.filter((e) => e.id !== evId) } : g));

  const filled = goals.filter((g) => g.selfAssessment.trim().length > 0).length;
  const pct = Math.round((filled / goals.length) * 100);

  const inp: React.CSSProperties = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" };

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>Self Assessment</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>FY 2025–26 · Assessment window open until 28 Feb 2026</p>
        </div>
        {!submitted && (
          <button onClick={() => setShowConfirm(true)} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>Submit Assessment</button>
        )}
        {submitted && (
          <div style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14 }}>✓ Submitted — Awaiting Manager Review</div>
        )}
      </div>

      {/* Progress */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 20, border: "1px solid #ede9fe", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Assessment Progress</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>{filled} / {goals.length} goals filled</span>
          </div>
          <div style={{ height: 8, background: "#f3f0ff", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#7c3aed,#4f46e5)", borderRadius: 4, transition: "width 0.4s" }} />
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#7c3aed" }}>{pct}%</div>
      </div>

      {/* Goal Cards */}
      {goals.map((g) => (
        <div key={g.id} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${expanded === g.id ? "#c4b5fd" : "#ede9fe"}`, marginBottom: 12, overflow: "hidden", boxShadow: expanded === g.id ? "0 4px 20px rgba(124,58,237,0.12)" : "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.2s" }}>
          {/* Card Header */}
          <div onClick={() => setExpanded(expanded === g.id ? "" : g.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", cursor: "pointer", background: expanded === g.id ? "#faf8ff" : "#fff" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{g.no}</div>
            <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#1f2937" }}>{g.goal}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {g.selfAssessment && <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>✓ Filled</span>}
              {g.evidence.length > 0 && <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{g.evidence.length} evidence</span>}
              <span style={{ color: "#9ca3af", fontSize: 18 }}>{expanded === g.id ? "▴" : "▾"}</span>
            </div>
          </div>

          {/* Expanded Body */}
          {expanded === g.id && (
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Self Assessment</label>
                  <textarea disabled={submitted} rows={4} placeholder="Describe your achievement against this goal..." value={g.selfAssessment} onChange={(e) => update(g.id, "selfAssessment", e.target.value)} style={{ ...inp, borderColor: g.selfAssessment ? "#a78bfa" : "#e5e7eb" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Manager Feedback <span style={{ color: "#d1d5db", fontWeight: 400 }}>(read-only)</span></label>
                  <textarea rows={4} readOnly placeholder="Manager feedback will appear here after review..." value={g.managerFeedback} style={{ ...inp, background: "#f9fafb", color: "#9ca3af", cursor: "default" }} />
                </div>
              </div>

              {/* Evidence Section */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>Supporting Evidence / Data <span style={{ color: "#9ca3af", fontWeight: 400 }}>({g.evidence.length}/12 rows)</span></label>
                  {!submitted && g.evidence.length < 12 && (
                    <button onClick={() => addEvidence(g.id)} style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #c4b5fd", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Row</button>
                  )}
                </div>
                {g.evidence.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "16px", background: "#faf8ff", borderRadius: 10, border: "1px dashed #c4b5fd", color: "#9ca3af", fontSize: 13 }}>No evidence added yet. Click "+ Add Row" to add supporting data.</div>
                ) : (
                  g.evidence.map((ev, i) => (
                    <div key={ev.id} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                      <select value={ev.month} onChange={(e) => updateEvidence(g.id, ev.id, "month", e.target.value)} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#374151", background: "#fff", width: 80 }}>
                        {MONTHS.map((m) => <option key={m}>{m}</option>)}
                      </select>
                      <input value={ev.description} onChange={(e) => updateEvidence(g.id, ev.id, "description", e.target.value)} placeholder={`Evidence ${i + 1} — e.g. Delivered X feature with 0 defects`} style={{ ...inp, marginBottom: 0, flex: 1 }} />
                      {!submitted && <button onClick={() => removeEvidence(g.id, ev.id)} style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>✕</button>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Confirm Modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ width: 52, height: 52, background: "#f5f3ff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>📤</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>Submit Self Assessment?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Once submitted, you cannot edit your responses. Your reporting manager will be notified via email.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { setSubmitted(true); setShowConfirm(false); }} style={{ flex: 1, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Confirm & Submit</button>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}