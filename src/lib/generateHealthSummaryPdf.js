import { jsPDF } from "jspdf";

const categoryLabels = {
  visit_summary: "Visit Summary",
  lab_results: "Lab Results",
  imaging: "Imaging",
  vaccination: "Vaccination",
  prescription: "Prescription",
  allergy: "Allergy",
  intake_form: "Intake Form",
  other: "Other",
};

const vitalLabels = {
  heart_rate: "Heart Rate",
  blood_pressure: "Blood Pressure",
  oxygen_saturation: "Oxygen Saturation",
  blood_glucose: "Blood Glucose",
  weight: "Weight",
  sleep_hours: "Sleep",
  activity_minutes: "Activity",
  temperature: "Temperature",
};

export function generateHealthSummaryPdf(data) {
  const { user, profile, records, medications, vitals, consultations, appointments, insuranceCards } = data;
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = 20;
  const maxW = pageW - m * 2;
  let y = m;

  const ensureSpace = (h) => {
    if (y + h > pageH - m) { doc.addPage(); y = m; }
  };

  const addText = (text, size, style, color) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style || "normal");
    if (color) doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach((line) => {
      ensureSpace(size * 0.5 + 2);
      doc.text(line, m, y);
      y += size * 0.5 + 2;
    });
  };

  const addSectionTitle = (title) => {
    y += 6;
    ensureSpace(16);
    doc.setDrawColor(22, 86, 160);
    doc.setLineWidth(0.5);
    doc.line(m, y - 2, pageW - m, y - 2);
    addText(title, 13, "bold", [22, 86, 160]);
    y += 2;
  };

  const addField = (label, value) => {
    if (!value && value !== 0) return;
    ensureSpace(12);
    addText(`${label}: `, 10, "bold", [100, 100, 100]);
    y -= 7;
    addText(String(value), 10, "normal", [40, 40, 40]);
  };

  const addList = (items) => {
    items.forEach((item, i) => {
      addText(`  ${i + 1}. ${item}`, 10, "normal", [60, 60, 60]);
    });
  };

  // Header banner
  doc.setFillColor(22, 86, 160);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Health Me Medical Center", m, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Comprehensive Health Summary", m, 28);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - m, 28, { align: "right" });
  y = 55;

  // Patient Demographics
  addSectionTitle("Patient Information");
  addField("Name", user?.full_name || "N/A");
  addField("Email", user?.email || "N/A");
  if (profile) {
    addField("Date of Birth", profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not specified");
    addField("Gender", profile.gender ? profile.gender.replace(/_/g, " ") : "Not specified");
    addField("Blood Type", profile.blood_type || "Unknown");
    addField("Height", profile.height_cm ? `${profile.height_cm} cm` : "Not specified");
    addField("Weight", profile.weight_kg ? `${profile.weight_kg} kg` : "Not specified");
    if (profile.height_cm && profile.weight_kg) {
      const bmi = (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1);
      addField("BMI", bmi);
    }
    addField("Health Score", profile.health_score || "Not calculated");
    addField("Membership Tier", profile.membership_tier || "free");
  }
  y += 2;

  // Emergency Contact
  if (profile && (profile.emergency_contact_name || profile.emergency_contact_phone)) {
    addSectionTitle("Emergency Contact");
    addField("Name", profile.emergency_contact_name);
    addField("Phone", profile.emergency_contact_phone);
    addField("Email", profile.emergency_contact_email);
    addField("Relationship", profile.emergency_contact_relationship);
    y += 2;
  }

  // Allergies & Conditions
  if (profile && ((profile.allergies?.length > 0) || (profile.chronic_conditions?.length > 0))) {
    addSectionTitle("Allergies & Chronic Conditions");
    if (profile.allergies?.length > 0) {
      addText("Allergies:", 10, "bold", [100, 100, 100]);
      addList(profile.allergies);
    }
    if (profile.chronic_conditions?.length > 0) {
      y += 2;
      addText("Chronic Conditions:", 10, "bold", [100, 100, 100]);
      addList(profile.chronic_conditions);
    }
    y += 2;
  }

  // Current Medications
  if (medications?.length > 0) {
    addSectionTitle(`Current Medications (${medications.length})`);
    medications.forEach((med, i) => {
      ensureSpace(14);
      addText(`${i + 1}. ${med.name}`, 10, "bold", [40, 40, 40]);
      addText(`   Dosage: ${med.dosage}  |  Frequency: ${med.frequency}`, 9, "normal", [80, 80, 80]);
      if (med.prescribing_provider) addText(`   Prescribed by: ${med.prescribing_provider}`, 9, "normal", [80, 80, 80]);
      if (med.start_date) addText(`   Started: ${new Date(med.start_date).toLocaleDateString()}`, 9, "normal", [80, 80, 80]);
      if (med.refill_date) addText(`   Refill due: ${new Date(med.refill_date).toLocaleDateString()}`, 9, "normal", [80, 80, 80]);
      y += 2;
    });
    y += 2;
  }

  // Recent Vital Signs
  if (vitals?.length > 0) {
    addSectionTitle("Recent Vital Signs");
    const byType = {};
    vitals.forEach((v) => {
      if (!byType[v.type]) byType[v.type] = [];
      byType[v.type].push(v);
    });
    Object.keys(byType).forEach((type) => {
      const records = byType[type].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
      const latest = records[0];
      const label = vitalLabels[type] || type;
      const value = type === "blood_pressure" && latest.secondary_value ? `${latest.value}/${latest.secondary_value}` : latest.value;
      const unit = latest.unit || "";
      addText(`• ${label}: ${value} ${unit}`, 10, "normal", [40, 40, 40]);
      addText(`  Last recorded: ${new Date(latest.recorded_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`, 9, "normal", [120, 120, 120]);
      if (records.length > 1) {
        const oldest = records[records.length - 1];
        const oldVal = type === "blood_pressure" && oldest.secondary_value ? `${oldest.value}/${oldest.secondary_value}` : oldest.value;
        const trend = latest.value > oldest.value ? "↑ increasing" : latest.value < oldest.value ? "↓ decreasing" : "→ stable";
        addText(`  Trend: ${trend} (from ${oldVal} ${unit} over ${records.length} readings)`, 9, "normal", [120, 120, 120]);
      }
      y += 1;
    });
    y += 2;
  }

  // Medical Records History
  if (records?.length > 0) {
    addSectionTitle(`Medical Records History (${records.length})`);
    records.forEach((rec, i) => {
      ensureSpace(14);
      const cat = categoryLabels[rec.category] || rec.category || "Other";
      addText(`${i + 1}. ${rec.title}`, 10, "bold", [40, 40, 40]);
      addText(`   Category: ${cat}  |  Date: ${rec.date ? new Date(rec.date).toLocaleDateString() : "N/A"}`, 9, "normal", [80, 80, 80]);
      if (rec.provider) addText(`   Provider: ${rec.provider}`, 9, "normal", [80, 80, 80]);
      if (rec.notes) {
        const noteLines = doc.splitTextToSize(`   Notes: ${rec.notes}`, maxW);
        noteLines.slice(0, 3).forEach((line) => { ensureSpace(5); doc.text(line, m, y); y += 5; });
      }
      y += 2;
    });
    y += 2;
  }

  // Recent Consultations
  if (consultations?.length > 0) {
    addSectionTitle(`AI Consultation Summaries (${consultations.length})`);
    consultations.forEach((c, i) => {
      ensureSpace(14);
      addText(`${i + 1}. ${c.type?.replace(/_/g, " ") || "Consultation"}${c.specialty ? ` — ${c.specialty}` : ""}`, 10, "bold", [40, 40, 40]);
      addText(`   Date: ${new Date(c.created_date).toLocaleDateString()}  |  Status: ${c.status}`, 9, "normal", [80, 80, 80]);
      if (c.symptoms) addText(`   Symptoms: ${c.symptoms.substring(0, 150)}${c.symptoms.length > 150 ? "..." : ""}`, 9, "normal", [80, 80, 80]);
      if (c.report?.summary) addText(`   AI Summary: ${c.report.summary.substring(0, 200)}${c.report.summary.length > 200 ? "..." : ""}`, 9, "normal", [80, 80, 80]);
      if (c.report?.diagnoses?.length > 0) {
        addText(`   Diagnoses: ${c.report.diagnoses.map((d) => `${d.name} (${d.confidence})`).join(", ")}`, 9, "normal", [80, 80, 80]);
      }
      y += 2;
    });
    y += 2;
  }

  // Upcoming Appointments
  if (appointments?.length > 0) {
    const upcoming = appointments.filter((a) => a.status === "scheduled");
    if (upcoming.length > 0) {
      addSectionTitle(`Upcoming Appointments (${upcoming.length})`);
      upcoming.forEach((a, i) => {
        addText(`${i + 1}. ${a.title}`, 10, "bold", [40, 40, 40]);
        addText(`   Date: ${new Date(a.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`, 9, "normal", [80, 80, 80]);
        if (a.provider) addText(`   Provider: ${a.provider}`, 9, "normal", [80, 80, 80]);
        if (a.type) addText(`   Type: ${a.type.replace(/_/g, " ")}`, 9, "normal", [80, 80, 80]);
        y += 2;
      });
      y += 2;
    }
  }

  // Insurance Information
  if (insuranceCards?.length > 0) {
    addSectionTitle("Insurance Information");
    insuranceCards.forEach((ins, i) => {
      ensureSpace(14);
      addText(`${i + 1}. ${ins.provider_name}`, 10, "bold", [40, 40, 40]);
      addText(`   Policy: ${ins.policy_number}  |  Plan: ${ins.plan_name || "N/A"}`, 9, "normal", [80, 80, 80]);
      if (ins.subscriber_name) addText(`   Subscriber: ${ins.subscriber_name}`, 9, "normal", [80, 80, 80]);
      if (ins.plan_type) addText(`   Plan Type: ${ins.plan_type.toUpperCase()}`, 9, "normal", [80, 80, 80]);
      if (ins.effective_date) addText(`   Effective: ${new Date(ins.effective_date).toLocaleDateString()}`, 9, "normal", [80, 80, 80]);
      y += 2;
    });
    y += 2;
  }

  // Disclaimer
  y += 8;
  ensureSpace(20);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, y, pageW - m, y);
  y += 6;
  addText("This comprehensive health summary was generated by Health Me Medical Center. It consolidates your self-reported data, AI consultation results, and tracked health metrics. This document is intended for sharing with your healthcare providers and is not a substitute for professional medical advice, diagnosis, or treatment.", 8, "italic", [120, 120, 120]);

  const patientName = (user?.full_name || "Patient").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Health-Summary-${patientName}-${new Date().toISOString().split("T")[0]}.pdf`);
}