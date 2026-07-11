import { jsPDF } from "jspdf";

export function generateMedicationHistoryPdf(data) {
  const { user, profile, medications, adherenceLogs } = data;
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
    const c = color || [5, 150, 105];
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(0.5);
    doc.line(m, y - 2, pageW - m, y - 2);
    addText(title, 12, "bold", c);
    y += 2;
  };

  // Header banner
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, pageW, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Medication History Report", m, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Complete Medication Record & Adherence Summary", m, 23);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - m, 23, { align: "right" });
  doc.setFontSize(8);
  doc.text("Health Me Medical Center", pageW - m, 14, { align: "right" });
  y = 44;

  // Patient Information
  addSectionTitle("Patient Information");
  addText(`Name: ${user?.full_name || "N/A"}`, 10, "normal", [40, 40, 40]);
  if (profile?.date_of_birth) addText(`DOB: ${new Date(profile.date_of_birth).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`, 9, "normal", [80, 80, 80]);
  if (profile?.blood_type && profile.blood_type !== "unknown") addText(`Blood Type: ${profile.blood_type}`, 9, "normal", [80, 80, 80]);
  if (profile?.allergies?.length > 0) addText(`Allergies: ${profile.allergies.join(", ")}`, 9, "bold", [185, 28, 28]);
  y += 2;

  // Medication Details
  if (medications?.length > 0) {
    addSectionTitle(`Medications (${medications.length})`, [5, 150, 105]);
    medications.forEach((med, i) => {
      ensureSpace(20);
      const activeBadge = med.active === false ? " [INACTIVE]" : "";
      addText(`${i + 1}. ${med.name} — ${med.dosage}${activeBadge}`, 10, "bold", [40, 40, 40]);
      addText(`   Frequency: ${med.frequency}${med.time_of_day?.length > 0 ? ` [${med.time_of_day.join(", ")}]` : ""}`, 9, "normal", [80, 80, 80]);
      const details = [];
      if (med.prescribing_provider) details.push(`Prescribed by: ${med.prescribing_provider}`);
      if (med.start_date) details.push(`Started: ${new Date(med.start_date).toLocaleDateString()}`);
      if (med.end_date) details.push(`Ended: ${new Date(med.end_date).toLocaleDateString()}`);
      if (med.refill_date) details.push(`Refill due: ${new Date(med.refill_date).toLocaleDateString()}`);
      if (med.supply_quantity != null) details.push(`Supply: ${med.supply_quantity}`);
      if (details.length > 0) addText(`   ${details.join("  |  ")}`, 8, "normal", [100, 100, 100]);
      if (med.notes) addText(`   Notes: ${med.notes}`, 8, "italic", [120, 120, 120]);
      y += 1;
    });
    y += 2;
  }

  // Adherence Summary
  if (adherenceLogs?.length > 0) {
    addSectionTitle("Medication Adherence Summary", [37, 99, 235]);

    const byStatus = { taken: 0, missed: 0, skipped: 0 };
    const byMed = {};
    adherenceLogs.forEach((log) => {
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;
      const name = log.medication_name || "Unknown";
      if (!byMed[name]) byMed[name] = { taken: 0, missed: 0, skipped: 0, total: 0 };
      byMed[name][log.status] = (byMed[name][log.status] || 0) + 1;
      byMed[name].total++;
    });

    const total = adherenceLogs.length;
    const adherenceRate = total > 0 ? ((byStatus.taken / total) * 100).toFixed(1) : "0";

    addText(`Total logged entries: ${total}  |  Overall adherence rate: ${adherenceRate}%`, 10, "bold", [37, 99, 235]);
    y += 2;
    addText(`Taken: ${byStatus.taken || 0}  |  Missed: ${byStatus.missed || 0}  |  Skipped: ${byStatus.skipped || 0}`, 9, "normal", [80, 80, 80]);
    y += 3;

    // Per-medication adherence table
    ensureSpace(8);
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(m, y - 3, maxW, 7, 1, 1, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("Medication", m + 2, y + 1);
    doc.text("Total", m + 90, y + 1);
    doc.text("Taken", m + 110, y + 1);
    doc.text("Missed", m + 130, y + 1);
    doc.text("Rate", m + 155, y + 1);
    y += 7;

    Object.entries(byMed).forEach(([name, stats]) => {
      ensureSpace(6);
      const rate = stats.total > 0 ? ((stats.taken / stats.total) * 100).toFixed(0) : "0";
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      doc.text(name.length > 30 ? name.substring(0, 30) + "..." : name, m + 2, y);
      doc.text(String(stats.total), m + 90, y);
      doc.text(String(stats.taken || 0), m + 110, y);
      doc.setTextColor(stats.missed > 0 ? 220 : 40, stats.missed > 0 ? 38 : 40, stats.missed > 0 ? 38 : 40);
      doc.text(String(stats.missed || 0), m + 130, y);
      doc.setTextColor(40, 40, 40);
      doc.text(`${rate}%`, m + 155, y);
      y += 6;
    });
    y += 3;
  }

  // Footer
  y += 6;
  ensureSpace(20);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, y, pageW - m, y);
  y += 6;
  addText("This medication history report was compiled from your records in Health Me Medical Center. It includes self-reported medication data and adherence logs. Share this document with your healthcare providers for informed care decisions. This document is not a substitute for professional medical advice.", 7, "italic", [120, 120, 120]);

  const patientName = (user?.full_name || "Patient").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Medication-History-${patientName}-${new Date().toISOString().split("T")[0]}.pdf`);
}