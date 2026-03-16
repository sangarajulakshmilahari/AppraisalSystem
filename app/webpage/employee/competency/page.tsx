// app/webpage/competency/page.tsx
"use client";
import { useState, useEffect } from "react";

type Comp = {
  id: number;
  competency_id: number;
  area_name: string;
  expected_behaviour: string;
  self_rating: number | null;
  manager_rating: number | null;
  manager_feedback: string | null;
};

const RATING_LABELS = ["", "Below Expectations", "Needs Improvement", "Meets Expectations", "Exceeds Expectations", "Outstanding"];
const RATING_COLORS = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#7c3aed"];

export default function CompetencyPage() {
  const [comps, setComps] = useState<Comp[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [editable, setEditable] = useState(false);
  const [cycleName, setCycleName] = useState("");
  const [competencyEnd, setCompetencyEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/employee/competencies")
      .then((r) => r.json())
      .then((data) => {
        if (data.competencies) setComps(data.competencies);
        if (data.cycle) {
          setCycleName(data.cycle.name || "");
          setCompetencyEnd(data.cycle.competencyEnd || "");
        }
        if (data.competencyEditable !== undefined) setEditable(data.competencyEditable);
        if (data.appraisal?.competencySubmittedAt) setSubmitted(true);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const rated = comps.filter((c) => c.self_rating !== null).length;

  // Save rating immediately on click
  const setRating = async (comp: Comp, rating: number) => {
    if (submitted || !editable) return;
    setError("");

    // Optimistic update
    setComps(comps.map((c) => (c.id === comp.id ? { ...c, self_rating: rating } : c)));

    try {
      const res = await fetch(`/api/employee/competencies/${comp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ self_rating: rating }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        // Revert on failure
        setComps(comps.map((c) => (c.id === comp.id ? { ...c, self_rating: comp.self_rating } : c)));
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Submit all
  const handleSubmit = async () => {
    setError("");
    try {
      const res = await fetch("/api/employee/competencies/submit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSubmitted(true);
      setEditable(false);
      setShowConfirm(false);
    } catch (e: any) { setError(e.message); }
  };

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af" }}>Loading competencies...</div>;
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>Competency Assessment</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>
            Rate yourself on a scale of 1 (lowest) to 5 (highest)
            {competencyEnd && ` · Window open until ${competencyEnd}`}
          </p>
        </div>
        {!submitted && editable ? (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={rated < comps.length}
            style={{
              background: rated === comps.length ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#e5e7eb",
              color: rated === comps.length ? "#fff" : "#9ca3af",
              border: "none", borderRadius: 10, padding: "10px 24px",
              fontWeight: 700, fontSize: 14,
              cursor: rated === comps.length ? "pointer" : "not-allowed",
            }}
          >
            Submit Assessment
          </button>
        ) : submitted ? (
          <div style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14 }}>✓ Submitted</div>
        ) : (
          <div style={{ background: "#f3f4f6", color: "#6b7280", borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 13 }}>Window not open</div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 20, border: "1px solid #ede9fe", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1, height: 8, background: "#f3f0ff", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${(rated / Math.max(comps.length, 1)) * 100}%`, height: "100%", background: "linear-gradient(90deg,#7c3aed,#4f46e5)", borderRadius: 4, transition: "width 0.4s" }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", whiteSpace: "nowrap" }}>{rated} / {comps.length} rated</span>
      </div>

      {/* No competencies */}
      {comps.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: "48px", textAlign: "center", border: "1px solid #ede9fe" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>No competencies configured</h3>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Contact HR to set up competency areas.</p>
        </div>
      )}

      {/* Competency Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {comps.map((c) => {
          const r = c.self_rating;
          const rColor = r ? RATING_COLORS[r] : "#e5e7eb";
          return (
            <div key={c.id} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: `1px solid ${r ? rColor + "40" : "#ede9fe"}`, boxShadow: `0 4px 14px ${r ? rColor + "18" : "rgba(124,58,237,0.06)"}`, transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1f2937" }}>{c.area_name}</h3>
                {r && (
                  <span style={{ background: rColor + "18", color: rColor, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{RATING_LABELS[r]}</span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, marginBottom: 16 }}>{c.expected_behaviour}</p>

              {/* Rating Selector */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Self Rating</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(c, n)}
                      title={RATING_LABELS[n]}
                      disabled={submitted || !editable}
                      style={{
                        width: 40, height: 40, borderRadius: 10,
                        border: `2px solid ${r === n ? RATING_COLORS[n] : "#e5e7eb"}`,
                        background: r === n ? RATING_COLORS[n] : "#faf8ff",
                        color: r === n ? "#fff" : "#9ca3af",
                        fontWeight: 800, fontSize: 16,
                        cursor: submitted || !editable ? "default" : "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {r && <p style={{ fontSize: 11, color: rColor, fontWeight: 600, marginTop: 6 }}>{RATING_LABELS[r]}</p>}
              </div>

              {/* Manager columns - read only */}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f0ff", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>Manager Feedback</p>
                  <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: c.manager_feedback ? "#374151" : "#d1d5db", fontStyle: c.manager_feedback ? "normal" : "italic" }}>
                    {c.manager_feedback || "Pending review"}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>Manager Rating</p>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} style={{
                        width: 26, height: 26, borderRadius: 6,
                        background: c.manager_rating && n <= c.manager_rating ? RATING_COLORS[c.manager_rating] : "#f3f4f6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, color: c.manager_rating && n <= c.manager_rating ? "#fff" : "#d1d5db", fontWeight: 700,
                      }}>{n}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⭐</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Submit Competency Assessment?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Your ratings will be locked. The manager will review and provide feedback.
            </p>
            {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleSubmit} style={{ flex: 1, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>Confirm</button>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}