// app/webpage/_components/PlaceholderPage.tsx
"use client";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  FileText,
  Files,
  GraduationCap,
  Link2,
  LucideIcon,
  Medal,
  RadioTower,
  RefreshCw,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Upload,
  WalletCards,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  barChart: BarChart3,
  bell: Bell,
  checkCircle: CheckCircle2,
  file: FileText,
  files: Files,
  graduationCap: GraduationCap,
  link: Link2,
  medal: Medal,
  radio: RadioTower,
  refresh: RefreshCw,
  scale: Scale,
  search: Search,
  settings: Settings,
  shield: ShieldCheck,
  trendingUp: TrendingUp,
  trophy: Trophy,
  upload: Upload,
  wallet: WalletCards,
};

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
  const Icon = ICONS[icon] || FileText;
  return (
    <div style={{ maxWidth: 980 }}>
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--color-border)",
          padding: "40px 32px",
          background: "#fff",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <div style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: "1px solid #ffd7c2",
              background: "#fff8f3",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon size={22} color="var(--color-orange-500)" strokeWidth={2} />
          </div>
          <span
            className="status-pill"
            style={{ background: "#eef6ff", color: "var(--color-navy-700)", border: "1px solid #dbe5f3" }}
          >
            {role}
          </span>
        </div>

        <h2 style={{ fontSize: 30, fontWeight: 700, color: "var(--color-text-heading)", letterSpacing: "-0.02em", margin: 0 }}>
          {title}
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: 15, lineHeight: 1.7, maxWidth: 640, margin: "10px 0 0" }}>
          {description}
        </p>

        <div
          style={{
            marginTop: 18,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#f8fafc",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 12,
            color: "var(--color-text-body)",
            fontWeight: 600,
          }}
        >
          {role} Module · Coming Soon
        </div>
      </div>
    </div>
  );
}
