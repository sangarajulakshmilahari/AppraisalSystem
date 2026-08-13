// app/webpage/profile/page.tsx
"use client";

import { useEffect, useState } from "react";

const PHASE_LABELS: Record<string, string> = {
  goal_setting: "Goal Setting",
  self_assessment: "Self Assessment",
  competency_assessment: "Competency Assessment",
  manager_review: "Manager Review",
  hr_review: "HR Review",
  completed: "Completed",
};

type Profile = {
  id: number;
  username: string;
  email: string;
  createdAt?: string;
  roles: string[];
  teamLeadName?: string | null;
  managerName?: string | null;
  resume?: {
    id: number;
    fileName: string;
    filePath: string;
    mimeType: string;
    fileSizeBytes: number;
    uploadedAt: string | null;
    dueDate: string | null;
    stale: boolean;
    reminderSentAt: string | null;
  } | null;
};

type Cycle = {
  cycleName: string;
  currentPhase: string;
  periodStart: string;
  periodEnd: string;
};

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: "var(--color-text-heading)" }}>
        {value || "—"}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

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

  const refreshProfile = async () => {
    const res = await fetch("/api/employee/profile");
    const data = await res.json();
    if (data.profile) setProfile(data.profile);
    if (data.cycle) setCycle(data.cycle);
  };

  const handleResumeUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setMessage("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/employee/profile/resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to upload resume");
        return;
      }
      setMessage("Resume uploaded successfully.");
      await refreshProfile();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to upload resume");
    } finally {
      setUploading(false);
      ev.target.value = "";
    }
  };

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 180, color: "var(--color-text-muted)", background: "#fff", border: "1px solid var(--color-border)", borderRadius: 16, boxShadow: "var(--shadow-soft)" }}>
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)", background: "#fff", border: "1px solid var(--color-border)", borderRadius: 16, boxShadow: "var(--shadow-soft)" }}>
        Unable to load profile
      </div>
    );
  }

  const initials = profile.username
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div style={{ maxWidth: 980, display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0, fontSize: 30, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>My Profile</h1>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16 }}>
        <section style={{ background: "#fff", borderRadius: 16, padding: "28px 20px", border: "1px solid var(--color-border)", textAlign: "center", boxShadow: "var(--shadow-soft)" }}>
          <div style={{ width: 92, height: 92, borderRadius: "50%", background: "#e7eef9", margin: "0 auto 14px", display: "grid", placeItems: "center", fontSize: 30, fontWeight: 800, color: "var(--color-navy-700)" }}>
            {initials}
          </div>
          <h2 style={{ margin: 0, fontSize: 22, color: "var(--color-text-heading)" }}>{profile.username}</h2>
          <p style={{ margin: "4px 0 12px", fontSize: 13, color: "var(--color-text-muted)" }}>{profile.email}</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 14 }}>
            {profile.roles.map((r: string) => (
              <span key={r} className="status-pill" style={{ background: "#eef6ff", color: "var(--color-navy-700)", border: "1px solid #dbe5f3" }}>
                {r}
              </span>
            ))}
          </div>

          <div className="status-pill status-approved" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px" }}>
            ● Active Employee
          </div>
        </section>

        <section style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-soft)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 24 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: "var(--color-text-heading)", paddingBottom: 10, borderBottom: "1px solid var(--color-border)" }}>
                Account Information
              </h3>
              <FieldRow label="Username" value={profile.username} />
              <FieldRow label="Email Address" value={profile.email} />
              <FieldRow label="Member Since" value={profile.createdAt || "—"} />
            </div>

            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: "var(--color-text-heading)", paddingBottom: 10, borderBottom: "1px solid var(--color-border)" }}>
                Role & Reporting
              </h3>
              <FieldRow label="Assigned Roles" value={profile.roles.join(", ")} />
              {profile.teamLeadName ? <FieldRow label="Team Lead" value={profile.teamLeadName} /> : null}
              <FieldRow label="Manager" value={profile.managerName || "Not assigned"} />
              {/* <FieldRow label="System ID" value={`#${profile.id}`} /> */}
            </div>
          </div>

          {cycle && (
            <div style={{ marginTop: 18, padding: "14px 16px", background: "#fff8f3", borderRadius: 12, border: "1px solid #ffd7c2" }}>
              <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--color-orange-500)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Current Appraisal Cycle
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 10 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)", fontWeight: 700 }}>Cycle</p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "var(--color-text-heading)" }}>{cycle.cycleName}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)", fontWeight: 700 }}>Current Phase</p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "var(--color-text-heading)" }}>
                    {PHASE_LABELS[cycle.currentPhase] || cycle.currentPhase}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)", fontWeight: 700 }}>Period</p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "var(--color-text-heading)" }}>
                    {cycle.periodStart} – {cycle.periodEnd}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 18, padding: "14px 16px", background: profile.resume?.stale ? "#fff7ed" : "#f8fafc", borderRadius: 12, border: profile.resume?.stale ? "1px solid #fdba74" : "1px solid var(--color-border)" }}>
            <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--color-orange-500)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Resume Management
            </h4>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-body)" }}>
                {profile.resume
                  ? `Current resume: ${profile.resume.fileName}`
                  : "No resume uploaded yet."}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                Last updated: {profile.resume?.uploadedAt || "—"} · Next update due: {profile.resume?.dueDate || "After first upload"}
              </p>
              {profile.resume?.stale && (
                <div className="status-pill" style={{ background: "#fff1f2", color: "#b91c1c", border: "1px solid #fecdd3", width: "fit-content" }}>
                  Resume update overdue (more than 6 months)
                </div>
              )}
              {profile.resume?.filePath && (
                <a
                  href={profile.resume.filePath}
                  target="_blank"
                  rel="noreferrer"
                  style={{ width: "fit-content", fontSize: 13, fontWeight: 700, color: "var(--color-navy-700)", textDecoration: "none" }}
                >
                  View current resume
                </a>
              )}

              <label style={{ width: "fit-content" }}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleResumeUpload}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
                <span className="btn btn-primary" style={{ display: "inline-flex", cursor: uploading ? "default" : "pointer", opacity: uploading ? 0.7 : 1 }}>
                  {uploading ? "Uploading..." : profile.resume ? "Replace Resume" : "Upload Resume"}
                </span>
              </label>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>Allowed formats: PDF, DOC, DOCX (max 5MB)</p>

              {message && (
                <p style={{ margin: 0, fontSize: 13, color: message.includes("success") ? "#15803d" : "#b91c1c" }}>{message}</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
