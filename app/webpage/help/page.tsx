export default function HelpPage() {
  const faqs = [
    { q: "When does the self-assessment window close?",    a: "The self-assessment window is open until 28 Feb 2026. No changes can be made after submission." },
    { q: "Can I edit my goals after submission?",           a: "Goals can be edited only when the goal-setting window is open and before your manager approves them." },
    { q: "How is the final performance rating calculated?", a: "The final rating is a weighted average of all goal ratings given by your reporting manager, reviewed by HR." },
    { q: "What happens after I acknowledge the results?",   a: "Acknowledgment confirms you have reviewed the appraisal. This is required before compensation changes are processed." },
    { q: "Who do I contact for appraisal queries?",         a: "Please reach out to your HR Business Partner or raise a ticket via AHDAR (Help Desk system)." },
  ];

  return (
    <div style={{ maxWidth: 800 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937", marginBottom: 6 }}>Help & Support</h2>
      <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24 }}>Frequently asked questions about the appraisal process</p>
      {faqs.map((f, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", marginBottom: 12, border: "1px solid #ede9fe", boxShadow: "0 2px 8px rgba(124,58,237,0.05)" }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#7c3aed", marginBottom: 8 }}>Q: {f.q}</p>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>{f.a}</p>
        </div>
      ))}
      <div style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 16, padding: "24px", color: "#fff", marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Still need help?</h3>
        <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 16 }}>Raise a support ticket through the AHDAR Help Desk or contact your HR Business Partner directly.</p>
        <a href="mailto:hr@adroitent.com" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "10px 20px", borderRadius: 10, fontWeight: 600, fontSize: 13, textDecoration: "none", display: "inline-block" }}>Contact HR →</a>
      </div>
    </div>
  );
}