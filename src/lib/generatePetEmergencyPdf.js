import { jsPDF } from "jspdf";

const petTypeIcons = { dog: "Dog", cat: "Cat", bird: "Bird", rabbit: "Rabbit", other: "Pet" };

export function generatePetEmergencyPdf(pet) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = 18;
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

  // Header banner
  doc.setFillColor(147, 51, 234);
  doc.rect(0, 0, pageW, 42, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PET EMERGENCY CARD", m, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Health Me Medical Center — Veterinary", m, 28);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - m, 28, { align: "right" });
  y = 55;

  // Alert box
  doc.setFillColor(254, 242, 242);
  doc.rect(m, y - 4, maxW, 16, "F");
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(0.5);
  doc.rect(m, y - 4, maxW, 16, "S");
  doc.setTextColor(239, 68, 68);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("BRING THIS CARD TO THE ANIMAL HOSPITAL OR EMERGENCY CLINIC", m + 3, y + 5);
  y += 20;

  // Pet Info
  doc.setDrawColor(147, 51, 234);
  doc.setLineWidth(0.5);
  doc.line(m, y - 2, pageW - m, y - 2);
  doc.setTextColor(147, 51, 234);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Pet Information", m, y + 4);
  y += 10;

  const ageText = pet.birth_date
    ? `${Math.floor((new Date() - new Date(pet.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))} years (born ${new Date(pet.birth_date).toLocaleDateString()})`
    : "Unknown";

  const infoFields = [
    ["Name", pet.name],
    ["Type", petTypeIcons[pet.pet_type] || pet.pet_type],
    ["Breed", pet.breed || "Not specified"],
    ["Age", ageText],
    ["Sex", pet.sex || "Unknown"],
    ["Weight", pet.weight_kg ? `${pet.weight_kg} kg` : "Not recorded"],
    ["Microchip ID", pet.microchip_id],
  ];

  infoFields.forEach(([label, value]) => {
    if (!value) return;
    ensureSpace(8);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(`${label}:`, m, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(String(value), m + 35, y);
    y += 7;
  });
  y += 4;

  // Critical Medical Info
  doc.setDrawColor(239, 68, 68);
  doc.line(m, y - 2, pageW - m, y - 2);
  doc.setTextColor(239, 68, 68);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Critical Medical Information", m, y + 4);
  y += 10;

  // Allergies
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("Known Allergies:", m, y);
  y += 6;
  if (pet.known_allergies) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    addText(pet.known_allergies, 11, "bold", [220, 38, 38]);
  } else {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("No known allergies recorded", m, y);
    y += 6;
  }
  y += 4;

  // Medications
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("Current Medications:", m, y);
  y += 6;
  if (pet.current_medications) {
    addText(pet.current_medications, 10, "normal", [40, 40, 40]);
  } else {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("No current medications recorded", m, y);
    y += 6;
  }
  y += 6;

  // Veterinary Contact
  doc.setDrawColor(147, 51, 234);
  doc.line(m, y - 2, pageW - m, y - 2);
  doc.setTextColor(147, 51, 234);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Veterinary Contact", m, y + 4);
  y += 10;

  const vetFields = [
    ["Primary Vet Clinic", pet.vet_clinic],
    ["Vet Phone", pet.vet_phone],
    ["Emergency Contact", pet.emergency_contact],
  ];

  vetFields.forEach(([label, value]) => {
    if (!value) return;
    ensureSpace(8);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(`${label}:`, m, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(String(value), m + 50, y);
    y += 7;
  });
  y += 6;

  // Notes
  if (pet.notes) {
    doc.setDrawColor(200, 200, 200);
    doc.line(m, y - 2, pageW - m, y - 2);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Additional Notes", m, y + 4);
    y += 10;
    addText(pet.notes, 10, "normal", [40, 40, 40]);
    y += 6;
  }

  // Footer
  y += 10;
  ensureSpace(20);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, y, pageW - m, y);
  y += 6;
  addText("This emergency card was generated by Health Me Medical Center from your pet health records. Present this to the veterinary staff at the animal hospital or emergency clinic.", 8, "italic", [120, 120, 120]);

  const fileName = `Pet-Emergency-Card-${(pet.name || "Pet").replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}