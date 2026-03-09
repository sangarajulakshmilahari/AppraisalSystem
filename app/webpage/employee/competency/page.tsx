"use client";
import { useState } from "react";

type Comp = { id: string; area: string; expected: string; selfRating: number | null; submitted: boolean };

const INIT_COMP: Comp[] = [
  { id: "1", area: "Ownership",               expected: "Meets deadlines, owns outcomes, resolves issues without shifting blame.", selfRating: null, submitted: false },
  { id: "2", area: "Collaboration & Teamwork", expected: "Supports peers, shares knowledge, contributes to team success.", selfRating: null, submitted: false },
  { id: "3", area: "Communication Skills",     expected: "Provides clear updates, listens actively, adapts communication to audience.", selfRating: null, submitted: false },
  { id: "4", area: "Proactiveness",            expected: "Identifies improvements, volunteers for tasks, anticipates issues.", selfRating: null, submitted: false },
  { id: "5", area: "Analysis & Troubleshooting", expected: "Suggests solutions, uses logical reasoning, minimizes escalations.", selfRating: null, submitted: false },
  { id: "6", area: "Learning Ability",         expected: "Learns new skills, accepts feedback positively, applies learning.", selfRating: null, submitted: false },
  { id: "7", area: "Leadership",               expected: "Mentors team members, delegates effectively, builds team morale.", selfRating: null, submitted: false },
];

const RATING_LABELS = ["", "Below Expectations", "Needs Improvement", "Meets Expectations", "Exceeds Expectations", "Outstanding"];
const RATING_COLORS = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#7c3aed"];

export default function CompetencyPage() {
  const [comps, setComps] = useState<Comp[]>(INIT_COMP);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const setRating = (id: string, r: number) => {
    if (submitted) return;
    setComps(comps.map((c) => (c.id === id ? { ...c, selfRating: r } : c)));
  };

  const rated = comps.filter((c) => c.selfRating !== null).length;

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>Competency Assessment</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>Rate yourself on a scale of 1 (lowest) to 5 (highest)</p>
        </div>
        {!submitted ? (
          <button onClick={() => setShowConfirm(true)} disabled={rated < comps.length} style={{ background: rated === comps.length ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#e5e7eb", color: rated === comps.length ? "#fff" : "#9ca3af", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: rated === comps.length ? "pointer" : "not-allowed" }}>
            Submit Assessment
          </button>
        ) : (
          <div style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14 }}>✓ Submitted</div>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 20, border: "1px solid #ede9fe", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1, height: 8, background: "#f3f0ff", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${(rated / comps.length) * 100}%`, height: "100%", background: "linear-gradient(90deg,#7c3aed,#4f46e5)", borderRadius: 4, transition: "width 0.4s" }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", whiteSpace: "nowrap" }}>{rated} / {comps.length} rated</span>
      </div>

      {/* Competency Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {comps.map((c) => {
          const r = c.selfRating;
          const rColor = r ? RATING_COLORS[r] : "#e5e7eb";
          return (
            <div key={c.id} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: `1px solid ${r ? rColor + "40" : "#ede9fe"}`, boxShadow: `0 4px 14px ${r ? rColor + "18" : "rgba(124,58,237,0.06)"}`, transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1f2937" }}>{c.area}</h3>
                {r && (
                  <span style={{ background: rColor + "18", color: rColor, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{RATING_LABELS[r]}</span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, marginBottom: 16 }}>{c.expected}</p>

              {/* Rating Selector */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Self Rating</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(c.id, n)} title={RATING_LABELS[n]} style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${r === n ? RATING_COLORS[n] : "#e5e7eb"}`, background: r === n ? RATING_COLORS[n] : "#faf8ff", color: r === n ? "#fff" : "#9ca3af", fontWeight: 800, fontSize: 16, cursor: submitted ? "default" : "pointer", transition: "all 0.15s" }}>
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
                  <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#d1d5db", fontStyle: "italic" }}>Pending review</div>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>Manager Rating</p>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1,2,3,4,5].map((n) => (
                      <div key={n} style={{ width: 26, height: 26, borderRadius: 6, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#d1d5db", fontWeight: 700 }}>{n}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⭐</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Submit Competency Assessment?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Your ratings will be locked. The manager will review and provide feedback.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { setSubmitted(true); setShowConfirm(false); }} style={{ flex: 1, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>Confirm</button>
              <button onClick={() => setShowConfirm(false)} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}