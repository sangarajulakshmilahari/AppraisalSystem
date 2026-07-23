// app/webpage/manager/team-assessments/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ClipboardList, X } from "lucide-react";

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

type TeamMember = {
  appraisalId: number;
  employeeName: string;
  selfAssessmentSubmittedAt: string | null;
  managerReviewCompletedAt: string | null;
  goals: Goal[];
};

type Recommendation = {
  hike_percentage?: number | null;
  promotion_status?: string;
  promotion_notes?: string;
};

const ui: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1140, display: "grid", gap: 14 },
  card: {
    background: "#fff",
    border: "1px solid var(--color-border)",
    borderRadius: 16,
    boxShadow: "var(--shadow-soft)",
  },
};

export default function TeamAssessmentsPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComplete, setShowComplete] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<Record<number, Recommendation>>({});

  const saveTimers = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    fetch("/api/manager/team-assessments")
      .then((r) => r.json())
      .then((data) => {
        if (data.team) setTeam(data.team);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const saveFeedback = (goalId: number, feedback: string, rating: number | null) => {
    if (saveTimers.current[goalId]) clearTimeout(saveTimers.current[goalId]);
    saveTimers.current[goalId] = setTimeout(async () => {
      await fetch(`/api/manager/review-goal/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manager_feedback: feedback, performance_rating: rating }),
      });
    }, 800);
  };

  const updateGoalField = (
    appraisalId: number,
    goalId: number,
    field: "manager_feedback" | "performance_rating",
    value: string | number,
  ) => {
    setTeam((prev) =>
      prev.map((t) =>
        t.appraisalId === appraisalId
          ? {
              ...t,
              goals: t.goals.map((g) =>
                g.id === goalId
                  ? { ...g, [field]: value }
                  : g,
              ),
            }
          : t,
      ),
    );

    const member = team.find((t) => t.appraisalId === appraisalId);
    const goal = member?.goals.find((g) => g.id === goalId);
    if (goal) {
      const updatedFeedback = field === "manager_feedback" ? String(value) : goal.manager_feedback || "";
      const updatedRating = field === "performance_rating" ? Number(value) : goal.performance_rating;
      saveFeedback(goalId, updatedFeedback, updatedRating);
    }
  };

  const setRating = (appraisalId: number, goalId: number, rating: number) => {
    updateGoalField(appraisalId, goalId, "performance_rating", rating);
  };

  const completeReview = async (appraisalId: number) => {
    setError("");
    try {
      const res = await fetch(`/api/manager/complete-review/${appraisalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recommendations[appraisalId] || {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setTeam((prev) => prev.map((t) => (t.appraisalId === appraisalId ? { ...t, managerReviewCompletedAt: new Date().toISOString() } : t)));
      setShowComplete(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to complete review");
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
        <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
          Review self-assessments, provide feedback, and rate team performance
        </p>
      </div>

      {error && (
        <div style={{ ...ui.card, borderColor: "#fecaca", background: "#fff5f5", color: "#b91c1c", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ border: 0, background: "transparent", color: "#b91c1c", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
        </div>
      )}

      {team.length === 0 && (
        <div style={{ ...ui.card, padding: 44, textAlign: "center" }}>
          <ClipboardList size={44} color="var(--color-navy-700)" />
          <h3 style={{ margin: "10px 0 0", fontSize: 22, color: "var(--color-text-heading)" }}>No assessments to review</h3>
        </div>
      )}

      {team.map((member) => {
        const isExpanded = expanded === member.appraisalId;
        const saSubmitted = !!member.selfAssessmentSubmittedAt;
        const reviewDone = !!member.managerReviewCompletedAt;
        const ratedCount = member.goals.filter((g) => g.performance_rating !== null).length;

        return (
          <section key={member.appraisalId} style={{ ...ui.card, borderColor: isExpanded ? "#ffd7c2" : "var(--color-border)", boxShadow: isExpanded ? "var(--shadow-hover)" : "var(--shadow-soft)", overflow: "hidden" }}>
            <div onClick={() => setExpanded(isExpanded ? null : member.appraisalId)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", cursor: "pointer", background: isExpanded ? "#fff8f3" : "#fff", borderBottom: isExpanded ? "1px solid var(--color-border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e7eef9", color: "var(--color-navy-700)", display: "grid", placeItems: "center", fontWeight: 700 }}>
                  {member.employeeName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--color-text-heading)" }}>{member.employeeName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>{ratedCount}/{member.goals.length} goals rated</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {reviewDone ? (
                  <span className="status-pill status-approved" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={13} /> Review Complete</span>
                ) : saSubmitted ? (
                  <span className="status-pill status-pending">Ready for Review</span>
                ) : (
                  <span className="status-pill status-draft">SA Not Submitted</span>
                )}
                <span style={{ color: "var(--color-text-muted)", fontSize: 18 }}>{isExpanded ? "▴" : "▾"}</span>
              </div>
            </div>

            {isExpanded && (
              <div style={{ padding: "0 18px 18px" }}>
                {member.goals.map((g) => {
                  const isGoalExpanded = expandedGoal === g.id;
                  return (
                    <div key={g.id} style={{ border: "1px solid var(--color-border)", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
                      <div onClick={() => setExpandedGoal(isGoalExpanded ? null : g.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", background: "#f8fafc" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--color-navy-700)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12 }}>{g.goal_no}</div>
                        <p style={{ flex: 1, margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text-heading)" }}>{g.description}</p>
                        {g.performance_rating ? <span className="status-pill" style={{ background: `${RATING_COLORS[g.performance_rating]}1f`, color: RATING_COLORS[g.performance_rating] }}>{RATING_LABELS[g.performance_rating]}</span> : null}
                        <span style={{ color: "var(--color-text-muted)" }}>{isGoalExpanded ? "▴" : "▾"}</span>
                      </div>

                      {isGoalExpanded && (
                        <div style={{ padding: "12px 14px" }}>
                          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Employee Self Assessment</p>
                            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.5 }}>{g.self_assessment || "Not filled"}</p>
                            {g.evidence?.length > 0 && (
                              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)" }}>Evidence ({g.evidence.length})</p>
                                {g.evidence.map((ev) => (
                                  <p key={ev.id} style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-body)" }}>• <strong>{ev.month}:</strong> {ev.description}</p>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ marginBottom: 12 }}>
                            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Manager Feedback</p>
                            <textarea
                              value={g.manager_feedback || ""}
                              onChange={(e) => updateGoalField(member.appraisalId, g.id, "manager_feedback", e.target.value)}
                              disabled={reviewDone}
                              placeholder="Write your feedback for this goal..."
                              rows={3}
                              className="field-textarea"
                            />
                          </div>

                          <div>
                            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Performance Rating</p>
                            <div style={{ display: "flex", gap: 8 }}>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  onClick={() => !reviewDone && setRating(member.appraisalId, g.id, n)}
                                  title={RATING_LABELS[n]}
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
                        </div>
                      )}
                    </div>
                  );
                })}

                {saSubmitted && !reviewDone && (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
                    <button className="btn btn-primary" onClick={() => setShowComplete(member.appraisalId)} disabled={ratedCount < member.goals.length}>
                      Complete Review ({ratedCount}/{member.goals.length} rated)
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}

      {showComplete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,.38)", display: "grid", placeItems: "center", zIndex: 100, padding: 16 }}>
          <div style={{ ...ui.card, width: "100%", maxWidth: 500, padding: 28 }}>
            <h3 style={{ margin: 0, fontSize: 24, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Finalize Performance Review</h3>

            <div style={{ marginTop: 12 }}>
              <label className="field-label">Recommended Hike %</label>
              <input
                type="number"
                placeholder="e.g. 12"
                value={recommendations[showComplete]?.hike_percentage || ""}
                onChange={(e) =>
                  setRecommendations({
                    ...recommendations,
                    [showComplete]: {
                      ...recommendations[showComplete],
                      hike_percentage: e.target.value ? Number(e.target.value) : null,
                    },
                  })
                }
                className="field-input"
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <label className="field-label">Promotion</label>
              <select
                value={recommendations[showComplete]?.promotion_status || "not_applicable"}
                onChange={(e) =>
                  setRecommendations({
                    ...recommendations,
                    [showComplete]: { ...recommendations[showComplete], promotion_status: e.target.value },
                  })
                }
                className="field-select"
              >
                <option value="not_applicable">Not Applicable</option>
                <option value="recommended">Recommended</option>
                <option value="not_this_cycle">Not This Cycle</option>
              </select>
            </div>

            <div style={{ marginTop: 12 }}>
              <label className="field-label">Notes</label>
              <textarea
                placeholder="Any additional notes..."
                value={recommendations[showComplete]?.promotion_notes || ""}
                onChange={(e) =>
                  setRecommendations({
                    ...recommendations,
                    [showComplete]: { ...recommendations[showComplete], promotion_notes: e.target.value },
                  })
                }
                rows={2}
                className="field-textarea"
              />
            </div>

            {error && <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 10 }}>{error}</p>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowComplete(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => completeReview(showComplete)}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
