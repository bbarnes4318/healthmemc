import { jsPDF } from "jspdf";

export function generateEmergencySummaryPdf(data) {
  const { user, profile, medications, vitals, insuranceCards, trustedContacts } = data;
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = 16;
  const maxW = pageW - m * 2;
  let y = 0;

  const ensureSpace = (h) => {
    if (y + h > pageH - 20) { doc.addPage(); y = m; }
  };

  // Red header banner
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("EMERGENCY MEDICAL SUMMARY", m, 13);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleString(), m, 22);
  doc.text("Health Me Medical Center", pageW - m, 22, { align: "right" });
  y = 38;

  // Patient info box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(m, y, maxW, 26, 2, 2, "F");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(user?.full_name || "Unknown Patient", m + 4, y + 7);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  const infoParts = [];
  if (profile?.date_of_birth) infoParts.push(`DOB: ${new Date(profile.date_of_birth).toLocaleDateString()}`);
  if (profile?.gender) infoParts.push(`Sex: ${profile.gender}`);
  if (profile?.height_cm) infoParts.push(`Ht: ${profile.height_cm} cm`);
  if (profile?.weight_kg) infoParts.push(`Wt: ${profile.weight_kg} kg`);
  doc.text(infoParts.join("   |   "), m + 4, y + 13);
  if (profile?.blood_type && profile.blood_type !== "unknown") {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text(`BLOOD TYPE: ${profile.blood_type}`, m + 4, y + 20);
  }
  y += 32;

  // ALLERGIES — red box
  const allergies = profile?.allergies || [];
  if (allergies.length > 0) {
    const boxH = 11 + allergies.length * 5;
    ensureSpace(boxH + 4);
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.roundedRect(m, y, maxW, boxH, 2, 2, "FD");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28);
    doc.text("ALLERGIES / ADVERSE REACTIONS", m + 4, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(127, 29, 29);
    allergies.forEach((a, i) => {
      doc.text(`  - ${a}`, m + 4, y + 12 + i * 5);
    });
    y += boxH + 4;
  }

  // Current Medications
  if (medications?.length > 0) {
    const shown = medications.slice(0, 10);
    const medH = 11 + shown.length * 5;
    ensureSpace(medH + 4);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(m, y, maxW, medH, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text("CURRENT MEDICATIONS", m + 4, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 58, 138);
    shown.forEach((med, i) => {
      doc.text(`  - ${med.name} ${med.dosage} (${med.frequency})`, m + 4, y + 12 + i * 5);
    });
    if (medications.length > 10) {
      doc.text(`  ... and ${medications.length - 10} more`, m + 4, y + 12 + shown.length * 5);
    }
    y += medH + 4;
  }

  // Latest Vitals
  if (vitals?.length > 0) {
    const byType = {};
    vitals.forEach((v) => {
      if (!byType[v.type] || new Date(v.recorded_at) > new Date(byType[v.type].recorded_at)) {
        byType[v.type] = v;
      }
    });
    const entries = Object.values(byType);
    if (entries.length > 0) {
      const vitalH = 11 + entries.length * 5;
      ensureSpace(vitalH + 4);
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(m, y, maxW, vitalH, 2, 2, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(6, 95, 70);
      doc.text("LATEST VITALS", m + 4, y + 7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(6, 78, 59);
      const labels = {
        heart_rate: "Heart Rate", blood_pressure: "Blood Pressure",
        oxygen_saturation: "O2 Sat", blood_glucose: "Blood Glucose",
        weight: "Weight", temperature: "Temperature", sleep_hours: "Sleep", steps: "Steps",
      };
      entries.forEach((v, i) => {
        const label = labels[v.type] || v.type;
        const val = v.type === "blood_pressure" && v.secondary_value ? `${v.value}/${v.secondary_value}` : v.value;
        const unit = v.unit || "";
        doc.text(`  - ${label}: ${val} ${unit}`, m + 4, y + 12 + i * 5);
      });
      y += vitalH + 4;
    }
  }

  // Chronic Conditions
  const conditions = profile?.chronic_conditions || [];
  if (conditions.length > 0) {
    ensureSpace(10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Chronic Conditions:", m, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const condText = doc.splitTextToSize(conditions.join(", "), maxW - 45);
    doc.text(condText, m + 45, y + 5);
    y += 5 + condText.length * 5 + 3;
  }

  // Emergency Contact
  if (profile?.emergency_contact_name || profile?.emergency_contact_phone) {
    ensureSpace(20);
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(m, y, maxW, 16, 2, 2, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(146, 64, 14);
    doc.text("EMERGENCY CONTACT", m + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 53, 15);
    let ecLine = profile.emergency_contact_name || "";
    if (profile.emergency_contact_phone) ecLine += `  |  Phone: ${profile.emergency_contact_phone}`;
    if (profile.emergency_contact_relationship) ecLine += `  (${profile.emergency_contact_relationship})`;
    doc.text(ecLine, m + 4, y + 12);
    y += 20;
  }

  // Trusted Contacts
  if (trustedContacts?.length > 0) {
    const shown = trustedContacts.slice(0, 8);
    const tcH = 11 + shown.length * 5;
    ensureSpace(tcH + 4);
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(m, y, maxW, tcH, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(6, 95, 70);
    doc.text("TRUSTED CONTACTS", m + 4, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(6, 78, 59);
    shown.forEach((c, i) => {
      let line = c.name || "";
      if (c.relationship) line += ` (${c.relationship})`;
      if (c.phone) line += `  |  Ph: ${c.phone}`;
      if (c.email) line += `  |  ${c.email}`;
      doc.text(`  - ${line}`, m + 4, y + 12 + i * 5);
    });
    if (trustedContacts.length > 8) {
      doc.text(`  ... and ${trustedContacts.length - 8} more`, m + 4, y + 12 + shown.length * 5);
    }
    y += tcH + 4;
  }

  // Insurance
  if (insuranceCards?.length > 0) {
    const ins = insuranceCards[0];
    ensureSpace(15);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Insurance:", m, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`${ins.provider_name} - Policy: ${ins.policy_number}${ins.plan_name ? ` (${ins.plan_name})` : ""}`, m + 28, y + 5);
    if (ins.customer_service_phone) {
      doc.text(`Customer Service: ${ins.customer_service_phone}`, m + 28, y + 10);
    }
    y += 15;
  }

  // Footer
  ensureSpace(15);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, pageH - 15, pageW - m, pageH - 15);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  doc.text("Generated by Health Me Medical Center. Provide this document to emergency responders or paramedics.", m, pageH - 10);

  const name = (user?.full_name || "Patient").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Emergency-Summary-${name}-${new Date().toISOString().split("T")[0]}.pdf`);
}