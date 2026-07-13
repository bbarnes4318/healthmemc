import { jsPDF } from "jspdf";

export function generatePrimaryDoctorReportPdf(data) {
  const { user, profile, consultations, medications, vitals } = data;
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = 18;
  const maxW = pageW - m * 2;
  let y = 0;

  const ensureSpace = (h) => {
    if (y + h > pageH - 24) { doc.addPage(); y = m; }
  };

  const addText = (text, size, style, color, x) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style || "normal");
    if (color) doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxW);
    const xPos = x || m;
    lines.forEach((line) => {
      ensureSpace(size * 0.5 + 2);
      doc.text(line, xPos, y);
      y += size * 0.5 + 2;
    });
  };

  const addSectionTitle = (title, color) => {
    y += 5;
    ensureSpace(14);
    const c = color || [22, 86, 160];
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(0.5);
    doc.line(m, y - 2, pageW - m, y - 2);
    addText(title, 12, "bold", c);
    y += 2;
  };

  // Header banner
  doc.setFillColor(22, 86, 160);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Visit Summary", m, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Prepared for Primary Care Physician", m, 25);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - m, 25, { align: "right" });
  doc.setFontSize(8);
  doc.text("Health Me Medical Center", pageW - m, 15, { align: "right" });
  y = 48;

  // Intro note
  addText("This report compiles the patient's recent AI-assisted health consultations and tracked health data for your review. It is intended to support your clinical assessment, not replace it.", 9, "italic", [120, 120, 120]);
  y += 4;

  // Patient Information
  addSectionTitle("Patient Information");
  addText(`Name: ${user?.full_name || "N/A"}`, 10, "normal", [40, 40, 40]);
  y -= 3;
  const demoParts = [];
  if (profile?.date_of_birth) demoParts.push(`DOB: ${new Date(profile.date_of_birth).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`);
  if (profile?.gender) demoParts.push(`Sex: ${profile.gender.replace(/_/g, " ")}`);
  if (profile?.blood_type && profile.blood_type !== "unknown") demoParts.push(`Blood Type: ${profile.blood_type}`);
  if (profile?.height_cm) demoParts.push(`Height: ${profile.height_cm} cm`);
  if (profile?.weight_kg) demoParts.push(`Weight: ${profile.weight_kg} kg`);
  if (demoParts.length > 0) addText(demoParts.join("   |   "), 9, "normal", [80, 80, 80]);
  if (profile?.height_cm && profile?.weight_kg) {
    const bmi = (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1);
    addText(`BMI: ${bmi}`, 9, "normal", [80, 80, 80]);
  }
  y += 2;

  // Allergies & Conditions
  if ((profile?.allergies?.length > 0) || (profile?.chronic_conditions?.length > 0)) {
    addSectionTitle("Allergies & Chronic Conditions", [185, 28, 28]);
    if (profile.allergies?.length > 0) {
      ensureSpace(10);
      doc.setFillColor(254, 226, 226);
      doc.roundedRect(m, y - 3, maxW, 8, 2, 2, "F");
      addText(`ALLERGIES: ${profile.allergies.join(", ")}`, 9, "bold", [185, 28, 28]);
    }
    if (profile.chronic_conditions?.length > 0) {
      y += 2;
      addText(`Chronic Conditions: ${profile.chronic_conditions.join(", ")}`, 9, "normal", [60, 60, 60]);
    }
    y += 3;
  }

  // Current Medications
  if (medications?.length > 0) {
    addSectionTitle(`Current Medications (${medications.length})`, [5, 150, 105]);
    medications.forEach((med, i) => {
      ensureSpace(12);
      const times = med.time_of_day?.length > 0 ? ` [${med.time_of_day.join(", ")}]` : "";
      addText(`${i + 1}. ${med.name || med.medication_name} — ${med.dosage || ""}, ${med.frequency || ""}${times}`, 10, "bold", [40, 40, 40]);
      y += 1;
    });
    y += 2;
  }

  // Recent Vital Signs
  if (vitals?.length > 0) {
    addSectionTitle("Recent Vital Signs", [37, 99, 235]);
    const byType = {};
    vitals.forEach((v) => {
      if (!byType[v.type]) byType[v.type] = [];
      byType[v.type].push(v);
    });
    Object.keys(byType).forEach((type) => {
      const records = byType[type].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
      const latest = records[records.length - 1];
      const label = type.replace(/_/g, " ");
      const value = type === "blood_pressure" && latest.secondary_value
        ? `${latest.value}/${latest.secondary_value}`
        : latest.value;
      const dateStr = latest.recorded_at ? new Date(latest.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
      addText(`• ${label}: ${value} ${latest.unit || ""} (${dateStr}) — ${records.length} readings on file`, 9, "normal", [60, 60, 60]);
      y += 1;
    });
    y += 2;
  }

  // AI Consultation Summaries — the core section
  if (consultations?.length > 0) {
    addSectionTitle(`AI Health Consultation Summaries (${consultations.length})`, [139, 92, 246]);

    consultations.forEach((c, i) => {
      ensureSpace(20);
      const typeLabel = (c.type || "consultation").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const specLabel = c.specialty ? ` — ${c.specialty}` : "";
      addText(`${i + 1}. ${typeLabel}${specLabel}`, 10, "bold", [40, 40, 40]);
      addText(`   Date: ${new Date(c.created_date).toLocaleDateString()}  |  Status: ${c.status || "completed"}`, 8, "normal", [100, 100, 100]);

      if (c.symptoms) {
        addText(`   Reported Symptoms: ${c.symptoms.substring(0, 200)}${c.symptoms.length > 200 ? "..." : ""}`, 9, "normal", [80, 80, 80]);
      }

      if (c.report?.summary) {
        ensureSpace(10);
        doc.setFillColor(238, 242, 255);
        doc.roundedRect(m, y - 3, maxW, 8, 1, 1, "F");
        addText(`   Clinical Summary: ${c.report.summary.substring(0, 250)}${c.report.summary.length > 250 ? "..." : ""}`, 9, "normal", [55, 48, 163]);
      }

      if (c.report?.diagnoses?.length > 0) {
        const dxText = c.report.diagnoses.map((d) => `${d.name} (${d.confidence} confidence)`).join("; ");
        addText(`   Possible Diagnoses: ${dxText}`, 8, "normal", [80, 80, 80]);
      }

      if (c.report?.recommended_tests?.length > 0) {
        addText(`   Recommended Tests: ${c.report.recommended_tests.join(", ")}`, 8, "normal", [80, 80, 80]);
      }

      if (c.report?.recommended_treatments?.length > 0) {
        addText(`   Recommended Treatments: ${c.report.recommended_treatments.join(", ")}`, 8, "normal", [80, 80, 80]);
      }

      if (c.report?.emergency_warnings?.length > 0) {
        ensureSpace(8);
        addText(`   ⚠ EMERGENCY WARNINGS: ${c.report.emergency_warnings.join("; ")}`, 8, "bold", [185, 28, 28]);
      }

      if (c.report?.follow_up_plan) {
        addText(`   Follow-up Plan: ${c.report.follow_up_plan.substring(0, 150)}${c.report.follow_up_plan.length > 150 ? "..." : ""}`, 8, "normal", [80, 80, 80]);
      }

      if (c.report?.lifestyle_recommendations?.length > 0) {
        addText(`   Lifestyle Recs: ${c.report.lifestyle_recommendations.join(", ")}`, 8, "normal", [80, 80, 80]);
      }

      y += 3;
    });
    y += 2;
  }

  // Footer
  y += 6;
  ensureSpace(24);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, y, pageW - m, y);
  y += 6;
  addText("This summary was automatically compiled from the patient's AI-assisted health consultations and self-tracked health data in Health Me Medical Center. It includes AI-generated clinical summaries, which are informational and should be verified against clinical judgment. This document is intended to support — not replace — professional medical evaluation.", 7, "italic", [120, 120, 120]);

  const patientName = (user?.full_name || "Patient").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Primary-Doctor-Report-${patientName}-${new Date().toISOString().split("T")[0]}.pdf`);
}