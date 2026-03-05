"use client";
import { useState } from "react";

type Area = "Technical" | "Domain" | "Soft Skill" | "Others";
type Entry = { id: string; area: Area; action: string; timeline: string; responsible: string };

const AREAS: Area[] = ["Technical", "Domain", "Soft Skill", "Others"];
const AREA_ICONS: Record<Area, string> = { Technical: "💻", Domain: "🏭", "Soft Skill": "🗣️", Others: "📌" };
const AREA_COLORS: Record<Area, string> = { Technical: "#7c3aed", Domain: "#0891b2", "Soft Skill": "#059669", Others: "#d97706" };

const INIT: Entry[] = [
  { id: "1", area: "Technical",  action: "Complete AWS Solutions Architect certification",            timeline: "Dec 2025", responsible: "Self" },
  { id: "2", area: "Technical",  action: "Complete a React Advanced Patterns course on Udemy",        timeline: "Sep 2025", responsible: "Self" },
  { id: "3", area: "Domain",     action: "Attend BFSI domain workshop organized by Adroitent",        timeline: "Nov 2025", responsible: "HR / Self" },
  { id: "4", area: "Soft Skill", action: "Join Toastmasters for presentation & communication skills", timeline: "Ongoing",  responsible: "Self" },
];

export default function DevelopmentPlanPage() {
  const [entries, setEntries] = useState<Entry[]>(INIT);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Entry>>({});
  const [activeTab, setActiveTab] = useState<Area>("Technical");
  const [newForms, setNewForms] = useState<Record<Area, Partial<Entry>>>({ Technical: {}, Domain: {}, "Soft Skill": {}, Others: {} });
  const [adding, setAdding] = useState<Area | null>(null);

  const tabEntries = entries.filter((e) => e.area === activeTab);

  const addEntry = (area: Area) => {
    const f = newForms[area];
    if (!f.action?.trim()) return;
    setEntries([...entries, { id: Date.now().toString(), area, action: f.action, timeline: f.timeline ?? "", responsible: f.responsible ?? "Self" }]);
    setNewForms({ ...newForms, [area]: {} });
    setAdding(null);
  };

  const saveEdit = () => {
    setEntries(entries.map((e) => e.id === editId ? { ...e, ...editForm } as Entry : e));
    setEditId(null);
  };

  const deleteEntry = (id: string) => setEntries(entries.filter((e) => e.id !== id));

  const inp: React.CSSProperties = { border: "1px solid #d8b4fe", borderRadius: 8, padding: "7px 10px", fontSize: 13, outline: "none", background: "#faf8ff", width: "100%" };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}>Development Plan</h2>
        <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>Track your learning, certifications, and growth actions throughout the year</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {AREAS.map((a) => {
          const count = entries.filter((e) => e.area === a).length;
          return (
            <div key={a} onClick={() => setActiveTab(a)} style={{ background: "#fff", borderRadius: 12, padding: "16px", border: `2px solid ${activeTab === a ? AREA_COLORS[a] : "#ede9fe"}`, cursor: "pointer", transition: "all 0.2s", boxShadow: activeTab === a ? `0 4px 16px ${AREA_COLORS[a]}25` : "none" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{AREA_ICONS[a]}</div>
              <p style={{ fontWeight: 700, fontSize: 13, color: activeTab === a ? AREA_COLORS[a] : "#374151" }}>{a}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: AREA_COLORS[a] }}>{count}</p>
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
            <span style={{ fontSize: 22 }}>{AREA_ICONS[activeTab]}</span>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{activeTab}</h3>
            <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{tabEntries.length} items</span>
          </div>
          <button onClick={() => setAdding(activeTab)} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add Entry</button>
        </div>

        {/* Table Head */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 160px 80px", background: "#faf8ff", padding: "10px 20px", fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #ede9fe", gap: 12 }}>
          {["Action / Training / Certification", "Timeline", "Responsible Person", ""].map((h) => <div key={h}>{h}</div>)}
        </div>

        {tabEntries.length === 0 && adding !== activeTab && (
          <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No entries yet. Click "+ Add Entry" to get started.</div>
        )}

        {tabEntries.map((e, i) => (
          <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 160px 80px", padding: "14px 20px", gap: 12, alignItems: "center", background: i % 2 === 0 ? "#fff" : "#faf8ff", borderBottom: "1px solid #f3f0ff" }}>
            {editId === e.id ? (
              <>
                <input value={editForm.action ?? ""} onChange={(ev) => setEditForm({ ...editForm, action: ev.target.value })} style={inp} />
                <input value={editForm.timeline ?? ""} onChange={(ev) => setEditForm({ ...editForm, timeline: ev.target.value })} style={inp} placeholder="e.g. Dec 2025" />
                <input value={editForm.responsible ?? ""} onChange={(ev) => setEditForm({ ...editForm, responsible: ev.target.value })} style={inp} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={saveEdit} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>✓</button>
                  <button onClick={() => setEditId(null)} style={{ background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: 12, cursor: "pointer" }}>✕</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "#1f2937", lineHeight: 1.5, fontWeight: 500 }}>{e.action}</div>
                <div style={{ fontSize: 12 }}>
                  <span style={{ background: "#f5f3ff", color: "#7c3aed", borderRadius: 6, padding: "3px 10px", fontWeight: 600, fontSize: 12 }}>{e.timeline}</span>
                </div>
                <div style={{ fontSize: 12, color: "#374151" }}>{e.responsible}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditId(e.id); setEditForm({ ...e }); }} style={{ background: "#f5f3ff", color: "#7c3aed", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => deleteEntry(e.id)} style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: 12, cursor: "pointer" }}>✕</button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add new row */}
        {adding === activeTab && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 160px 80px", padding: "14px 20px", gap: 12, alignItems: "center", background: "#faf8ff", borderTop: "2px dashed #c4b5fd" }}>
            <input value={newForms[activeTab].action ?? ""} onChange={(e) => setNewForms({ ...newForms, [activeTab]: { ...newForms[activeTab], action: e.target.value } })} placeholder="Enter training / certification / action..." style={inp} />
            <input value={newForms[activeTab].timeline ?? ""} onChange={(e) => setNewForms({ ...newForms, [activeTab]: { ...newForms[activeTab], timeline: e.target.value } })} placeholder="e.g. Dec 2025" style={inp} />
            <input value={newForms[activeTab].responsible ?? ""} onChange={(e) => setNewForms({ ...newForms, [activeTab]: { ...newForms[activeTab], responsible: e.target.value } })} placeholder="Self / Manager / HR" style={inp} />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => addEntry(activeTab)} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Add</button>
              <button onClick={() => setAdding(null)} style={{ background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 6, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>✕</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}