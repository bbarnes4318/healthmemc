import { jsPDF } from "jspdf";
import { format } from "date-fns";

const vitalLabels = {
  heart_rate: "Heart Rate", blood_pressure: "Blood Pressure", oxygen_saturation: "Oxygen (SpO2)",
  blood_glucose: "Blood Glucose", weight: "Weight", sleep_hours: "Sleep",
  activity_minutes: "Activity", temperature: "Temperature", steps: "Steps",
};
const vitalUnits = {
  heart_rate: "bpm", blood_pressure: "mmHg", oxygen_saturation: "%",
  blood_glucose: "mg/dL", weight: "kg", sleep_hours: "hrs",
  activity_minutes: "min", temperature: "°F", steps: "steps",
};
const severityLabels = { mild: "Mild", moderate: "Moderate", severe: "Severe" };

export function generateComprehensiveHealthPdf({ vitals, painLogs, medications, healthScore, memberName }) {
    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text("Health Me Medical Center", 20, y);
    y += 8;
    doc.setFontSize(13);
    doc.setTextColor(100, 116, 139);
    doc.text("Comprehensive Health Report", 20, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Patient: ${memberName || "Self"}`, 20, y);
    y += 5;
    doc.text(`Generated: ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`, 20, y);
    y += 8;

    doc.setDrawColor(226, 232, 240);
    doc.line(20, y, 190, y);
    y += 10;

    const checkPage = () => {
      if (y > 270) { doc.addPage(); y = 20; }
    };

    // Section 1: Vitals Summary
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Latest Vitals", 20, y);
    y += 7;

    const latestByType = {};
    vitals.forEach((v) => {
      if (!latestByType[v.type] || new Date(v.recorded_at || v.created_date) > new Date(latestByType[v.type].recorded_at || latestByType[v.type].created_date)) {
        latestByType[v.type] = v;
      }
    });

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    if (healthScore) {
      doc.text(`  Health Score: ${healthScore}/100`, 20, y);
      y += 6;
    }
    Object.keys(vitalLabels).forEach((type) => {
      if (latestByType[type]) {
        checkPage();
        const v = latestByType[type];
        const value = type === "blood_pressure" && v.secondary_value ? `${v.value}/${v.secondary_value}` : v.value;
        const date = format(new Date(v.recorded_at || v.created_date), "MMM d, yyyy");
        doc.text(`  ${vitalLabels[type]}: ${value} ${vitalUnits[type] || ""}  (${date})`, 20, y);
        y += 6;
      }
    });
    y += 6;

    // Vitals Trend Table (last 14 readings per type)
    Object.keys(vitalLabels).forEach((type) => {
      const typeVitals = vitals
        .filter((v) => v.type === type)
        .sort((a, b) => new Date(a.recorded_at || a.created_date) - new Date(b.recorded_at || b.created_date))
        .slice(-10);

      if (typeVitals.length === 0) return;
      checkPage();

      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`${vitalLabels[type]} Trend`, 20, y);
      y += 5;
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Date", 20, y);
      doc.text("Value", 80, y);
      doc.text("Notes", 120, y);
      y += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y, 190, y);
      y += 4;

      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      typeVitals.forEach((v) => {
        checkPage();
        const date = format(new Date(v.recorded_at || v.created_date), "MMM d, yyyy");
        const value = type === "blood_pressure" && v.secondary_value ? `${v.value}/${v.secondary_value} ${vitalUnits[type] || ""}` : `${v.value} ${vitalUnits[type] || ""}`;
        doc.text(date, 20, y);
        doc.text(value, 80, y);
        doc.text(v.notes ? v.notes.substring(0, 50) : "", 120, y);
        y += 5;
      });
      y += 6;
    });

    // Section 2: Pain Logs
    checkPage();
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Pain & Symptom Log", 20, y);
    y += 7;

    if (painLogs.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("  No pain logs recorded.", 20, y);
      y += 8;
    } else {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Date", 20, y);
      doc.text("Region", 55, y);
      doc.text("Severity", 100, y);
      doc.text("Pain Type", 130, y);
      y += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y, 190, y);
      y += 4;

      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      painLogs.slice(0, 30).forEach((p) => {
        checkPage();
        const date = p.logged_at ? format(new Date(p.logged_at), "MMM d, yyyy") : "—";
        doc.text(date, 20, y);
        doc.text((p.body_region || "—").substring(0, 18), 55, y);
        doc.text(severityLabels[p.severity] || p.severity || "—", 100, y);
        doc.text((p.pain_type || "—").substring(0, 20), 130, y);
        y += 5;
      });
      y += 6;
    }

    // Section 3: Medication History
    checkPage();
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Medication History", 20, y);
    y += 7;

    if (medications.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("  No medications on record.", 20, y);
      y += 8;
    } else {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Medication", 20, y);
      doc.text("Dosage", 80, y);
      doc.text("Frequency", 115, y);
      doc.text("Status", 150, y);
      y += 3;
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y, 190, y);
      y += 4;

      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      medications.forEach((m) => {
        checkPage();
        doc.text((m.name || "—").substring(0, 28), 20, y);
        doc.text((m.dosage || "—").substring(0, 18), 80, y);
        doc.text((m.frequency || "—").substring(0, 18), 115, y);
        doc.text(m.active ? "Active" : "Inactive", 150, y);
        y += 5;
        if (m.start_date || m.prescribing_provider) {
          checkPage();
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          const detail = [
            m.start_date ? `Started: ${format(new Date(m.start_date), "MMM d, yyyy")}` : null,
            m.prescribing_provider ? `Rx: ${m.prescribing_provider}` : null,
            m.end_date ? `Ended: ${format(new Date(m.end_date), "MMM d, yyyy")}` : null,
          ].filter(Boolean).join("   ");
          doc.text(detail, 25, y);
          y += 4;
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
        }
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("This report is for personal tracking and does not constitute medical advice.", 20, 287);
      doc.text(`Health Me Medical Center — Page ${i} of ${pageCount}`, 20, 292);
    }

    doc.save(`health-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}