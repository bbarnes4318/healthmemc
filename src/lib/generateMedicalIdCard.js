import { jsPDF } from "jspdf";

export function generateMedicalIdCard({ user, profile, insuranceCard, includePhoto, photoUrl }) {
  const doc = new jsPDF({ unit: "pt", format: [340, 215] });
  const w = 340;
  const h = 215;
  const m = 14;

  // Company header bar
  doc.setFillColor(22, 86, 160);
  doc.roundedRect(0, 0, w, 52, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Health Me Medical Center", m, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("MEDICAL ID CARD", m, 34);
  doc.setFontSize(6);
  doc.text(`Issued: ${new Date().toLocaleDateString()}`, w - m, 34, { align: "right" });

  // Photo (optional)
  let contentX = m;
  if (includePhoto && photoUrl) {
    try {
      doc.addImage(photoUrl, "JPEG", m, 62, 54, 68);
    } catch (_) { /* image load fails silently */ }
    contentX = m + 62;
  }

  // Patient info
  let y = 68;
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(user?.full_name || "N/A", contentX, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);

  const addField = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 120, 120);
    doc.text(label.toUpperCase(), contentX, y);
    y += 9;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);
    doc.text(String(value || "N/A"), contentX, y);
    y += 12;
    doc.setFontSize(7);
  };

  if (profile) {
    if (profile.date_of_birth) addField("DOB", new Date(profile.date_of_birth).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }));
    if (profile.blood_type && profile.blood_type !== "unknown") addField("Blood Type", profile.blood_type);
    if (profile.gender) addField("Gender", profile.gender.replace(/_/g, " "));
  }

  // Insurance details
  if (insuranceCard) {
    addField("Insurance", insuranceCard.provider_name);
    addField("Policy #", insuranceCard.policy_number);
    if (insuranceCard.group_number) addField("Group #", insuranceCard.group_number);
    if (insuranceCard.plan_type) addField("Plan", insuranceCard.plan_type.toUpperCase());
  }

  // Emergency contact at bottom
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(m, h - 28, w - m, h - 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text("EMERGENCY CONTACT", m, h - 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(40, 40, 40);
  const ecName = profile?.emergency_contact_name || "Not set";
  const ecPhone = profile?.emergency_contact_phone || "";
  doc.text(`${ecName}${ecPhone ? `  ·  ${ecPhone}` : ""}`, m, h - 9);
  doc.setFontSize(5);
  doc.setTextColor(150, 150, 150);
  doc.text("This card is for identification purposes only. Not a substitute for professional medical care.", w - m, h - 9, { align: "right" });

  const name = (user?.full_name || "Patient").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Medical-ID-${name}.pdf`);
}