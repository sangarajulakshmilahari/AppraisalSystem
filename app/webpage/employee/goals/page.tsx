// app/webpage/goals/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Send,
  Target,
  X,
} from "lucide-react";

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
  is_custom?: number;
  created_by?: string;
};

type Designation = {
  id?: number;
  designation_name: string;
};

type GoalForm = Partial<Goal> & {
  area_id?: number | null;
  description?: string | null;
  target?: string | null;
  timeline?: string | null;
};

const BADGE: Record<string, { className: string; label: string }> = {
  approved: { className: "status-pill status-approved", label: "Approved" },
  submitted: { className: "status-pill status-submitted", label: "Submitted" },
  draft: { className: "status-pill status-draft", label: "Draft" },
  rejected: { className: "status-pill status-rejected", label: "Rejected" },
};

const AREA_COLORS: Record<string, string> = {
  Primary: "#1f3a68",
  "Stretch / Growth Opportunities": "#0f766e",
  "Value Adds": "#166534",
  Learning: "#b45309",
  "Process Adherence": "#334155",
  "Work from office": "#64748b",
};

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1320, display: "grid", gap: 16 },
  card: {
    background: "#fff",
    border: "1px solid var(--color-border)",
    borderRadius: 16,
    boxShadow: "var(--shadow-soft)",
  },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  title: { margin: 0, fontSize: 30, color: "var(--color-text-heading)", letterSpacing: "-0.02em" },
  subtitle: { margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 },
  topActions: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid var(--color-border)",
    borderRadius: 16,
    background: "#fff",
    boxShadow: "var(--shadow-soft)",
  },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1120 },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: "#fff",
    color: "var(--color-text-heading)",
    textTransform: "uppercase",
    letterSpacing: ".05em",
    fontSize: 11,
    fontWeight: 700,
    textAlign: "left",
    padding: "12px 14px",
    borderBottom: "1px solid var(--color-border)",
    borderRight: "1px solid #f1f5f9",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 14px",
    fontSize: 13,
    color: "var(--color-text-body)",
    borderBottom: "1px solid #f1f5f9",
    borderRight: "1px solid #f8fafc",
    verticalAlign: "top",
  },
  input: {
    width: "100%",
    minHeight: 38,
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    padding: "0 10px",
    fontSize: 13,
    color: "var(--color-text-body)",
    outline: "none",
  },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [designation, setDesignation] = useState<Designation | null>(null);
  const [goalsEditable, setGoalsEditable] = useState(false);
  const [cycleName, setCycleName] = useState("");
  const [goalsSubmitted, setGoalsSubmitted] = useState(false);
  const [goalsApproved, setGoalsApproved] = useState(false);
  const [goalWindowOpen, setGoalWindowOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<GoalForm>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [rejectingGoalId, setRejectingGoalId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [designations, setDesignations] = useState<{ id: number; designation_name: string }[]>([]);
  const [selectedDesignationId, setSelectedDesignationId] = useState<number | null>(null);
  const [loadingDesignations, setLoadingDesignations] = useState(false);

  useEffect(() => {
    fetch("/api/employee/goals")
      .then((r) => r.json())
      .then((data) => {
        if (data.goals) setGoals(data.goals);
        if (data.cycle) {
          setCycleName(data.cycle.name || "");
          setGoalWindowOpen(data.cycle.goalWindowOpen || false);
        }
        if (data.goalsEditable !== undefined) setGoalsEditable(data.goalsEditable);
        if (data.appraisal) {
          setGoalsSubmitted(!!data.appraisal.goalsSubmittedAt);
          setGoalsApproved(!!data.appraisal.goalsApprovedAt);
        }
        if (data.designation) {
          setDesignation(data.designation);
          setSelectedDesignationId(data.designation.id);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!designation) {
      setLoadingDesignations(true);
      fetch("/api/employee/kpi-designations")
        .then((r) => r.json())
        .then((data) => {
          if (data.designations) setDesignations(data.designations);
        })
        .catch((e) => console.error("Failed to load designations:", e))
        .finally(() => setLoadingDesignations(false));
    }
  }, [designation]);

  const totalWeight = useMemo(() =>
    goals.reduce((s, g) => {
      // Include weight if:
      // 1. Goal is not rejected (status !== 'rejected')
      // 2. AND (goal is custom OR goal is accepted/submitted/draft)
      // Actually simpler: exclude rejected goals only
      if (g.status === 'rejected') {
        return s; // Don't add weight for rejected goals
      }
      return s + (g.weight || 0);
    }, 0),
    [goals]
  );

  const cancelEdit = () => {
    setEditId(null);
    setForm({});
  };

  const saveEdit = async () => {
    setError("");
    try {
      const res = await fetch(`/api/employee/goals/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setGoals(goals.map((g) => (g.id === editId ? data.goal : g)));
      setEditId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update goal");
    }
  };

  const addCustomGoal = async () => {
    setError("");
    try {
      const res = await fetch("/api/employee/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_custom_goal" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add custom goal");
        return;
      }

      const updatedGoals: Goal[] = data.goals || [];
      setGoals(updatedGoals);

      // Make the newly added custom goal immediately editable.
      const newestCustomDraft = [...updatedGoals]
        .reverse()
        .find((g) => !!g.is_custom && g.status === "draft");

      if (newestCustomDraft) {
        setEditId(newestCustomDraft.id);
        setForm({ ...newestCustomDraft });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add custom goal");
    }
  };

  const acceptGoal = async (goalId: number) => {
    setError("");
    try {
      const res = await fetch(`/api/employee/goals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, action: "accept" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to accept goal");
        return;
      }

      if (data.goals) {
        setGoals(data.goals);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to accept goal");
    }
  };

  const rejectGoal = async (goalId: number, reason: string) => {
    setError("");
    try {
      const res = await fetch(`/api/employee/goals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, action: "reject", reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reject goal");
        return;
      }

      if (data.goals) {
        setGoals(data.goals);
      }
      setRejectingGoalId(null);
      setRejectionReason("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reject goal");
    }
  };

  const handleDesignationSelect = async (designationId: number) => {
    if (!designationId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/employee/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designation_id: designationId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setGoals(data.goals);
      // Refresh designation
      const designationRes = await fetch("/api/employee/goals");
      const designationData = await designationRes.json();
      if (designationData.designation) {
        setDesignation(designationData.designation);
        setSelectedDesignationId(designationData.designation.id);
      }
    } catch (e: any) {
      alert("Failed to load goals for selected designation: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const res = await fetch("/api/employee/goals/submit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setShowConfirm(false);
        return;
      }
      setGoalsSubmitted(true);
      setGoalsEditable(false);
      setGoals(goals.map((g) => ({ ...g, status: g.status === "draft" ? "submitted" : g.status })));
      setShowConfirm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit goals");
    }
  };

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

  if (loading) {
    return (
      <div style={{ ...styles.card, minHeight: 180, display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        Loading goals...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <section style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>My Goals</h1>
          <p style={styles.subtitle}>
            {cycleName} · Total Weight: <strong style={{ color: totalWeight === 100 ? "#16a34a" : "#d97706" }}>{totalWeight}%</strong>
            {designation && (
              <span>
                {" "}· Designation: <strong style={{ color: "var(--color-text-heading)" }}>{designation.designation_name}</strong>
                {goalsEditable && (
                  <span style={{ marginLeft: 8 }}>
                    <select
                      value={selectedDesignationId || ""}
                      onChange={(e) => {
                        const id = parseInt(e.target.value);
                        if (id) handleDesignationSelect(id);
                      }}
                      style={{
                        fontSize: 12,
                        padding: "2px 6px",
                        borderRadius: 4,
                        border: "1px solid var(--color-border)",
                        background: "#fff",
                        color: "var(--color-text-body)",
                      }}
                    >
                      <option value="">Change...</option>
                      {designations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.designation_name}
                        </option>
                      ))}
                    </select>
                  </span>
                )}
              </span>
            )}
            {!designation && designations.length > 0 && (
              <span>
                {" "}· Select Designation:{" "}
                <select
                  value={selectedDesignationId || ""}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    if (id) handleDesignationSelect(id);
                  }}
                  style={{
                    fontSize: 12,
                    padding: "2px 6px",
                    borderRadius: 4,
                    border: "1px solid var(--color-border)",
                    background: "#fff",
                    color: "var(--color-text-body)",
                  }}
                >
                  <option value="">Choose...</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.designation_name}
                    </option>
                  ))}
                </select>
              </span>
            )}
          </p>
        </div>

        <div style={styles.topActions}>
          {goalsEditable && !goalsSubmitted && (
            <button className="btn btn-secondary" onClick={addCustomGoal}>
              Add Custom Goal
            </button>
          )}

          <span
            className="status-pill"
            style={{
              background: goalWindowOpen ? "rgba(22,163,74,.1)" : "rgba(220,38,38,.1)",
              color: goalWindowOpen ? "#16a34a" : "#dc2626",
            }}
          >
            Goal window: {goalWindowOpen ? "Open" : "Closed"}
          </span>

          {goalsEditable && goals.length > 0 && !goalsSubmitted && (
            <button className="btn btn-primary" onClick={() => setShowConfirm(true)} disabled={totalWeight !== 100}>
              Submit Goals
            </button>
          )}

          {goalsSubmitted && !goalsApproved && (
            <div className="status-pill status-submitted" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px" }}>
              <Send size={14} /> Submitted
            </div>
          )}

          {goalsApproved && (
            <div className="status-pill status-approved" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px" }}>
              <CheckCircle2 size={14} /> Approved
            </div>
          )}
        </div>
      </section>

      {error && (
        <div
          style={{
            ...styles.card,
            padding: "12px 14px",
            borderColor: "#fecaca",
            background: "#fff5f5",
            color: "#b91c1c",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          <button aria-label="Close" onClick={() => setError("")} style={{ border: 0, background: "transparent", color: "#b91c1c", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {goals.length === 0 && !designation && (
        <section style={{ ...styles.card, padding: 28, textAlign: "center" }}>
          <div style={{ display: "grid", placeItems: "center", marginBottom: 12 }}>
            <Target size={36} color="#1f3a68" />
          </div>
          <h3 style={{ margin: 0, fontSize: 22, color: "var(--color-text-heading)" }}>Select Designation to Load Goals</h3>
          <p style={{ margin: "8px auto 0", maxWidth: 640, color: "var(--color-text-muted)", fontSize: 14 }}>
            Project role is now selected manually. Choose your designation from the dropdown above to load KPI goals.
          </p>
        </section>
      )}

      {/* {designation && (
        <div
          style={{
            ...styles.card,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderColor: "#ffd7c2",
            background: "#fff8f3",
          }}
        >
          <Target size={18} color="#f26522" />
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-heading)", fontWeight: 600 }}>
            KPI template aligned for {designation.designation_name}
            {aaramEmployee?.name ? <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}> · {aaramEmployee.name} ({aaramEmployee.employeeId})</span> : null}
          </p>
        </div>
      )} */}

      {goals.length > 0 && (
        <section style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {[
                  "Area",
                  "KPI",
                  "Measurable Metric / Target",
                  "Expected in a month",
                  "Weight (%)",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} style={styles.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {goals.map((g, idx) => {
                const areaSpan = getAreaSpan(idx);
                const showArea = isFirstInArea(idx);
                const areaColor = AREA_COLORS[g.area || ""] || "#1f3a68";
                const isEditing = editId === g.id;
                return (
                  <tr key={g.id} style={{ background: idx % 2 === 0 ? "#fff" : "#fcfdff" }}>
                    {showArea && (
                      <td
                        rowSpan={areaSpan?.count}
                        style={{
                          ...styles.td,
                          width: 160,
                          background: `${areaColor}0f`,
                          color: areaColor,
                          fontWeight: 700,
                          borderRight: `1px solid ${areaColor}25`,
                        }}
                      >
                        {g.area || "—"}
                      </td>
                    )}

                    <td style={{ ...styles.td, width: 260 }}>
                      {isEditing ? (
                        <input
                          value={form.kpi ?? ""}
                          onChange={(e) => setForm({ ...form, kpi: e.target.value })}
                          style={styles.input}
                        />
                      ) : (
                        <>
                          <span>{g.kpi || "—"}</span>
                          {!!g.is_custom && (
                            <span className="status-pill" style={{ marginLeft: 8, background: "#fff1e9", color: "#f26522" }}>
                              Custom
                            </span>
                          )}
                        </>
                      )}
                    </td>

                    <td style={styles.td}>
                      {isEditing ? (
                        <input
                          value={form.metric ?? ""}
                          onChange={(e) => setForm({ ...form, metric: e.target.value })}
                          style={styles.input}
                        />
                      ) : (
                        g.metric || "—"
                      )}
                    </td>

                    <td style={{ ...styles.td, width: 220 }}>
                      {isEditing ? (
                        <input
                          value={form.expected_monthly ?? ""}
                          onChange={(e) => setForm({ ...form, expected_monthly: e.target.value })}
                          style={styles.input}
                        />
                      ) : (
                        g.expected_monthly || g.target || "—"
                      )}
                    </td>

                    <td style={{ ...styles.td, width: 110, textAlign: "center" }}>
                      {isEditing ? (
                        <input
                          type="number"
                          value={form.weight ?? 0}
                          onChange={(e) => setForm({ ...form, weight: +e.target.value })}
                          style={{ ...styles.input, textAlign: "center" }}
                          min={0}
                          max={100}
                        />
                      ) : (
                        <strong style={{ color: g.weight > 0 ? "var(--color-text-heading)" : "#cbd5e1" }}>{g.weight || ""}</strong>
                      )}
                    </td>

                    <td style={{ ...styles.td, width: 110 }}>
                      <span className={BADGE[g.status].className}>{BADGE[g.status].label}</span>
                    </td>

                    <td style={{ ...styles.td, width: 190 }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-primary" onClick={saveEdit} style={{ minHeight: 34, padding: "0 10px" }}>
                            <Check size={14} />
                          </button>
                          <button className="btn btn-secondary" onClick={cancelEdit} style={{ minHeight: 34, padding: "0 10px" }}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        g.status === "draft" &&
                        goalsEditable &&
                        g.created_by &&
                        (g.created_by.toLowerCase().includes('manager') ||
                         g.created_by.toLowerCase().includes('mgr') ||
                         g.created_by.toLowerCase().includes('manger')) && (
                          <div style={{ display: "flex", gap: 8 }}>
                            {rejectingGoalId === g.id ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 200 }}>
                                <textarea
                                  placeholder="Enter rejection reason..."
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  style={{
                                    padding: 8,
                                    border: "1px solid #fecaca",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    minHeight: 60,
                                  }}
                                />
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => rejectGoal(g.id, rejectionReason)}
                                    disabled={!rejectionReason.trim()}
                                    style={{ minHeight: 34, padding: "0 10px", fontSize: 12 }}
                                  >
                                    Submit Rejection
                                  </button>
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                      setRejectingGoalId(null);
                                      setRejectionReason("");
                                    }}
                                    style={{ minHeight: 34, padding: "0 10px", fontSize: 12 }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  className="btn btn-ghost"
                                  onClick={() => acceptGoal(g.id)}
                                  style={{
                                    minHeight: 34,
                                    padding: "0 10px",
                                    border: "1px solid #86efac",
                                    color: "#166534",
                                    background: "#f0fdf4",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <Check size={14} /> Accept
                                </button>
                                <button
                                  className="btn btn-ghost"
                                  onClick={() => {
                                    setRejectingGoalId(g.id);
                                    setRejectionReason("");
                                  }}
                                  style={{
                                    minHeight: 34,
                                    padding: "0 10px",
                                    border: "1px solid #fecaca",
                                    color: "#b91c1c",
                                    background: "#fff5f5",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <X size={14} /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}

              <tr style={{ background: "#fff8f3" }}>
                <td colSpan={3} style={{ ...styles.td, borderBottom: 0 }} />
                <td style={{ ...styles.td, fontWeight: 700, textAlign: "right", color: "var(--color-text-heading)", borderBottom: 0 }}>
                  Total
                </td>
                <td style={{ ...styles.td, textAlign: "center", borderBottom: 0 }}>
                  <strong style={{ color: totalWeight === 100 ? "#16a34a" : "#dc2626", fontSize: 15 }}>{totalWeight}</strong>
                </td>
                <td colSpan={2} style={{ ...styles.td, borderBottom: 0 }} />
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,31,61,.38)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div style={{ ...styles.card, width: "100%", maxWidth: 460, padding: 28 }} role="dialog" aria-modal="true" aria-label="Submit goals confirmation">
            <div style={{ display: "grid", placeItems: "center", marginBottom: 12 }}>
              <Target size={34} color="#f26522" />
            </div>
            <h3 style={{ margin: 0, fontSize: 24, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Submit Goals for Approval</h3>
            <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              Submitting <strong>{goals.length} goals</strong>
              {designation ? <> ({designation.designation_name})</> : null} with total weight <strong>{totalWeight}%</strong>. You cannot edit after submission.
            </p>

            {error && <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 10 }}>{error}</p>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
