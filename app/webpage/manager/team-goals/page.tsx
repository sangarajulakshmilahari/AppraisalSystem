// app/webpage/manager/team-goals/page.tsx
"use client";
import { useState, useEffect } from "react";

const BADGE: Record<string, { bg: string; color: string; label: string }> = {
  approved: { bg: "#dcfce7", color: "#16a34a", label: "Approved" },
  submitted: { bg: "#dbeafe", color: "#1d4ed8", label: "Submitted" },
  draft: { bg: "#f3f4f6", color: "#6b7280", label: "Draft" },
  rejected: { bg: "#fef2f2", color: "#ef4444", label: "Rejected" },
};

export default function TeamGoalsPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/manager/team-goals")
      .then((r) => r.json())
      .then((data) => { if (data.team) setTeam(data.team); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const approveGoals = async (appraisalId: number) => {
    setError("");
    try {
      const res = await fetch(`/api/manager/team-goals/approve/${appraisalId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setTeam(team.map((t) => t.appraisalId === appraisalId
        ? { ...t, goalsApprovedAt: new Date().toISOString(), goals: t.goals.map((g: any) => ({ ...g, status: "approved" })) }
        : t
      ));
    } catch (e: any) { setError(e.message); }
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
      if (!res.ok) { setError(data.error); return; }
      setTeam(team.map((t) => t.appraisalId === appraisalId
        ? { ...t, goalsSubmittedAt: null, goals: t.goals.map((g: any) => ({ ...g, status: "draft" })) }
        : t
      ));
      setShowReject(null);
      setRejectReason("");
    } catch (e: any) { setError(e.message); }
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af" }}>Loading team goals...</div>;

  return (
    <div style={{ maxWidth: 1100 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937", marginBottom: 6 }}>Team Goals Approval</h2>
      <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24 }}>Review and approve your team members' performance goals</p>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>
          {error} <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {team.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: "1px solid #ede9fe" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>No team members assigned</h3>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>You don't have any employees assigned for this appraisal cycle.</p>
        </div>
      )}

      {team.map((member) => {
        const isExpanded = expanded === member.appraisalId;
        const hasSubmitted = !!member.goalsSubmittedAt;
        const isApproved = !!member.goalsApprovedAt;

        return (
          <div key={member.appraisalId} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${isExpanded ? "#c4b5fd" : "#ede9fe"}`, marginBottom: 12, overflow: "hidden", boxShadow: isExpanded ? "0 4px 20px rgba(124,58,237,0.12)" : "none" }}>
            {/* Header */}
            <div onClick={() => setExpanded(isExpanded ? null : member.appraisalId)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", background: isExpanded ? "#faf8ff" : "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                  {member.employeeName?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{member.employeeName}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>{member.employeeEmail} · {member.goalCount} goals · Weight: {member.totalWeight}%</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {isApproved && <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>✓ Approved</span>}
                {hasSubmitted && !isApproved && <span style={{ background: "#fef9c3", color: "#854d0e", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>Awaiting Approval</span>}
                {!hasSubmitted && !isApproved && <span style={{ background: "#f3f4f6", color: "#6b7280", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>Not Submitted</span>}
                <span style={{ color: "#9ca3af", fontSize: 18 }}>{isExpanded ? "▴" : "▾"}</span>
              </div>
            </div>

            {/* Goals Table */}
            {isExpanded && (
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "40px 130px 1fr 140px 100px 80px 80px", background: "#f5f3ff", padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", borderRadius: 8, marginBottom: 8, gap: 8 }}>
                  {["#", "Area", "Description", "Metric", "Target", "Weight", "Status"].map((h) => <div key={h}>{h}</div>)}
                </div>

                {member.goals.map((g: any, i: number) => (
                  <div key={g.id} style={{ display: "grid", gridTemplateColumns: "40px 130px 1fr 140px 100px 80px 80px", padding: "10px 12px", gap: 8, alignItems: "center", background: i % 2 === 0 ? "#fff" : "#faf8ff", borderRadius: 6, marginBottom: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>{g.goal_no}</div>
                    <div><span style={{ background: "#f5f3ff", color: "#7c3aed", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{g.area_name || "—"}</span></div>
                    <div style={{ fontSize: 13, color: "#374151" }}>{g.description}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{g.metric || "—"}</div>
                    <div style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{g.target || "—"}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>{g.weight}%</div>
                    <div><span style={{ background: BADGE[g.status]?.bg, color: BADGE[g.status]?.color, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{BADGE[g.status]?.label}</span></div>
                  </div>
                ))}

                {/* Action buttons */}
                {hasSubmitted && !isApproved && (
                  <div style={{ display: "flex", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid #ede9fe" }}>
                    <button onClick={() => approveGoals(member.appraisalId)} style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      ✓ Approve All Goals
                    </button>
                    <button onClick={() => setShowReject(member.appraisalId)} style={{ background: "#fff", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      Return for Revision
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Reject Modal */}
      {showReject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Return Goals for Revision</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for returning (optional)..." rows={3} style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px", fontSize: 13, outline: "none", marginBottom: 16, fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => rejectGoals(showReject)} style={{ flex: 1, background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>Return Goals</button>
              <button onClick={() => { setShowReject(null); setRejectReason(""); }} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}