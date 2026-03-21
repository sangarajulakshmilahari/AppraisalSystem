// app/webpage/manager/development-plans/page.tsx
"use client";
import { useState, useEffect } from "react";

const AREA_ICONS: Record<string, string> = { Technical: "💻", Domain: "🏭", "Soft Skill": "🗣️", Others: "📌" };
const AREA_COLORS: Record<string, string> = { Technical: "#7c3aed", Domain: "#0891b2", "Soft Skill": "#059669", Others: "#d97706" };
const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  not_started: { bg: "#f3f4f6", color: "#6b7280", label: "Not Started" },
  in_progress: { bg: "#dbeafe", color: "#1d4ed8", label: "In Progress" },
  completed:   { bg: "#dcfce7", color: "#16a34a", label: "Completed" },
};

export default function TeamDevelopmentPlansPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/manager/development-plans")
      .then((r) => r.json())
      .then((data) => { if (data.team) setTeam(data.team); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af" }}>Loading development plans...</div>;

  return (
    <div style={{ maxWidth: 1100 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937", marginBottom: 6 }}>Development Plans (Team)</h2>
      <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24 }}>Review your team members' learning and growth plans</p>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>
          {error}
        </div>
      )}

      {team.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", border: "1px solid #ede9fe" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>No team members assigned</h3>
        </div>
      )}

      {team.map((member) => {
        const isExpanded = expanded === member.appraisalId;

        // Group entries by area
        const grouped: Record<string, any[]> = {};
        for (const e of member.entries) {
          if (!grouped[e.area_name]) grouped[e.area_name] = [];
          grouped[e.area_name].push(e);
        }

        return (
          <div key={member.appraisalId} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${isExpanded ? "#c4b5fd" : "#ede9fe"}`, marginBottom: 12, overflow: "hidden" }}>
            {/* Header */}
            <div onClick={() => setExpanded(isExpanded ? null : member.appraisalId)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", background: isExpanded ? "#faf8ff" : "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#059669,#0891b2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {member.employeeName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{member.employeeName}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>{member.total} entries · {member.completed} completed · {member.inProgress} in progress</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {member.total === 0 && <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>No Plan</span>}
                {member.total > 0 && member.completed === member.total && <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>All Complete</span>}
                {member.total > 0 && member.completed < member.total && (
                  <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>
                    {member.completed}/{member.total} done
                  </span>
                )}
                <span style={{ color: "#9ca3af", fontSize: 18 }}>{isExpanded ? "▴" : "▾"}</span>
              </div>
            </div>

            {/* Expanded */}
            {isExpanded && (
              <div style={{ padding: "0 20px 20px" }}>
                {member.total === 0 ? (
                  <div style={{ textAlign: "center", padding: 24, color: "#9ca3af", fontSize: 13 }}>
                    This employee has not created a development plan yet.
                  </div>
                ) : (
                  Object.keys(grouped).map((areaName) => {
                    const areaEntries = grouped[areaName];
                    const aColor = AREA_COLORS[areaName] || "#7c3aed";
                    const aIcon = AREA_ICONS[areaName] || "📌";

                    return (
                      <div key={areaName} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 18 }}>{aIcon}</span>
                          <h4 style={{ fontSize: 14, fontWeight: 700, color: aColor }}>{areaName}</h4>
                          <span style={{ background: aColor + "15", color: aColor, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{areaEntries.length}</span>
                        </div>

                        {areaEntries.map((e: any, i: number) => {
                          const sb = STATUS_BADGE[e.status] || STATUS_BADGE.not_started;
                          return (
                            <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 110px", padding: "10px 14px", gap: 12, alignItems: "center", background: i % 2 === 0 ? "#fff" : "#faf8ff", borderRadius: 8, marginBottom: 4, border: "1px solid #f3f0ff" }}>
                              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}>{e.action}</div>
                              <div>
                                <span style={{ background: "#f5f3ff", color: "#7c3aed", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{e.timeline || "—"}</span>
                              </div>
                              <div style={{ fontSize: 12, color: "#6b7280" }}>{e.responsible}</div>
                              <div>
                                <span style={{ background: sb.bg, color: sb.color, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>{sb.label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}