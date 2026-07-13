import { jsPDF } from "jspdf";

export function generateMonthlyAdherencePdf(data) {
  const { user, profile, monthLabel, medications, logs, stats, dailyBreakdown } = data;
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
  doc.text("Monthly Adherence Report", m, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Medication Adherence Summary — ${monthLabel}`, m, 23);
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

  // Overall Summary
  addSectionTitle("Adherence Summary", [37, 99, 235]);
  const adherenceRate = stats.total > 0 ? ((stats.taken / stats.total) * 100).toFixed(1) : "0";
  const rateColor = parseFloat(adherenceRate) >= 80 ? [22, 163, 74] : parseFloat(adherenceRate) >= 50 ? [245, 158, 11] : [220, 38, 38];

  addText(`Reporting Period: ${monthLabel}`, 10, "normal", [80, 80, 80]);
  addText(`Total Scheduled Doses: ${stats.total}`, 10, "normal", [40, 40, 40]);
  addText(`Doses Taken: ${stats.taken}`, 10, "bold", [22, 163, 74]);
  addText(`Doses Missed: ${stats.missed}`, 10, "bold", [220, 38, 38]);
  addText(`Doses Skipped: ${stats.skipped}`, 10, "normal", [120, 120, 120]);
  y += 2;
  ensureSpace(12);
  doc.setFillColor(rateColor[0], rateColor[1], rateColor[2]);
  doc.roundedRect(m, y - 2, maxW, 10, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Overall Adherence Rate: ${adherenceRate}%`, m + 2, y + 4);
  y += 12;

  // Per-medication table
  if (medications?.length > 0) {
    addSectionTitle("Per-Medication Breakdown", [5, 150, 105]);

    ensureSpace(8);
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(m, y - 3, maxW, 7, 1, 1, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("Medication", m + 2, y + 1);
    doc.text("Dosage", m + 70, y + 1);
    doc.text("Total", m + 105, y + 1);
    doc.text("Taken", m + 120, y + 1);
    doc.text("Missed", m + 138, y + 1);
    doc.text("Rate", m + 158, y + 1);
    y += 7;

    medications.forEach((med) => {
      ensureSpace(6);
      const medStats = stats.byMed[med.name] || { taken: 0, missed: 0, skipped: 0, total: 0 };
      const rate = medStats.total > 0 ? ((medStats.taken / medStats.total) * 100).toFixed(0) : "-";
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      doc.text(med.name?.length > 32 ? med.name.substring(0, 32) + "..." : (med.name || "Unknown"), m + 2, y);
      doc.text(med.dosage?.length > 18 ? med.dosage.substring(0, 18) + "..." : (med.dosage || ""), m + 70, y);
      doc.text(String(medStats.total), m + 105, y);
      doc.text(String(medStats.taken || 0), m + 120, y);
      doc.setTextColor(medStats.missed > 0 ? 220 : 40, medStats.missed > 0 ? 38 : 40, medStats.missed > 0 ? 38 : 40);
      doc.text(String(medStats.missed || 0), m + 138, y);
      doc.setTextColor(40, 40, 40);
      doc.text(`${rate}%`, m + 158, y);
      y += 6;
    });
    y += 3;
  }

  // Daily breakdown
  if (dailyBreakdown?.length > 0) {
    addSectionTitle("Daily Breakdown", [37, 99, 235]);

    ensureSpace(8);
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(m, y - 3, maxW, 7, 1, 1, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("Date", m + 2, y + 1);
    doc.text("Taken", m + 70, y + 1);
    doc.text("Missed", m + 95, y + 1);
    doc.text("Skipped", m + 120, y + 1);
    doc.text("Rate", m + 150, y + 1);
    y += 7;

    dailyBreakdown.forEach((day) => {
      ensureSpace(5);
      const rate = day.total > 0 ? ((day.taken / day.total) * 100).toFixed(0) : "-";
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      doc.text(day.date, m + 2, y);
      doc.text(String(day.taken), m + 70, y);
      doc.setTextColor(day.missed > 0 ? 220 : 40, day.missed > 0 ? 38 : 40, day.missed > 0 ? 38 : 40);
      doc.text(String(day.missed), m + 95, y);
      doc.setTextColor(40, 40, 40);
      doc.text(String(day.skipped), m + 120, y);
      doc.text(`${rate}%`, m + 150, y);
      y += 5;
    });
    y += 3;
  }

  // Clinical notes
  addSectionTitle("Clinical Notes", [120, 120, 120]);
  const notes = [];
  if (parseFloat(adherenceRate) >= 80) notes.push("Patient demonstrates good medication adherence this period.");
  else if (parseFloat(adherenceRate) >= 50) notes.push("Patient shows moderate adherence — review barriers to compliance.");
  else notes.push("Patient has low adherence — recommend medication review and support.");

  const missedMeds = Object.entries(stats.byMed).filter(([, s]) => s.missed > 0);
  if (missedMeds.length > 0) {
    notes.push(`Medications with missed doses: ${missedMeds.map(([name, s]) => `${name} (${s.missed} missed)`).join(", ")}.`);
  }

  notes.forEach((note) => addText(`• ${note}`, 9, "normal", [80, 80, 80]));
  y += 2;

  // Footer
  y += 6;
  ensureSpace(20);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, y, pageW - m, y);
  y += 6;
  addText("This monthly adherence report was compiled from self-reported medication logs in Health Me Medical Center. Adherence rates are based on logged doses and may not reflect actual intake. Please discuss any adherence concerns with your healthcare provider. This document is not a substitute for professional medical advice.", 7, "italic", [120, 120, 120]);

  const patientName = (user?.full_name || "Patient").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Monthly-Adherence-${monthLabel.replace(/\s/g, "-")}-${patientName}.pdf`);
}