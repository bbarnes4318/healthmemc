import { jsPDF } from "jspdf";
import { format } from "date-fns";

const WHO_WEIGHT_3RD_PCT = {
  0: 2.5, 1: 3.4, 2: 4.4, 3: 5.0, 4: 5.6, 5: 6.0, 6: 6.4,
  9: 7.1, 12: 7.7, 18: 8.8, 24: 9.7,
};

function getExpectedWeight(ageMonths) {
  const keys = Object.keys(WHO_WEIGHT_3RD_PCT).map(Number).sort((a, b) => a - b);
  let lower = 0, upper = keys[keys.length - 1];
  for (const k of keys) {
    if (k <= ageMonths) lower = k;
    if (k >= ageMonths) { upper = k; break; }
  }
  if (lower === upper) return WHO_WEIGHT_3RD_PCT[lower];
  const t = (ageMonths - lower) / (upper - lower);
  return WHO_WEIGHT_3RD_PCT[lower] + t * (WHO_WEIGHT_3RD_PCT[upper] - WHO_WEIGHT_3RD_PCT[lower]);
}

export function generateNewbornMonthlyPdf(data) {
  const { feedings, sleeps, diapers, milestones, growthLogs, babyName, monthLabel } = data;
  const doc = new jsPDF();
  let y = 20;
  const pageWidth = 190;
  const left = 20;

  // Header
  doc.setFillColor(236, 72, 153);
  doc.rect(0, 0, 210, 28, "F");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Health Me Medical Center", left, 14);
  doc.setFontSize(11);
  doc.text(`Newborn Care Monthly Report`, left, 22);
  y = 38;

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`${babyName ? babyName + " — " : ""}${monthLabel}`, left, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`, left, y);
  y += 4;
  doc.text("Prepared for your pediatrician", left, y);
  y += 8;

  doc.setDrawColor(226, 232, 240);
  doc.line(left, y, left + pageWidth, y);
  y += 10;

  // Feeding Summary
  doc.setFontSize(12);
  doc.setTextColor(236, 72, 153);
  doc.text("Feeding Summary", left, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const feedTotal = feedings.length;
  const feedBreast = feedings.filter(f => f.feeding_type === "breast").length;
  const feedBottle = feedings.filter(f => f.feeding_type?.startsWith("bottle")).length;
  const feedSolid = feedings.filter(f => f.feeding_type === "solid").length;
  const totalMl = feedings.reduce((s, f) => s + (f.feeding_amount_ml || 0), 0);
  const avgPerDay = feedTotal / 30;
  doc.text(`Total feedings this month: ${feedTotal} (avg ${avgPerDay.toFixed(1)}/day)`, left, y); y += 5;
  doc.text(`Breast: ${feedBreast}  |  Bottle: ${feedBottle}  |  Solid: ${feedSolid}`, left, y); y += 5;
  if (totalMl > 0) { doc.text(`Total volume (bottle/solid): ${totalMl} ml`, left, y); y += 5; }
  y += 4;

  // Sleep Summary
  doc.setFontSize(12);
  doc.setTextColor(99, 102, 241);
  doc.text("Sleep Summary", left, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const sleepTotal = sleeps.reduce((s, sl) => s + (sl.duration_minutes || 0), 0);
  const sleepHours = Math.floor(sleepTotal / 60);
  const sleepMins = sleepTotal % 60;
  const goodNights = sleeps.filter(s => s.sleep_quality === "good").length;
  const restlessNights = sleeps.filter(s => s.sleep_quality === "restless").length;
  const poorNights = sleeps.filter(s => s.sleep_quality === "poor").length;
  doc.text(`Total sleep: ${sleepHours}h ${sleepMins}m across ${sleeps.length} sessions`, left, y); y += 5;
  doc.text(`Quality: ${goodNights} good, ${restlessNights} restless, ${poorNights} poor`, left, y); y += 5;
  const avgSleep = sleeps.length > 0 ? Math.round(sleepTotal / sleeps.length) : 0;
  doc.text(`Average per session: ${avgSleep} min`, left, y); y += 5;
  y += 4;

  // Diaper Summary
  doc.setFontSize(12);
  doc.setTextColor(34, 197, 94);
  doc.text("Diaper Summary", left, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const wetCount = diapers.filter(d => d.diaper_type === "wet" || d.diaper_type === "both").length;
  const dirtyCount = diapers.filter(d => d.diaper_type === "dirty" || d.diaper_type === "both").length;
  doc.text(`Total changes: ${diapers.length} (avg ${(diapers.length / 30).toFixed(1)}/day)`, left, y); y += 5;
  doc.text(`Wet: ${wetCount}  |  Dirty: ${dirtyCount}`, left, y); y += 5;
  y += 4;

  // Growth Summary
  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129);
  doc.text("Growth Summary", left, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  if (growthLogs.length === 0) {
    doc.text("No growth measurements recorded this month.", left, y); y += 5;
  } else {
    const sorted = [...growthLogs].sort((a, b) => new Date(a.measurement_date) - new Date(b.measurement_date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (first.height_cm && last.height_cm) {
      doc.text(`Height: ${first.height_cm}cm → ${last.height_cm}cm (+${(last.height_cm - first.height_cm).toFixed(1)}cm)`, left, y); y += 5;
    } else if (last.height_cm) {
      doc.text(`Latest height: ${last.height_cm}cm`, left, y); y += 5;
    }
    if (first.weight_kg && last.weight_kg) {
      doc.text(`Weight: ${first.weight_kg}kg → ${last.weight_kg}kg (+${(last.weight_kg - first.weight_kg).toFixed(2)}kg)`, left, y); y += 5;
    } else if (last.weight_kg) {
      doc.text(`Latest weight: ${last.weight_kg}kg`, left, y); y += 5;
    }
    if (first.head_circumference_cm && last.head_circumference_cm) {
      doc.text(`Head circ: ${first.head_circumference_cm}cm → ${last.head_circumference_cm}cm (+${(last.head_circumference_cm - first.head_circumference_cm).toFixed(1)}cm)`, left, y); y += 5;
    } else if (last.head_circumference_cm) {
      doc.text(`Latest head circ: ${last.head_circumference_cm}cm`, left, y); y += 5;
    }
    // Growth concern check
    if (last.age_months != null && last.weight_kg != null) {
      const expected = getExpectedWeight(last.age_months);
      if (last.weight_kg < expected) {
        doc.setTextColor(220, 38, 38);
        doc.text(`Note: Weight (${last.weight_kg}kg) is below the 3rd percentile for ${last.age_months} months (expected min: ${expected}kg).`, left, y); y += 5;
        doc.setTextColor(51, 65, 85);
      }
    }
  }
  y += 4;

  // Milestones
  doc.setFontSize(12);
  doc.setTextColor(168, 85, 247);
  doc.text("Milestones Achieved", left, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  if (milestones.length === 0) {
    doc.text("No milestones recorded this month.", left, y); y += 5;
  } else {
    const sorted = [...milestones].sort((a, b) => new Date(a.milestone_date) - new Date(b.milestone_date));
    for (const m of sorted) {
      if (y > 270) { doc.addPage(); y = 20; }
      const label = m.title || m.milestone_type;
      const ageLabel = m.baby_age_weeks ? ` (${m.baby_age_weeks}w old)` : "";
      doc.text(`• ${m.milestone_date} — ${label}${ageLabel}`, left, y); y += 5;
      if (m.description) {
        const lines = doc.splitTextToSize(m.description, pageWidth - 10);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        for (const line of lines.slice(0, 2)) {
          doc.text(`    ${line}`, left, y); y += 4;
        }
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
      }
    }
  }
  y += 6;

  // Footer
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setDrawColor(226, 232, 240);
  doc.line(left, y, left + pageWidth, y);
  y += 7;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("This report is generated from data logged in the Health Me Medical Center app.", left, y);
  y += 4;
  doc.text("It is for informational purposes and does not replace professional medical advice.", left, y);

  doc.save(`newborn-monthly-report-${format(new Date(), "yyyy-MM")}.pdf`);
}