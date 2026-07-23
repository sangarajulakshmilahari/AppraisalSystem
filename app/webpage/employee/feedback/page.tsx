// app/webpage/feedback/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, MessageSquare, PartyPopper, X } from "lucide-react";

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

type Appraisal = {
  overallRating?: number | null;
  overallRatingLabel?: string | null;
  managerReviewCompletedAt?: string | null;
  hikePercentage?: number | null;
  hikeEffectiveDate?: string | null;
  promotionStatus?: string | null;
  promotionNotes?: string | null;
  acknowledged?: boolean;
  acknowledgedAt?: string | null;
};

type CompetencyReview = {
  id: number;
  area_name: string;
  expected_behaviour: string;
  self_rating: number | null;
  manager_rating: number | null;
  manager_feedback: string | null;
};

const RATING_LABELS = ["", "Below Expectations", "Needs Improvement", "Meets Expectations", "Exceeds Expectations", "Outstanding"];
const RATING_COLORS = ["", "#dc2626", "#d97706", "#1f3a68", "#16a34a", "#f26522"];

const ui: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1080, display: "grid", gap: 16 },
  card: {
    background: "#fff",
    border: "1px solid var(--color-border)",
    borderRadius: 16,
    boxShadow: "var(--shadow-soft)",
  },
};

