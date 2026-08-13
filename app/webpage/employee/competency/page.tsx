// app/webpage/competency/page.tsx
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Star, X } from "lucide-react";

type Comp = {
  id: number;
  competency_id: number;
  area_name: string;
  expected_behaviour: string;
  self_rating: number | null;
  manager_rating: number | null;
  manager_feedback: string | null;
  team_lead_assessment: string | null;
  team_lead_rating: number | null;
};

const RATING_LABELS = ["", "Below Expectations", "Needs Improvement", "Meets Expectations", "Exceeds Expectations", "Outstanding"];
const RATING_COLORS = ["", "#dc2626", "#d97706", "#1f3a68", "#16a34a", "#f26522"];

const ui: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1040, display: "grid", gap: 16 },
  card: {
    background: "#fff",
    border: "1px solid var(--color-border)",
    borderRadius: 16,
    boxShadow: "var(--shadow-soft)",
  },
};

export default function CompetencyPage() {
  const [comps, setComps] = useState<Comp[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/employee/competencies")
      .then((r) => r.json())
      .then((data) => {
        if (data.competencies) setComps(data.competencies);
        if (data.competencyEditable !== undefined) setEditable(data.competencyEditable);
        if (data.appraisal?.competencySubmittedAt) setSubmitted(true);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const rated = comps.filter((c) => c.self_rating !== null).length;

  const setRating = async (comp: Comp, rating: number) => {
    if (submitted || !editable) return;
    setError("");

    const prev = comp.self_rating;
    setComps((current) => current.map((c) => (c.id === comp.id ? { ...c, self_rating: rating } : c)));

    try {
      const res = await fetch(`/api/employee/competencies/${comp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ self_rating: rating }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        setComps((current) => current.map((c) => (c.id === comp.id ? { ...c, self_rating: prev } : c)));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save competency rating");
      setComps((current) => current.map((c) => (c.id === comp.id ? { ...c, self_rating: prev } : c)));
    }
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const res = await fetch("/api/employee/competencies/submit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSubmitted(true);
      setEditable(false);
      setShowConfirm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit competencies");
    }
  };

  if (loading) {
    return (
      <div style={{ ...ui.card, minHeight: 180, display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        Loading competencies...
      </div>
    );
  }

  return (
    <div style={ui.page}>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, marginTop: -56 }}>

        {!submitted && editable ? (
          <button className="btn btn-primary" onClick={() => setShowConfirm(true)} disabled={rated < comps.length}>
            Submit Assessment
          </button>
        ) : submitted ? (
          <div className="status-pill status-approved" style={{ padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} /> Submitted
          </div>
        ) : (
          <div className="status-pill status-draft" style={{ padding: "8px 14px", border: "1px solid var(--color-border)" }}>
            Window not open
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

      <div style={{ ...ui.card, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1, height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${(rated / Math.max(comps.length, 1)) * 100}%`, height: "100%", background: "linear-gradient(90deg,#f26522,#1f3a68)", transition: "width var(--duration-medium) var(--ease-enterprise)" }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-heading)", whiteSpace: "nowrap" }}>
          {rated} / {comps.length} rated
        </span>
      </div>

      {comps.length === 0 && (
        <div style={{ ...ui.card, padding: "44px 20px", textAlign: "center" }}>
          <Star size={42} color="var(--color-navy-700)" />
          <h3 style={{ fontSize: 22, color: "var(--color-text-heading)", margin: "10px 0 0" }}>No competencies configured</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginTop: 6 }}>Contact HR to set up competency areas.</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {comps.map((c) => {
          const r = c.self_rating;
          const rColor = r ? RATING_COLORS[r] : "#e2e8f0";
          return (
            <div key={c.id} style={{ ...ui.card, padding: 20, borderColor: r ? `${rColor}55` : "var(--color-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: "var(--color-text-heading)" }}>{c.area_name}</h3>
                {r ? (
                  <span className="status-pill" style={{ background: `${rColor}1f`, color: rColor }}>
                    {RATING_LABELS[r]}
                  </span>
                ) : null}
              </div>

              <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: 14 }}>{c.expected_behaviour}</p>

              <div>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "var(--color-text-heading)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  Self Rating
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(c, n)}
                      title={RATING_LABELS[n]}
                      disabled={submitted || !editable}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        border: `1px solid ${r === n ? RATING_COLORS[n] : "var(--color-border)"}`,
                        background: r === n ? RATING_COLORS[n] : "#fff",
                        color: r === n ? "#fff" : "var(--color-text-muted)",
                        fontWeight: 800,
                        fontSize: 15,
                        cursor: submitted || !editable ? "default" : "pointer",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {r ? <p style={{ margin: "6px 0 0", fontSize: 12, color: rColor, fontWeight: 600 }}>{RATING_LABELS[r]}</p> : null}
              </div>

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9", display: "grid", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>Teamlead Assessment</p>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>Teamlead Rating</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
                    <div style={{ minHeight: 38, background: "#f8fafc", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: c.team_lead_assessment || c.team_lead_rating ? "var(--color-text-body)" : "#94a3b8", fontStyle: c.team_lead_assessment || c.team_lead_rating ? "normal" : "italic" }}>
                      {c.team_lead_assessment || (c.team_lead_rating ? "Reviewed (rating submitted)" : "Pending review")}
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: c.team_lead_rating && n <= c.team_lead_rating ? RATING_COLORS[c.team_lead_rating] : "#f1f5f9",
                            display: "grid",
                            placeItems: "center",
                            color: c.team_lead_rating && n <= c.team_lead_rating ? "#fff" : "#cbd5e1",
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>Management Assessment</p>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>Manager Rating</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
                    <div style={{ minHeight: 38, background: "#f8fafc", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: c.manager_feedback || c.manager_rating ? "var(--color-text-body)" : "#94a3b8", fontStyle: c.manager_feedback || c.manager_rating ? "normal" : "italic" }}>
                      {c.manager_feedback || (c.manager_rating ? "Reviewed (rating submitted)" : "Pending review")}
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: c.manager_rating && n <= c.manager_rating ? RATING_COLORS[c.manager_rating] : "#f1f5f9",
                            display: "grid",
                            placeItems: "center",
                            color: c.manager_rating && n <= c.manager_rating ? "#fff" : "#cbd5e1",
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,.38)", display: "grid", placeItems: "center", zIndex: 100, padding: 16 }}>
          <div style={{ ...ui.card, width: "100%", maxWidth: 420, padding: 28 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#fff8f3", border: "1px solid #ffd7c2", display: "grid", placeItems: "center", marginBottom: 16 }}>
              <Star size={24} color="var(--color-orange-500)" />
            </div>
            <h3 style={{ margin: 0, fontSize: 24, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Submit Competency Assessment</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Your ratings will be locked. The manager will review and provide feedback.
            </p>
            {error && <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
