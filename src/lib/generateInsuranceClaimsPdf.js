import { jsPDF } from "jspdf";

function fmtMoney(n) {
  if (n === null || n === undefined) return "—";
  return `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function generateInsuranceClaimsPdf({ card, claims, user }) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = 48;
  let y = 0;

  // Header bar
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Health Me Medical Center", m, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("INSURANCE CLAIMS & DEDUCTIBLE SUMMARY", m, 50);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageW - m, 50, { align: "right" });

  y = 100;

  // Patient & Provider
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PATIENT", m, y);
  doc.text("INSURANCE PROVIDER", m + 260, y);
  y += 16;
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(user?.full_name || "N/A", m, y);
  doc.text(card?.provider_name || "N/A", m + 260, y);
  y += 18;
  if (card?.plan_name) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(card.plan_name, m + 260, y);
  }
  if (card?.policy_number) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Policy: ${card.policy_number}`, m, y);
  }
  y += 24;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(m, y, pageW - m, y);
  y += 22;

  // Deductible Status
  const deductibleAmount = card?.deductible_amount || 0;
  const deductibleMet = card?.deductible_met || 0;
  const deductiblePct = deductibleAmount > 0 ? Math.min(100, (deductibleMet / deductibleAmount) * 100) : 0;
  const remaining = Math.max(0, deductibleAmount - deductibleMet);

  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DEDUCTIBLE STATUS", m, y);
  y += 16;

  // Progress bar
  const barW = pageW - m * 2;
  const barH = 22;
  doc.setFillColor(230, 230, 240);
  doc.roundedRect(m, y, barW, barH, 4, 4, "F");
  if (deductiblePct > 0) {
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(m, y, barW * (deductiblePct / 100), barH, 4, 4, "F");
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  if (deductiblePct > 15) {
    doc.text(`${fmtMoney(deductibleMet)} of ${fmtMoney(deductibleAmount)}`, m + 10, y + 15);
  }
  doc.setTextColor(40, 40, 40);
  doc.text(`${deductiblePct.toFixed(0)}% met`, pageW - m - 10, y + 15, { align: "right" });
  y += barH + 14;

  // Deductible details grid
  const totalPatient = claims.reduce((s, c) => s + (c.patient_responsibility || 0), 0);
  const oopMax = card?.out_of_pocket_max || 0;

  const detailFields = [
    { label: "Deductible Amount", value: fmtMoney(deductibleAmount) },
    { label: "Amount Met", value: fmtMoney(deductibleMet) },
    { label: "Remaining", value: fmtMoney(remaining) },
  ];
  if (oopMax > 0) {
    detailFields.push(
      { label: "Out-of-Pocket Max", value: fmtMoney(oopMax) },
      { label: "OOP Met", value: fmtMoney(totalPatient) },
      { label: "OOP Remaining", value: fmtMoney(Math.max(0, oopMax - totalPatient)) },
    );
  }
  if (card?.copay_amount != null) {
    detailFields.push({ label: "Copay", value: fmtMoney(card.copay_amount) });
  }

  const detailColW = (pageW - m * 2) / 3;
  for (let i = 0; i < detailFields.length; i++) {
    const f = detailFields[i];
    const col = i % 3;
    const row = Math.floor(i / 3);
    const fx = m + col * detailColW;
    const fy = y + row * 28;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(f.label.toUpperCase(), fx, fy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(f.value, fx, fy + 13);
  }
  y += Math.ceil(detailFields.length / 3) * 28 + 12;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(m, y, pageW - m, y);
  y += 22;

  // Totals Summary boxes
  const totalBilled = claims.reduce((s, c) => s + (c.billed_amount || 0), 0);
  const totalPaid = claims.reduce((s, c) => s + (c.insurance_paid || 0), 0);

  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CLAIMS SUMMARY", m, y);
  y += 14;

  const summaryBoxes = [
    { label: "Total Billed", value: fmtMoney(totalBilled), color: [40, 40, 40] },
    { label: "Insurance Paid", value: fmtMoney(totalPaid), color: [16, 185, 129] },
    { label: "Patient Responsibility", value: fmtMoney(totalPatient), color: [245, 158, 11] },
  ];
  const boxW = (pageW - m * 2 - 16) / 3;
  for (let i = 0; i < 3; i++) {
    const f = summaryBoxes[i];
    const fx = m + i * (boxW + 8);
    doc.setFillColor(245, 245, 248);
    doc.roundedRect(fx, y, boxW, 48, 6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(f.label.toUpperCase(), fx + 12, y + 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...f.color);
    doc.text(f.value, fx + 12, y + 38);
  }
  y += 64;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(m, y, pageW - m, y);
  y += 22;

  // Claims Table
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`RECENT CLAIMS (${claims.length})`, m, y);
  y += 10;

  const cols = [
    { key: "date", label: "Date", w: 58 },
    { key: "service", label: "Service Description", w: 150 },
    { key: "billed", label: "Billed", w: 65, align: "right" },
    { key: "insurance", label: "Insurance Paid", w: 75, align: "right" },
    { key: "patient", label: "Patient", w: 65, align: "right" },
    { key: "status", label: "Status", w: 103 },
  ];

  const drawTableHeader = (headerY) => {
    doc.setFillColor(79, 70, 229);
    doc.rect(m, headerY, pageW - m * 2, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    let cx = m;
    for (const col of cols) {
      const align = col.align === "right" ? "right" : "left";
      const tx = col.align === "right" ? cx + col.w - 6 : cx + 6;
      doc.text(col.label.toUpperCase(), tx, headerY + 15, { align });
      cx += col.w;
    }
  };

  drawTableHeader(y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const rowH = 24;

  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];

    if (y + rowH > pageH - 60) {
      doc.addPage();
      y = 60;
      drawTableHeader(y);
      y += 22;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    }

    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 252);
      doc.rect(m, y, pageW - m * 2, rowH, "F");
    }

    let cx = m;
    doc.setTextColor(50, 50, 50);
    for (const col of cols) {
      let val = "";
      if (col.key === "date") val = claim.service_date ? new Date(claim.service_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—";
      else if (col.key === "service") val = (claim.service_description || "—").substring(0, 40);
      else if (col.key === "billed") val = fmtMoney(claim.billed_amount);
      else if (col.key === "insurance") val = fmtMoney(claim.insurance_paid);
      else if (col.key === "patient") val = fmtMoney(claim.patient_responsibility);
      else if (col.key === "status") val = (claim.status || "—").replace(/_/g, " ");

      const align = col.align === "right" ? "right" : "left";
      const tx = col.align === "right" ? cx + col.w - 6 : cx + 6;
      doc.text(val, tx, y + 15, { align });
      cx += col.w;
    }
    y += rowH;
  }

  // Footer
  doc.setDrawColor(220, 220, 220);
  doc.line(m, pageH - 40, pageW - m, pageH - 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("Health Me Medical Center — Insurance Claims & Deductible Summary", m, pageH - 25);
  doc.text(`${claims.length} claims · Generated ${new Date().toLocaleDateString()}`, pageW - m, pageH - 25, { align: "right" });

  const name = (card?.provider_name || "Insurance").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Insurance-Claims-${name}.pdf`);
}