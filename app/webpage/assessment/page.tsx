"use client";

import Link from "next/link";
import { ClipboardList, Star } from "lucide-react";

type RoleName = "Employee" | "Manager" | "";

export default function AssessmentHomePage() {
  const role = (typeof window !== "undefined" ? sessionStorage.getItem("activeRole") || "" : "") as RoleName;

  const isManager = role === "Manager";

  const cards = isManager
    ? [
        {
          href: "/webpage/assessment/goals/manager-review",
          title: "Goals Manager Review",
          desc: "Review employee goal self assessments.",
          icon: <ClipboardList size={18} />,
        },
        {
          href: "/webpage/assessment/competency-assessment/manager-review",
          title: "Competency Manager Review",
          desc: "Review employee competency self assessments.",
          icon: <Star size={18} />,
        },
      ]
    : [
        {
          href: "/webpage/assessment/goals/self-assessment",
          title: "Goals Self Assessment",
          desc: "Fill your goal-wise self assessment.",
          icon: <ClipboardList size={18} />,
        },
        {
          href: "/webpage/assessment/competency-assessment/self-assessment",
          title: "Competency Assessment",
          desc: "Fill your competency self assessment.",
          icon: <Star size={18} />,
        },
      ];

  return (
    <div style={{ maxWidth: 980, display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 30, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Assessment</h1>
        <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
          Select an assessment module to continue.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(260px, 1fr))", gap: 14 }}>
        {cards.map((c) => (
          <Link key={c.href} href={c.href} style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--color-border)",
                borderRadius: 16,
                boxShadow: "var(--shadow-soft)",
                padding: 18,
                minHeight: 140,
                display: "grid",
                alignContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #ffd7c2", background: "#fff7f3", color: "var(--color-orange-500)", display: "grid", placeItems: "center" }}>
                {c.icon}
              </div>
              <div>
                <p style={{ margin: 0, color: "var(--color-text-heading)", fontWeight: 700 }}>{c.title}</p>
                <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 13, lineHeight: 1.5 }}>{c.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

     
    </div>
  );
}

