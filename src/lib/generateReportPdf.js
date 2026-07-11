import { jsPDF } from "jspdf";

export function generateReportPdf(report, symptoms, severity) {
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

  const addList = (items) => {
    items.forEach((item, i) => {
      addText(`  ${i + 1}. ${item}`, 10, "normal", [60, 60, 60]);
    });
  };

  const addFieldLabel = (label) => {
    addText(label, 9, "bold", [100, 100, 100]);
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
  doc.text("Health Consultation Report", m, 28);
  doc.setFontSize(9);
  doc.text(`Date: ${new Date().toLocaleString()}`, pageW - m, 28, { align: "right" });
  y = 55;

  // Patient symptoms
  if (symptoms) {
    addSectionTitle("Reported Symptoms");
    addText(symptoms, 10, "normal", [60, 60, 60]);
  }

  // Clinical Assessment Overview
  addSectionTitle("Clinical Assessment Overview");
  const dxCount = report.diagnoses?.length || 0;
  const highConf = report.diagnoses?.filter((d) => d.confidence === "High").length || 0;
  const modConf = report.diagnoses?.filter((d) => d.confidence === "Moderate").length || 0;
  const lowConf = report.diagnoses?.filter((d) => d.confidence === "Low").length || 0;
  const emergencyCount = report.emergency_warnings?.length || 0;
  const severityLabel = severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : (emergencyCount > 0 ? "High" : "Low");
  const severityColor = severityLabel === "Emergency" ? [220, 38, 38] : severityLabel === "High" ? [220, 38, 38] : severityLabel === "Moderate" ? [217, 119, 6] : [22, 163, 74];

  addFieldLabel("Severity Level");
  addText(severityLabel, 12, "bold", severityColor);
  y += 1;
  addFieldLabel("Possible Diagnoses Identified");
  addText(String(dxCount), 11, "normal", [40, 40, 40]);
  y += 1;
  addFieldLabel("Confidence Distribution");
  addText(`High: ${highConf}    Moderate: ${modConf}    Low: ${lowConf}`, 11, "normal", [40, 40, 40]);
  y += 1;
  addFieldLabel("Emergency Warnings");
  addText(emergencyCount > 0 ? `${emergencyCount} warning(s) — seek immediate medical attention` : "None identified", 11, "normal", emergencyCount > 0 ? [220, 38, 38] : [22, 163, 74]);
  y += 1;
  addFieldLabel("Overall Accuracy Assessment");
  const accuracyScore = dxCount > 0 ? Math.round(((highConf * 100) + (modConf * 60) + (lowConf * 30)) / dxCount) : 0;
  addText(`${accuracyScore}% confidence score based on ${dxCount} diagnostic ${dxCount === 1 ? "possibility" : "possibilities"}`, 11, "normal", [40, 40, 40]);

  // Summary
  if (report.summary) {
    addSectionTitle("Summary");
    addText(report.summary, 10, "normal", [60, 60, 60]);
  }

  // Diagnoses
  if (report.diagnoses?.length) {
    addSectionTitle("Possible Diagnoses");
    report.diagnoses.forEach((d, i) => {
      const confColor = d.confidence === "High" ? [22, 163, 74] : d.confidence === "Moderate" ? [217, 119, 6] : [107, 114, 128];
      const confScore = d.confidence === "High" ? "90-100%" : d.confidence === "Moderate" ? "50-89%" : "20-49%";
      addText(`${i + 1}. ${d.name}`, 10, "bold", [40, 40, 40]);
      addText(`   Confidence: ${d.confidence} (${confScore} accuracy)`, 9, "bold", confColor);
      addText(`   ${d.description}`, 9, "normal", [80, 80, 80]);
      y += 2;
    });
  }

  // Emergency warnings
  if (report.emergency_warnings?.length) {
    addSectionTitle("Emergency Warnings");
    doc.setFillColor(254, 226, 226);
    doc.rect(m, y - 4, maxW, report.emergency_warnings.length * 6 + 4, "F");
    addList(report.emergency_warnings);
    y += 2;
  }

  // Recommended tests
  if (report.recommended_tests?.length) {
    addSectionTitle("Recommended Tests");
    addList(report.recommended_tests);
  }

  // Recommended treatments
  if (report.recommended_treatments?.length) {
    addSectionTitle("Recommended Treatments");
    addList(report.recommended_treatments);
  }

  // Medication review
  if (report.medication_review) {
    addSectionTitle("Medication Review");
    addText(report.medication_review, 10, "normal", [60, 60, 60]);
  }

  // Lifestyle recommendations
  if (report.lifestyle_recommendations?.length) {
    addSectionTitle("Lifestyle Recommendations");
    addList(report.lifestyle_recommendations);
  }

  // Complementary care
  if (report.complementary_care?.length) {
    addSectionTitle("Complementary Care Options");
    addList(report.complementary_care);
  }

  // Follow-up plan
  if (report.follow_up_plan) {
    addSectionTitle("Follow-up Plan");
    addText(report.follow_up_plan, 10, "normal", [60, 60, 60]);
  }

  // References
  if (report.references?.length) {
    addSectionTitle("References");
    addList(report.references);
  }

  // Disclaimer
  y += 8;
  ensureSpace(20);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, y, pageW - m, y);
  y += 6;
  addText(
    "This report was generated by Health Me Medical Center and should be reviewed by a licensed healthcare professional. It is not a substitute for professional medical diagnosis or treatment.",
    8, "italic", [120, 120, 120]
  );

  doc.save(`Health-Me-Report-${new Date().toISOString().split("T")[0]}.pdf`);
}