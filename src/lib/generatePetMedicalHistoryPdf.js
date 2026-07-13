import { jsPDF } from "jspdf";

const petTypeLabels = { dog: "Dog", cat: "Cat", bird: "Bird", rabbit: "Rabbit", other: "Pet" };

const observationTypeLabels = {
  pain: "Pain", swelling: "Swelling", lesion: "Lesion", lameness: "Lameness",
  skin_issue: "Skin Issue", behavior: "Behavior", other: "Other",
};

const scheduleTypeLabels = {
  vet_visit: "Vet Visit", vaccination: "Vaccination", dental_cleaning: "Dental Cleaning",
  grooming: "Grooming", parasite_prevention: "Parasite Prevention", other: "Health Item",
};

const medicationLogStatusLabels = {
  given: "Given", missed: "Missed", skipped: "Skipped",
};

/**
 * Generates a comprehensive printable PDF of a pet's medical history.
 * @param {Object} pet - PetProfile record
 * @param {Object} data - { symptoms, weightLogs, medications, medicationLogs, schedules }
 */
export function generatePetMedicalHistoryPdf(pet, data = {}) {
  const { symptoms = [], weightLogs = [], medications = [], medicationLogs = [], schedules = [] } = data;
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

  const addSectionHeader = (title, color) => {
    y += 4;
    ensureSpace(16);
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.5);
    doc.line(m, y - 2, pageW - m, y - 2);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(title, m, y + 4);
    y += 10;
  };

  // Header banner
  doc.setFillColor(147, 51, 234);
  doc.rect(0, 0, pageW, 42, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PET MEDICAL HISTORY", m, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Health Me Medical Center — Veterinary Records", m, 28);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - m, 28, { align: "right" });
  y = 55;

  // Pet Information
  addSectionHeader("Pet Information", [147, 51, 234]);

  const ageText = pet.birth_date
    ? `${Math.floor((new Date() - new Date(pet.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))} years (born ${new Date(pet.birth_date).toLocaleDateString()})`
    : "Unknown";

  const infoFields = [
    ["Name", pet.name],
    ["Type", petTypeLabels[pet.pet_type] || pet.pet_type],
    ["Breed", pet.breed || "Not specified"],
    ["Sex", pet.sex || "Unknown"],
    ["Age", ageText],
    ["Microchip ID", pet.microchip_id],
    ["Vet Clinic", pet.vet_clinic],
    ["Vet Phone", pet.vet_phone],
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
    doc.text(String(value), m + 40, y);
    y += 7;
  });

  // Allergies
  if (pet.known_allergies) {
    ensureSpace(12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.text("⚠ Known Allergies:", m, y);
    y += 6;
    addText(pet.known_allergies, 10, "bold", [220, 38, 38]);
  }

  // Current Weight (from latest weight log)
  const latestWeight = weightLogs.length > 0
    ? [...weightLogs].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;
  if (latestWeight) {
    ensureSpace(8);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Current Weight:", m, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(`${latestWeight.weight_kg} ${latestWeight.weight_unit || "kg"} (as of ${new Date(latestWeight.date).toLocaleDateString()})`, m + 40, y);
    y += 7;
  }

  // Medications Section
  addSectionHeader("Current Medications & Prescriptions", [14, 165, 233]);

  if (medications.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("No medications recorded", m, y);
    y += 6;
  } else {
    medications.forEach((med, idx) => {
      ensureSpace(20);
      // Medication name + low supply flag
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      const medName = `${idx + 1}. ${med.medication_name}`;
      doc.text(medName, m, y);

      if (med.supply_remaining != null && med.supply_remaining <= 7) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(220, 38, 38);
        doc.text("⚠ LOW SUPPLY", pageW - m, y, { align: "right" });
      }
      y += 6;

      const medDetails = [
        ["Dosage", med.dosage],
        ["Frequency", med.frequency],
        ["Times", med.time_of_day ? med.time_of_day.join(", ") : null],
        ["Start Date", med.start_date ? new Date(med.start_date).toLocaleDateString() : null],
        ["End Date", med.end_date ? new Date(med.end_date).toLocaleDateString() : null],
        ["Prescribing Vet", med.prescribing_vet],
        ["Supply Remaining", med.supply_remaining != null ? `${med.supply_remaining} doses` : null],
      ];

      medDetails.forEach(([label, value]) => {
        if (!value) return;
        ensureSpace(7);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(120, 120, 120);
        doc.text(`  ${label}:`, m, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(String(value), m + 45, y);
        y += 6;
      });

      if (med.notes) {
        ensureSpace(8);
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text(`  Notes: ${med.notes}`, m, y);
        y += 6;
      }
      y += 3;
    });
  }

  // Medication Adherence Log (recent)
  if (medicationLogs.length > 0) {
    addSectionHeader("Recent Medication Adherence Log", [14, 165, 233]);
    const recentLogs = [...medicationLogs]
      .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
      .slice(0, 15);

    recentLogs.forEach((log) => {
      ensureSpace(7);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const status = medicationLogStatusLabels[log.status] || log.status;
      const statusColor = log.status === "given" ? [22, 163, 74] : log.status === "missed" ? [220, 38, 38] : [160, 160, 160];
      doc.setTextColor(60, 60, 60);
      doc.text(`${new Date(log.scheduled_date).toLocaleDateString()} (${log.time_of_day || ""})`, m, y);
      doc.text(`${log.medication_name}`, m + 60, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(status, pageW - m, y, { align: "right" });
      y += 6;
    });
  }

  // Symptom History
  addSectionHeader("Symptom History", [239, 68, 68]);

  if (symptoms.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("No symptoms logged", m, y);
    y += 6;
  } else {
    const sortedSymptoms = [...symptoms].sort((a, b) => new Date(b.logged_at || b.created_date) - new Date(a.logged_at || a.created_date));
    sortedSymptoms.forEach((s, idx) => {
      ensureSpace(16);
      const dateStr = s.logged_at ? new Date(s.logged_at).toLocaleDateString() : "Unknown date";
      const obsType = observationTypeLabels[s.observation_type] || s.observation_type;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const sevColor = s.severity === "severe" ? [220, 38, 38] : s.severity === "moderate" ? [234, 88, 12] : [161, 98, 7];
      doc.setTextColor(sevColor[0], sevColor[1], sevColor[2]);
      doc.text(`${idx + 1}. ${obsType} — ${s.severity}`, m, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(dateStr, pageW - m, y, { align: "right" });
      y += 6;

      if (s.body_region) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`  Region: ${s.body_region.replace(/_/g, " ")}`, m, y);
        y += 5;
      }
      if (s.description) {
        addText(`  Description: ${s.description}`, 9, "normal", [80, 80, 80]);
      }
      y += 2;
    });
  }

  // Weight History
  addSectionHeader("Weight Tracking History", [34, 197, 94]);

  if (weightLogs.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("No weight entries recorded", m, y);
    y += 6;
  } else {
    const sortedWeights = [...weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstW = sortedWeights[0];
    const lastW = sortedWeights[sortedWeights.length - 1];
    const change = lastW.weight_kg - firstW.weight_kg;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Summary:", m, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(`${sortedWeights.length} entries · First: ${firstW.weight_kg} ${firstW.weight_unit || "kg"} · Latest: ${lastW.weight_kg} ${lastW.weight_unit || "kg"} · Change: ${change > 0 ? "+" : ""}${change.toFixed(1)}`, m + 30, y);
    y += 8;

    // Table header
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.text("Date", m, y);
    doc.text("Weight", m + 60, y);
    doc.text("Notes", m + 100, y);
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(m, y - 2, pageW - m, y - 2);

    [...sortedWeights].reverse().forEach((w) => {
      ensureSpace(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(new Date(w.date).toLocaleDateString(), m, y);
      doc.text(`${w.weight_kg} ${w.weight_unit || "kg"}`, m + 60, y);
      if (w.notes) {
        const noteLines = doc.splitTextToSize(w.notes, maxW - 100);
        doc.text(noteLines[0] || "", m + 100, y);
      }
      y += 6;
    });
  }

  // Vaccinations & Vet Visits
  addSectionHeader("Vaccinations & Vet Visit Schedule", [168, 85, 247]);

  if (schedules.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("No scheduled health items recorded", m, y);
    y += 6;
  } else {
    schedules.forEach((s, idx) => {
      ensureSpace(14);
      const typeLabel = scheduleTypeLabels[s.record_type] || s.record_type;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(`${idx + 1}. ${typeLabel}${s.vaccine_type ? `: ${s.vaccine_type}` : ""}`, m, y);
      y += 6;

      const schedDetails = [
        ["Last Done", s.last_done_date ? new Date(s.last_done_date).toLocaleDateString() : null],
        ["Next Due", s.next_due_date ? new Date(s.next_due_date).toLocaleDateString() : null],
        ["Frequency", s.frequency_months ? `Every ${s.frequency_months} months` : null],
        ["Clinic", s.clinic_name],
      ];
      schedDetails.forEach(([label, value]) => {
        if (!value) return;
        ensureSpace(6);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(120, 120, 120);
        doc.text(`  ${label}:`, m, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(String(value), m + 45, y);
        y += 5;
      });
      if (s.notes) {
        ensureSpace(6);
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text(`  Notes: ${s.notes}`, m, y);
        y += 5;
      }
      y += 2;
    });
  }

  // Footer
  y += 10;
  ensureSpace(20);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, y, pageW - m, y);
  y += 6;
  addText("This comprehensive medical history was generated by Health Me Medical Center from your pet health records. Share this document with your veterinarian for complete clinical context.", 8, "italic", [120, 120, 120]);

  const fileName = `Pet-Medical-History-${(pet.name || "Pet").replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}