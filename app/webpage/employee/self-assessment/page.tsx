// app/webpage/self-assessment/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, FileText, Send, X } from "lucide-react";

type DropdownOption = { order: number; text: string };
type Evidence = { id: number; goal_id: number; month: string; description: string };
type GoalSA = {
  id: number;
  goal_no: number;
  area: string | null;
  kpi: string | null;
  description: string;
  metric: string | null;
  target: string | null;
  sa_kpi_label: string | null;
  option_key?: string | null;
  self_assessment: string | null;
  manager_feedback: string | null;
  team_lead_review: string | null;
  performance_rating: number | null;
  evidence: Evidence[];
  dropdownOptions: DropdownOption[];
};

function normalizeLabel(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const ui: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1080, display: "grid", gap: 16 },
  card: {
    background: "#fff",
    border: "1px solid var(--color-border)",
    borderRadius: 16,
    boxShadow: "var(--shadow-soft)",
  },
  input: {
    width: "100%",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
    color: "var(--color-text-body)",
  },
};

export default function SelfAssessmentPage({
  inlineWithSectionHeading = false,
  showProgress = true,
}: {
  inlineWithSectionHeading?: boolean;
  showProgress?: boolean;
}) {
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

  const saveTimers = useRef<Record<number, NodeJS.Timeout>>({});
  const evidenceTimers = useRef<Record<number, NodeJS.Timeout>>({});

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

  const saveSA = async (goalId: number, text: string, immediate?: boolean) => {
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, self_assessment: text } : g)));

    const doSave = async () => {
      setSaving((s) => ({ ...s, [goalId]: true }));
      try {
        await fetch(`/api/employee/self-assessment/${goalId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ self_assessment: text }),
        });
      } catch (e) {
        console.error("Save failed:", e);
      }
      setSaving((s) => ({ ...s, [goalId]: false }));
    };

    if (immediate) {
      await doSave();
    } else {
      if (saveTimers.current[goalId]) clearTimeout(saveTimers.current[goalId]);
      saveTimers.current[goalId] = setTimeout(doSave, 800);
    }
  };

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
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, evidence: [...g.evidence, data.evidence] } : g)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add evidence");
    }
  };

  const updateEvidence = (goalId: number, evId: number, field: "month" | "description", value: string) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, evidence: g.evidence.map((e) => (e.id === evId ? { ...e, [field]: value } : e)) }
          : g,
      ),
    );

    if (evidenceTimers.current[evId]) clearTimeout(evidenceTimers.current[evId]);
    evidenceTimers.current[evId] = setTimeout(async () => {
      const latestGoal = goals.find((g) => g.id === goalId);
      const ev = latestGoal?.evidence.find((e) => e.id === evId);
      if (!ev) return;
      const updated = { ...ev, [field]: value };
      await fetch(`/api/employee/evidence/item/${evId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: updated.month, description: updated.description }),
      });
    }, 800);
  };

  const removeEvidence = async (goalId: number, evId: number) => {
    setError("");
    const res = await fetch(`/api/employee/evidence/item/${evId}`, { method: "DELETE" });
    if (res.ok) {
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, evidence: g.evidence.filter((e) => e.id !== evId) } : g)));
    }
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const res = await fetch("/api/employee/self-assessment/submit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSubmitted(true);
      setSaEditable(false);
      setShowConfirm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit self assessment");
    }
  };

  if (loading) {
    return (
      <div style={{ ...ui.card, minHeight: 200, display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        Loading self assessment...
      </div>
    );
  }

  return (
    <div style={ui.page}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 16,
          marginTop: inlineWithSectionHeading ? -56 : 0,
        }}
      >

        {!submitted && saEditable && (
          <button className="btn btn-primary" onClick={() => setShowConfirm(true)}>
            Submit Assessment
          </button>
        )}

        {submitted && (
          <div className="status-pill status-approved" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px" }}>
            <CheckCircle2 size={16} /> Submitted — Awaiting Manager Review
          </div>
        )}
      </div>

      {error && (
        <div style={{ ...ui.card, borderColor: "#fecaca", background: "#fff5f5", color: "#b91c1c", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ border: 0, background: "transparent", color: "#b91c1c", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {showProgress && (
        <div style={{ ...ui.card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-heading)" }}>Assessment Progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-orange-500)" }}>
                {filled} / {goals.length} goals filled
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #f26522 0%, #1f3a68 100%)",
                  transition: "width var(--duration-medium) var(--ease-enterprise)",
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--color-text-heading)" }}>{pct}%</div>
        </div>
      )}

      {goals.length === 0 && (
        <div style={{ ...ui.card, padding: "44px 20px", textAlign: "center" }}>
          <FileText size={44} color="var(--color-navy-700)" />
          <h3 style={{ margin: "10px 0 0", fontSize: 22, color: "var(--color-text-heading)" }}>No goals to assess</h3>
          <p style={{ marginTop: 6, color: "var(--color-text-muted)", fontSize: 14 }}>
            Goals must be set and approved before self-assessment can begin.
          </p>
        </div>
      )}

      {goals.map((g) => {
        const optionKey = normalizeLabel(g.option_key || g.sa_kpi_label || g.kpi || g.metric);
        const hasDropdown = !!optionKey && (g.dropdownOptions?.length || 0) > 0;
        const displayKpi = g.kpi || g.sa_kpi_label || g.metric || g.area || g.description;
        const isOpen = expanded === g.id;

        return (
          <div
            key={g.id}
            style={{
              ...ui.card,
              borderColor: isOpen ? "#ffd7c2" : "var(--color-border)",
              boxShadow: isOpen ? "var(--shadow-hover)" : "var(--shadow-soft)",
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => setExpanded(isOpen ? null : g.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                cursor: "pointer",
                background: isOpen ? "#fff8f3" : "#fff",
                borderBottom: isOpen ? "1px solid var(--color-border)" : "none",
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--color-navy-700)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {g.goal_no}
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-heading)" }}>
                  {g.area && <span style={{ color: "var(--color-navy-700)" }}>{g.area}</span>}
                  {g.area && displayKpi && displayKpi !== g.area && " — "}
                  {displayKpi}
                </p>
                {displayKpi && (
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                    KPI: {displayKpi}
                  </p>
                )}
                {(g.metric || g.target) && (
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                    {g.metric ? `Metric: ${g.metric}` : "Metric: —"}
                    {g.target ? ` · Target: ${g.target}` : ""}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {!!g.self_assessment?.trim() && (
                  <span className="status-pill status-approved" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Check size={12} /> Filled
                  </span>
                )}
                {g.evidence.length > 0 && (
                  <span className="status-pill" style={{ background: "#eef6ff", color: "var(--color-navy-700)" }}>
                    {g.evidence.length} evidence
                  </span>
                )}
                {saving[g.id] && <span style={{ color: "var(--color-text-muted)", fontSize: 11 }}>Saving...</span>}
                <span style={{ color: "var(--color-text-muted)", fontSize: 18 }}>{isOpen ? "▴" : "▾"}</span>
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: "16px 20px 20px", display: "grid", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
                  <div>
                    {/* <label className="field-label">
                      Self Assessment {hasDropdown ? <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(select from options)</span> : <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(write based on metric/target)</span>}
                    </label> */}

                    {hasDropdown ? (
                      <div>
                        <select
                          value={g.self_assessment || ""}
                          onChange={(e) => saveSA(g.id, e.target.value, true)}
                          disabled={!saEditable}
                          className="field-select"
                          style={{ background: saEditable ? "#fff" : "#f8fafc" }}
                        >
                          <option value="">— Select your assessment —</option>
                          {g.dropdownOptions.map((opt) => (
                            <option key={opt.order} value={opt.text}>
                              {opt.text}
                            </option>
                          ))}
                        </select>

                        {g.self_assessment && (
                          <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, border: "1px solid #ffd7c2", background: "#fff8f3" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-orange-500)" }} />
                              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-heading)", fontWeight: 600 }}>{g.self_assessment}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--color-text-muted)" }}>
                          No predefined options found. Please assess against the metric shown.
                        </p>
                        <textarea
                          disabled={!saEditable}
                          rows={4}
                          placeholder="Describe your achievement against this goal/metric and include measurable outcomes."
                          value={g.self_assessment || ""}
                          onChange={(e) => saveSA(g.id, e.target.value)}
                          className="field-textarea"
                          style={{ background: saEditable ? "#fff" : "#f8fafc" }}
                        />
                      </>
                    )}
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <label className="field-label" style={{ marginBottom: 0 }}>
                        Supporting Evidence / Data <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({g.evidence.length}/12 rows)</span>
                      </label>
                      {!saEditable && (
                        <span className="status-pill status-draft" style={{ border: "1px solid var(--color-border)" }}>
                          Locked
                        </span>
                      )}
                    </div>

                    {g.evidence.length === 0 ? (
                      saEditable ? (
                        <button
                          className="btn btn-secondary"
                          onClick={() => addEvidence(g.id)}
                          style={{ width: "100%", minHeight: 46, justifyContent: "center" }}
                        >
                          + Add Row
                        </button>
                      ) : (
                        <div style={{ textAlign: "center", padding: "14px", borderRadius: 10, border: "1px dashed var(--color-border)", color: "var(--color-text-muted)", fontSize: 13, background: "#f8fafc" }}>
                          No evidence added. Evidence entry is locked after self-assessment submission.
                        </div>
                      )
                    ) : (
                      g.evidence.map((ev) => (
                        <div key={ev.id} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                          <select
                            value={ev.month}
                            onChange={(e) => updateEvidence(g.id, ev.id, "month", e.target.value)}
                            disabled={!saEditable}
                            className="field-select"
                            style={{ width: 92, minHeight: 38 }}
                          >
                            {MONTHS.map((m) => (
                              <option key={m}>{m}</option>
                            ))}
                          </select>
                          <input
                            value={ev.description}
                            onChange={(e) => updateEvidence(g.id, ev.id, "description", e.target.value)}
                            disabled={!saEditable}
                            placeholder="Evidence description..."
                            className="field-input"
                            style={{ minHeight: 38, flex: 1 }}
                          />
                          {saEditable && (
                            <button
                              onClick={() => removeEvidence(g.id, ev.id)}
                              style={{
                                minHeight: 38,
                                minWidth: 38,
                                border: "1px solid #fecaca",
                                borderRadius: 10,
                                background: "#fff5f5",
                                color: "#b91c1c",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <label className="field-label">
                      Teamlead Assessment <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(read-only)</span>
                    </label>
                    <textarea
                      rows={4}
                      readOnly
                      placeholder="Teamlead assessment will appear here after review..."
                      value={g.team_lead_review || ""}
                      className="field-textarea"
                      style={{ background: "#f8fafc", color: "var(--color-text-muted)", cursor: "default" }}
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      Manager Assessment <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(read-only)</span>
                    </label>
                    <textarea
                      rows={4}
                      readOnly
                      placeholder="Manager assessment will appear here after review..."
                      value={g.manager_feedback || ""}
                      className="field-textarea"
                      style={{ background: "#f8fafc", color: "var(--color-text-muted)", cursor: "default" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,.38)", display: "grid", placeItems: "center", zIndex: 100, padding: 16 }}>
          <div style={{ ...ui.card, width: "100%", maxWidth: 460, padding: 28 }}>
            <div style={{ width: 52, height: 52, background: "#fff8f3", border: "1px solid #ffd7c2", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Send size={24} color="var(--color-orange-500)" />
            </div>
            <h3 style={{ margin: 0, fontSize: 24, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Submit Self Assessment</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Once submitted, you cannot edit your responses. Your reporting manager will be notified.
            </p>
            {error && <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
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
