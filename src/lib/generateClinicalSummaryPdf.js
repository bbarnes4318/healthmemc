import { jsPDF } from "jspdf";

const vitalLabels = {
  heart_rate: "Heart Rate",
  blood_pressure: "Blood Pressure",
  oxygen_saturation: "Oxygen Sat.",
  blood_glucose: "Blood Glucose",
  weight: "Weight",
  sleep_hours: "Sleep",
  activity_minutes: "Activity",
  temperature: "Temperature",
  steps: "Steps",
};

const vitalUnits = {
  heart_rate: "bpm",
  blood_pressure: "mmHg",
  oxygen_saturation: "%",
  blood_glucose: "mg/dL",
  weight: "kg",
  sleep_hours: "hrs",
  activity_minutes: "min",
  temperature: "°F",
  steps: "",
};

const vitalRanges = {
  heart_rate: { min: 60, max: 100 },
  blood_pressure: { min: 90, max: 120 },
  oxygen_saturation: { min: 95, max: 100 },
  blood_glucose: { min: 70, max: 140 },
  temperature: { min: 97, max: 99 },
};

function getTrendArrow(records) {
  if (records.length < 2) return "→";
  const recent = records[records.length - 1].value;
  const older = records[0].value;
  if (recent > older * 1.02) return "↑";
  if (recent < older * 0.98) return "↓";
  return "→";
}

function isAbnormal(type, value) {
  const range = vitalRanges[type];
  if (!range) return false;
  return value < range.min || value > range.max;
}

