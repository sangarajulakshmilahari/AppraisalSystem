// app/webpage/feedback/page.tsx
"use client";
import { useState, useEffect } from "react";

type Evidence = { id: number; month: string; description: string };
type GoalFB = {
  id: number;
  goal_no: number;
  description: string;
  area_name: string | null;
  self_assessment: string | null;
  manager_feedback: string | null;
  performance_rating: number | null;
  evidence: Evidence[];
};

const RATING_LABELS = ["", "Below Expectations", "Needs Improvement", "Meets Expectations", "Exceeds Expectations", "Outstanding"];
const RATING_COLORS = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#7c3aed"];

export default function FeedbackPage() {
  const [goals, setGoals] = useState<GoalFB[]>([]);
  const [appraisal, setAppraisal] = useState<any>(null);
  const [cycleName, setCycleName] = useState("");
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [resultsReleased, setResultsReleased] = useState(false);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAck, setShowAck] = useState(false);

  useEffect(() => {
    fetch("/api/employee/feedback")
      .then((r) => r.json())
      .then((data) => {
        if (data.goals) setGoals(data.goals);
        if (data.cycle) setCycleName(data.cycle.name || "");
        if (data.appraisal) {
          setAppraisal(data.appraisal);
          setAcknowledged(data.appraisal.acknowledged || false);
        }
        if (data.avgRating !== undefined) setAvgRating(data.avgRating);
        if (data.feedbackVisible !== undefined) setFeedbackVisible(data.feedbackVisible);
        if (data.resultsReleased !== undefined) setResultsReleased(data.resultsReleased);
        if (data.managerName) setManagerName(data.managerName);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAcknowledge = async () => {
    setError("");
    try {
      const res = await fetch("/api/employee/feedback/acknowledge", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setAcknowledged(true);
      setShowAck(false);
    } catch (e: any) { setError(e.message); }
  };

  const displayRating = appraisal?.overallRating ?? avgRating;
  const displayLabel = appraisal?.overallRatingLabel || (displayRating ? RATING_LABELS[Math.round(displayRating)] : "Pending");

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af" }}>Loading feedback...</div>;
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>Feedback & Results</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>
            {cycleName} {appraisal?.managerReviewCompletedAt && `· Manager review completed ${appraisal.managerReviewCompletedAt}`}
          </p>
        </div>
        {!acknowledged ? (
          <button onClick={() => setShowAck(true)} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Acknowledge Results
          </button>
        ) : (
          <div style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14 }}>
            ✓ Acknowledged {appraisal?.acknowledgedAt && `on ${appraisal.acknowledgedAt}`}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Overall Rating Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Rating */}
        <div style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 16, padding: "24px", color: "#fff" }}>
          <p style={{ fontSize: 12, opacity: 0.8, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Overall Performance Rating</p>
          <p style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{displayRating ? displayRating.toFixed(1) : "—"}</p>
          <p style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>{displayLabel}</p>
          <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: displayRating && n <= Math.round(displayRating) ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>
        </div>

        {/* Compensation */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #ede9fe" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Compensation Impact</p>
          {appraisal?.hikePercentage ? (
            <>
              <p style={{ fontSize: 26, fontWeight: 800, color: "#10b981" }}>{appraisal.hikePercentage}% Hike</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                {appraisal.hikeEffectiveDate ? `Effective from ${appraisal.hikeEffectiveDate}` : "Effective date TBD"}
              </p>
              <div style={{ marginTop: 12, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Approved by HR</div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#9ca3af" }}>Pending</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Compensation details will appear after HR review</p>
            </>
          )}
        </div>

        {/* Promotion */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #ede9fe" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Promotion</p>
          {appraisal?.promotionStatus && appraisal.promotionStatus !== "not_applicable" ? (
            <>
              <p style={{ fontSize: 20, fontWeight: 800, color: appraisal.promotionStatus === "approved" ? "#10b981" : "#7c3aed" }}>
                {appraisal.promotionStatus === "approved" ? "Approved" : appraisal.promotionStatus === "recommended" ? "Recommended" : "Not This Cycle"}
              </p>
              {appraisal.promotionNotes && (
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4, lineHeight: 1.5 }}>{appraisal.promotionNotes}</p>
              )}
            </>
          ) : (
            <>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#9ca3af" }}>Not Applicable</p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>No promotion action this cycle</p>
            </>
          )}
        </div>
      </div>

      {/* Not yet reviewed message */}
      {!feedbackVisible && goals.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fef08a", borderRadius: 14, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>⏳</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#92400e" }}>Manager review in progress</p>
            <p style={{ fontSize: 13, color: "#a16207" }}>Your manager has not yet completed the review. Feedback and ratings will appear here once done.</p>
          </div>
        </div>
      )}

      {/* Goal-wise Feedback Table */}
      {goals.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", overflow: "hidden", boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>
          <div style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)", padding: "14px 20px" }}>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Goal-wise Feedback</h3>
          </div>

          {goals.map((f, i) => (
            <div key={f.id} style={{ padding: "20px", background: i % 2 === 0 ? "#fff" : "#faf8ff", borderBottom: "1px solid #f3f0ff" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>{f.goal_no}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#1f2937", marginBottom: 12 }}>{f.description}</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    {/* Self Assessment */}
                    <div style={{ background: "#f5f3ff", borderRadius: 10, padding: "12px 14px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Self Assessment</p>
                      <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{f.self_assessment || "Not filled"}</p>
                      {f.evidence.length > 0 && (
                        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
                          Evidence: {f.evidence.map((e) => e.description).filter(Boolean).join("; ") || `${f.evidence.length} entries`}
                        </p>
                      )}
                    </div>

                    {/* Manager Feedback */}
                    <div style={{ background: "#f0f9ff", borderRadius: 10, padding: "12px 14px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#0891b2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Manager Feedback</p>
                      <p style={{ fontSize: 13, color: f.manager_feedback ? "#374151" : "#9ca3af", lineHeight: 1.5, fontStyle: f.manager_feedback ? "normal" : "italic" }}>
                        {f.manager_feedback || "Pending review"}
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>Performance Rating:</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} style={{
                          width: 28, height: 28, borderRadius: 6,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 800,
                          background: f.performance_rating && n <= f.performance_rating ? RATING_COLORS[f.performance_rating] : "#f3f4f6",
                          color: f.performance_rating && n <= f.performance_rating ? "#fff" : "#d1d5db",
                        }}>{n}</div>
                      ))}
                    </div>
                    {f.performance_rating && (
                      <span style={{ background: RATING_COLORS[f.performance_rating] + "18", color: RATING_COLORS[f.performance_rating], borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
                        {RATING_LABELS[f.performance_rating]}
                      </span>
                    )}
                    {!f.performance_rating && (
                      <span style={{ color: "#9ca3af", fontSize: 12, fontStyle: "italic" }}>Not yet rated</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No goals */}
      {goals.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: "48px", textAlign: "center", border: "1px solid #ede9fe" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>No feedback available</h3>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Feedback will appear here after your goals are set and reviewed.</p>
        </div>
      )}

      {/* Acknowledge Modal */}
      {showAck && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420 }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Acknowledge Your Appraisal Results?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              By acknowledging, you confirm that you have reviewed your appraisal results and manager feedback.
            </p>
            {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleAcknowledge} style={{ flex: 1, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>Acknowledge</button>
              <button onClick={() => setShowAck(false)} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}