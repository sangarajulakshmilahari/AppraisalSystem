// app/webpage/development-plan/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Building2, Check, Code2, Pin, Plus, Trash2, Volume2, X } from "lucide-react";

type Entry = {
  id: number;
  area_id: number;
  area_name: string;
  action: string;
  timeline: string | null;
  responsible: string;
  status: "not_started" | "in_progress" | "completed";
};

type DevArea = { id: number; area_name: string };

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
  in_progress: { bg: "#fff4ea", color: "#f26522", label: "In Progress" },
  completed: { bg: "#dcfce7", color: "#15803d", label: "Completed" },
};

const ui: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1080, display: "grid", gap: 16 },
  card: {
    background: "#fff",
    border: "1px solid var(--color-border)",
    borderRadius: 16,
    boxShadow: "var(--shadow-soft)",
  },
  input: {
    width: "100%",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    minHeight: 38,
    padding: "0 10px",
    fontSize: 13,
    color: "var(--color-text-body)",
    outline: "none",
    background: "#fff",
  },
};

export default function DevelopmentPlanPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [areas, setAreas] = useState<DevArea[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Entry>>({});

  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<Entry>>({ responsible: "Self" });

  useEffect(() => {
    Promise.all([
      fetch("/api/employee/development-plan").then((r) => r.json()),
      fetch("/api/employee/development-areas").then((r) => r.json()),
    ])
      .then(([planData, areasData]) => {
        if (planData.entries) setEntries(planData.entries);
        if (areasData.areas) {
          setAreas(areasData.areas);
          if (areasData.areas.length > 0) setActiveTab(areasData.areas[0].area_name);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const tabEntries = entries.filter((e) => e.area_name === activeTab);
  const activeArea = areas.find((a) => a.area_name === activeTab);

  const handleAdd = async () => {
    if (!activeArea || !newForm.action?.trim()) return;
    setError("");
    try {
      const res = await fetch("/api/employee/development-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newForm, area_id: activeArea.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setEntries((prev) => [...prev, data.entry]);
      setNewForm({ responsible: "Self" });
      setAdding(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add development entry");
    }
  };

  const saveEdit = async () => {
    if (!editForm.action?.trim()) return;
    setError("");
    try {
      const res = await fetch(`/api/employee/development-plan/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setEntries((prev) => prev.map((e) => (e.id === editId ? data.entry : e)));
      setEditId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update development entry");
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    try {
      const res = await fetch(`/api/employee/development-plan/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error);
        return;
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete development entry");
    }
  };

  const changeStatus = async (entry: Entry, newStatus: string) => {
    setError("");
    try {
      const res = await fetch(`/api/employee/development-plan/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: entry.action,
          timeline: entry.timeline,
          responsible: entry.responsible,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? data.entry : e)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div style={{ ...ui.card, minHeight: 180, display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        Loading development plan...
      </div>
    );
  }

  return (
    <div style={ui.page}>
      <div>
        <h1 style={{ margin: 0, fontSize: 30, color: "var(--color-text-heading)", letterSpacing: "-0.02em" }}>Development Plan</h1>
        <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
          Track your learning, certifications, and growth actions throughout the year
        </p>
      </div>

      {error && (
        <div style={{ ...ui.card, borderColor: "#fecaca", background: "#fff5f5", color: "#b91c1c", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ border: 0, background: "transparent", color: "#b91c1c", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(areas.length, 1)}, minmax(0, 1fr))`, gap: 12 }}>
        {areas.map((a) => {
          const count = entries.filter((e) => e.area_name === a.area_name).length;
          const aColor = AREA_COLORS[a.area_name] || "#1f3a68";
          const AreaIcon = AREA_ICONS[a.area_name] || Pin;

          return (
            <button
              key={a.id}
              onClick={() => setActiveTab(a.area_name)}
              style={{
                ...ui.card,
                padding: "16px",
                borderColor: activeTab === a.area_name ? "#ffd7c2" : "var(--color-border)",
                boxShadow: activeTab === a.area_name ? "var(--shadow-hover)" : "var(--shadow-soft)",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div style={{ marginBottom: 8, display: "flex" }}>
                <AreaIcon size={22} color={aColor} />
              </div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: activeTab === a.area_name ? "var(--color-text-heading)" : "var(--color-text-body)" }}>
                {a.area_name}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 800, color: "var(--color-text-heading)" }}>{count}</p>
              <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>action{count !== 1 ? "s" : ""}</p>
            </button>
          );
        })}
      </div>

      <section style={{ ...ui.card, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", background: "#fff8f3", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {(() => {
              const ActiveIcon = AREA_ICONS[activeTab] || Pin;
              return <ActiveIcon size={20} color="var(--color-orange-500)" />;
            })()}
            <h3 style={{ margin: 0, color: "var(--color-text-heading)", fontWeight: 700, fontSize: 18 }}>
              {activeTab || "Development Area"}
            </h3>
            <span className="status-pill" style={{ background: "#fff", color: "var(--color-text-body)", border: "1px solid var(--color-border)" }}>
              {tabEntries.length} items
            </span>
          </div>

          <button className="btn btn-primary" onClick={() => { setAdding(true); setNewForm({ responsible: "Self" }); }}>
            <Plus size={14} /> Add Entry
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 170px 140px 120px", background: "#fff", padding: "10px 20px", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-border)", gap: 12 }}>
          {["Action / Training / Certification", "Timeline", "Responsible", "Status", "Actions"].map((h) => (
            <div key={h}>{h}</div>
          ))}
        </div>

        {tabEntries.length === 0 && !adding && (
          <div style={{ padding: "28px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 14 }}>
            No entries yet. Click &quot;Add Entry&quot; to get started.
          </div>
        )}

        {tabEntries.map((e, i) => (
          <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 170px 140px 120px", padding: "14px 20px", gap: 12, alignItems: "center", background: i % 2 === 0 ? "#fff" : "#fcfdff", borderBottom: "1px solid #f1f5f9" }}>
            {editId === e.id ? (
              <>
                <input value={editForm.action ?? ""} onChange={(ev) => setEditForm({ ...editForm, action: ev.target.value })} style={ui.input} />
                <input value={editForm.timeline ?? ""} onChange={(ev) => setEditForm({ ...editForm, timeline: ev.target.value })} style={ui.input} placeholder="e.g. Dec 2025" />
                <input value={editForm.responsible ?? ""} onChange={(ev) => setEditForm({ ...editForm, responsible: ev.target.value })} style={ui.input} />
                <select value={editForm.status ?? "not_started"} onChange={(ev) => setEditForm({ ...editForm, status: ev.target.value as Entry["status"] })} style={ui.input}>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary" onClick={saveEdit} style={{ minHeight: 34, padding: "0 10px" }}>
                    <Check size={14} />
                  </button>
                  <button className="btn btn-secondary" onClick={() => setEditId(null)} style={{ minHeight: 34, padding: "0 10px" }}>
                    <X size={14} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.5, fontWeight: 500 }}>{e.action}</div>
                <div style={{ fontSize: 12 }}>
                  <span className="status-pill status-draft" style={{ background: "#fff", border: "1px solid var(--color-border)" }}>
                    {e.timeline || "—"}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--color-text-body)" }}>{e.responsible}</div>
                <div>
                  <select
                    value={e.status}
                    onChange={(ev) => changeStatus(e, ev.target.value)}
                    style={{
                      border: "1px solid transparent",
                      borderRadius: 999,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      background: STATUS_BADGE[e.status].bg,
                      color: STATUS_BADGE[e.status].color,
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => { setEditId(e.id); setEditForm({ ...e }); }} style={{ minHeight: 34, padding: "0 10px" }}>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    style={{
                      minHeight: 34,
                      minWidth: 34,
                      border: "1px solid #fecaca",
                      borderRadius: 10,
                      background: "#fff5f5",
                      color: "#b91c1c",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {adding && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 170px 140px 120px", padding: "14px 20px", gap: 12, alignItems: "center", background: "#fff8f3", borderTop: "1px dashed #ffd7c2" }}>
            <input value={newForm.action ?? ""} onChange={(e) => setNewForm({ ...newForm, action: e.target.value })} placeholder="Enter training / certification / action..." style={ui.input} />
            <input value={newForm.timeline ?? ""} onChange={(e) => setNewForm({ ...newForm, timeline: e.target.value })} placeholder="e.g. Dec 2025" style={ui.input} />
            <input value={newForm.responsible ?? ""} onChange={(e) => setNewForm({ ...newForm, responsible: e.target.value })} placeholder="Self / Manager / HR" style={ui.input} />
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Not Started</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={handleAdd} style={{ minHeight: 34, padding: "0 10px" }}>
                Add
              </button>
              <button className="btn btn-secondary" onClick={() => setAdding(false)} style={{ minHeight: 34, padding: "0 10px" }}>
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
