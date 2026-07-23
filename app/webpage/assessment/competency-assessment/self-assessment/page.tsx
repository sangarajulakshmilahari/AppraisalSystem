"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RoleRouteGuard from "../../components/RoleRouteGuard";
import CompetencyPage from "../../../employee/competency/page";

export default function AssessmentCompetencySelfAssessmentPage() {
  return (
    <RoleRouteGuard allowedRoles={["Employee"]}>
      <div style={{ display: "grid", gap: 12 }}>
        <Link href="/webpage/assessment" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-navy-700)", fontWeight: 700 }}>
          <ArrowLeft size={16} /> Back to Assessment
        </Link>
        <CompetencyPage />
      </div>
    </RoleRouteGuard>
  );
}

