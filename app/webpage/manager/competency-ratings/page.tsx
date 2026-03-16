// app/webpage/manager/competency-ratings/page.tsx
"use client";
import { useState, useEffect } from "react";

const RATING_LABELS = ["", "Below Expectations", "Needs Improvement", "Meets Expectations", "Exceeds Expectations", "Outstanding"];
const RATING_COLORS = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#7c3aed"];

export default function CompetencyRatingsPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/manager/competency-ratings")
      .then((r) => r.json())
      .then((data) => { if (data.team) setTeam(data.team); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const saveRating = async (compId: number, appraisalId: number, rating: number) => {
    const member = team.find((t) => t.appraisalId === appraisalId);
    if (member?.managerCompetencySubmittedAt) return; // locked

    setTeam(team.map((t) =>
      t.appraisalId === appraisalId
        ? { ...t, competencies: t.competencies.map((c: any) => c.id === compId ? { ...c, manager_rating: rating } : c) }
        : t
    ));

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
      if (!res.ok) { setError(data.error); return; }
      setTeam(team.map((t) =>
        t.appraisalId === appraisalId
          ? { ...t, managerCompetencySubmittedAt: new Date().toISOString() }
          : t
      ));
      setShowConfirm(null);
    } catch (e: any) { setError(e.message); }
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 1100 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937", marginBottom: 6 }}>Competency Ratings (Team)</h2>
      <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24 }}>Review and rate your team's competency self-assessments</p>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      {team.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: "1px solid #ede9fe" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>No competency assessments to review</h3>
        </div>
      )}

      {team.map((member) => {
        const isExpanded = expanded === member.appraisalId;
        const empSubmitted = !!member.competencySubmittedAt;
        const mgrSubmitted = !!member.managerCompetencySubmittedAt;
        const mgrRated = member.competencies.filter((c: any) => c.manager_rating !== null).length;
        const totalComps = member.competencies.length;
        const allRated = mgrRated === totalComps && totalComps > 0;

        return (
          <div key={member.appraisalId} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${isExpanded ? "#c4b5fd" : "#ede9fe"}`, marginBottom: 12, overflow: "hidden" }}>
            {/* Header */}
            <div onClick={() => setExpanded(isExpanded ? null : member.appraisalId)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#0891b2,#059669)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {member.employeeName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{member.employeeName}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>Manager rated: {mgrRated}/{totalComps}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {mgrSubmitted && (
                  <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>✓ Submitted</span>
                )}
                {empSubmitted && !mgrSubmitted && (
                  <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>Employee Submitted</span>
                )}
                {!empSubmitted && (
                  <span style={{ background: "#f3f4f6", color: "#6b7280", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>Not Submitted</span>
                )}
                <span style={{ color: "#9ca3af" }}>{isExpanded ? "▴" : "▾"}</span>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {member.competencies.map((c: any) => (
                    <div key={c.id} style={{ border: "1px solid #ede9fe", borderRadius: 10, padding: 16 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1f2937", marginBottom: 4 }}>{c.area_name}</h4>
                      <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>{c.expected_behaviour}</p>

                      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                        {/* Employee self rating */}
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", marginBottom: 4 }}>SELF RATING</p>
                          <div style={{ display: "flex", gap: 4 }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <div key={n} style={{ width: 28, height: 28, borderRadius: 6, background: c.self_rating && n <= c.self_rating ? RATING_COLORS[c.self_rating] : "#f3f4f6", color: c.self_rating && n <= c.self_rating ? "#fff" : "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{n}</div>
                            ))}
                          </div>
                          {c.self_rating && <p style={{ fontSize: 10, color: RATING_COLORS[c.self_rating], fontWeight: 600, marginTop: 2 }}>{RATING_LABELS[c.self_rating]}</p>}
                        </div>

                        {/* Manager rating */}
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#0891b2", marginBottom: 4 }}>YOUR RATING</p>
                          <div style={{ display: "flex", gap: 4 }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                onClick={() => saveRating(c.id, member.appraisalId, n)}
                                disabled={mgrSubmitted}
                                style={{
                                  width: 28, height: 28, borderRadius: 6,
                                  border: `2px solid ${c.manager_rating === n ? RATING_COLORS[n] : "#e5e7eb"}`,
                                  background: c.manager_rating === n ? RATING_COLORS[n] : "#fff",
                                  color: c.manager_rating === n ? "#fff" : "#9ca3af",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 12, fontWeight: 700,
                                  cursor: mgrSubmitted ? "default" : "pointer",
                                }}
                              >{n}</button>
                            ))}
                          </div>
                          {c.manager_rating && <p style={{ fontSize: 10, color: RATING_COLORS[c.manager_rating], fontWeight: 600, marginTop: 2 }}>{RATING_LABELS[c.manager_rating]}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Button */}
                {empSubmitted && !mgrSubmitted && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #ede9fe", display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      onClick={() => setShowConfirm(member.appraisalId)}
                      disabled={!allRated}
                      style={{
                        background: allRated ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#e5e7eb",
                        color: allRated ? "#fff" : "#9ca3af",
                        border: "none", borderRadius: 10, padding: "10px 24px",
                        fontWeight: 700, fontSize: 14,
                        cursor: allRated ? "pointer" : "not-allowed",
                      }}
                    >
                      Submit Competency Ratings ({mgrRated}/{totalComps} rated)
                    </button>
                    {!allRated && (
                      <p style={{ fontSize: 12, color: "#f59e0b" }}>Rate all competencies to submit</p>
                    )}
                  </div>
                )}

                {mgrSubmitted && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #ede9fe" }}>
                    <div style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, display: "inline-block" }}>
                      ✓ Competency ratings submitted and locked
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Confirm Modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420 }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⭐</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Submit Competency Ratings?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Your ratings will be locked and the employee will be notified. This action cannot be undone.
            </p>
            {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => submitRatings(showConfirm)} style={{ flex: 1, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>Confirm & Submit</button>
              <button onClick={() => setShowConfirm(null)} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}