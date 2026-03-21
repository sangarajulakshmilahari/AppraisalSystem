// app/webpage/goals/page.tsx
"use client";
import { useState, useEffect } from "react";

type Goal = {
  id: number;
  goal_no: number;
  area: string | null;
  kpi: string | null;
  description: string;
  metric: string | null;
  target: string | null;
  expected_monthly: string | null;
  weight: number;
  status: "draft" | "submitted" | "approved" | "rejected";
};

type Designation = { id: number; designation_name: string };

const BADGE: Record<string, { bg: string; color: string; label: string }> = {
  approved:  { bg: "#dcfce7", color: "#16a34a", label: "Approved" },
  submitted: { bg: "#dbeafe", color: "#1d4ed8", label: "Submitted" },
  draft:     { bg: "#f3f4f6", color: "#6b7280", label: "Draft" },
  rejected:  { bg: "#fef2f2", color: "#ef4444", label: "Rejected" },
};

const AREA_COLORS: Record<string, string> = {
  Primary: "#7c3aed",
  "Stretch / Growth Opportunities": "#0891b2",
  "Value Adds": "#059669",
  Learning: "#d97706",
  "Process Adherence": "#1d4ed8",
  "Work from office": "#6b7280",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState<number | null>(null);
  const [currentDesignation, setCurrentDesignation] = useState<Designation | null>(null);
  const [goalsEditable, setGoalsEditable] = useState(false);
  const [cycleName, setCycleName] = useState("");
  const [goalsSubmitted, setGoalsSubmitted] = useState(false);
  const [goalsApproved, setGoalsApproved] = useState(false);
  const [goalWindowOpen, setGoalWindowOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/employee/goals").then((r) => r.json()),
      fetch("/api/employee/kpi-designations").then((r) => r.json()),
    ])
      .then(([goalsData, desData]) => {
        if (goalsData.goals) setGoals(goalsData.goals);
        if (goalsData.cycle) {
          setCycleName(goalsData.cycle.name || "");
          setGoalWindowOpen(goalsData.cycle.goalWindowOpen || false);
        }
        if (goalsData.goalsEditable !== undefined) setGoalsEditable(goalsData.goalsEditable);
        if (goalsData.appraisal) {
          setGoalsSubmitted(!!goalsData.appraisal.goalsSubmittedAt);
          setGoalsApproved(!!goalsData.appraisal.goalsApprovedAt);
          if (goalsData.appraisal.designationId) setSelectedDesignation(goalsData.appraisal.designationId);
        }
        if (goalsData.designation) setCurrentDesignation(goalsData.designation);
        if (desData.designations) setDesignations(desData.designations);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalWeight = goals.reduce((s, g) => s + (g.weight || 0), 0);

  const loadTemplate = async (designationId: number) => {
    setError("");
    setLoadingTemplate(true);
    try {
      const res = await fetch("/api/employee/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designation_id: designationId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setGoals(data.goals);
      setSelectedDesignation(designationId);
      const des = designations.find((d) => d.id === designationId);
      if (des) setCurrentDesignation(des);
    } catch (e: any) { setError(e.message); }
    finally { setLoadingTemplate(false); }
  };

  const startEdit = (g: Goal) => { setEditId(g.id); setForm({ ...g }); };
  const cancelEdit = () => { setEditId(null); setForm({}); };
  const saveEdit = async () => {
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

  const handleSubmit = async () => {
    setError("");
    try {
      const res = await fetch("/api/employee/goals/submit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setShowConfirm(false); return; }
      setGoalsSubmitted(true);
      setGoalsEditable(false);
      setGoals(goals.map((g) => ({ ...g, status: g.status === "draft" ? "submitted" as const : g.status })));
      setShowConfirm(false);
    } catch (e: any) { setError(e.message); }
  };

  // Group goals by area for row-spanning display
  const getAreaSpans = () => {
    const spans: { area: string; startIdx: number; count: number }[] = [];
    let currentArea: string | null = null;
    for (let i = 0; i < goals.length; i++) {
      const area = goals[i].area || "Other";
      if (area !== currentArea) {
        spans.push({ area, startIdx: i, count: 1 });
        currentArea = area;
      } else if (spans.length > 0) {
        spans[spans.length - 1].count++;
      }
    }
    return spans;
  };
  const areaSpans = getAreaSpans();
  const isFirstInArea = (idx: number) => areaSpans.some((s) => s.startIdx === idx);
  const getAreaSpan = (idx: number) => areaSpans.find((s) => s.startIdx === idx);

  const inp: React.CSSProperties = {
    width: "100%", border: "1px solid #d8b4fe", borderRadius: 6,
    padding: "5px 8px", fontSize: 12, outline: "none", background: "#faf8ff",
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af" }}>Loading goals...</div>;

  return (
    <div style={{ maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>My Goals</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>
            {cycleName} · Total Weight: <span style={{ color: totalWeight === 100 ? "#10b981" : "#f59e0b", fontWeight: 700 }}>{totalWeight}%</span>
            {currentDesignation && <span> · Designation: <span style={{ color: "#7c3aed", fontWeight: 600 }}>{currentDesignation.designation_name}</span></span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 10, padding: "6px 14px", fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>
            Goal window: <span style={{ color: goalWindowOpen ? "#10b981" : "#ef4444" }}>{goalWindowOpen ? "Open" : "Closed"}</span>
          </div>
          {goalsEditable && goals.length > 0 && !goalsSubmitted && (
            <button onClick={() => setShowConfirm(true)} disabled={totalWeight !== 100} style={{ background: totalWeight === 100 ? "linear-gradient(135deg,#10b981,#059669)" : "#e5e7eb", color: totalWeight === 100 ? "#fff" : "#9ca3af", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 600, fontSize: 13, cursor: totalWeight === 100 ? "pointer" : "not-allowed" }}>
              Submit Goals
            </button>
          )}
          {goalsSubmitted && !goalsApproved && (
            <div style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 13 }}>📤 Submitted</div>
          )}
          {goalsApproved && (
            <div style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 13 }}>✓ Approved</div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Designation Selector */}
      {goals.length === 0 && goalsEditable && (
        <div style={{ background: "#fff", borderRadius: 16, padding: "32px", border: "1px solid #ede9fe", textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>Select Your Designation</h3>
          <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 24 }}>Choose your role to load pre-defined KPI goals</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {designations.map((d) => (
              <button key={d.id} onClick={() => loadTemplate(d.id)} disabled={loadingTemplate} style={{ background: "#fff", color: "#374151", border: "2px solid #ede9fe", borderRadius: 12, padding: "14px 28px", fontSize: 14, fontWeight: 700, cursor: loadingTemplate ? "wait" : "pointer" }}>
                {d.designation_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Change designation */}
      {goals.length > 0 && goalsEditable && !goalsSubmitted && (
        <div style={{ background: "#f5f3ff", borderRadius: 12, padding: "10px 18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #ede9fe" }}>
          <p style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600 }}>Designation: {currentDesignation?.designation_name}</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={selectedDesignation || ""} onChange={(e) => { if (e.target.value) loadTemplate(Number(e.target.value)); }} style={{ border: "1px solid #c4b5fd", borderRadius: 8, padding: "5px 10px", fontSize: 12, outline: "none", background: "#fff" }}>
              <option value="" disabled>Change...</option>
              {designations.map((d) => <option key={d.id} value={d.id}>{d.designation_name}</option>)}
            </select>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>⚠️ Resets draft goals</span>
          </div>
        </div>
      )}

      {/* Goals Table — Excel layout */}
      {goals.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", overflow: "hidden", boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>
          {/* Header */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }}>
                {["Area", "KPI", "Measurable Metric / Target", "Expected in a month", "Weight (%)", "Status", ""].map((h) => (
                  <th key={h} style={{ color: "#fff", padding: "12px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "left", borderRight: "1px solid rgba(255,255,255,0.15)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {goals.map((g, idx) => {
                const areaSpan = getAreaSpan(idx);
                const showArea = isFirstInArea(idx);
                const areaColor = AREA_COLORS[g.area || ""] || "#7c3aed";
                const isEditing = editId === g.id;

                return (
                  <tr key={g.id} style={{ background: idx % 2 === 0 ? "#fff" : "#faf8ff", borderBottom: "1px solid #f3f0ff" }}>
                    {/* Area cell with rowSpan */}
                    {showArea && (
                      <td rowSpan={areaSpan!.count} style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: areaColor, verticalAlign: "top", borderRight: "1px solid #f3f0ff", background: areaColor + "08", width: 140, borderBottom: "2px solid " + areaColor + "30" }}>
                        {g.area || "—"}
                      </td>
                    )}

                    {/* KPI */}
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151", borderRight: "1px solid #f3f0ff", width: 200 }}>
                      {isEditing ? (
                        <input value={form.kpi ?? ""} onChange={(e) => setForm({ ...form, kpi: e.target.value })} style={inp} />
                      ) : (
                        g.kpi || "—"
                      )}
                    </td>

                    {/* Metric */}
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b7280", borderRight: "1px solid #f3f0ff" }}>
                      {isEditing ? (
                        <input value={form.metric ?? ""} onChange={(e) => setForm({ ...form, metric: e.target.value })} style={inp} />
                      ) : (
                        g.metric || "—"
                      )}
                    </td>

                    {/* Expected in a month */}
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#374151", fontWeight: 600, borderRight: "1px solid #f3f0ff", width: 140 }}>
                      {isEditing ? (
                        <input value={form.expected_monthly ?? ""} onChange={(e) => setForm({ ...form, expected_monthly: e.target.value })} style={inp} />
                      ) : (
                        g.expected_monthly || g.target || "—"
                      )}
                    </td>

                    {/* Weight */}
                    <td style={{ padding: "10px 14px", textAlign: "center", borderRight: "1px solid #f3f0ff", width: 80 }}>
                      {isEditing ? (
                        <input type="number" value={form.weight ?? 0} onChange={(e) => setForm({ ...form, weight: +e.target.value })} style={{ ...inp, textAlign: "center" }} min={0} max={100} />
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 800, color: g.weight > 0 ? "#7c3aed" : "#d1d5db" }}>{g.weight || ""}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "10px 14px", borderRight: "1px solid #f3f0ff", width: 80 }}>
                      <span style={{ background: BADGE[g.status].bg, color: BADGE[g.status].color, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{BADGE[g.status].label}</span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "10px 10px", width: 70 }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={saveEdit} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>✓</button>
                          <button onClick={cancelEdit} style={{ background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
                        </div>
                      ) : (
                        g.status === "draft" && goalsEditable && (
                          <button onClick={() => startEdit(g)} style={{ background: "none", border: "1px solid #d8b4fe", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#7c3aed", cursor: "pointer" }}>Edit</button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Total row */}
              <tr style={{ background: "#f5f3ff", borderTop: "2px solid #7c3aed" }}>
                <td colSpan={3} />
                <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 800, color: "#374151", textAlign: "right" }}>Total</td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: totalWeight === 100 ? "#10b981" : "#ef4444" }}>{totalWeight}</span>
                </td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Submit Modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420 }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🎯</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Submit Goals for Approval?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Submitting <strong>{goals.length} goals</strong> ({currentDesignation?.designation_name}) with total weight <strong>{totalWeight}%</strong>. You cannot edit after submission.
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