export function generateClinicalSummaryPdf(data) {
  const { user, profile, medications, vitals, labRecords, consultations } = data;
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = 18;
  const maxW = pageW - m * 2;
  let y = 0;

  const ensureSpace = (h) => {
    if (y + h > pageH - 20) { doc.addPage(); y = m; }
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
  doc.rect(0, 0, pageW, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Clinical Summary", m, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("For Specialist Visit Handover", m, 23);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - m, 23, { align: "right" });
  doc.setFontSize(8);
  doc.text("Health Me Medical Center", pageW - m, 14, { align: "right" });
  y = 44;

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
  if (demoParts.length > 0) {
    addText(demoParts.join("   |   "), 9, "normal", [80, 80, 80]);
  }
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
      doc.roundedRect(m, y - 3, maxW, 8 + profile.allergies.length * 5, 2, 2, "F");
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
      ensureSpace(14);
      const times = med.time_of_day?.length > 0 ? ` [${med.time_of_day.join(", ")}]` : "";
      addText(`${i + 1}. ${med.name} — ${med.dosage}, ${med.frequency}${times}`, 10, "bold", [40, 40, 40]);
      const details = [];
      if (med.prescribing_provider) details.push(`Rx: ${med.prescribing_provider}`);
      if (med.start_date) details.push(`Started: ${new Date(med.start_date).toLocaleDateString()}`);
      if (med.refill_date) details.push(`Refill: ${new Date(med.refill_date).toLocaleDateString()}`);
      if (med.supply_quantity != null) details.push(`Supply: ${med.supply_quantity}`);
      if (details.length > 0) addText(`   ${details.join("  |  ")}`, 8, "normal", [100, 100, 100]);
      y += 1;
    });
    y += 2;
  }

  // Latest Vital Signs with Trends
  if (vitals?.length > 0) {
    addSectionTitle("Latest Vital Signs & Trends", [37, 99, 235]);

    // Group by type and sort chronologically
    const byType = {};
    vitals.forEach((v) => {
      if (!byType[v.type]) byType[v.type] = [];
      byType[v.type].push(v);
    });
    Object.keys(byType).forEach((type) => {
      byType[type].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
    });

    // Table header
    ensureSpace(8);
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(m, y - 3, maxW, 7, 1, 1, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("Vital", m + 2, y + 1);
    doc.text("Latest", m + 65, y + 1);
    doc.text("Trend", m + 110, y + 1);
    doc.text("Readings", m + 135, y + 1);
    doc.text("Last Recorded", m + 165, y + 1);
    y += 7;

    Object.keys(byType).forEach((type) => {
      const records = byType[type];
      const latest = records[records.length - 1];
      const label = vitalLabels[type] || type.replace(/_/g, " ");
      const value = type === "blood_pressure" && latest.secondary_value
        ? `${latest.value}/${latest.secondary_value}`
        : latest.value;
      const unit = vitalUnits[type] || latest.unit || "";
      const trend = getTrendArrow(records);
      const abnormal = isAbnormal(type, latest.value);
      const dateStr = new Date(latest.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

      ensureSpace(6);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      doc.text(label, m + 2, y);

      doc.setFont("helvetica", abnormal ? "bold" : "normal");
      doc.setTextColor(abnormal ? 220 : 40, abnormal ? 38 : 40, abnormal ? 38 : 40);
      doc.text(`${value} ${unit}`, m + 65, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(trend, m + 110, y);
      doc.text(String(records.length), m + 135, y);
      doc.text(dateStr, m + 165, y);
      y += 6;
    });
    y += 3;
  }

  // Recent Lab Results
  if (labRecords?.length > 0) {
    addSectionTitle(`Recent Lab Results (${labRecords.length})`, [22, 163, 74]);
    labRecords.slice(0, 15).forEach((rec, i) => {
      ensureSpace(12);
      addText(`${i + 1}. ${rec.title}`, 9, "bold", [40, 40, 40]);
      const meta = [];
      if (rec.date) meta.push(`Date: ${new Date(rec.date).toLocaleDateString()}`);
      if (rec.provider) meta.push(`Lab/Provider: ${rec.provider}`);
      if (meta.length > 0) addText(`   ${meta.join("  |  ")}`, 8, "normal", [100, 100, 100]);
      if (rec.notes) {
        const noteLines = doc.splitTextToSize(`   Result: ${rec.notes}`, maxW - 4);
        noteLines.slice(0, 4).forEach((line) => {
          ensureSpace(4);
          doc.text(line, m, y);
          y += 4;
        });
      }
      y += 1;
    });
    y += 2;
  }

  // Recent AI Consultation Summaries
  if (consultations?.length > 0) {
    addSectionTitle("Recent AI Consultation Summaries", [139, 92, 246]);
    consultations.slice(0, 5).forEach((c, i) => {
      ensureSpace(12);
      const typeLabel = c.type?.replace(/_/g, " ") || "Consultation";
      const specLabel = c.specialty ? ` — ${c.specialty}` : "";
      addText(`${i + 1}. ${typeLabel}${specLabel}`, 9, "bold", [40, 40, 40]);
      addText(`   Date: ${new Date(c.created_date).toLocaleDateString()}  |  Status: ${c.status}`, 8, "normal", [100, 100, 100]);
      if (c.symptoms) addText(`   Symptoms: ${c.symptoms.substring(0, 120)}${c.symptoms.length > 120 ? "..." : ""}`, 8, "normal", [80, 80, 80]);
      if (c.report?.summary) addText(`   Summary: ${c.report.summary.substring(0, 150)}${c.report.summary.length > 150 ? "..." : ""}`, 8, "normal", [80, 80, 80]);
      if (c.report?.diagnoses?.length > 0) {
        addText(`   Diagnoses: ${c.report.diagnoses.map((d) => `${d.name} (${d.confidence})`).join(", ")}`, 8, "normal", [80, 80, 80]);
      }
      y += 1;
    });
    y += 2;
  }

  // Footer
  y += 6;
  ensureSpace(20);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, y, pageW - m, y);
  y += 6;
  addText("This clinical summary was automatically compiled from your health records in Health Me Medical Center. It includes self-reported data, AI consultation results, and tracked health metrics. This document is intended to support — not replace — professional medical evaluation during your specialist visit.", 7, "italic", [120, 120, 120]);

  const patientName = (user?.full_name || "Patient").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Clinical-Summary-${patientName}-${new Date().toISOString().split("T")[0]}.pdf`);
}