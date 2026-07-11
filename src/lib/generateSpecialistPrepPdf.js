import { jsPDF } from "jspdf";

const labMarkerKeywords = [
  "cholesterol", "ldl", "hdl", "triglycerides", "glucose", "a1c", "hemoglobin a1c",
  "creatinine", "bun", "egfr", "alt", "ast", "bilirubin", "white blood", "wbc",
  "red blood", "rbc", "platelet", "hemoglobin", "hematocrit", "sodium", "potassium",
  "chloride", "co2", "calcium", "albumin", "protein", "alkaline phosphatase", "alp",
  "tsh", "t3", "t4", "vitamin d", "b12", "folate", "iron", "ferritin",
  "psa", "inr", "crp", "esr", "rheumatoid", "troponin", "bnp"
];

function isLabMarker(text) {
  const lower = (text || "").toLowerCase();
  return labMarkerKeywords.some((kw) => lower.includes(kw));
}

export function generateSpecialistPrepPdf(data) {
  const { user, profile, medications, labRecords } = data;
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
  doc.text("Specialist Prep Report", m, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Lab Markers & Current Medications", m, 23);
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
  if (profile?.height_cm && profile?.weight_kg) {
    const bmi = (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1);
    demoParts.push(`BMI: ${bmi}`);
  }
  if (demoParts.length > 0) {
    addText(demoParts.join("   |   "), 9, "normal", [80, 80, 80]);
  }
  // Allergies alert
  if (profile?.allergies?.length > 0) {
    y += 2;
    ensureSpace(8);
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(m, y - 3, maxW, 8, 2, 2, "F");
    addText(`⚠  ALLERGIES: ${profile.allergies.join(", ")}`, 9, "bold", [185, 28, 28]);
    y += 2;
  }
  y += 3;

  // Current Medications Table
  if (medications?.length > 0) {
    addSectionTitle(`Current Medications (${medications.length})`, [5, 150, 105]);

    // Table header
    ensureSpace(8);
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(m, y - 3, maxW, 7, 1, 1, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 101, 52);
    doc.text("#", m + 2, y + 1);
    doc.text("Medication", m + 10, y + 1);
    doc.text("Dosage", m + 70, y + 1);
    doc.text("Frequency", m + 100, y + 1);
    doc.text("Started", m + 135, y + 1);
    doc.text("Refill", m + 165, y + 1);
    y += 7;

    medications.forEach((med, i) => {
      ensureSpace(10);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      doc.text(String(i + 1), m + 2, y);
      doc.text(doc.splitTextToSize(med.name || "", 55)[0], m + 10, y);
      doc.text(doc.splitTextToSize(med.dosage || "", 25)[0], m + 70, y);
      doc.text(doc.splitTextToSize(med.frequency || "", 30)[0], m + 100, y);
      doc.text(med.start_date ? new Date(med.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—", m + 135, y);
      doc.text(med.refill_date ? new Date(med.refill_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—", m + 165, y);
      y += 5;

      if (med.prescribing_provider || med.time_of_day?.length > 0 || med.notes) {
        const subDetails = [];
        if (med.prescribing_provider) subDetails.push(`Rx: ${med.prescribing_provider}`);
        if (med.time_of_day?.length > 0) subDetails.push(`Times: ${med.time_of_day.join(", ")}`);
        if (med.supply_quantity != null) subDetails.push(`Supply: ${med.supply_quantity}`);
        if (med.notes) subDetails.push(med.notes);
        ensureSpace(4);
        doc.setFontSize(7);
        doc.setTextColor(110, 110, 110);
        doc.text(doc.splitTextToSize(subDetails.join("  |  "), maxW - 4), m + 10, y);
        y += 4;
      }
    });
    y += 3;
  } else {
    addSectionTitle("Current Medications", [5, 150, 105]);
    addText("No active medications on record.", 9, "italic", [120, 120, 120]);
    y += 2;
  }

  // Latest Lab Markers
  addSectionTitle("Latest Lab Markers", [22, 163, 74]);

  // Filter and sort lab records by date descending
  const sortedLabs = (labRecords || [])
    .filter((r) => r.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Try to identify lab marker records vs general lab result docs
  const markerRecords = sortedLabs.filter((r) => isLabMarker(r.title) || isLabMarker(r.notes));
  const otherLabRecords = sortedLabs.filter((r) => !isLabMarker(r.title) && !isLabMarker(r.notes));
  const displayLabs = markerRecords.length > 0 ? markerRecords : sortedLabs;

  if (displayLabs.length > 0) {
    // Table header
    ensureSpace(8);
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(m, y - 3, maxW, 7, 1, 1, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 101, 52);
    doc.text("#", m + 2, y + 1);
    doc.text("Test / Marker", m + 10, y + 1);
    doc.text("Date", m + 100, y + 1);
    doc.text("Provider/Lab", m + 130, y + 1);
    y += 7;

    displayLabs.slice(0, 20).forEach((rec, i) => {
      ensureSpace(12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      doc.text(String(i + 1), m + 2, y);
      doc.text(doc.splitTextToSize(rec.title || "Untitled", 85)[0], m + 10, y);
      doc.text(new Date(rec.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }), m + 100, y);
      doc.text(doc.splitTextToSize(rec.provider || "—", 35)[0], m + 130, y);
      y += 5;

      if (rec.notes) {
        ensureSpace(4);
        doc.setFontSize(7);
        doc.setTextColor(90, 90, 90);
        const noteLines = doc.splitTextToSize(`Result: ${rec.notes}`, maxW - 4);
        noteLines.slice(0, 3).forEach((line) => {
          ensureSpace(4);
          doc.text(line, m + 10, y);
          y += 4;
        });
      }
      y += 1;
    });

    if (otherLabRecords.length > 0 && markerRecords.length > 0) {
      y += 2;
      ensureSpace(6);
      addText(`+ ${otherLabRecords.length} additional lab record(s) on file.`, 8, "italic", [120, 120, 120]);
    }
  } else {
    addText("No lab results on file. Upload lab result documents in Medical Records to include them here.", 9, "italic", [120, 120, 120]);
  }
  y += 3;

  // Footer
  y += 6;
  ensureSpace(20);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, y, pageW - m, y);
  y += 6;
  addText("This report was compiled from your health records in Health Me Medical Center. It includes self-reported data and uploaded lab results. This document is intended to support — not replace — professional medical evaluation during your specialist visit.", 7, "italic", [120, 120, 120]);

  const patientName = (user?.full_name || "Patient").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Specialist-Prep-${patientName}-${new Date().toISOString().split("T")[0]}.pdf`);
}