import { jsPDF } from "jspdf";

export function generateFitnessPainMedicationPdf(data) {
  const { user, exercises, surgicalLogs, medications, medicationLogs } = data;
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
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Fitness, Pain & Medication Report", m, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Prepared for Primary Care Physician", m, 25);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - m, 25, { align: "right" });
  doc.setFontSize(8);
  doc.text("Health Me Medical Center", pageW - m, 15, { align: "right" });
  y = 48;

  // Intro note
  addText("This report compiles the patient's fitness activity, pain levels, surgical recovery progress, and medication adherence into a single document for clinical review. It is intended to support your assessment, not replace it.", 9, "italic", [120, 120, 120]);
  y += 4;

  // Patient Information
  addSectionTitle("Patient Information");
  addText(`Name: ${user?.full_name || "N/A"}`, 10, "normal", [40, 40, 40]);
  y += 2;

  // Summary Statistics
  addSectionTitle("Summary at a Glance", [37, 99, 235]);
  const totalExercises = exercises?.length || 0;
  const totalDuration = exercises?.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0;
  const avgPainEx = totalExercises > 0
    ? (exercises.reduce((s, e) => s + (e.pain_level || 0), 0) / totalExercises).toFixed(1)
    : "N/A";
  const surgicalCount = surgicalLogs?.length || 0;
  const latestSurgicalPain = surgicalLogs?.[0]?.pain_level;
  const activeMeds = medications?.length || 0;
  const takenCount = medicationLogs?.filter((l) => l.status === "taken").length || 0;
  const missedCount = medicationLogs?.filter((l) => l.status === "missed").length || 0;
  const adherenceRate = (takenCount + missedCount) > 0
    ? Math.round((takenCount / (takenCount + missedCount)) * 100)
    : null;

  addText(`Total Exercise Sessions Logged: ${totalExercises}`, 9, "normal", [60, 60, 60]);
  addText(`Total Exercise Duration: ${totalDuration} minutes`, 9, "normal", [60, 60, 60]);
  addText(`Average Pain During Exercise: ${avgPainEx}/10`, 9, "normal", [60, 60, 60]);
  addText(`Surgical Recovery Logs: ${surgicalCount}`, 9, "normal", [60, 60, 60]);
  if (latestSurgicalPain != null) addText(`Latest Post-Op Pain Level: ${latestSurgicalPain}/10`, 9, "normal", [60, 60, 60]);
  addText(`Active Medications: ${activeMeds}`, 9, "normal", [60, 60, 60]);
  if (adherenceRate != null) addText(`Medication Adherence Rate: ${adherenceRate}% (${takenCount} taken, ${missedCount} missed)`, 9, "normal", [60, 60, 60]);
  y += 3;

  // Current Medications
  if (medications?.length > 0) {
    addSectionTitle(`Current Medications (${medications.length})`, [5, 150, 105]);
    medications.forEach((med, i) => {
      ensureSpace(12);
      const times = med.time_of_day?.length > 0 ? ` [${med.time_of_day.join(", ")}]` : "";
      const supply = med.supply_remaining != null ? ` | Supply: ${med.supply_remaining}` : "";
      addText(`${i + 1}. ${med.name || med.medication_name} — ${med.dosage || ""}, ${med.frequency || ""}${times}${supply}`, 10, "bold", [40, 40, 40]);
      y += 1;
    });
    y += 2;
  }

  // Medication Adherence Log
  if (medicationLogs?.length > 0) {
    addSectionTitle(`Medication Adherence Log (Last ${medicationLogs.length} entries)`, [139, 92, 246]);
    const recentLogs = medicationLogs.slice(0, 30);
    recentLogs.forEach((log) => {
      ensureSpace(8);
      const dateStr = log.scheduled_date ? new Date(log.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
      const statusColor = log.status === "taken" ? [5, 150, 105] : log.status === "missed" ? [185, 28, 28] : [120, 120, 120];
      addText(`• ${dateStr} — ${log.medication_name}: ${log.status.toUpperCase()}${log.notes ? ` (${log.notes})` : ""}`, 8, "normal", statusColor);
    });
    y += 2;
  }

  // Exercise & Fitness Activity Log
  if (exercises?.length > 0) {
    addSectionTitle(`Fitness Activity Log (${exercises.length} sessions)`, [37, 99, 235]);
    exercises.slice(0, 40).forEach((ex, i) => {
      ensureSpace(14);
      const dateStr = ex.date ? new Date(ex.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
      addText(`${i + 1}. ${ex.exercise_name} — ${ex.body_part?.replace(/_/g, " ") || "N/A"}`, 10, "bold", [40, 40, 40]);
      const details = [];
      if (ex.difficulty) details.push(`Difficulty: ${ex.difficulty}`);
      if (ex.intensity) details.push(`Intensity: ${ex.intensity}`);
      if (ex.sets) details.push(`${ex.sets} sets`);
      if (ex.reps) details.push(`${ex.reps} reps`);
      if (ex.duration_minutes) details.push(`${ex.duration_minutes} min`);
      if (ex.rom_degrees) details.push(`ROM: ${ex.rom_degrees}°`);
      if (ex.pain_level != null) details.push(`Pain: ${ex.pain_level}/10`);
      if (dateStr) details.push(dateStr);
      addText(`   ${details.join("  |  ")}`, 8, "normal", [80, 80, 80]);
      if (ex.notes) addText(`   Notes: ${ex.notes.substring(0, 120)}${ex.notes.length > 120 ? "..." : ""}`, 8, "italic", [100, 100, 100]);
      y += 1;
    });
    y += 2;
  }

  // Pain & Surgical Recovery Log
  if (surgicalLogs?.length > 0) {
    addSectionTitle(`Pain & Surgical Recovery Log (${surgicalLogs.length} entries)`, [185, 28, 28]);
    surgicalLogs.slice(0, 30).forEach((log) => {
      ensureSpace(16);
      const dateStr = log.log_date ? new Date(log.log_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
      addText(`${log.surgery_name || "Surgery"}${log.days_post_op != null ? ` — Day ${log.days_post_op} post-op` : ""}`, 10, "bold", [40, 40, 40]);
      addText(`   Date: ${dateStr}  |  Pain: ${log.pain_level ?? "N/A"}/10${log.pain_type ? ` (${log.pain_type})` : ""}  |  Mobility: ${(log.mobility_level || "N/A").replace(/_/g, " ")}`, 8, "normal", [80, 80, 80]);
      if (log.wound_status) addText(`   Wound: ${log.wound_status.replace(/_/g, " ")}${log.temperature ? `  |  Temp: ${log.temperature}°F` : ""}`, 8, "normal", [80, 80, 80]);
      if (log.activity_type) {
        const actDetails = [log.activity_type.replace(/_/g, " ")];
        if (log.activity_duration_minutes) actDetails.push(`${log.activity_duration_minutes} min`);
        addText(`   Activity: ${actDetails.join(", ")}`, 8, "normal", [80, 80, 80]);
      }
      if (log.medications_taken) addText(`   Meds Taken: ${log.medications_taken}`, 8, "normal", [80, 80, 80]);
      if (log.notes) addText(`   Notes: ${log.notes.substring(0, 120)}${log.notes.length > 120 ? "..." : ""}`, 8, "italic", [100, 100, 100]);
      y += 2;
    });
    y += 2;
  }

  // If no data at all
  if (!exercises?.length && !surgicalLogs?.length && !medications?.length && !medicationLogs?.length) {
    addSectionTitle("No Data Available");
    addText("No fitness, pain, or medication data has been logged yet. Start logging your exercises, pain levels, and medications to generate a comprehensive report.", 9, "normal", [80, 80, 80]);
  }

  // Footer
  y += 6;
  ensureSpace(24);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, y, pageW - m, y);
  y += 6;
  addText("This report was automatically compiled from the patient's self-tracked fitness activities, pain levels, surgical recovery logs, and medication adherence records in Health Me Medical Center. This document is intended to support — not replace — professional medical evaluation.", 7, "italic", [120, 120, 120]);

  const patientName = (user?.full_name || "Patient").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Fitness-Pain-Medication-Report-${patientName}-${new Date().toISOString().split("T")[0]}.pdf`);
}