export default function FeedbackPage() {
  const [goals, setGoals] = useState<GoalFB[]>([]);
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [cycleName, setCycleName] = useState("");
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [competencies, setCompetencies] = useState<CompetencyReview[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAck, setShowAck] = useState(false);
  const [activeSection, setActiveSection] = useState<"goals" | "competency">("goals");

  useEffect(() => {
    Promise.all([fetch("/api/employee/feedback"), fetch("/api/employee/competencies")])
      .then(async ([feedbackRes, competenciesRes]) => {
        const feedbackData = await feedbackRes.json();
        const competencyData = await competenciesRes.json();

        if (feedbackData.goals) setGoals(feedbackData.goals);
        if (feedbackData.cycle) setCycleName(feedbackData.cycle.name || "");
        if (feedbackData.appraisal) {
          setAppraisal(feedbackData.appraisal);
          setAcknowledged(feedbackData.appraisal.acknowledged || false);
        }
        if (feedbackData.avgRating !== undefined) setAvgRating(feedbackData.avgRating);
        if (feedbackData.feedbackVisible !== undefined) setFeedbackVisible(feedbackData.feedbackVisible);
        if (feedbackData.managerName) setManagerName(feedbackData.managerName);

        if (competencyData.competencies) setCompetencies(competencyData.competencies);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAcknowledge = async () => {
    setError("");
    try {
      const res = await fetch("/api/employee/feedback/acknowledge", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setAcknowledged(true);
      setShowAck(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to acknowledge feedback");
    }
  };

  const displayRating = appraisal?.overallRating ?? avgRating;
  const displayLabel = appraisal?.overallRatingLabel || (displayRating ? RATING_LABELS[Math.round(displayRating)] : "Pending");

  if (loading) {
    return (
      <div style={{ ...ui.card, minHeight: 180, display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        Loading feedback...
      </div>
    );
  }

  return (
    <div style={ui.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Link href="/webpage/dashboard" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-navy-700)", fontWeight: 700 }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 30, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Feedback & Results</h1>
          <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
            {cycleName} {appraisal?.managerReviewCompletedAt ? `· Manager review completed ${appraisal.managerReviewCompletedAt}` : ""}
          </p>
          {managerName ? <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: 13 }}>Manager: {managerName}</p> : null}
        </div>

        {!acknowledged ? (
          <button className="btn btn-primary" onClick={() => setShowAck(true)}>
            Acknowledge Results
          </button>
        ) : (
          <div className="status-pill status-approved" style={{ padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} /> Acknowledged {appraisal?.acknowledgedAt ? `on ${appraisal.acknowledgedAt}` : ""}
          </div>
        )}
      </div>

      <section style={{ ...ui.card, padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          type="button"
          onClick={() => setActiveSection("goals")}
          style={{
            border: activeSection === "goals" ? "1px solid rgba(242,101,34,0.32)" : "1px solid var(--color-border)",
            background: activeSection === "goals" ? "rgba(242,101,34,0.12)" : "#fff",
            color: "var(--color-text-heading)",
            borderRadius: 12,
            padding: "12px 14px",
            textAlign: "left",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Goal Review
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("competency")}
          style={{
            border: activeSection === "competency" ? "1px solid rgba(242,101,34,0.32)" : "1px solid var(--color-border)",
            background: activeSection === "competency" ? "rgba(242,101,34,0.12)" : "#fff",
            color: "var(--color-text-heading)",
            borderRadius: 12,
            padding: "12px 14px",
            textAlign: "left",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Competency Review
        </button>
      </section>

      {error && (
        <div style={{ ...ui.card, borderColor: "#fecaca", background: "#fff5f5", color: "#b91c1c", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ border: 0, background: "transparent", color: "#b91c1c", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div style={{ ...ui.card, padding: 22, borderTop: "3px solid var(--color-orange-500)", background: "#fff8f3" }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
            Overall Performance Rating
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 44, fontWeight: 900, color: "var(--color-text-heading)", lineHeight: 1 }}>
            {displayRating ? displayRating.toFixed(1) : "—"}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--color-text-body)", fontWeight: 600 }}>{displayLabel}</p>
        </div>

        <div style={{ ...ui.card, padding: 22 }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
            Compensation Impact
          </p>
          {appraisal?.hikePercentage ? (
            <>
              <p style={{ margin: "8px 0 0", fontSize: 26, fontWeight: 800, color: "#16a34a" }}>{appraisal.hikePercentage}% Hike</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
                {appraisal.hikeEffectiveDate ? `Effective from ${appraisal.hikeEffectiveDate}` : "Effective date TBD"}
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: "8px 0 0", fontSize: 20, fontWeight: 800, color: "var(--color-text-muted)" }}>Pending</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>Compensation details will appear after HR review</p>
            </>
          )}
        </div>

        <div style={{ ...ui.card, padding: 22 }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
            Promotion
          </p>
          {appraisal?.promotionStatus && appraisal.promotionStatus !== "not_applicable" ? (
            <>
              <p style={{ margin: "8px 0 0", fontSize: 20, fontWeight: 800, color: appraisal.promotionStatus === "approved" ? "#16a34a" : "var(--color-navy-700)" }}>
                {appraisal.promotionStatus === "approved" ? "Approved" : appraisal.promotionStatus === "recommended" ? "Recommended" : "Not This Cycle"}
              </p>
              {appraisal.promotionNotes ? <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>{appraisal.promotionNotes}</p> : null}
            </>
          ) : (
            <>
              <p style={{ margin: "8px 0 0", fontSize: 20, fontWeight: 800, color: "var(--color-text-muted)" }}>Not Applicable</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>No promotion action this cycle</p>
            </>
          )}
        </div>
      </div>

      {!feedbackVisible && goals.length > 0 && (
        <div style={{ ...ui.card, borderColor: "#fde68a", background: "#fffbeb", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <Clock3 size={22} color="#a16207" />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#92400e" }}>Manager review in progress</p>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#a16207" }}>
              Feedback and ratings will appear here once manager review is completed.
            </p>
          </div>
        </div>
      )}

      {activeSection === "goals" && goals.length > 0 && (
        <section style={{ ...ui.card, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", background: "#fff8f3" }}>
            <h3 style={{ margin: 0, color: "var(--color-text-heading)", fontSize: 18 }}>Goal-wise Feedback</h3>
          </div>

          {goals.map((f, i) => (
            <div key={f.id} style={{ padding: "18px", background: i % 2 === 0 ? "#fff" : "#fcfdff", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--color-navy-700)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0 }}>
                  {f.goal_no}
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--color-text-heading)" }}>{f.description}</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px" }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                        Self Assessment
                      </p>
                      <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.5 }}>{f.self_assessment || "Not filled"}</p>
                    </div>

                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px" }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                        Manager Feedback
                      </p>
                      <p style={{ margin: "6px 0 0", fontSize: 13, color: f.manager_feedback ? "var(--color-text-body)" : "var(--color-text-muted)", lineHeight: 1.5, fontStyle: f.manager_feedback ? "normal" : "italic" }}>
                        {f.manager_feedback || "Pending review"}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontWeight: 600 }}>Performance Rating:</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            display: "grid",
                            placeItems: "center",
                            fontSize: 13,
                            fontWeight: 800,
                            background: f.performance_rating && n <= f.performance_rating ? RATING_COLORS[f.performance_rating] : "#f1f5f9",
                            color: f.performance_rating && n <= f.performance_rating ? "#fff" : "#cbd5e1",
                          }}
                        >
                          {n}
                        </div>
                      ))}
                    </div>
                    {f.performance_rating ? (
                      <span className="status-pill" style={{ background: `${RATING_COLORS[f.performance_rating]}1f`, color: RATING_COLORS[f.performance_rating] }}>
                        {RATING_LABELS[f.performance_rating]}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)", fontSize: 12, fontStyle: "italic" }}>Not yet rated</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {activeSection === "competency" && competencies.length > 0 && (
        <section style={{ ...ui.card, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-border)", background: "#fff8f3" }}>
            <h3 style={{ margin: 0, color: "var(--color-text-heading)", fontSize: 18 }}>Competency Manager Review</h3>
          </div>

          {competencies.map((c, i) => (
            <div key={c.id} style={{ padding: "18px", background: i % 2 === 0 ? "#fff" : "#fcfdff", borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--color-text-heading)" }}>{c.area_name}</p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.5 }}>{c.expected_behaviour}</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px" }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Self Rating
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.5 }}>
                    {c.self_rating ? `${c.self_rating} / 5 · ${RATING_LABELS[c.self_rating]}` : "Not filled"}
                  </p>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px" }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                    Manager Rating
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: c.manager_rating ? "var(--color-text-body)" : "var(--color-text-muted)", lineHeight: 1.5, fontStyle: c.manager_rating ? "normal" : "italic" }}>
                    {c.manager_rating ? `${c.manager_rating} / 5 · ${RATING_LABELS[c.manager_rating]}` : "Pending review"}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px" }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Manager Feedback
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: c.manager_feedback ? "var(--color-text-body)" : "var(--color-text-muted)", lineHeight: 1.5, fontStyle: c.manager_feedback ? "normal" : "italic" }}>
                  {c.manager_feedback || "Pending review"}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {activeSection === "goals" && goals.length === 0 && (
        <div style={{ ...ui.card, padding: "44px 20px", textAlign: "center" }}>
          <MessageSquare size={44} color="var(--color-navy-700)" />
          <h3 style={{ margin: "10px 0 0", fontSize: 22, color: "var(--color-text-heading)" }}>No feedback available</h3>
          <p style={{ marginTop: 6, color: "var(--color-text-muted)", fontSize: 14 }}>Feedback will appear here after your goals are set and reviewed.</p>
        </div>
      )}

      {activeSection === "competency" && competencies.length === 0 && (
        <div style={{ ...ui.card, padding: "44px 20px", textAlign: "center" }}>
          <MessageSquare size={44} color="var(--color-navy-700)" />
          <h3 style={{ margin: "10px 0 0", fontSize: 22, color: "var(--color-text-heading)" }}>No competency review available</h3>
          <p style={{ marginTop: 6, color: "var(--color-text-muted)", fontSize: 14 }}>Competency manager review will appear here after assessment and manager evaluation.</p>
        </div>
      )}

      {showAck && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,.38)", display: "grid", placeItems: "center", zIndex: 100, padding: 16 }}>
          <div style={{ ...ui.card, width: "100%", maxWidth: 460, padding: 28 }}>
            <div style={{ marginBottom: 16, display: "grid", placeItems: "center" }}>
              <PartyPopper size={34} color="var(--color-orange-500)" />
            </div>
            <h3 style={{ margin: 0, fontSize: 24, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Acknowledge Appraisal Results</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14, lineHeight: 1.6, margin: "10px 0 18px" }}>
              By acknowledging, you confirm you have reviewed appraisal results and manager feedback.
            </p>
            {error ? <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{error}</p> : null}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowAck(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAcknowledge}>Acknowledge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
