"use client";
import { useState } from "react";

const feedback = [
  { no: 1, goal: "Deliver high quality, defect-free code", selfAssessment: "Maintained < 0.3 defects/KLOC across 3 projects. All PRs reviewed and approved within SLA.", evidence: "Sonar reports, code review logs", managerFeedback: "Sriram consistently delivered high-quality code. Proactively resolved code smell issues.", rating: 4 },
  { no: 2, goal: "Complete client deliverables on time",    selfAssessment: "Achieved 97% on-time delivery for all client milestones in FY 2025-26.",                    evidence: "Project tracker, sprint reports", managerFeedback: "Excellent delivery track record. Communicated proactively about risks.", rating: 5 },
  { no: 3, goal: "Complete one certification",              selfAssessment: "Completed AWS Cloud Practitioner in August 2025.",                                            evidence: "Credly badge, certification ID", managerFeedback: "Great initiative. Recommend pursuing Solutions Architect next.", rating: 4 },
  { no: 4, goal: "Contribute to knowledge sharing",         selfAssessment: "Conducted 7 knowledge sharing sessions on React and TypeScript best practices.",              evidence: "Session recordings, attendance", managerFeedback: "Strong contribution. Team benefited greatly from the TypeScript sessions.", rating: 4 },
  { no: 5, goal: "Follow CMMI Level 3 processes",           selfAssessment: "Maintained 94% process compliance in all project audits.",                                    evidence: "Audit reports Q1-Q4",            managerFeedback: "Consistent adherence. Helped team maintain compliance standards.", rating: 3 },
];

const RATING_LABELS = ["", "Below Expectations", "Needs Improvement", "Meets Expectations", "Exceeds Expectations", "Outstanding"];
const RATING_COLORS = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#7c3aed"];

const avgRating = feedback.reduce((s, f) => s + f.rating, 0) / feedback.length;

export default function FeedbackPage() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [showAck, setShowAck] = useState(false);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>Feedback & Results</h2>
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>FY 2025–26 · Manager review completed on 15 Mar 2026</p>
        </div>
        {!acknowledged ? (
          <button onClick={() => setShowAck(true)} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Acknowledge Results</button>
        ) : (
          <div style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14 }}>✓ Acknowledged on 20 Mar 2026</div>
        )}
      </div>

      {/* Overall Rating Card */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 16, padding: "24px", color: "#fff", gridColumn: "span 1" }}>
          <p style={{ fontSize: 12, opacity: 0.8, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Overall Performance Rating</p>
          <p style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{avgRating.toFixed(1)}</p>
          <p style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>Exceeds Expectations</p>
          <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
            {[1,2,3,4,5].map((n) => (
              <div key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: n <= Math.round(avgRating) ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #ede9fe" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Compensation Impact</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: "#10b981" }}>12% Hike</p>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Effective from April 2026</p>
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Approved by HR</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: "1px solid #ede9fe" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Promotion</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: "#7c3aed" }}>Not This Cycle</p>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4, lineHeight: 1.5 }}>Eligible for consideration in FY 2026–27</p>
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#f5f3ff", borderRadius: 8, fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>Next review: Apr 2027</div>
        </div>
      </div>

      {/* Feedback Table */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", overflow: "hidden", boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>
        <div style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)", padding: "14px 20px" }}>
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Goal-wise Feedback</h3>
        </div>

        {feedback.map((f, i) => (
          <div key={f.no} style={{ padding: "20px", background: i % 2 === 0 ? "#fff" : "#faf8ff", borderBottom: "1px solid #f3f0ff" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>{f.no}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#1f2937", marginBottom: 12 }}>{f.goal}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div style={{ background: "#f5f3ff", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Self Assessment</p>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{f.selfAssessment}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>Evidence: {f.evidence}</p>
                  </div>
                  <div style={{ background: "#f0f9ff", borderRadius: 10, padding: "12px 14px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#0891b2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Manager Feedback</p>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{f.managerFeedback}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>Performance Rating:</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1,2,3,4,5].map((n) => (
                      <div key={n} style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, background: n <= f.rating ? RATING_COLORS[f.rating] : "#f3f4f6", color: n <= f.rating ? "#fff" : "#d1d5db" }}>{n}</div>
                    ))}
                  </div>
                  <span style={{ background: RATING_COLORS[f.rating] + "18", color: RATING_COLORS[f.rating], borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>{RATING_LABELS[f.rating]}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Acknowledge Modal */}
      {showAck && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420 }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Acknowledge Your Appraisal Results?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>By acknowledging, you confirm that you have reviewed your appraisal results and manager feedback.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { setAcknowledged(true); setShowAck(false); }} style={{ flex: 1, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>Acknowledge</button>
              <button onClick={() => setShowAck(false)} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}