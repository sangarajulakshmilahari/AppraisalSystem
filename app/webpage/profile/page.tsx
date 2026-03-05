"use client";
import { useEffect, useState } from "react";
import { getUserFromCookie, getInitials } from "../../api/lib/auth";

const mockEmployee = {
  name: "Sriram Kumar",
  email: "sriram.kumar@adroitent.com",
  employeeCode: "ADR-2241",
  designation: "Senior Software Engineer",
  department: "Technology Services",
  practice: "Enterprise Applications",
  manager: "Rajesh Nair",
  hrBP: "Meena Sharma",
  joiningDate: "12 Aug 2019",
  location: "Chennai, India",
  workMode: "Hybrid",
  cmmiRole: "Practitioner",
};

export default function ProfilePage() {
  const [name, setName] = useState(mockEmployee.name);
  useEffect(() => {
    const u = getUserFromCookie();
    if (u && u !== "User") setName(u);
  }, []);

  const emp = { ...mockEmployee, name };
  const initials = getInitials(emp.name);

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #f3f0ff" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>{value}</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1f2937", marginBottom: 20 }}>My Profile</h2>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        {/* Avatar Card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "32px 24px", border: "1px solid #ede9fe", textAlign: "center", boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#ec4899)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "#fff", boxShadow: "0 8px 24px rgba(124,58,237,0.35)" }}>{initials}</div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1f2937", marginBottom: 4 }}>{emp.name}</h3>
          <p style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600, marginBottom: 4 }}>{emp.designation}</p>
          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>{emp.department}</p>
          <div style={{ background: "#f5f3ff", borderRadius: 10, padding: "8px 16px", marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700 }}>Employee Code</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#4c1d95" }}>{emp.employeeCode}</p>
          </div>
          <div style={{ background: "#dcfce7", borderRadius: 10, padding: "8px 16px" }}>
            <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>● Active Employee</p>
          </div>
        </div>

        {/* Details */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ede9fe", boxShadow: "0 4px 16px rgba(124,58,237,0.08)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 32 }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, paddingBottom: 8, borderBottom: "2px solid #ede9fe" }}>Personal Information</h4>
              <Field label="Full Name" value={emp.name} />
              <Field label="Email Address" value={emp.email} />
              <Field label="Location" value={emp.location} />
              <Field label="Work Mode" value={emp.workMode} />
              <Field label="Date of Joining" value={emp.joiningDate} />
            </div>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, paddingBottom: 8, borderBottom: "2px solid #ede9fe" }}>Role & Reporting</h4>
              <Field label="Designation" value={emp.designation} />
              <Field label="Department" value={emp.department} />
              <Field label="Practice Area" value={emp.practice} />
              <Field label="Reporting Manager" value={emp.manager} />
              <Field label="HR Business Partner" value={emp.hrBP} />
            </div>
          </div>

          {/* Appraisal Cycle Info */}
          <div style={{ marginTop: 20, padding: "16px 18px", background: "linear-gradient(90deg,#f5f3ff,#ede9fe)", borderRadius: 12, border: "1px solid #c4b5fd" }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Current Appraisal Cycle</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {[
                { label: "Cycle", value: "FY 2025–26" },
                { label: "Current Phase", value: "Self Assessment" },
                { label: "CMMI Role", value: emp.cmmiRole },
              ].map((item) => (
                <div key={item.label}>
                  <p style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#4c1d95" }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}