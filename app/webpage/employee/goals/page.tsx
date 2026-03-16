// app/webpage/goals/page.tsx
"use client";
import { useState, useEffect } from "react";

type Goal = {
  id: number;
  goal_no: number;
  area_id: number | null;
  area_name: string | null;
  description: string;
  metric: string | null;
  target: string | null;
  timeline: string | null;
  weight: number;
  status: "draft" | "submitted" | "approved" | "rejected";
};

type GoalArea = { id: number; area_name: string };

const BADGE: Record<string, { bg: string; color: string; label: string }> = {
  approved:  { bg: "#dcfce7", color: "#16a34a", label: "Approved" },
  submitted: { bg: "#dbeafe", color: "#1d4ed8", label: "Submitted" },
  draft:     { bg: "#f3f4f6", color: "#6b7280", label: "Draft" },
  rejected:  { bg: "#fef2f2", color: "#ef4444", label: "Rejected" },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [areas, setAreas] = useState<GoalArea[]>([]);
  const [goalsEditable, setGoalsEditable] = useState(false);
  const [cycleName, setCycleName] = useState("");
  const [goalsSubmitted, setGoalsSubmitted] = useState(false);
  const [goalsApproved, setGoalsApproved] = useState(false);
  const [goalWindowOpen, setGoalWindowOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Goal>>({});

  // Add state
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<Goal>>({ weight: 0 });

  // Confirm submit
  const [showConfirm, setShowConfirm] = useState(false);

  // Load goals and areas
  useEffect(() => {
    Promise.all([
      fetch("/api/employee/goals").then((r) => r.json()),
      fetch("/api/employee/goal-areas").then((r) => r.json()),
    ])
      .then(([goalsData, areasData]) => {
        if (goalsData.goals) setGoals(goalsData.goals);
        if (goalsData.cycle) {
          setCycleName(goalsData.cycle.name || "");
          setGoalWindowOpen(goalsData.cycle.goalWindowOpen || false);
        }
        if (goalsData.goalsEditable !== undefined) setGoalsEditable(goalsData.goalsEditable);
        if (goalsData.appraisal) {
          setGoalsSubmitted(!!goalsData.appraisal.goalsSubmittedAt);
          setGoalsApproved(!!goalsData.appraisal.goalsApprovedAt);
        }
        if (areasData.areas) setAreas(areasData.areas);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalWeight = goals.reduce((s, g) => s + (g.weight || 0), 0);
  const canEdit = (g: Goal) => g.status === "draft" && goalsEditable;

  // ── Add Goal ──
  const handleAdd = async () => {
    if (!newForm.description?.trim()) return;
    setError("");
    try {
      const res = await fetch("/api/employee/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setGoals([...goals, data.goal]);
      setNewForm({ weight: 0 });
      setAdding(false);
    } catch (e: any) { setError(e.message); }
  };

  // ── Edit Goal ──
  const startEdit = (g: Goal) => { setEditId(g.id); setForm({ ...g }); };
  const cancelEdit = () => { setEditId(null); setForm({}); };
  const saveEdit = async () => {
    if (!form.description?.trim()) return;
    setError("");
    try {
      const res = await fetch(`/api/employee/goals/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setGoals(goals.map((g) => (g.id === editId ? data.goal : g)));
      setEditId(null);
    } catch (e: any) { setError(e.message); }
  };

  // ── Delete Goal ──
  const handleDelete = async (id: number) => {
    setError("");
    try {
      const res = await fetch(`/api/employee/goals/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setGoals(goals.filter((g) => g.id !== id));
    } catch (e: any) { setError(e.message); }
  };

  // ── Submit Goals ──
  const handleSubmit = async () => {
    setError("");
    try {
      const res = await fetch("/api/employee/goals/submit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setShowConfirm(false); return; }
      setGoalsSubmitted(true);
      setGoalsEditable(false);
      setGoals(goals.map((g) => ({ ...g, status: g.status === "draft" ? "submitted" : g.status })));
      setShowConfirm(false);
    } catch (e: any) { setError(e.message); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid #d8b4fe", borderRadius: 6,
    padding: "5px 8px", fontSize: 12, outline: "none", background: "#faf8ff",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af" }}>
        Loading goals...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>My Goals</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>
            {cycleName || "No active cycle"} · Total Weight:{" "}
            <span style={{ color: totalWeight === 100 ? "#10b981" : "#f59e0b", fontWeight: 700 }}>{totalWeight}%</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 10, padding: "6px 14px", fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>
            Goal window: <span style={{ color: goalWindowOpen ? "#10b981" : "#ef4444" }}>{goalWindowOpen ? "Open" : "Closed"}</span>
          </div>
          {goalsEditable && (
            <button onClick={() => setAdding(true)} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              + Add Goal
            </button>
          )}
          {goalsEditable && goals.length > 0 && !goalsSubmitted && (
            <button onClick={() => setShowConfirm(true)} style={{ background: totalWeight === 100 ? "linear-gradient(135deg,#10b981,#059669)" : "#e5e7eb", color: totalWeight === 100 ? "#fff" : "#9ca3af", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 600, fontSize: 13, cursor: totalWeight === 100 ? "pointer" : "not-allowed" }} disabled={totalWeight !== 100}>
              Submit Goals
            </button>
          )}
          {goalsSubmitted && !goalsApproved && (
            <div style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 13 }}>📤 Submitted — Awaiting Approval</div>
          )}
          {goalsApproved && (
            <div style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 13 }}>✓ Approved</div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* No goals message */}
      {goals.length === 0 && !adding && (
        <div style={{ background: "#fff", borderRadius: 16, padding: "48px", textAlign: "center", border: "1px solid #ede9fe" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>No goals set yet</h3>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>
            {goalsEditable ? 'Click "+ Add Goal" to create your first performance goal.' : "Goal setting window is currently closed."}
          </p>
        </div>
      )}

      {/* Goals Table */}
      {(goals.length > 0 || adding) && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", overflow: "hidden", boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>
          {/* Table Header */}
          <div style={{ display: "grid", gridTemplateColumns: "48px 140px 1fr 160px 130px 110px 90px 120px", background: "linear-gradient(90deg,#7c3aed,#4f46e5)", color: "#fff", padding: "14px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", gap: 8 }}>
            {["#", "Area", "Goal Description", "Measurement Metric", "Target", "Timeline", "Weight", "Status"].map((h) => (
              <div key={h}>{h}</div>
            ))}
          </div>

          {/* Goal Rows */}
          {goals.map((g, idx) => (
            <div key={g.id} style={{ display: "grid", gridTemplateColumns: "48px 140px 1fr 160px 130px 110px 90px 120px", padding: "14px 16px", gap: 8, alignItems: "center", background: idx % 2 === 0 ? "#fff" : "#faf8ff", borderBottom: "1px solid #f3f0ff" }}>
              {editId === g.id ? (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>{g.goal_no}</div>
                  <select value={form.area_id ?? ""} onChange={(e) => setForm({ ...form, area_id: e.target.value ? Number(e.target.value) : null })} style={inputStyle}>
                    <option value="">Select area</option>
                    {areas.map((a) => <option key={a.id} value={a.id}>{a.area_name}</option>)}
                  </select>
                  <input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} />
                  <input value={form.metric ?? ""} onChange={(e) => setForm({ ...form, metric: e.target.value })} style={inputStyle} />
                  <input value={form.target ?? ""} onChange={(e) => setForm({ ...form, target: e.target.value })} style={inputStyle} />
                  <input value={form.timeline ?? ""} onChange={(e) => setForm({ ...form, timeline: e.target.value })} style={inputStyle} />
                  <input type="number" value={form.weight ?? 0} onChange={(e) => setForm({ ...form, weight: +e.target.value })} style={inputStyle} min={0} max={100} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={saveEdit} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Save</button>
                    <button onClick={cancelEdit} style={{ background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>✕</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>{g.goal_no}</div>
                  <div>
                    <span style={{ background: "#f5f3ff", color: "#7c3aed", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 }}>{g.area_name || "—"}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}>{g.description}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{g.metric || "—"}</div>
                  <div style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{g.target || "—"}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{g.timeline || "—"}</div>
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
                      <>
                        <button onClick={() => startEdit(g)} style={{ background: "none", border: "1px solid #d8b4fe", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#7c3aed", cursor: "pointer" }}>Edit</button>
                        <button onClick={() => handleDelete(g.id)} style={{ background: "none", border: "1px solid #fecaca", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#ef4444", cursor: "pointer" }}>✕</button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add Row */}
          {adding && (
            <div style={{ display: "grid", gridTemplateColumns: "48px 140px 1fr 160px 130px 110px 90px 120px", padding: "14px 16px", gap: 8, alignItems: "center", background: "#faf8ff", borderTop: "2px dashed #c4b5fd" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af" }}>—</div>
              <select value={newForm.area_id ?? ""} onChange={(e) => setNewForm({ ...newForm, area_id: e.target.value ? Number(e.target.value) : null })} style={inputStyle}>
                <option value="">Select area</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.area_name}</option>)}
              </select>
              <input value={newForm.description ?? ""} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} placeholder="Goal description..." style={inputStyle} />
              <input value={newForm.metric ?? ""} onChange={(e) => setNewForm({ ...newForm, metric: e.target.value })} placeholder="Metric" style={inputStyle} />
              <input value={newForm.target ?? ""} onChange={(e) => setNewForm({ ...newForm, target: e.target.value })} placeholder="Target" style={inputStyle} />
              <input value={newForm.timeline ?? ""} onChange={(e) => setNewForm({ ...newForm, timeline: e.target.value })} placeholder="e.g. Mar 2026" style={inputStyle} />
              <input type="number" value={newForm.weight ?? 0} onChange={(e) => setNewForm({ ...newForm, weight: +e.target.value })} style={inputStyle} min={0} max={100} />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={handleAdd} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Add</button>
                <button onClick={() => { setAdding(false); setNewForm({ weight: 0 }); }} style={{ background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>✕</button>
              </div>
            </div>
          )}

          {/* Weight Total Row */}
          {goals.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "48px 140px 1fr 160px 130px 110px 90px 120px", padding: "12px 16px", gap: 8, background: "#f5f3ff", borderTop: "2px solid #ede9fe" }}>
              <div /><div /><div /><div /><div />
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Total Weight</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: totalWeight === 100 ? "#10b981" : "#f59e0b" }}>{totalWeight}%</div>
              <div />
            </div>
          )}
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🎯</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Submit Goals for Approval?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
              You are submitting <strong>{goals.length} goals</strong> with a total weight of <strong>{totalWeight}%</strong>.
            </p>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Once submitted, you cannot edit your goals until your manager reviews them.
            </p>
            {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>Confirm & Submit</button>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}