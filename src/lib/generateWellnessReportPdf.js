import { jsPDF } from "jspdf";
import { format } from "date-fns";

export function generateWellnessReportPdf(chartData, range, healthScore) {
  const doc = new jsPDF();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("Health Me Medical Center", 20, y);
  y += 8;
  doc.setFontSize(13);
  doc.setTextColor(100, 116, 139);
  doc.text(`Wellness Trends Report — ${range === "weekly" ? "Last 7 Days" : "Last 30 Days"}`, 20, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`, 20, y);
  y += 10;

  doc.setDrawColor(226, 232, 240);
  doc.line(20, y, 190, y);
  y += 10;

  // Summary Stats
  const validDays = chartData.filter((d) => d.wellnessScore !== null);
  const avgScore = validDays.length > 0
    ? Math.round(validDays.reduce((s, d) => s + d.wellnessScore, 0) / validDays.length)
    : 0;
  const totalWater = chartData.reduce((s, d) => s + d.waterCups, 0);
  const totalExercise = chartData.reduce((s, d) => s + d.exerciseMin, 0);
  const totalCalories = chartData.reduce((s, d) => s + d.calories, 0);
  const daysWithNutrition = chartData.filter((d) => d.calories > 0).length;
  const avgCalories = daysWithNutrition > 0 ? Math.round(totalCalories / daysWithNutrition) : 0;
  const avgSleep = validDays.length > 0
    ? (chartData.filter((d) => d.sleepHours > 0).reduce((s, d) => s + d.sleepHours, 0) / Math.max(chartData.filter((d) => d.sleepHours > 0).length, 1)).toFixed(1)
    : "0";

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Summary", 20, y);
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  const stats = [
    `Average Wellness Score: ${avgScore}/100${healthScore ? ` (Current Health Score: ${healthScore})` : ""}`,
    `Total Water Intake: ${totalWater} cups`,
    `Total Exercise: ${totalExercise} minutes`,
    `Average Daily Calories: ${avgCalories} kcal`,
    `Average Sleep: ${avgSleep} hours/night`,
    `Days with Nutrition Logs: ${daysWithNutrition}`,
  ];
  stats.forEach((s) => { doc.text(`  • ${s}`, 20, y); y += 6; });
  y += 6;

  // Daily Breakdown Table
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Daily Breakdown", 20, y);
  y += 7;

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Date", 20, y);
  doc.text("Score", 55, y);
  doc.text("Water", 75, y);
  doc.text("Calories", 100, y);
  doc.text("Exercise", 130, y);
  doc.text("Sleep", 160, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, y, 190, y);
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  chartData.forEach((d) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(d.date, 20, y);
    doc.text(d.wellnessScore != null ? `${d.wellnessScore}` : "—", 55, y);
    doc.text(`${d.waterCups}`, 75, y);
    doc.text(`${d.calories}`, 100, y);
    doc.text(`${d.exerciseMin}m`, 130, y);
    doc.text(d.sleepHours > 0 ? `${d.sleepHours}h` : "—", 160, y);
    y += 5;
  });
  y += 8;

  // Nutrition Impact Analysis
  if (daysWithNutrition > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Nutrition Impact on Wellness", 20, y);
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    const nutritionDays = chartData.filter((d) => d.calories > 0 && d.wellnessScore !== null);
    if (nutritionDays.length > 0) {
      const avgCalNutritionDays = Math.round(nutritionDays.reduce((s, d) => s + d.calories, 0) / nutritionDays.length);
      const avgScoreNutritionDays = Math.round(nutritionDays.reduce((s, d) => s + d.wellnessScore, 0) / nutritionDays.length);
      const nonNutritionDays = chartData.filter((d) => d.calories === 0 && d.wellnessScore !== null);
      const avgScoreNonNutrition = nonNutritionDays.length > 0
        ? Math.round(nonNutritionDays.reduce((s, d) => s + d.wellnessScore, 0) / nonNutritionDays.length)
        : null;

      doc.text(`Average calories on logged days: ${avgCalNutritionDays} kcal`, 20, y); y += 5;
      doc.text(`Average wellness score on nutrition-logged days: ${avgScoreNutritionDays}/100`, 20, y); y += 5;
      if (avgScoreNonNutrition !== null) {
        doc.text(`Average wellness score on non-logged days: ${avgScoreNonNutrition}/100`, 20, y); y += 5;
        const diff = avgScoreNutritionDays - avgScoreNonNutrition;
        doc.text(`Impact: ${diff >= 0 ? "+" : ""}${diff} points when nutrition is tracked`, 20, y); y += 5;
      }
    }
    y += 6;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("This report is for personal tracking purposes and does not constitute medical advice.", 20, 282);
  doc.text(`Health Me Medical Center — Generated ${format(new Date(), "MMM d, yyyy")}`, 20, 287);

  doc.save(`wellness-trends-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}