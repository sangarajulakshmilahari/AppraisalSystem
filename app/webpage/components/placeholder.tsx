// app/webpage/_components/PlaceholderPage.tsx
"use client";

export default function PlaceholderPage({
  title,
  description,
  icon,
  role,
}: {
  title: string;
  description: string;
  icon: string;
  role: string;
}) {
  return (
    <div style={{ maxWidth: 800 }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "48px 40px",
          border: "1px solid #ede9fe",
          textAlign: "center",
          boxShadow: "0 4px 16px rgba(124,58,237,0.08)",
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 20 }}>{icon}</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1f2937", marginBottom: 8 }}>{title}</h2>
        <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.6, maxWidth: 500, margin: "0 auto 20px" }}>
          {description}
        </p>
        <div style={{ display: "inline-block", background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 10, padding: "8px 16px", fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>
          {role} Module · Coming Soon
        </div>
      </div>
    </div>
  );
}
