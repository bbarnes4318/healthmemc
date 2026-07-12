import { jsPDF } from "jspdf";

export default function generateForumReportPdf(topic, replies, specialties) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  // Header band
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, pageWidth, 8, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  const titleLines = doc.splitTextToSize(topic.title, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 4;

  // Meta info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const specialtyLabel = specialties.find((s) => s.value === topic.specialty)?.label || topic.specialty;
  const metaParts = [
    `Category: ${topic.category?.replace(/_/g, " ")}`,
    `Specialty: ${specialtyLabel}`,
    `Author: ${topic.author_name || "Anonymous"} (${topic.author_role})`,
    `Date: ${new Date(topic.created_date).toLocaleString()}`,
    `Views: ${topic.views || 0}`,
  ];
  metaParts.forEach((part) => {
    doc.text(part, margin, y);
    y += 5;
  });
  y += 3;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Topic content
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("Discussion Summary", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const contentLines = doc.splitTextToSize(topic.content, maxWidth);
  contentLines.forEach((line) => {
    if (y > pageHeight - 25) { doc.addPage(); y = 20; }
    doc.text(line, margin, y);
    y += 5;
  });
  y += 4;

  // Tags
  if (topic.tags?.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Tags: ${topic.tags.join(", ")}`, margin, y);
    y += 6;
  }

  // Replies
  if (y > pageHeight - 30) { doc.addPage(); y = 20; }
  y += 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`Clinical Responses (${replies.length})`, margin, y);
  y += 7;

  replies.forEach((reply, idx) => {
    if (y > pageHeight - 30) { doc.addPage(); y = 20; }

    // Reply header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(14, 165, 233);
    doc.text(`${idx + 1}. ${reply.author_name || "Anonymous"} (${reply.author_role})`, margin, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const replyDate = new Date(reply.created_date).toLocaleString();
    doc.text(`${replyDate}${reply.author_specialty ? " | " + reply.author_specialty : ""}${reply.is_verified ? " | Verified" : ""}`, margin, y);
    y += 5;

    // Reply content
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const replyLines = doc.splitTextToSize(reply.content, maxWidth);
    replyLines.forEach((line) => {
      if (y > pageHeight - 20) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 4.5;
    });
    y += 4;
  });

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Health Me Medical Center - Professional Forum Report - Page ${i} of ${totalPages}`, margin, pageHeight - 8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  const fileName = `forum-${topic.title?.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-") || "report"}.pdf`;
  doc.save(fileName);
}