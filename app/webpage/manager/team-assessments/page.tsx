// app/webpage/manager/team-assessments/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";

const RATING_LABELS = ["", "Below Expectations", "Needs Improvement", "Meets Expectations", "Exceeds Expectations", "Outstanding"];
const RATING_COLORS = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#7c3aed"];

export default function TeamAssessmentsPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComplete, setShowComplete] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<any>({});

  const saveTimers = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    fetch("/api/manager/team-assessments")
      .then((r) => r.json())
      .then((data) => { if (data.team) setTeam(data.team); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Auto-save feedback (debounced)
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

  const updateGoalField = (appraisalId: number, goalId: number, field: string, value: any) => {
    setTeam(team.map((t) =>
      t.appraisalId === appraisalId
        ? { ...t, goals: t.goals.map((g: any) => g.id === goalId ? { ...g, [field]: value } : g) }
        : t
    ));
    const member = team.find((t) => t.appraisalId === appraisalId);
    const goal = member?.goals.find((g: any) => g.id === goalId);
    if (goal) {
      const updatedFeedback = field === "manager_feedback" ? value : goal.manager_feedback;
      const updatedRating = field === "performance_rating" ? value : goal.performance_rating;
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
      if (!res.ok) { setError(data.error); return; }
      setTeam(team.map((t) => t.appraisalId === appraisalId ? { ...t, managerReviewCompletedAt: new Date().toISOString() } : t));
      setShowComplete(null);
    } catch (e: any) { setError(e.message); }
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af" }}>Loading team assessments...</div>;

  return (
    <div style={{ maxWidth: 1100 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937", marginBottom: 6 }}>Team Assessments</h2>
      <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24 }}>Review self-assessments, provide feedback, and rate your team's performance</p>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>
          {error} <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {team.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: "1px solid #ede9fe" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>No assessments to review</h3>
        </div>
      )}

      {team.map((member) => {
        const isExpanded = expanded === member.appraisalId;
        const saSubmitted = !!member.selfAssessmentSubmittedAt;
        const reviewDone = !!member.managerReviewCompletedAt;
        const ratedCount = member.goals.filter((g: any) => g.performance_rating !== null).length;

        return (
          <div key={member.appraisalId} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${isExpanded ? "#c4b5fd" : "#ede9fe"}`, marginBottom: 12, overflow: "hidden" }}>
            <div onClick={() => setExpanded(isExpanded ? null : member.appraisalId)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", background: isExpanded ? "#faf8ff" : "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#0891b2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {member.employeeName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{member.employeeName}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>{ratedCount}/{member.goals.length} goals rated</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {reviewDone && <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>✓ Review Complete</span>}
                {saSubmitted && !reviewDone && <span style={{ background: "#fef9c3", color: "#854d0e", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>Ready for Review</span>}
                {!saSubmitted && <span style={{ background: "#f3f4f6", color: "#6b7280", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>SA Not Submitted</span>}
                <span style={{ color: "#9ca3af", fontSize: 18 }}>{isExpanded ? "▴" : "▾"}</span>
              </div>
            </div>

            {isExpanded && (
              <div style={{ padding: "0 20px 20px" }}>
                {member.goals.map((g: any) => {
                  const isGoalExpanded = expandedGoal === g.id;
                  return (
                    <div key={g.id} style={{ border: "1px solid #ede9fe", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                      <div onClick={() => setExpandedGoal(isGoalExpanded ? null : g.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", background: "#faf8ff" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{g.goal_no}</div>
                        <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{g.description}</p>
                        {g.performance_rating && <span style={{ background: RATING_COLORS[g.performance_rating] + "18", color: RATING_COLORS[g.performance_rating], borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{RATING_LABELS[g.performance_rating]}</span>}
                        <span style={{ color: "#9ca3af" }}>{isGoalExpanded ? "▴" : "▾"}</span>
                      </div>

                      {isGoalExpanded && (
                        <div style={{ padding: "12px 16px" }}>
                          {/* Employee's self assessment */}
                          <div style={{ background: "#f5f3ff", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 4 }}>EMPLOYEE'S SELF ASSESSMENT</p>
                            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{g.self_assessment || "Not filled"}</p>
                            {g.evidence?.length > 0 && (
                              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #ede9fe" }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>Evidence ({g.evidence.length})</p>
                                {g.evidence.map((ev: any) => (
                                  <p key={ev.id} style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>• <strong>{ev.month}:</strong> {ev.description}</p>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Manager feedback input */}
                          <div style={{ marginBottom: 12 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#0891b2", marginBottom: 4 }}>YOUR FEEDBACK</p>
                            <textarea
                              value={g.manager_feedback || ""}
                              onChange={(e) => updateGoalField(member.appraisalId, g.id, "manager_feedback", e.target.value)}
                              disabled={reviewDone}
                              placeholder="Write your feedback for this goal..."
                              rows={3}
                              style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" }}
                            />
                          </div>

                          {/* Rating */}
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>PERFORMANCE RATING</p>
                            <div style={{ display: "flex", gap: 8 }}>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} onClick={() => !reviewDone && setRating(member.appraisalId, g.id, n)} title={RATING_LABELS[n]} disabled={reviewDone} style={{ width: 44, height: 44, borderRadius: 10, border: `2px solid ${g.performance_rating === n ? RATING_COLORS[n] : "#e5e7eb"}`, background: g.performance_rating === n ? RATING_COLORS[n] : "#faf8ff", color: g.performance_rating === n ? "#fff" : "#9ca3af", fontWeight: 800, fontSize: 16, cursor: reviewDone ? "default" : "pointer" }}>
                                  {n}
                                </button>
                              ))}
                            </div>
                            {g.performance_rating && <p style={{ fontSize: 11, color: RATING_COLORS[g.performance_rating], fontWeight: 600, marginTop: 4 }}>{RATING_LABELS[g.performance_rating]}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Complete Review button */}
                {saSubmitted && !reviewDone && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #ede9fe" }}>
                    <button onClick={() => setShowComplete(member.appraisalId)} disabled={ratedCount < member.goals.length} style={{ background: ratedCount === member.goals.length ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#e5e7eb", color: ratedCount === member.goals.length ? "#fff" : "#9ca3af", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: ratedCount === member.goals.length ? "pointer" : "not-allowed" }}>
                      Complete Review ({ratedCount}/{member.goals.length} rated)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Complete Review Modal */}
      {showComplete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 480 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Finalize Performance Review</h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Recommended Hike %</label>
              <input type="number" placeholder="e.g. 12" value={recommendations[showComplete]?.hike_percentage || ""} onChange={(e) => setRecommendations({ ...recommendations, [showComplete]: { ...recommendations[showComplete], hike_percentage: e.target.value ? Number(e.target.value) : null } })} style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Promotion</label>
              <select value={recommendations[showComplete]?.promotion_status || "not_applicable"} onChange={(e) => setRecommendations({ ...recommendations, [showComplete]: { ...recommendations[showComplete], promotion_status: e.target.value } })} style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}>
                <option value="not_applicable">Not Applicable</option>
                <option value="recommended">Recommended</option>
                <option value="not_this_cycle">Not This Cycle</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Notes</label>
              <textarea placeholder="Any additional notes..." value={recommendations[showComplete]?.promotion_notes || ""} onChange={(e) => setRecommendations({ ...recommendations, [showComplete]: { ...recommendations[showComplete], promotion_notes: e.target.value } })} rows={2} style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            </div>

            {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => completeReview(showComplete)} style={{ flex: 1, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>Submit Review</button>
              <button onClick={() => setShowComplete(null)} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}