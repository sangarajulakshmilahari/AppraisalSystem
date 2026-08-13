// app/webpage/manager/team-assessments/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList, Star, TrendingUp, X } from "lucide-react";

const RATING_LABELS = ["", "Below Expectations", "Needs Improvement", "Meets Expectations", "Exceeds Expectations", "Outstanding"];
const RATING_COLORS = ["", "#dc2626", "#d97706", "#1f3a68", "#16a34a", "#f26522"];

type Evidence = { id: number; month: string; description: string };
type Goal = {
  id: number;
  goal_no: number;
  description: string;
  self_assessment: string | null;
  manager_feedback: string | null;
  performance_rating: number | null;
  evidence: Evidence[];
};

type GoalMember = {
  appraisalId: number;
  employeeName: string;
  selfAssessmentSubmittedAt: string | null;
  managerReviewCompletedAt: string | null;
  teamLeadReviewCompletedAt?: string | null;
  goals: Goal[];
};

type Competency = {
  id: number;
  area_name: string;
  expected_behaviour: string;
  self_rating: number | null;
  manager_rating: number | null;
};

type CompetencyMember = {
  appraisalId: number;
  employeeName: string;
  competencySubmittedAt: string | null;
  managerCompetencySubmittedAt: string | null;
  competencies: Competency[];
};

type DevelopmentEntry = {
  id: number;
  area_name: string;
  action: string;
  timeline: string | null;
  responsible: string;
  status: "not_started" | "in_progress" | "completed";
};

type DevelopmentMember = {
  appraisalId: number;
  employeeName: string;
  total: number;
  completed: number;
  inProgress: number;
  entries: DevelopmentEntry[];
};

const ui: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, display: "grid", gap: 16 },
  card: {
    background: "#fff",
    border: "1px solid var(--color-border)",
    borderRadius: 16,
    boxShadow: "var(--shadow-soft)",
  },
};

