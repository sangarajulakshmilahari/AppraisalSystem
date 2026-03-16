// app/webpage/self-assessment/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";

type Evidence = { id: number; goal_id: number; month: string; description: string };
type GoalSA = {
  id: number;
  goal_no: number;
  description: string;
  area_name: string | null;
  self_assessment: string | null;
  manager_feedback: string | null;
  performance_rating: number | null;
  evidence: Evidence[];
};

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export default function SelfAssessmentPage() {
  const [goals, setGoals] = useState<GoalSA[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saEditable, setSaEditable] = useState(false);
  const [cycleName, setCycleName] = useState("");
  const [saEnd, setSaEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  // Auto-save debounce timers
  const saveTimers = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    fetch("/api/employee/self-assessment")
      .then((r) => r.json())
      .then((data) => {
        if (data.goals) {
          setGoals(data.goals);
          if (data.goals.length > 0) setExpanded(data.goals[0].id);
        }
        if (data.cycle) {
          setCycleName(data.cycle.name || "");
          setSaEnd(data.cycle.selfAssessmentEnd || "");
        }
        if (data.saEditable !== undefined) setSaEditable(data.saEditable);
        if (data.appraisal?.selfAssessmentSubmittedAt) setSubmitted(true);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filled = goals.filter((g) => g.self_assessment && g.self_assessment.trim().length > 0).length;
  const pct = goals.length > 0 ? Math.round((filled / goals.length) * 100) : 0;

  // ── Auto-save self assessment text ──
  const updateSA = (goalId: number, text: string) => {
    setGoals(goals.map((g) => (g.id === goalId ? { ...g, self_assessment: text } : g)));

    // Debounce save
    if (saveTimers.current[goalId]) clearTimeout(saveTimers.current[goalId]);
    saveTimers.current[goalId] = setTimeout(async () => {
      setSaving((s) => ({ ...s, [goalId]: true }));
      try {
        await fetch(`/api/employee/self-assessment/${goalId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ self_assessment: text }),
        });
      } catch (e) {
        console.error("Auto-save failed:", e);
      }
      setSaving((s) => ({ ...s, [goalId]: false }));
    }, 800);
  };

  // ── Evidence: Add ──
  const addEvidence = async (goalId: number) => {
    setError("");
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || goal.evidence.length >= 12) return;

    const nextMonth = MONTHS[goal.evidence.length] ?? "Apr";
    try {
      const res = await fetch(`/api/employee/evidence/${goalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: nextMonth, description: " " }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setGoals(goals.map((g) =>
        g.id === goalId ? { ...g, evidence: [...g.evidence, data.evidence] } : g
      ));
    } catch (e: any) { setError(e.message); }
  };

  // ── Evidence: Update (debounced) ──
  const evidenceTimers = useRef<Record<number, NodeJS.Timeout>>({});

  const updateEvidence = (goalId: number, evId: number, field: "month" | "description", value: string) => {
    setGoals(goals.map((g) =>
      g.id === goalId
        ? { ...g, evidence: g.evidence.map((e) => (e.id === evId ? { ...e, [field]: value } : e)) }
        : g
    ));

    if (evidenceTimers.current[evId]) clearTimeout(evidenceTimers.current[evId]);
    evidenceTimers.current[evId] = setTimeout(async () => {
      const goal = goals.find((g) => g.id === goalId);
      const ev = goal?.evidence.find((e) => e.id === evId);
      if (!ev) return;
      const updated = { ...ev, [field]: value };
      try {
        await fetch(`/api/employee/evidence/item/${evId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ month: updated.month, description: updated.description }),
        });
      } catch (e) { console.error("Evidence save failed:", e); }
    }, 800);
  };

  // ── Evidence: Delete ──
  const removeEvidence = async (goalId: number, evId: number) => {
    setError("");
    try {
      const res = await fetch(`/api/employee/evidence/item/${evId}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      setGoals(goals.map((g) =>
        g.id === goalId ? { ...g, evidence: g.evidence.filter((e) => e.id !== evId) } : g
      ));
    } catch (e: any) { setError(e.message); }
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setError("");
    try {
      const res = await fetch("/api/employee/self-assessment/submit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSubmitted(true);
      setSaEditable(false);
      setShowConfirm(false);
    } catch (e: any) { setError(e.message); }
  };

  const inp: React.CSSProperties = {
    width: "100%", border: "1px solid #e5e7eb", borderRadius: 8,
    padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical",
  };

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af" }}>Loading self assessment...</div>;
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>Self Assessment</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>
            {cycleName} {saEnd && `· Assessment window open until ${saEnd}`}
          </p>
        </div>
        {!submitted && saEditable && (
          <button onClick={() => setShowConfirm(true)} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
            Submit Assessment
          </button>
        )}
        {submitted && (
          <div style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14 }}>✓ Submitted — Awaiting Manager Review</div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

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

      {/* No goals */}
      {goals.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: "48px", textAlign: "center", border: "1px solid #ede9fe" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>No goals to assess</h3>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Goals must be set and approved before self-assessment can begin.</p>
        </div>
      )}

      {/* Goal Cards */}
      {goals.map((g) => (
        <div key={g.id} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${expanded === g.id ? "#c4b5fd" : "#ede9fe"}`, marginBottom: 12, overflow: "hidden", boxShadow: expanded === g.id ? "0 4px 20px rgba(124,58,237,0.12)" : "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.2s" }}>
          {/* Card Header */}
          <div onClick={() => setExpanded(expanded === g.id ? null : g.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", cursor: "pointer", background: expanded === g.id ? "#faf8ff" : "#fff" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{g.goal_no}</div>
            <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#1f2937" }}>{g.description}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {g.self_assessment && g.self_assessment.trim() && (
                <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>✓ Filled</span>
              )}
              {g.evidence.length > 0 && (
                <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{g.evidence.length} evidence</span>
              )}
              {saving[g.id] && (
                <span style={{ color: "#9ca3af", fontSize: 11 }}>Saving...</span>
              )}
              <span style={{ color: "#9ca3af", fontSize: 18 }}>{expanded === g.id ? "▴" : "▾"}</span>
            </div>
          </div>

          {/* Expanded Body */}
          {expanded === g.id && (
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                {/* Self Assessment */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Self Assessment</label>
                  <textarea
                    disabled={!saEditable}
                    rows={4}
                    placeholder="Describe your achievement against this goal..."
                    value={g.self_assessment || ""}
                    onChange={(e) => updateSA(g.id, e.target.value)}
                    style={{ ...inp, borderColor: g.self_assessment ? "#a78bfa" : "#e5e7eb", background: saEditable ? "#fff" : "#f9fafb" }}
                  />
                </div>
                {/* Manager Feedback (read-only) */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                    Manager Feedback <span style={{ color: "#d1d5db", fontWeight: 400 }}>(read-only)</span>
                  </label>
                  <textarea
                    rows={4}
                    readOnly
                    placeholder="Manager feedback will appear here after review..."
                    value={g.manager_feedback || ""}
                    style={{ ...inp, background: "#f9fafb", color: "#9ca3af", cursor: "default" }}
                  />
                </div>
              </div>

              {/* Evidence Section */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Supporting Evidence / Data <span style={{ color: "#9ca3af", fontWeight: 400 }}>({g.evidence.length}/12 rows)</span>
                  </label>
                  {saEditable && g.evidence.length < 12 && (
                    <button onClick={() => addEvidence(g.id)} style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #c4b5fd", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      + Add Row
                    </button>
                  )}
                </div>

                {g.evidence.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "16px", background: "#faf8ff", borderRadius: 10, border: "1px dashed #c4b5fd", color: "#9ca3af", fontSize: 13 }}>
                    No evidence added yet. Click "+ Add Row" to add supporting data.
                  </div>
                ) : (
                  g.evidence.map((ev) => (
                    <div key={ev.id} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                      <select
                        value={ev.month}
                        onChange={(e) => updateEvidence(g.id, ev.id, "month", e.target.value)}
                        disabled={!saEditable}
                        style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#374151", background: "#fff", width: 80 }}
                      >
                        {MONTHS.map((m) => <option key={m}>{m}</option>)}
                      </select>
                      <input
                        value={ev.description}
                        onChange={(e) => updateEvidence(g.id, ev.id, "description", e.target.value)}
                        disabled={!saEditable}
                        placeholder="Evidence — e.g. Delivered X feature with 0 defects"
                        style={{ ...inp, marginBottom: 0, flex: 1 }}
                      />
                      {saEditable && (
                        <button onClick={() => removeEvidence(g.id, ev.id)} style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>✕</button>
                      )}
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
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Once submitted, you cannot edit your responses. Your reporting manager will be notified.
            </p>
            {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Confirm & Submit</button>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}