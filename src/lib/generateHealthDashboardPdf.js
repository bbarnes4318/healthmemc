import { jsPDF } from "jspdf";
import { format } from "date-fns";

const vitalLabels = {
  heart_rate: "Heart Rate",
  blood_pressure: "Blood Pressure",
  oxygen_saturation: "Oxygen Saturation",
  blood_glucose: "Blood Glucose",
  weight: "Weight",
  sleep_hours: "Sleep",
  activity_minutes: "Activity",
  temperature: "Temperature",
  steps: "Steps",
};

const vitalUnits = {
  heart_rate: "bpm",
  blood_pressure: "mmHg",
  oxygen_saturation: "%",
  blood_glucose: "mg/dL",
  weight: "kg",
  sleep_hours: "hrs",
  activity_minutes: "min",
  temperature: "°F",
  steps: "steps",
};

export function generateHealthDashboardPdf(vitals, healthScore) {
  const doc = new jsPDF();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("Health Me Medical Center", 20, y);
  y += 8;
  doc.setFontSize(13);
  doc.setTextColor(100, 116, 139);
  doc.text("Health Dashboard Report", 20, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`, 20, y);
  y += 10;

  doc.setDrawColor(226, 232, 240);
  doc.line(20, y, 190, y);
  y += 10;

  // Current Vitals Summary
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Current Vitals Summary", 20, y);
  y += 7;

  const vitalTypes = Object.keys(vitalLabels);
  const latestByType = {};
  vitals.forEach((v) => {
    if (!latestByType[v.type] || new Date(v.recorded_at || v.created_date) > new Date(latestByType[v.type].recorded_at || latestByType[v.type].created_date)) {
      latestByType[v.type] = v;
    }
  });

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  if (healthScore) {
    doc.text(`  • Health Score: ${healthScore}/100`, 20, y);
    y += 6;
  }
  vitalTypes.forEach((type) => {
    if (latestByType[type]) {
      const v = latestByType[type];
      const value = type === "blood_pressure" && v.secondary_value
        ? `${v.value}/${v.secondary_value}`
        : v.value;
      const date = format(new Date(v.recorded_at || v.created_date), "MMM d, yyyy");
      doc.text(`  • ${vitalLabels[type]}: ${value} ${vitalUnits[type] || ""} (recorded ${date})`, 20, y);
      y += 6;
    }
  });
  y += 6;

  // Trend Data by Vital Type
  vitalTypes.forEach((type) => {
    const typeVitals = vitals
      .filter((v) => v.type === type)
      .sort((a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date))
      .slice(-14);

    if (typeVitals.length === 0) return;

    if (y > 250) { doc.addPage(); y = 20; }

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`${vitalLabels[type]} Trend (${vitalUnits[type] || ""})`, 20, y);
    y += 6;

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Date", 20, y);
    doc.text("Value", 80, y);
    doc.text("Notes", 120, y);
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, y, 190, y);
    y += 5;

    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    typeVitals.forEach((v) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const date = format(new Date(v.recorded_at || v.created_date), "MMM d, yyyy");
      const value = type === "blood_pressure" && v.secondary_value
        ? `${v.value}/${v.secondary_value}`
        : `${v.value} ${vitalUnits[type] || ""}`;
      doc.text(date, 20, y);
      doc.text(value, 80, y);
      doc.text(v.notes ? v.notes.substring(0, 50) : "", 120, y);
      y += 5;
    });
    y += 8;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("This report is for personal tracking purposes and does not constitute medical advice.", 20, 282);
  doc.text(`Health Me Medical Center — Generated ${format(new Date(), "MMM d, yyyy")}`, 20, 287);

  doc.save(`health-dashboard-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}