export default function TeamAssessmentsPage() {
  const [goalsTeam, setGoalsTeam] = useState<GoalMember[]>([]);
  const [competencyTeam, setCompetencyTeam] = useState<CompetencyMember[]>([]);
  const [developmentTeam, setDevelopmentTeam] = useState<DevelopmentMember[]>([]);

  const [selectedAppraisalId, setSelectedAppraisalId] = useState<number | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewerMode, setReviewerMode] = useState<"team_lead" | "manager">("manager");
  const [planApproved, setPlanApproved] = useState<Record<number, boolean>>({});

  const saveTimers = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/manager/team-assessments").then((r) => r.json()),
      fetch("/api/manager/competency-ratings").then((r) => r.json()),
      fetch("/api/manager/development-plans").then((r) => r.json()),
    ])
      .then(([goalsData, compData, devData]) => {
        const g = goalsData.team || [];
        const c = compData.team || [];
        const d = devData.team || [];

        setGoalsTeam(g);
        setCompetencyTeam(c);
        setDevelopmentTeam(d);
        if (goalsData?.reviewerMode === "team_lead" || compData?.reviewerMode === "team_lead") setReviewerMode("team_lead");
        else setReviewerMode("manager");
      })
      .catch((e) => setError(e.message || "Failed to load team assessments"))
      .finally(() => setLoading(false));
  }, []);

  const employeeList = useMemo(() => {
    const map = new Map<number, { appraisalId: number; employeeName: string }>();
    for (const m of goalsTeam) map.set(m.appraisalId, { appraisalId: m.appraisalId, employeeName: m.employeeName });
    for (const m of competencyTeam) if (!map.has(m.appraisalId)) map.set(m.appraisalId, { appraisalId: m.appraisalId, employeeName: m.employeeName });
    for (const m of developmentTeam) if (!map.has(m.appraisalId)) map.set(m.appraisalId, { appraisalId: m.appraisalId, employeeName: m.employeeName });
    return Array.from(map.values());
  }, [goalsTeam, competencyTeam, developmentTeam]);

  const selectedGoals = goalsTeam.find((m) => m.appraisalId === selectedAppraisalId) || null;
  const selectedComps = competencyTeam.find((m) => m.appraisalId === selectedAppraisalId) || null;
  const selectedDev = developmentTeam.find((m) => m.appraisalId === selectedAppraisalId) || null;

  const saveGoalFeedback = (goalId: number, feedback: string, rating: number | null) => {
    if (saveTimers.current[goalId]) clearTimeout(saveTimers.current[goalId]);
    saveTimers.current[goalId] = setTimeout(async () => {
      await fetch(`/api/manager/review-goal/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manager_feedback: feedback, performance_rating: rating }),
      });
    }, 800);
  };

  const updateGoalField = (goalId: number, field: "manager_feedback" | "performance_rating", value: string | number) => {
    if (!selectedAppraisalId) return;
    setGoalsTeam((prev) =>
      prev.map((t) =>
        t.appraisalId === selectedAppraisalId
          ? {
              ...t,
              goals: t.goals.map((g) => (g.id === goalId ? { ...g, [field]: value } : g)),
            }
          : t,
      ),
    );

    const member = goalsTeam.find((t) => t.appraisalId === selectedAppraisalId);
    const goal = member?.goals.find((g) => g.id === goalId);
    if (goal) {
      const updatedFeedback = field === "manager_feedback" ? String(value) : goal.manager_feedback || "";
      const updatedRating = field === "performance_rating" ? Number(value) : goal.performance_rating;
      saveGoalFeedback(goalId, updatedFeedback, updatedRating);
    }
  };

  const completeGoalReview = async (appraisalId: number) => {
    setError("");
    try {
      const res = await fetch(`/api/manager/complete-review/${appraisalId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to complete review");
        return;
      }
      setGoalsTeam((prev) => prev.map((t) => {
        if (t.appraisalId !== appraisalId) return t;
        if (reviewerMode === "team_lead") {
          return { ...t, teamLeadReviewCompletedAt: new Date().toISOString() };
        }
        return { ...t, managerReviewCompletedAt: new Date().toISOString() };
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to complete review");
    }
  };

  const saveCompetencyRating = async (compId: number, appraisalId: number, rating: number) => {
    const member = competencyTeam.find((t) => t.appraisalId === appraisalId);
    if (member?.managerCompetencySubmittedAt) return;

    setCompetencyTeam((prev) =>
      prev.map((t) =>
        t.appraisalId === appraisalId
          ? {
              ...t,
              competencies: t.competencies.map((c) => (c.id === compId ? { ...c, manager_rating: rating } : c)),
            }
          : t,
      ),
    );

    await fetch(`/api/manager/competencyrate/${compId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manager_rating: rating }),
    });
  };

  const submitCompetencyRatings = async (appraisalId: number) => {
    setError("");
    try {
      const res = await fetch(`/api/manager/competency-ratings/submit/${appraisalId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit competency ratings");
        return;
      }
      setCompetencyTeam((prev) => prev.map((t) => (t.appraisalId === appraisalId ? { ...t, managerCompetencySubmittedAt: new Date().toISOString() } : t)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit competency ratings");
    }
  };

  const approveDevelopmentPlan = async (appraisalId: number) => {
    setError("");
    try {
      const res = await fetch(`/api/manager/development-plans/approve/${appraisalId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to approve development plan");
        return;
      }
      setPlanApproved((prev) => ({ ...prev, [appraisalId]: true }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to approve development plan");
    }
  };

  if (loading) {
    return (
      <div style={{ ...ui.card, minHeight: 180, display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        Loading team assessments...
      </div>
    );
  }

  return (
    <div style={ui.page}>
      <div>
        <h1 style={{ margin: 0, fontSize: 30, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Team Assessments</h1>
        {/* <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
          Open an employee to review Goals Assessment, Competency Assessment, and Development Plan in one page.
        </p> */}
      </div>

      {error && (
        <div style={{ ...ui.card, borderColor: "#fecaca", background: "#fff5f5", color: "#b91c1c", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ border: 0, background: "transparent", color: "#b91c1c", cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      <section style={{ ...ui.card, padding: 16 }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 18, color: "var(--color-text-heading)" }}>Assigned Employees</h2>
        {employeeList.length === 0 ? (
          <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>No employees assigned.</p>
        ) : (
          <>
            <div style={{ display: "grid", gap: 8 }}>
              {employeeList.map((emp) => (
                <button
                  key={emp.appraisalId}
                  onClick={() => setSelectedAppraisalId((prev) => (prev === emp.appraisalId ? null : emp.appraisalId))}
                  style={{
                    textAlign: "left",
                    border: "1px solid var(--color-border)",
                    background: selectedAppraisalId === emp.appraisalId ? "#fff8f3" : "#fff",
                    borderColor: selectedAppraisalId === emp.appraisalId ? "#ffd7c2" : "var(--color-border)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "var(--color-text-heading)",
                  }}
                >
                  {emp.employeeName}
                </button>
              ))}
            </div>

            {selectedAppraisalId ? (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--color-border)", display: "grid", gap: 16 }}>
            {/* <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--color-text-muted)", fontWeight: 600 }}>
              {employeeList.find((e) => e.appraisalId === selectedAppraisalId)?.employeeName}
            </p> */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <ClipboardList size={18} />
              <h2 style={{ margin: 0, fontSize: 20, color: "var(--color-text-heading)" }}>Goals Assessment</h2>
            </div>

            {!selectedGoals ? (
              <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>No goals data available.</p>
            ) : (
              <div>
                {selectedGoals.goals.map((g) => {
                  const isOpen = expandedGoal === g.id;
                  const reviewDone = reviewerMode === "team_lead"
                    ? !!selectedGoals.teamLeadReviewCompletedAt
                    : !!selectedGoals.managerReviewCompletedAt;
                  return (
                    <div key={g.id} style={{ border: "1px solid var(--color-border)", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
                      <div onClick={() => setExpandedGoal(isOpen ? null : g.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", background: "#f8fafc" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--color-navy-700)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12 }}>{g.goal_no}</div>
                        <p style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text-heading)" }}>{g.description}</p>
                        {g.performance_rating ? <span className="status-pill" style={{ background: `${RATING_COLORS[g.performance_rating]}1f`, color: RATING_COLORS[g.performance_rating] }}>{RATING_LABELS[g.performance_rating]}</span> : null}
                        <span style={{ color: "var(--color-text-muted)" }}>{isOpen ? "▴" : "▾"}</span>
                      </div>

                      {isOpen && (
                        <div style={{ padding: "12px 14px" }}>
                          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Employee Self Assessment</p>
                            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.5 }}>{g.self_assessment || "Not filled"}</p>
                          </div>

                          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                            {reviewerMode === "team_lead" ? "Team Lead Feedback" : "Manager Feedback"}
                          </p>
                          <textarea
                            value={g.manager_feedback || ""}
                            onChange={(e) => updateGoalField(g.id, "manager_feedback", e.target.value)}
                            disabled={reviewDone}
                            rows={3}
                            className="field-textarea"
                          />

                          <p style={{ margin: "10px 0 6px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Performance Rating</p>
                          <div style={{ display: "flex", gap: 8 }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                onClick={() => !reviewDone && updateGoalField(g.id, "performance_rating", n)}
                                disabled={reviewDone}
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 10,
                                  border: `1px solid ${g.performance_rating === n ? RATING_COLORS[n] : "var(--color-border)"}`,
                                  background: g.performance_rating === n ? RATING_COLORS[n] : "#fff",
                                  color: g.performance_rating === n ? "#fff" : "var(--color-text-muted)",
                                  fontWeight: 800,
                                  fontSize: 16,
                                  cursor: reviewDone ? "default" : "pointer",
                                }}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!!selectedGoals.selfAssessmentSubmittedAt && !(
                  reviewerMode === "team_lead"
                    ? !!selectedGoals.teamLeadReviewCompletedAt
                    : !!selectedGoals.managerReviewCompletedAt
                ) && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => completeGoalReview(selectedGoals.appraisalId)}
                      disabled={selectedGoals.goals.filter((g) => g.performance_rating !== null).length < selectedGoals.goals.length}
                    >
                      {reviewerMode === "team_lead" ? "Complete Team Lead Review" : "Complete Goals Review"}
                    </button>
                  </div>
                )}
              </div>
            )}
            <div style={{ margin: "16px 0", borderTop: "1px solid var(--color-border)" }} />

          <div style={{ padding: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Star size={18} />
              <h2 style={{ margin: 0, fontSize: 20, color: "var(--color-text-heading)" }}>Competency Assessment</h2>
            </div>

            {!selectedComps ? (
              <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>No competency data available.</p>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {selectedComps.competencies.map((c) => (
                    <div key={c.id} style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: 14 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--color-text-heading)" }}>{c.area_name}</h4>
                      <p style={{ margin: "4px 0 12px", fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>{c.expected_behaviour}</p>
                      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                        {reviewerMode === "team_lead" ? "Team Lead Rating" : "Manager Rating"}
                      </p>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => saveCompetencyRating(c.id, selectedComps.appraisalId, n)}
                            disabled={!!selectedComps.managerCompetencySubmittedAt}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: `1px solid ${c.manager_rating === n ? RATING_COLORS[n] : "var(--color-border)"}`,
                              background: c.manager_rating === n ? RATING_COLORS[n] : "#fff",
                              color: c.manager_rating === n ? "#fff" : "var(--color-text-muted)",
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {!!selectedComps.competencySubmittedAt && !selectedComps.managerCompetencySubmittedAt && (
                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" onClick={() => submitCompetencyRatings(selectedComps.appraisalId)}>
                      Submit Competency Ratings
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

            <div style={{ margin: "16px 0", borderTop: "1px solid var(--color-border)" }} />

          <div style={{ padding: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <TrendingUp size={18} />
              <h2 style={{ margin: 0, fontSize: 20, color: "var(--color-text-heading)" }}>Development Plan</h2>
            </div>

            {!selectedDev ? (
              <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>No development plan data available.</p>
            ) : selectedDev.entries.length === 0 ? (
              <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 13 }}>This employee has not created a development plan yet.</p>
            ) : (
              <>
                <div style={{ display: "grid", gap: 8 }}>
                  {selectedDev.entries.map((e) => (
                    <div key={e.id} style={{ border: "1px solid #f1f5f9", borderRadius: 10, padding: 10 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700 }}>{e.area_name}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-body)" }}>{e.action}</p>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => approveDevelopmentPlan(selectedDev.appraisalId)}
                    disabled={!!planApproved[selectedDev.appraisalId]}
                  >
                    {planApproved[selectedDev.appraisalId] ? "Development Plan Approved" : "Approve Development Plan"}
                  </button>
                </div>
              </>
            )}
          </div>
              </div>
            ) : (
              <p style={{ margin: "12px 0 0", color: "var(--color-text-muted)", fontSize: 13 }}>
                Select an employee to open their assessment details.
              </p>
            )}
          </>
        )}
      </section>

    </div>
  );
}

