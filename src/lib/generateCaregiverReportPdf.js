import { jsPDF } from "jspdf";

export function generateCaregiverReportPdf(visits, medicationLogs, patientName) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Header
  doc.setFillColor(139, 92, 246);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CAREGIVER SUMMARY REPORT", margin, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Patient: ${patientName || "Self"}  |  Generated: ${new Date().toLocaleString()}`, margin, 20);
  doc.text("Health Me Medical Center", pageWidth - margin - 50, 20);
  y = 34;

  // Summary stats
  const totalVisits = visits.length;
  const totalMinutes = visits.reduce((s, v) => s + (v.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const medsGiven = visits.filter(v => v.medication_administered).length;
  const mealsTaken = visits.filter(v => v.meal_taken).length;
  const medLogsTaken = medicationLogs.filter(m => m.status === "taken").length;
  const medLogsMissed = medicationLogs.filter(m => m.status === "missed").length;
  const adherence = medicationLogs.length > 0 ? Math.round((medLogsTaken / medicationLogs.length) * 100) : 0;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("OVERVIEW", margin, y);
  y += 5;
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Care Visits: ${totalVisits}    Total Care Hours: ${totalHours}h    Medications Administered: ${medsGiven}    Meals: ${mealsTaken}`, margin, y);
  y += 6;
  doc.text(`Medication Adherence: ${adherence}% (${medLogsTaken} taken, ${medLogsMissed} missed out of ${medicationLogs.length} scheduled)`, margin, y);
  y += 8;

  // Care Visit Log
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CARE VISIT LOG", margin, y);
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  if (visits.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("No care visits recorded.", margin, y);
    y += 8;
  } else {
    for (const visit of visits) {
      if (y > pageHeight - 30) { doc.addPage(); y = margin; }
      const dateStr = visit.visit_date ? new Date(visit.visit_date).toLocaleString() : "N/A";
      const supportLabel = visit.support_type ? visit.support_type.replace(/_/g, " ") : "General";

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${dateStr} — ${supportLabel}`, margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      let details = `Caregiver: ${visit.caregiver_name || "N/A"}`;
      if (visit.family_member_name) details += `  |  Recipient: ${visit.family_member_name}`;
      if (visit.duration_minutes) details += `  |  Duration: ${visit.duration_minutes} min`;
      doc.text(details, margin, y);
      y += 5;

      const flags = [];
      if (visit.medication_administered) flags.push("Meds Given");
      if (visit.meal_taken) flags.push("Meal Taken");
      if (visit.activity_completed) flags.push("Activity Done");
      if (flags.length > 0) {
        doc.text(`Checklist: ${flags.join(", ")}`, margin, y);
        y += 5;
      }

      if (visit.notes) {
        const splitNotes = doc.splitTextToSize(`Notes: ${visit.notes}`, pageWidth - margin * 2);
        doc.text(splitNotes, margin, y);
        y += splitNotes.length * 4 + 2;
      }
      y += 3;
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    }
  }

  // Medication Administration Log
  if (y > pageHeight - 40) { doc.addPage(); y = margin; }
  y += 4;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("MEDICATION ADMINISTRATION LOG", margin, y);
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  if (medicationLogs.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("No medication logs recorded.", margin, y);
    y += 8;
  } else {
    // Table header
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Date", margin, y);
    doc.text("Medication", margin + 35, y);
    doc.text("Status", margin + 100, y);
    doc.text("Notes", margin + 130, y);
    y += 4;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    for (const log of medicationLogs) {
      if (y > pageHeight - 20) { doc.addPage(); y = margin; }
      const dateStr = log.scheduled_date ? new Date(log.scheduled_date).toLocaleDateString() : "N/A";
      const statusColor = log.status === "taken" ? [22, 163, 74] : log.status === "missed" ? [220, 38, 38] : [168, 162, 158];
      doc.setTextColor(60, 60, 60);
      doc.text(dateStr, margin, y);
      const medName = doc.splitTextToSize(log.medication_name || "Unknown", 60);
      doc.text(medName[0], margin + 35, y);
      doc.setTextColor(...statusColor);
      doc.text(log.status || "N/A", margin + 100, y);
      doc.setTextColor(60, 60, 60);
      if (log.notes) {
        const notes = doc.splitTextToSize(log.notes, 50);
        doc.text(notes[0], margin + 130, y);
      }
      y += 5;
    }
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`Health Me Medical Center — Caregiver Summary Report — Page ${i} of ${totalPages}`, margin, pageHeight - 6);
  }

  doc.save(`caregiver-report-${new Date().toISOString().split("T")[0]}.pdf`);
}