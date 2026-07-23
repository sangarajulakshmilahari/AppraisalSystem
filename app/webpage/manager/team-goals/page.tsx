// app/webpage/manager/team-goals/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Users, X } from "lucide-react";

type GoalItem = {
  id: number;
  goal_no: number;
  area_name: string | null;
  description: string;
  metric: string | null;
  target: string | null;
  weight: number;
  status: "approved" | "submitted" | "draft" | "rejected";
};

type TeamMember = {
  appraisalId: number;
  employeeName: string;
  employeeEmail: string;
  goalCount: number;
  totalWeight: number;
  goalsSubmittedAt: string | null;
  goalsApprovedAt: string | null;
  goals: GoalItem[];
};

const BADGE: Record<GoalItem["status"], { className: string; label: string }> = {
  approved: { className: "status-pill status-approved", label: "Approved" },
  submitted: { className: "status-pill status-submitted", label: "Submitted" },
  draft: { className: "status-pill status-draft", label: "Draft" },
  rejected: { className: "status-pill status-rejected", label: "Rejected" },
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

export default function TeamGoalsPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState<number | null>(null);
  const [rejectingGoalId, setRejectingGoalId] = useState<number | null>(null);
  const [rejectingGoalReason, setRejectingGoalReason] = useState("");
  const [approvingGoalId, setApprovingGoalId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/manager/team-goals")
      .then((r) => r.json())
      .then((data) => {
        if (data.team) setTeam(data.team);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const approveGoals = async (appraisalId: number) => {
    setError("");
    try {
      const res = await fetch(`/api/manager/team-goals/approve/${appraisalId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setTeam((prev) =>
        prev.map((t) =>
          t.appraisalId === appraisalId
            ? {
                ...t,
                goalsApprovedAt: new Date().toISOString(),
                goals: t.goals.map((g) => ({ ...g, status: "approved" })),
              }
            : t,
        ),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to approve goals");
    }
  };

  const rejectGoals = async (appraisalId: number) => {
    setError("");
    try {
      const res = await fetch(`/api/manager/team-goals/reject/${appraisalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setTeam((prev) =>
        prev.map((t) =>
          t.appraisalId === appraisalId
            ? { ...t, goalsSubmittedAt: null, goals: t.goals.map((g) => ({ ...g, status: "draft" })) }
            : t,
        ),
      );
      setShowReject(null);
      setRejectReason("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to return goals");
    }
  };

  const approveIndividualGoal = async (appraisalId: number, goalId: number) => {
    setError("");
    try {
      const res = await fetch(`/api/manager/team-goals/approve/${appraisalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setTeam((prev) =>
        prev.map((t) =>
          t.appraisalId === appraisalId
            ? {
                ...t,
                goals: t.goals.map((g) => (g.id === goalId ? { ...g, status: "approved" } : g)),
              }
            : t,
        ),
      );
      setApprovingGoalId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to approve goal");
    }
  };

  const rejectIndividualGoal = async (appraisalId: number, goalId: number, reason: string) => {
    setError("");
    try {
      const res = await fetch(`/api/manager/team-goals/reject/${appraisalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setTeam((prev) =>
        prev.map((t) =>
          t.appraisalId === appraisalId
            ? {
                ...t,
                goals: t.goals.map((g) => (g.id === goalId ? { ...g, status: "rejected" } : g)),
              }
            : t,
        ),
      );
      setRejectingGoalId(null);
      setRejectingGoalReason("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reject goal");
    }
  };

  if (loading) {
    return (
      <div style={{ ...ui.card, minHeight: 180, display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        Loading team goals...
      </div>
    );
  }

  return (
    <div style={ui.page}>
      <div>
        <h1 style={{ margin: 0, fontSize: 30, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Team Goals Approval</h1>
        <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
          Review and approve your team members&apos; performance goals
        </p>
      </div>

      {error && (
        <div style={{ ...ui.card, borderColor: "#fecaca", background: "#fff5f5", color: "#b91c1c", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ border: 0, background: "transparent", color: "#b91c1c", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {team.length === 0 && (
        <div style={{ ...ui.card, padding: 44, textAlign: "center" }}>
          <Users size={46} color="var(--color-navy-700)" />
          <h3 style={{ margin: "10px 0 0", fontSize: 22, color: "var(--color-text-heading)" }}>No team members assigned</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginTop: 6 }}>
            You do not have any employees assigned for this appraisal cycle.
          </p>
        </div>
      )}

      {team.map((member) => {
        const isExpanded = expanded === member.appraisalId;
        const hasSubmitted = !!member.goalsSubmittedAt;
        const isApproved = !!member.goalsApprovedAt;

        return (
          <section key={member.appraisalId} style={{ ...ui.card, borderColor: isExpanded ? "#ffd7c2" : "var(--color-border)", boxShadow: isExpanded ? "var(--shadow-hover)" : "var(--shadow-soft)", overflow: "hidden" }}>
            <div onClick={() => setExpanded(isExpanded ? null : member.appraisalId)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", cursor: "pointer", background: isExpanded ? "#fff8f3" : "#fff", borderBottom: isExpanded ? "1px solid var(--color-border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e7eef9", color: "var(--color-navy-700)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14 }}>
                  {member.employeeName?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--color-text-heading)" }}>{member.employeeName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                    {member.employeeEmail} · {member.goalCount} goals · Weight: {member.totalWeight}%
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {isApproved ? (
                  <span className="status-pill status-approved" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={13} /> Approved
                  </span>
                ) : hasSubmitted ? (
                  <span className="status-pill status-pending">Awaiting Approval</span>
                ) : (
                  <span className="status-pill status-draft">Not Submitted</span>
                )}
                <span style={{ color: "var(--color-text-muted)", fontSize: 18 }}>{isExpanded ? "▴" : "▾"}</span>
              </div>
            </div>

            {isExpanded && (
              <div style={{ padding: "14px 18px 18px" }}>
                <div style={{ border: "1px solid var(--color-border)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "44px 140px 1fr 140px 110px 90px 100px 120px", background: "#fff", padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", gap: 8, borderBottom: "1px solid var(--color-border)" }}>
                    {["#", "Area", "Description", "Metric", "Target", "Weight", "Status", "Actions"].map((h) => <div key={h}>{h}</div>)}
                  </div>

                  {member.goals.map((g, i) => (
                    <div key={g.id} style={{ display: "grid", gridTemplateColumns: "44px 140px 1fr 140px 110px 90px 100px 120px", padding: "10px 12px", gap: 8, alignItems: "center", background: i % 2 === 0 ? "#fff" : "#fcfdff", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-heading)" }}>{g.goal_no}</div>
                      <div>
                        <span className="status-pill status-draft" style={{ background: "#fff", border: "1px solid var(--color-border)", color: "var(--color-text-body)" }}>{g.area_name || "—"}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--color-text-body)" }}>{g.description}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{g.metric || "—"}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-body)", fontWeight: 600 }}>{g.target || "—"}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-heading)" }}>{g.weight}%</div>
                      <div>
                        <span className={BADGE[g.status].className}>{BADGE[g.status].label}</span>
                      </div>
                      <div>
                        {g.status === "submitted" && hasSubmitted && !isApproved && (
                          <div style={{ display: "flex", gap: 6 }}>
                            {rejectingGoalId === g.id ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 200 }}>
                                <textarea
                                  placeholder="Rejection reason..."
                                  value={rejectingGoalReason}
                                  onChange={(e) => setRejectingGoalReason(e.target.value)}
                                  style={{ padding: 4, fontSize: 11, minHeight: 40, border: "1px solid #fecaca", borderRadius: 4 }}
                                />
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button
                                    onClick={() => rejectIndividualGoal(member.appraisalId, g.id, rejectingGoalReason)}
                                    disabled={!rejectingGoalReason.trim()}
                                    style={{ padding: "2px 6px", fontSize: 11, background: "#dc2626", color: "white", border: "none", borderRadius: 4 }}
                                  >
                                    Submit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectingGoalId(null);
                                      setRejectingGoalReason("");
                                    }}
                                    style={{ padding: "2px 6px", fontSize: 11, background: "#6b7280", color: "white", border: "none", borderRadius: 4 }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : approvingGoalId === g.id ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 120 }}>
                                <div style={{ fontSize: 11, color: "#166534" }}>Approve this goal?</div>
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button
                                    onClick={() => approveIndividualGoal(member.appraisalId, g.id)}
                                    style={{ padding: "2px 6px", fontSize: 11, background: "#16a34a", color: "white", border: "none", borderRadius: 4 }}
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setApprovingGoalId(null)}
                                    style={{ padding: "2px 6px", fontSize: 11, background: "#6b7280", color: "white", border: "none", borderRadius: 4 }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => setApprovingGoalId(g.id)}
                                  style={{ padding: "2px 6px", fontSize: 11, background: "#16a34a", color: "white", border: "none", borderRadius: 4 }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingGoalId(g.id);
                                    setRejectingGoalReason("");
                                  }}
                                  style={{ padding: "2px 6px", fontSize: 11, background: "#dc2626", color: "white", border: "none", borderRadius: 4 }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {hasSubmitted && !isApproved && (
                  <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <button className="btn btn-primary" onClick={() => approveGoals(member.appraisalId)}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={14} /> Approve All Goals</span>
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowReject(member.appraisalId)} style={{ borderColor: "#fecaca", color: "#b91c1c", background: "#fff5f5" }}>
                      Return for Revision
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}

      {showReject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,.38)", display: "grid", placeItems: "center", zIndex: 100, padding: 16 }}>
          <div style={{ ...ui.card, width: "100%", maxWidth: 440, padding: 28 }}>
            <h3 style={{ margin: 0, fontSize: 24, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Return Goals for Revision</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for returning (optional)..." rows={3} className="field-textarea" style={{ marginTop: 12 }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
              <button className="btn btn-secondary" onClick={() => { setShowReject(null); setRejectReason(""); }}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => rejectGoals(showReject)}>
                Return Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
