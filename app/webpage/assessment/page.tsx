"use client";

import { ClipboardList, Star, TrendingUp } from "lucide-react";
import SelfAssessmentPage from "../employee/self-assessment/page";
import CompetencyPage from "../employee/competency/page";
import DevelopmentPlanPage from "../employee/development-plan/page";

type RoleName = "Employee" | "Manager" | "";

export default function AssessmentHomePage() {
  const role = (typeof window !== "undefined" ? sessionStorage.getItem("activeRole") || "" : "") as RoleName;

  const sections = [
    {
      key: "self-assessment",
      title: "Goals Assessment",
      component: <SelfAssessmentPage inlineWithSectionHeading showProgress={role !== "Manager"} />,
      icon: <ClipboardList size={18} />,
    },
    {
      key: "competency-assessment",
      title: "Competency Assessment",
      component: <CompetencyPage />,
      icon: <Star size={18} />,
    },
    {
      key: "development-plan",
      title: "Development Plan",
      component: <DevelopmentPlanPage />,
      icon: <TrendingUp size={18} />,
    },
  ];

  return (
    <div style={{ maxWidth: 1200, display: "grid", gap: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 30, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Assessment</h1>
        <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
          All assessment modules are displayed inline below. No need to navigate to separate pages.
        </p>
      </div>

      {sections.map((s) => (
        <div
          key={s.key}
          style={{
            background: "#fff",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            boxShadow: "var(--shadow-soft)",
            padding: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #ffd7c2", background: "#fff7f3", color: "var(--color-orange-500)", display: "grid", placeItems: "center" }}>
              {s.icon}
            </div>
            <h2 style={{ margin: 0, fontSize: 20, color: "var(--color-text-heading)" }}>{s.title}</h2>
          </div>
          {s.component}
        </div>
      ))}
    </div>
  );
}
