// app/webpage/profile/page.tsx
"use client";
import { useState, useEffect } from "react";

const PHASE_LABELS: Record<string, string> = {
  goal_setting: "Goal Setting",
  self_assessment: "Self Assessment",
  competency_assessment: "Competency Assessment",
  manager_review: "Manager Review",
  hr_review: "HR Review",
  completed: "Completed",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [cycle, setCycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employee/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) setProfile(data.profile);
        if (data.cycle) setCycle(data.cycle);
      })
      .catch((e) => console.error("Profile error:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af" }}>Loading profile...</div>;
  }

  if (!profile) {
    return <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Unable to load profile</div>;
  }

  const initials = profile.username
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase() ?? "")
    .join("");

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #f3f0ff" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>{value || "—"}</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937", marginBottom: 20 }}>My Profile</h2>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        {/* Avatar Card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "32px 24px", border: "1px solid #ede9fe", textAlign: "center", boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#ec4899)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "#fff", boxShadow: "0 8px 24px rgba(124,58,237,0.35)" }}>
            {initials}
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1f2937", marginBottom: 4 }}>{profile.username}</h3>
          <p style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600, marginBottom: 12 }}>{profile.email}</p>

          {/* Roles */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 16 }}>
            {profile.roles.map((r: string) => (
              <span key={r} style={{ background: "#f5f3ff", color: "#7c3aed", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600, border: "1px solid #ede9fe" }}>{r}</span>
            ))}
          </div>

          <div style={{ background: "#dcfce7", borderRadius: 10, padding: "8px 16px" }}>
            <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>● Active Employee</p>
          </div>
        </div>

        {/* Details */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede9fe", boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 32 }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, paddingBottom: 8, borderBottom: "2px solid #ede9fe" }}>Account Information</h4>
              <Field label="Username" value={profile.username} />
              <Field label="Email Address" value={profile.email} />
              <Field label="Member Since" value={profile.createdAt || "—"} />
              {/* <Field label="Keycloak ID" value={profile.keycloakId ? profile.keycloakId.substring(0, 8) + "..." : "—"} /> */}
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, paddingBottom: 8, borderBottom: "2px solid #ede9fe" }}>Role & Reporting</h4>
              <Field label="Assigned Roles" value={profile.roles.join(", ")} />
              <Field label="Reporting Manager" value={profile.managerName || "Not assigned"} />
              <Field label="System ID" value={`#${profile.id}`} />
            </div>
          </div>

          {/* Appraisal Cycle Info */}
          {cycle && (
            <div style={{ marginTop: 20, padding: "16px 18px", background: "linear-gradient(90deg,#f5f3ff,#ede9fe)", borderRadius: 12, border: "1px solid #c4b5fd" }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Current Appraisal Cycle</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 2 }}>Cycle</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#4c1d95" }}>{cycle.cycleName}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 2 }}>Current Phase</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#4c1d95" }}>{PHASE_LABELS[cycle.currentPhase] || cycle.currentPhase}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 2 }}>Period</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#4c1d95" }}>{cycle.periodStart} – {cycle.periodEnd}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}