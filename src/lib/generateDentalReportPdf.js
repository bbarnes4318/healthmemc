import { jsPDF } from "jspdf";

const procedureTypeLabels = {
  cleaning: "Cleaning", filling: "Filling", root_canal: "Root Canal",
  extraction: "Extraction", crown: "Crown", bridge: "Bridge", implant: "Implant",
  whitening: "Whitening", x_ray: "X-Ray", examination: "Examination", other: "Other",
};

const painTypeLabels = {
  aching: "Aching", sharp: "Sharp", throbbing: "Throbbing",
  sensitivity: "Sensitivity", burning: "Burning", other: "Other",
};

const gumAreaLabels = {
  upper_left: "Upper Left", upper_front: "Upper Front", upper_right: "Upper Right",
  lower_left: "Lower Left", lower_front: "Lower Front", lower_right: "Lower Right",
};

const severityColors = {
  mild: [22, 163, 74], moderate: [234, 179, 8], severe: [239, 68, 68],
};

export function generateDentalReportPdf(data) {
  const { user, visitLogs, painLogs } = data;
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
    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(0.5);
    doc.line(m, y - 2, pageW - m, y - 2);
    addText(title, 13, "bold", [6, 182, 212]);
    y += 2;
  };

  const addField = (label, value) => {
    if (!value && value !== 0) return;
    ensureSpace(12);
    addText(`${label}: `, 10, "bold", [100, 100, 100]);
    y -= 7;
    addText(String(value), 10, "normal", [40, 40, 40]);
  };

  // Header banner
  doc.setFillColor(6, 182, 212);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Dental Health Report", m, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Health Me Medical Center", m, 28);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - m, 28, { align: "right" });
  y = 55;

  // Patient info
  addSectionTitle("Patient Information");
  addField("Name", user?.full_name || "N/A");
  addField("Email", user?.email || "N/A");
  y += 2;

  // Summary stats
  addSectionTitle("Summary");
  addField("Total Visits Logged", visitLogs?.length || 0);
  addField("Total Pain Entries", painLogs?.length || 0);
  const totalCost = visitLogs?.reduce((s, v) => s + (v.cost || 0), 0) || 0;
  if (totalCost > 0) addField("Total Recorded Cost", `$${totalCost.toFixed(2)}`);
  const pendingFollowUps = visitLogs?.filter((v) => v.follow_up_recommended).length || 0;
  if (pendingFollowUps > 0) addField("Pending Follow-ups", pendingFollowUps);
  const severePain = painLogs?.filter((p) => p.severity === "severe").length || 0;
  if (severePain > 0) addField("Severe Pain Episodes", severePain);
  y += 2;

  // Visit History
  if (visitLogs?.length > 0) {
    addSectionTitle(`Dental Visit History (${visitLogs.length})`);
    const sorted = [...visitLogs].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
    sorted.forEach((log, i) => {
      ensureSpace(16);
      addText(`${i + 1}. ${log.dentist_name}`, 10, "bold", [40, 40, 40]);
      const dateStr = log.visit_date ? new Date(log.visit_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";
      addText(`   Date: ${dateStr}  |  Procedure: ${procedureTypeLabels[log.procedure_type] || log.procedure_type || "N/A"}`, 9, "normal", [80, 80, 80]);
      if (log.tooth_numbers?.length > 0) {
        addText(`   Teeth Treated: ${log.tooth_numbers.map((n) => `#${n}`).join(", ")}`, 9, "normal", [80, 80, 80]);
      }
      if (log.procedure_notes) {
        const noteLines = doc.splitTextToSize(`   Details: ${log.procedure_notes}`, maxW);
        noteLines.forEach((line) => { ensureSpace(5); doc.text(line, m, y); y += 5; });
      }
      if (log.cost != null) addText(`   Cost: $${log.cost}`, 9, "normal", [80, 80, 80]);
      if (log.follow_up_recommended) {
        const fuDate = log.follow_up_date ? new Date(log.follow_up_date).toLocaleDateString() : "Not scheduled";
        addText(`   *** FOLLOW-UP RECOMMENDED: ${fuDate} ***`, 9, "bold", [234, 88, 12]);
        if (log.follow_up_notes) addText(`   Follow-up Notes: ${log.follow_up_notes}`, 9, "normal", [80, 80, 80]);
      }
      if (log.recovery_instructions) {
        const riLines = doc.splitTextToSize(`   Recovery: ${log.recovery_instructions}`, maxW);
        riLines.forEach((line) => { ensureSpace(5); doc.text(line, m, y); y += 5; });
      }
      if (log.notes) addText(`   Notes: ${log.notes}`, 9, "normal", [80, 80, 80]);
      y += 3;
    });
    y += 2;
  }

  // Pain Log
  if (painLogs?.length > 0) {
    addSectionTitle(`Dental Pain Log (${painLogs.length})`);
    const sortedPain = [...painLogs].sort((a, b) => new Date(b.logged_at || b.created_date) - new Date(a.logged_at || a.created_date));
    sortedPain.forEach((log, i) => {
      ensureSpace(14);
      const sevColor = severityColors[log.severity] || [100, 100, 100];
      const dateStr = log.logged_at ? new Date(log.logged_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "N/A";
      addText(`${i + 1}. ${log.severity?.toUpperCase()} — ${painTypeLabels[log.pain_type] || log.pain_type || "Pain"}`, 10, "bold", sevColor);
      addText(`   Logged: ${dateStr}`, 9, "normal", [80, 80, 80]);
      if (log.pain_teeth?.length > 0) {
        addText(`   Painful Teeth: ${log.pain_teeth.map((n) => `#${n}`).join(", ")}`, 9, "normal", [80, 80, 80]);
      }
      if (log.gum_pain_areas?.length > 0) {
        addText(`   Gum Areas: ${log.gum_pain_areas.map((a) => gumAreaLabels[a] || a).join(", ")}`, 9, "normal", [80, 80, 80]);
      }
      if (log.duration) addText(`   Duration: ${log.duration}`, 9, "normal", [80, 80, 80]);
      if (log.notes) {
        const noteLines = doc.splitTextToSize(`   Notes: ${log.notes}`, maxW);
        noteLines.forEach((line) => { ensureSpace(5); doc.text(line, m, y); y += 5; });
      }
      y += 3;
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
  addText("This dental health report was generated by Health Me Medical Center from self-reported data. It is intended for sharing with your dentist at your next checkup and is not a substitute for professional dental examination, diagnosis, or treatment.", 8, "italic", [120, 120, 120]);

  const patientName = (user?.full_name || "Patient").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Dental-Report-${patientName}-${new Date().toISOString().split("T")[0]}.pdf`);
}