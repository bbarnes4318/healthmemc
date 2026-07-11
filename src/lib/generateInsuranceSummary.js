import { jsPDF } from "jspdf";

export function generateInsuranceSummary({ card, user }) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const m = 48;
  let y = 0;

  // Header bar
  doc.setFillColor(22, 86, 160);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Health Me Medical Center", m, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("INSURANCE CARD SUMMARY", m, 50);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageW - m, 50, { align: "right" });

  y = 100;

  // Patient section
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PATIENT", m, y);
  y += 16;
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text(user?.full_name || "N/A", m, y);
  y += 28;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(m, y, pageW - m, y);
  y += 24;

  // Insurance provider section
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("INSURANCE PROVIDER", m, y);
  y += 16;
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(card.provider_name || "N/A", m, y);
  if (card.plan_name) {
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(card.plan_name, m, y);
  }
  if (card.plan_type) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(22, 86, 160);
    const planLabel = card.plan_type.toUpperCase();
    doc.text(planLabel, pageW - m, y - (card.plan_name ? 16 : 0), { align: "right" });
  }
  y += 30;

  // Details grid
  const colW = (pageW - m * 2) / 2;
  const rowH = 38;

  const fields = [
    { label: "Policy Number", value: card.policy_number },
    { label: "Group Number", value: card.group_number },
    { label: "Subscriber Name", value: card.subscriber_name },
    { label: "Plan Type", value: card.plan_type ? card.plan_type.toUpperCase() : null },
    { label: "Effective Date", value: card.effective_date ? new Date(card.effective_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : null },
    { label: "Termination Date", value: card.termination_date ? new Date(card.termination_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : null },
    { label: "Copay", value: card.copay_amount != null ? `$${card.copay_amount}` : null },
    { label: "Deductible", value: card.deductible_amount != null ? `$${card.deductible_amount}` : null },
    { label: "Customer Service", value: card.customer_service_phone },
  ];

  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (!f.value) continue;
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = m + col * colW;
    const fy = y + row * rowH;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(f.label.toUpperCase(), fx, fy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(String(f.value), fx, fy + 14);
  }

  y += Math.ceil(fields.filter((f) => f.value).length / 2) * rowH + 16;

  // Notes
  if (card.notes) {
    doc.setDrawColor(220, 220, 220);
    doc.line(m, y, pageW - m, y);
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("NOTES", m, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitNotes = doc.splitTextToSize(card.notes, pageW - m * 2);
    doc.text(splitNotes, m, y);
    y += splitNotes.length * 14 + 10;
  }

  // Card images
  if (card.card_front_url || card.card_back_url) {
    y += 10;
    doc.setDrawColor(220, 220, 220);
    doc.line(m, y, pageW - m, y);
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("CARD IMAGES", m, y);
    y += 10;
    const imgH = 120;
    const imgW = 190;
    try {
      if (card.card_front_url) {
        doc.addImage(card.card_front_url, "JPEG", m, y, imgW, imgH);
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text("Front", m, y + imgH + 12);
      }
      if (card.card_back_url) {
        doc.addImage(card.card_back_url, "JPEG", m + imgW + 20, y, imgW, imgH);
        doc.text("Back", m + imgW + 20, y + imgH + 12);
      }
    } catch (_) { /* image load fails silently */ }
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 220, 220);
  doc.line(m, pageH - 40, pageW - m, pageH - 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Health Me Medical Center — Insurance Card Summary", m, pageH - 25);
  doc.text("Present this summary at the front desk for verification. Information is patient-provided.", pageW - m, pageH - 25, { align: "right" });

  const name = (card.provider_name || "Insurance").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Insurance-Summary-${name}.pdf`);
}