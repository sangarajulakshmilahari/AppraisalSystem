// app/webpage/manager/competency-ratings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Star, X } from "lucide-react";

const RATING_COLORS = ["", "#dc2626", "#d97706", "#1f3a68", "#16a34a", "#f26522"];

type Competency = {
  id: number;
  area_name: string;
  expected_behaviour: string;
  self_rating: number | null;
  manager_rating: number | null;
};

type Member = {
  appraisalId: number;
  employeeName: string;
  competencySubmittedAt: string | null;
  managerCompetencySubmittedAt: string | null;
  competencies: Competency[];
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

export default function CompetencyRatingsPage({ inlineWithSectionHeading = false }: { inlineWithSectionHeading?: boolean }) {
  const [team, setTeam] = useState<Member[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/manager/competency-ratings")
      .then((r) => r.json())
      .then((data) => {
        if (data.team) setTeam(data.team);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const saveRating = async (compId: number, appraisalId: number, rating: number) => {
    const member = team.find((t) => t.appraisalId === appraisalId);
    if (member?.managerCompetencySubmittedAt) return;

    setTeam((prev) =>
      prev.map((t) =>
        t.appraisalId === appraisalId
          ? {
              ...t,
              competencies: t.competencies.map((c) =>
                c.id === compId ? { ...c, manager_rating: rating } : c,
              ),
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

  const submitRatings = async (appraisalId: number) => {
    setError("");
    try {
      const res = await fetch(`/api/manager/competency-ratings/submit/${appraisalId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setTeam((prev) =>
        prev.map((t) =>
          t.appraisalId === appraisalId ? { ...t, managerCompetencySubmittedAt: new Date().toISOString() } : t,
        ),
      );
      setShowConfirm(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit competency ratings");
    }
  };

  if (loading) {
    return (
      <div style={{ ...ui.card, minHeight: 180, display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        Loading competency ratings...
      </div>
    );
  }

  return (
    <div style={ui.page}>
      {!inlineWithSectionHeading && (
        <div>
          <h1 style={{ margin: 0, fontSize: 30, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Competency Ratings (Team)</h1>
          <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
            Review and rate team competency self-assessments
          </p>
        </div>
      )}

      {error && (
        <div style={{ ...ui.card, borderColor: "#fecaca", background: "#fff5f5", color: "#b91c1c", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ border: 0, background: "transparent", color: "#b91c1c", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {team.length === 0 && (
        <div style={{ ...ui.card, padding: 44, textAlign: "center" }}>
          <Star size={44} color="var(--color-navy-700)" />
          <h3 style={{ margin: "10px 0 0", fontSize: 22, color: "var(--color-text-heading)" }}>No competency assessments to review</h3>
        </div>
      )}

      {team.map((member) => {
        const isExpanded = expanded === member.appraisalId;
        const empSubmitted = !!member.competencySubmittedAt;
        const mgrSubmitted = !!member.managerCompetencySubmittedAt;
        const mgrRated = member.competencies.filter((c) => c.manager_rating !== null).length;
        const totalComps = member.competencies.length;
        const allRated = mgrRated === totalComps && totalComps > 0;

        return (
          <section key={member.appraisalId} style={{ ...ui.card, borderColor: isExpanded ? "#ffd7c2" : "var(--color-border)", boxShadow: isExpanded ? "var(--shadow-hover)" : "var(--shadow-soft)", overflow: "hidden" }}>
            <div onClick={() => setExpanded(isExpanded ? null : member.appraisalId)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", cursor: "pointer", background: isExpanded ? "#fff8f3" : "#fff", borderBottom: isExpanded ? "1px solid var(--color-border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e7eef9", color: "var(--color-navy-700)", display: "grid", placeItems: "center", fontWeight: 700 }}>
                  {member.employeeName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--color-text-heading)" }}>{member.employeeName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                    Manager rated: {mgrRated}/{totalComps}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {mgrSubmitted ? (
                  <span className="status-pill status-approved" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={13} /> Submitted
                  </span>
                ) : empSubmitted ? (
                  <span className="status-pill status-submitted">Employee Submitted</span>
                ) : (
                  <span className="status-pill status-draft">Not Submitted</span>
                )}
                <span style={{ color: "var(--color-text-muted)" }}>{isExpanded ? "▴" : "▾"}</span>
              </div>
            </div>

            {isExpanded && (
              <div style={{ padding: "0 18px 18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {member.competencies.map((c) => (
                    <div key={c.id} style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: 14 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--color-text-heading)" }}>{c.area_name}</h4>
                      <p style={{ margin: "4px 0 12px", fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>{c.expected_behaviour}</p>

                      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Self Rating</p>
                          <div style={{ display: "flex", gap: 4 }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <div key={n} style={{ width: 28, height: 28, borderRadius: 6, background: c.self_rating && n <= c.self_rating ? RATING_COLORS[c.self_rating] : "#f1f5f9", color: c.self_rating && n <= c.self_rating ? "#fff" : "#cbd5e1", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>
                                {n}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Your Rating</p>
                          <div style={{ display: "flex", gap: 4 }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                onClick={() => saveRating(c.id, member.appraisalId, n)}
                                disabled={mgrSubmitted}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  border: `1px solid ${c.manager_rating === n ? RATING_COLORS[n] : "var(--color-border)"}`,
                                  background: c.manager_rating === n ? RATING_COLORS[n] : "#fff",
                                  color: c.manager_rating === n ? "#fff" : "var(--color-text-muted)",
                                  display: "grid",
                                  placeItems: "center",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: mgrSubmitted ? "default" : "pointer",
                                }}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {empSubmitted && !mgrSubmitted && (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 12 }}>
                    <button className="btn btn-primary" onClick={() => setShowConfirm(member.appraisalId)} disabled={!allRated}>
                      Submit Competency Ratings ({mgrRated}/{totalComps} rated)
                    </button>
                    {!allRated && <p style={{ margin: 0, fontSize: 12, color: "#d97706" }}>Rate all competencies to submit</p>}
                  </div>
                )}

                {mgrSubmitted && (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
                    <div className="status-pill status-approved" style={{ padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle2 size={15} /> Competency ratings submitted and locked
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}

      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,.38)", display: "grid", placeItems: "center", zIndex: 100, padding: 16 }}>
          <div style={{ ...ui.card, width: "100%", maxWidth: 440, padding: 28 }}>
            <div style={{ marginBottom: 14, display: "grid", placeItems: "center" }}>
              <Star size={34} color="var(--color-orange-500)" />
            </div>
            <h3 style={{ margin: 0, fontSize: 24, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Submit Competency Ratings</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14, lineHeight: 1.6, margin: "10px 0 18px" }}>
              Ratings will be locked and the employee will be notified. This action cannot be undone.
            </p>
            {error && <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => submitRatings(showConfirm)}>Confirm & Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
