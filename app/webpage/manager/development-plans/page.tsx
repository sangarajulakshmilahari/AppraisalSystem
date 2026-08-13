// app/webpage/manager/development-plans/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Building2, Code2, Pin, TrendingUp, Volume2 } from "lucide-react";

type Entry = {
  id: number;
  area_name: string;
  action: string;
  timeline: string | null;
  responsible: string;
  status: "not_started" | "in_progress" | "completed";
};

type Member = {
  appraisalId: number;
  employeeName: string;
  total: number;
  completed: number;
  inProgress: number;
  entries: Entry[];
};

const AREA_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Technical: Code2,
  Domain: Building2,
  "Soft Skill": Volume2,
  Others: Pin,
};

const AREA_COLORS: Record<string, string> = {
  Technical: "#1f3a68",
  Domain: "#0f766e",
  "Soft Skill": "#16a34a",
  Others: "#d97706",
};

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  not_started: { bg: "#f3f4f6", color: "#6b7280", label: "Not Started" },
  in_progress: { bg: "#fff7ed", color: "#f26522", label: "In Progress" },
  completed: { bg: "#dcfce7", color: "#16a34a", label: "Completed" },
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

export default function TeamDevelopmentPlansPage({ inlineWithSectionHeading = false }: { inlineWithSectionHeading?: boolean }) {
  const [team, setTeam] = useState<Member[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/manager/development-plans")
      .then((r) => r.json())
      .then((data) => {
        if (data.team) setTeam(data.team);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ ...ui.card, minHeight: 180, display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        Loading development plans...
      </div>
    );
  }

  return (
    <div style={ui.page}>
      {!inlineWithSectionHeading && (
        <div>
          <h1 style={{ margin: 0, fontSize: 30, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Development Plans (Team)</h1>
          <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
            Review your team members&apos; learning and growth plans
          </p>
        </div>
      )}

      {error && (
        <div style={{ ...ui.card, borderColor: "#fecaca", background: "#fff5f5", color: "#b91c1c", padding: "10px 14px", fontSize: 13 }}>
          {error}
        </div>
      )}

      {team.length === 0 && (
        <div style={{ ...ui.card, padding: 44, textAlign: "center" }}>
          <TrendingUp size={44} color="var(--color-navy-700)" />
          <h3 style={{ margin: "10px 0 0", fontSize: 22, color: "var(--color-text-heading)" }}>No team members assigned</h3>
        </div>
      )}

      {team.map((member) => {
        const isExpanded = expanded === member.appraisalId;

        const grouped: Record<string, Entry[]> = {};
        for (const e of member.entries) {
          if (!grouped[e.area_name]) grouped[e.area_name] = [];
          grouped[e.area_name].push(e);
        }

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
                    {member.total} entries · {member.completed} completed · {member.inProgress} in progress
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {member.total === 0 ? (
                  <span className="status-pill status-pending">No Plan</span>
                ) : member.completed === member.total ? (
                  <span className="status-pill status-approved">All Complete</span>
                ) : (
                  <span className="status-pill status-submitted">{member.completed}/{member.total} done</span>
                )}
                <span style={{ color: "var(--color-text-muted)", fontSize: 18 }}>{isExpanded ? "▴" : "▾"}</span>
              </div>
            </div>

            {isExpanded && (
              <div style={{ padding: "0 18px 18px" }}>
                {member.total === 0 ? (
                  <div style={{ textAlign: "center", padding: 24, color: "var(--color-text-muted)", fontSize: 13 }}>
                    This employee has not created a development plan yet.
                  </div>
                ) : (
                  Object.keys(grouped).map((areaName) => {
                    const areaEntries = grouped[areaName];
                    const aColor = AREA_COLORS[areaName] || "#1f3a68";
                    const AreaIcon = AREA_ICONS[areaName] || Pin;

                    return (
                      <div key={areaName} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <AreaIcon size={18} color={aColor} />
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--color-text-heading)" }}>{areaName}</h4>
                          <span className="status-pill" style={{ background: `${aColor}15`, color: aColor }}>{areaEntries.length}</span>
                        </div>

                        {areaEntries.map((e, i) => {
                          const sb = STATUS_BADGE[e.status] || STATUS_BADGE.not_started;
                          return (
                            <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px", padding: "10px 12px", gap: 12, alignItems: "center", background: i % 2 === 0 ? "#fff" : "#fcfdff", borderRadius: 10, marginBottom: 4, border: "1px solid #f1f5f9" }}>
                              <div style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.5 }}>{e.action}</div>
                              <div>
                                <span className="status-pill status-draft" style={{ background: "#fff", border: "1px solid var(--color-border)" }}>{e.timeline || "—"}</span>
                              </div>
                              <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{e.responsible}</div>
                              <div>
                                <span className="status-pill" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
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
          </section>
        );
      })}
    </div>
  );
}
