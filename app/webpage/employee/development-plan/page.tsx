// app/webpage/development-plan/page.tsx
"use client";
import { useState, useEffect } from "react";

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

const AREA_ICONS: Record<string, string> = { Technical: "💻", Domain: "🏭", "Soft Skill": "🗣️", Others: "📌" };
const AREA_COLORS: Record<string, string> = { Technical: "#7c3aed", Domain: "#0891b2", "Soft Skill": "#059669", Others: "#d97706" };
const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  not_started: { bg: "#f3f4f6", color: "#6b7280", label: "Not Started" },
  in_progress: { bg: "#dbeafe", color: "#1d4ed8", label: "In Progress" },
  completed:   { bg: "#dcfce7", color: "#16a34a", label: "Completed" },
};

export default function DevelopmentPlanPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [areas, setAreas] = useState<DevArea[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Entry>>({});

  // Add state
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

  // ── Add ──
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
      if (!res.ok) { setError(data.error); return; }
      setEntries([...entries, data.entry]);
      setNewForm({ responsible: "Self" });
      setAdding(false);
    } catch (e: any) { setError(e.message); }
  };

  // ── Edit ──
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
      if (!res.ok) { setError(data.error); return; }
      setEntries(entries.map((e) => (e.id === editId ? data.entry : e)));
      setEditId(null);
    } catch (e: any) { setError(e.message); }
  };

  // ── Delete ──
  const handleDelete = async (id: number) => {
    setError("");
    try {
      const res = await fetch(`/api/employee/development-plan/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      setEntries(entries.filter((e) => e.id !== id));
    } catch (e: any) { setError(e.message); }
  };

  // ── Status change ──
  const changeStatus = async (entry: Entry, newStatus: string) => {
    setError("");
    try {
      const res = await fetch(`/api/employee/development-plan/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: entry.action, timeline: entry.timeline, responsible: entry.responsible, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setEntries(entries.map((e) => (e.id === entry.id ? data.entry : e)));
    } catch (e: any) { setError(e.message); }
  };

  const inp: React.CSSProperties = {
    border: "1px solid #d8b4fe", borderRadius: 8, padding: "7px 10px",
    fontSize: 13, outline: "none", background: "#faf8ff", width: "100%",
  };

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af" }}>Loading development plan...</div>;
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>Development Plan</h2>
        <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>Track your learning, certifications, and growth actions throughout the year</p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${areas.length}, 1fr)`, gap: 12, marginBottom: 24 }}>
        {areas.map((a) => {
          const count = entries.filter((e) => e.area_name === a.area_name).length;
          const aColor = AREA_COLORS[a.area_name] || "#7c3aed";
          return (
            <div key={a.id} onClick={() => setActiveTab(a.area_name)} style={{ background: "#fff", borderRadius: 12, padding: "16px", border: `2px solid ${activeTab === a.area_name ? aColor : "#ede9fe"}`, cursor: "pointer", transition: "all 0.2s", boxShadow: activeTab === a.area_name ? `0 4px 16px ${aColor}25` : "none" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{AREA_ICONS[a.area_name] || "📌"}</div>
              <p style={{ fontWeight: 700, fontSize: 13, color: activeTab === a.area_name ? aColor : "#374151" }}>{a.area_name}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: aColor }}>{count}</p>
              <p style={{ fontSize: 11, color: "#9ca3af" }}>action{count !== 1 ? "s" : ""}</p>
            </div>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede9fe", overflow: "hidden", boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>
        {/* Tab Header */}
        <div style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{AREA_ICONS[activeTab] || "📌"}</span>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{activeTab}</h3>
            <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{tabEntries.length} items</span>
          </div>
          <button onClick={() => { setAdding(true); setNewForm({ responsible: "Self" }); }} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add Entry</button>
        </div>

        {/* Table Head */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px 80px", background: "#faf8ff", padding: "10px 20px", fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #ede9fe", gap: 12 }}>
          {["Action / Training / Certification", "Timeline", "Responsible", "Status", ""].map((h) => <div key={h}>{h}</div>)}
        </div>

        {tabEntries.length === 0 && !adding && (
          <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No entries yet. Click "+ Add Entry" to get started.</div>
        )}

        {tabEntries.map((e, i) => (
          <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px 80px", padding: "14px 20px", gap: 12, alignItems: "center", background: i % 2 === 0 ? "#fff" : "#faf8ff", borderBottom: "1px solid #f3f0ff" }}>
            {editId === e.id ? (
              <>
                <input value={editForm.action ?? ""} onChange={(ev) => setEditForm({ ...editForm, action: ev.target.value })} style={inp} />
                <input value={editForm.timeline ?? ""} onChange={(ev) => setEditForm({ ...editForm, timeline: ev.target.value })} style={inp} placeholder="e.g. Dec 2025" />
                <input value={editForm.responsible ?? ""} onChange={(ev) => setEditForm({ ...editForm, responsible: ev.target.value })} style={inp} />
                <select value={editForm.status ?? "not_started"} onChange={(ev) => setEditForm({ ...editForm, status: ev.target.value as any })} style={inp}>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={saveEdit} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>✓</button>
                  <button onClick={() => setEditId(null)} style={{ background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: 12, cursor: "pointer" }}>✕</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "#1f2937", lineHeight: 1.5, fontWeight: 500 }}>{e.action}</div>
                <div style={{ fontSize: 12 }}>
                  <span style={{ background: "#f5f3ff", color: "#7c3aed", borderRadius: 6, padding: "3px 10px", fontWeight: 600, fontSize: 12 }}>{e.timeline || "—"}</span>
                </div>
                <div style={{ fontSize: 12, color: "#374151" }}>{e.responsible}</div>
                <div>
                  <select
                    value={e.status}
                    onChange={(ev) => changeStatus(e, ev.target.value)}
                    style={{ background: STATUS_BADGE[e.status].bg, color: STATUS_BADGE[e.status].color, border: "none", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditId(e.id); setEditForm({ ...e }); }} style={{ background: "#f5f3ff", color: "#7c3aed", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => handleDelete(e.id)} style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: 12, cursor: "pointer" }}>✕</button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add new row */}
        {adding && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px 80px", padding: "14px 20px", gap: 12, alignItems: "center", background: "#faf8ff", borderTop: "2px dashed #c4b5fd" }}>
            <input value={newForm.action ?? ""} onChange={(e) => setNewForm({ ...newForm, action: e.target.value })} placeholder="Enter training / certification / action..." style={inp} />
            <input value={newForm.timeline ?? ""} onChange={(e) => setNewForm({ ...newForm, timeline: e.target.value })} placeholder="e.g. Dec 2025" style={inp} />
            <input value={newForm.responsible ?? ""} onChange={(e) => setNewForm({ ...newForm, responsible: e.target.value })} placeholder="Self / Manager / HR" style={inp} />
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Not Started</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={handleAdd} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Add</button>
              <button onClick={() => setAdding(false)} style={{ background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 6, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>✕</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}