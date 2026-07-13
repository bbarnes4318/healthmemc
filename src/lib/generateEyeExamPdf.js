import React from "react";
import { jsPDF } from "jspdf";

export function generateEyeExamPdf(examData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Health Me Medical Center", margin, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("AI Vision Exam Report", margin, 23);
  doc.setFontSize(9);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, 15, { align: "right" });
  doc.text(`Time: ${new Date().toLocaleTimeString()}`, pageWidth - margin, 23, { align: "right" });

  y = 42;
  doc.setTextColor(30, 30, 30);

  // Patient section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Information", margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${examData.patientName || "Self"}`, margin, y);
  doc.text(`Exam Date: ${examData.examDate || new Date().toLocaleDateString()}`, pageWidth - margin, y, { align: "right" });
  y += 10;

  // Visual Acuity Results
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Visual Acuity (Snellen Test)", margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Left Eye (OS):  ${examData.acuity?.left || "Not tested"}`, margin, y);
  y += 5;
  doc.text(`Right Eye (OD): ${examData.acuity?.right || "Not tested"}`, margin, y);
  y += 5;
  doc.text(`Both Eyes:      ${examData.acuity?.both || "Not tested"}`, margin, y);
  y += 8;

  // Color Vision
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Color Vision (Ishihara Test)", margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Result: ${examData.colorVision?.result || "Not tested"}`, margin, y);
  y += 5;
  doc.text(`Score: ${examData.colorVision?.score || "N/A"}`, margin, y);
  y += 8;

  // Astigmatism
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Astigmatism Test", margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Result: ${examData.astigmatism?.result || "Not tested"}`, margin, y);
  y += 5;
  if (examData.astigmatism?.severity) {
    doc.text(`Severity: ${examData.astigmatism.severity}`, margin, y);
    y += 5;
  }
  y += 5;

  // Prescription Estimate
  if (examData.prescription) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Estimated Prescription", margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const p = examData.prescription;
    doc.text(`Left Eye (OS):  SPH ${p.left?.sph || "—"}  | CYL ${p.left?.cyl || "—"}  | AXIS ${p.left?.axis || "—"}`, margin, y);
    y += 5;
    doc.text(`Right Eye (OD): SPH ${p.right?.sph || "—"}  | CYL ${p.right?.cyl || "—"}  | AXIS ${p.right?.axis || "—"}`, margin, y);
    y += 8;
  }

  // Recommendations
  if (examData.recommendations?.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Recommendations", margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    examData.recommendations.forEach((rec) => {
      const lines = doc.splitTextToSize(`• ${rec}`, pageWidth - margin * 2);
      lines.forEach((line) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 5;
      });
    });
    y += 5;
  }

  // Selected eyewear
  if (examData.selectedEyewear) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Selected Eyewear", margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Type: ${examData.selectedEyewear.type}`, margin, y);
    y += 5;
    doc.text(`Model: ${examData.selectedEyewear.name}`, margin, y);
    y += 5;
    if (examData.selectedEyewear.price) {
      doc.text(`Price: $${examData.selectedEyewear.price}`, margin, y);
      y += 5;
    }
    y += 5;
  }

  // Disclaimer
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFillColor(254, 243, 199);
  doc.rect(margin - 5, y - 3, pageWidth - margin * 2 + 10, 20, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(146, 64, 14);
  const disclaimer = "This AI vision screening is for informational purposes only and is not a substitute for a comprehensive eye examination by a licensed optometrist or ophthalmologist. Please consult an eye care professional for diagnosis, prescription, and treatment.";
  const discLines = doc.splitTextToSize(disclaimer, pageWidth - margin * 2);
  discLines.forEach((line, i) => {
    doc.text(line, margin, y + i * 4);
  });

  doc.save(`eye-exam-report-${Date.now()}.pdf`);
}