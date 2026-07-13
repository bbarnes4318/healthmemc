import { jsPDF } from "jspdf";

const bodyPartLabels = {
  knee: "Knee", shoulder: "Shoulder", hip: "Hip", spine: "Spine",
  ankle: "Ankle", wrist: "Wrist", neck: "Neck", full_body: "Full Body", other: "Other",
};

export function generateMonthlyProgressPdf(data) {
  const { user, exercises, surgicalLogs, medications, medicationLogs, memberName } = data;
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const m = 20;
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

  const addSectionTitle = (title) => {
    y += 6;
    ensureSpace(16);
    doc.setDrawColor(234, 88, 12);
    doc.setLineWidth(0.5);
    doc.line(m, y - 2, pageW - m, y - 2);
    addText(title, 13, "bold", [234, 88, 12]);
    y += 2;
  };

  // Header banner
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Health Me Medical Center", m, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Monthly Health Progress Report", m, 28);
  doc.setFontSize(9);
  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  doc.text(`Report Period: ${monthLabel}`, pageW - m, 28, { align: "right" });
  y = 55;

  // Patient info
  addSectionTitle("Report Summary");
  addText(`Patient: ${memberName || user?.full_name || "N/A"}`, 10, "normal", [40, 40, 40]);
  addText(`Generated: ${now.toLocaleString()}`, 10, "normal", [80, 80, 80]);
  addText(`Report Type: Comprehensive Monthly Progress (PT, Medication Adherence, Pain Trends)`, 9, "italic", [100, 100, 100]);
  y += 4;

  // === PT MILESTONES ===
  const allMilestones = [];
  surgicalLogs.forEach((s) => {
    if (s.milestones_reached?.length > 0) {
      s.milestones_reached.forEach((ms) => {
        allMilestones.push({ milestone: ms, surgery: s.surgery_name, date: s.log_date, daysPostOp: s.days_post_op });
      });
    }
  });

  addSectionTitle(`PT Milestones (${allMilestones.length} reached)`);
  if (allMilestones.length === 0) {
    addText("No milestones recorded this period.", 9, "italic", [120, 120, 120]);
  } else {
    allMilestones.forEach((ms, i) => {
      ensureSpace(12);
      addText(`${i + 1}. ${ms.milestone}`, 10, "bold", [40, 40, 40]);
      addText(`   Surgery: ${ms.surgery}  |  Date: ${ms.date || "N/A"}  |  Days Post-Op: ${ms.daysPostOp || "N/A"}`, 9, "normal", [80, 80, 80]);
      y += 1;
    });
  }
  y += 4;

  // === PAIN TREND CHART ===
  const painByDate = {};
  exercises.forEach((e) => {
    if (e.pain_level != null && e.date) {
      if (!painByDate[e.date] || new Date(e.date) >= new Date(painByDate[e.date].date)) {
        painByDate[e.date] = e;
      }
    }
  });
  const painEntries = Object.values(painByDate).sort((a, b) => new Date(a.date) - new Date(b.date));

  addSectionTitle("Pain Trend Chart");
  if (painEntries.length === 0) {
    addText("No pain data recorded this period.", 9, "italic", [120, 120, 120]);
  } else {
    addText(`Pain levels tracked across ${painEntries.length} sessions (scale 0-10):`, 9, "normal", [80, 80, 80]);
    y += 4;
    drawPainChart(doc, painEntries, m, y, maxW);
    y += 55;

    // Pain summary stats
    const painValues = painEntries.map((e) => e.pain_level);
    const avgPain = (painValues.reduce((a, b) => a + b, 0) / painValues.length).toFixed(1);
    const maxPain = Math.max(...painValues);
    const minPain = Math.min(...painValues);
    const firstPain = painValues[0];
    const lastPain = painValues[painValues.length - 1];
    const trend = lastPain < firstPain ? "Improving (decreasing)" : lastPain > firstPain ? "Worsening (increasing)" : "Stable";

    addText(`Average Pain: ${avgPain}/10  |  Peak: ${maxPain}  |  Lowest: ${minPain}  |  Trend: ${trend}`, 10, "bold", [40, 40, 40]);
    y += 4;
  }
  y += 4;

  // === ROM TREND ===
  const romByDate = {};
  exercises.forEach((e) => {
    if (e.rom_degrees != null && e.date) {
      if (!romByDate[e.date] || new Date(e.date) >= new Date(romByDate[e.date].date)) {
        romByDate[e.date] = e;
      }
    }
  });
  const romEntries = Object.values(romByDate).sort((a, b) => new Date(a.date) - new Date(b.date));

  addSectionTitle("Range of Motion (ROM) Trend");
  if (romEntries.length === 0) {
    addText("No ROM data recorded this period.", 9, "italic", [120, 120, 120]);
  } else {
    addText(`ROM tracked across ${romEntries.length} sessions (degrees):`, 9, "normal", [80, 80, 80]);
    y += 4;
    drawRomChart(doc, romEntries, m, y, maxW);
    y += 55;

    const romValues = romEntries.map((e) => e.rom_degrees);
    const avgRom = Math.round(romValues.reduce((a, b) => a + b, 0) / romValues.length);
    const maxRom = Math.max(...romValues);
    const firstRom = romValues[0];
    const lastRom = romValues[romValues.length - 1];
    const romTrend = lastRom > firstRom ? "Improving (increasing)" : lastRom < firstRom ? "Declining (decreasing)" : "Stable";

    addText(`Average ROM: ${avgRom}°  |  Best: ${maxRom}°  |  Trend: ${romTrend}`, 10, "bold", [40, 40, 40]);
    y += 4;
  }
  y += 4;

  // === MEDICATION ADHERENCE ===
  addSectionTitle("Medication Adherence Summary");
  if (medicationLogs.length === 0) {
    addText("No medication logs recorded this period.", 9, "italic", [120, 120, 120]);
  } else {
    const byMed = {};
    medicationLogs.forEach((log) => {
      const name = log.medication_name || "Unknown";
      if (!byMed[name]) byMed[name] = [];
      byMed[name].push(log);
    });

    // Overall stats
    const totalTaken = medicationLogs.filter((l) => l.status === "taken").length;
    const totalMissed = medicationLogs.filter((l) => l.status === "missed").length;
    const totalSkipped = medicationLogs.filter((l) => l.status === "skipped").length;
    const totalScheduled = medicationLogs.length;
    const overallAdherence = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 0;

    addText(`Overall Adherence Rate: ${overallAdherence}%  (${totalTaken} taken / ${totalScheduled} total)`, 11, "bold", [40, 40, 40]);
    addText(`Missed: ${totalMissed}  |  Skipped: ${totalSkipped}`, 9, "normal", [80, 80, 80]);
    y += 4;

    // Per-medication breakdown
    addText("Per-Medication Breakdown:", 10, "bold", [60, 60, 60]);
    y += 2;
    Object.keys(byMed).forEach((name) => {
      const logs = byMed[name];
      const taken = logs.filter((l) => l.status === "taken").length;
      const adherence = logs.length > 0 ? Math.round((taken / logs.length) * 100) : 0;
      const bar = makeAdherenceBar(adherence);
      ensureSpace(10);
      addText(`${name}: ${adherence}% (${taken}/${logs.length}) ${bar}`, 9, "normal", [60, 60, 60]);
      y += 1;
    });

    y += 4;
    // Adherence bar chart
    addText("Adherence Trend (last 30 days):", 10, "bold", [60, 60, 60]);
    y += 4;
    drawAdherenceChart(doc, medicationLogs, m, y, maxW);
    y += 55;
  }
  y += 4;

  // === EXERCISE LOG SUMMARY ===
  addSectionTitle(`Exercise Sessions (${exercises.length} logged)`);
  if (exercises.length === 0) {
    addText("No exercise sessions recorded this period.", 9, "italic", [120, 120, 120]);
  } else {
    const byBodyPart = {};
    exercises.forEach((e) => {
      const part = e.body_part || "other";
      if (!byBodyPart[part]) byBodyPart[part] = { count: 0, totalDuration: 0, painSum: 0, painCount: 0 };
      byBodyPart[part].count++;
      byBodyPart[part].totalDuration += e.duration_minutes || 0;
      if (e.pain_level != null) { byBodyPart[part].painSum += e.pain_level; byBodyPart[part].painCount++; }
    });

    Object.entries(byBodyPart).forEach(([part, stats]) => {
      const avgPain = stats.painCount > 0 ? (stats.painSum / stats.painCount).toFixed(1) : "N/A";
      ensureSpace(10);
      addText(`${bodyPartLabels[part] || part}: ${stats.count} sessions  |  ${stats.totalDuration} min total  |  Avg pain: ${avgPain}`, 9, "normal", [60, 60, 60]);
      y += 1;
    });
  }
  y += 6;

  // === RECOMMENDATIONS ===
  addSectionTitle("AI-Generated Recommendations");
  const recs = [];
  if (painEntries.length > 0) {
    const avgPain = painEntries.reduce((a, b) => a + b.pain_level, 0) / painEntries.length;
    if (avgPain > 5) recs.push("Pain levels are elevated — consider scheduling a follow-up with your physical therapist.");
    else if (avgPain < 3) recs.push("Pain levels are well-controlled — continue your current exercise regimen.");
  }
  if (romEntries.length > 0) {
    const lastRom = romEntries[romEntries.length - 1].rom_degrees;
    const firstRom = romEntries[0].rom_degrees;
    if (lastRom > firstRom) recs.push("ROM is improving — gradually increase exercise intensity as tolerated.");
    else if (lastRom < firstRom) recs.push("ROM has decreased — consult your PT about adjusting your exercise plan.");
  }
  if (medicationLogs.length > 0) {
    const adherence = medicationLogs.filter((l) => l.status === "taken").length / medicationLogs.length;
    if (adherence < 0.8) recs.push("Medication adherence is below 80% — set up daily reminders to stay on track.");
  }
  if (exercises.length < 10) recs.push("Exercise frequency is low — aim for at least 3-4 PT sessions per week for optimal recovery.");
  if (recs.length === 0) recs.push("Great progress! Continue your current health routine and maintain consistent tracking.");

  recs.forEach((rec, i) => {
    ensureSpace(10);
    addText(`  ${i + 1}. ${rec}`, 9, "normal", [60, 60, 60]);
    y += 1;
  });

  // Footer
  y += 8;
  ensureSpace(20);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, y, pageW - m, y);
  y += 6;
  addText("This monthly progress report was generated by Health Me Medical Center. It consolidates your PT exercise logs, medication adherence, and pain/ROM trends. This document is intended for sharing with your healthcare providers and is not a substitute for professional medical advice.", 8, "italic", [120, 120, 120]);

  const patientName = (memberName || user?.full_name || "Patient").replace(/[^a-z0-9]/gi, "-").toLowerCase();
  doc.save(`Monthly-Progress-${patientName}-${now.toISOString().split("T")[0]}.pdf`);
}

function drawPainChart(doc, entries, x, startY, chartW) {
  const chartH = 42;
  const padding = 8;
  const plotX = x + padding;
  const plotY = startY + 6;
  const plotW = chartW - padding * 2;
  const plotH = chartH - 10;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(plotX, plotY, plotW, plotH, 2, 2, "F");

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("10", plotX - 2, plotY + 3, { align: "right" });
  doc.text("5", plotX - 2, plotY + plotH / 2, { align: "right" });
  doc.text("0", plotX - 2, plotY + plotH, { align: "right" });

  // Grid lines
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.line(plotX, plotY + plotH / 2, plotX + plotW, plotY + plotH / 2);

  if (entries.length > 0) {
    doc.text(new Date(entries[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), plotX + 2, plotY + plotH + 5);
    doc.text(new Date(entries[entries.length - 1].date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), plotX + plotW - 2, plotY + plotH + 5, { align: "right" });
  }

  // Pain line (red)
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(0.7);
  const points = entries.map((e, i) => {
    const px = plotX + (entries.length === 1 ? plotW / 2 : (i / (entries.length - 1)) * plotW);
    const py = plotY + plotH - (e.pain_level / 10) * plotH;
    return { x: px, y: py };
  });
  for (let i = 1; i < points.length; i++) {
    doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }
  points.forEach((p) => {
    doc.setFillColor(239, 68, 68);
    doc.circle(p.x, p.y, 0.8, "F");
  });
}

function drawRomChart(doc, entries, x, startY, chartW) {
  const chartH = 42;
  const padding = 8;
  const plotX = x + padding;
  const plotY = startY + 6;
  const plotW = chartW - padding * 2;
  const plotH = chartH - 10;

  const values = entries.map((e) => e.rom_degrees);
  const maxVal = Math.max(...values, 180);
  const minVal = Math.min(...values, 0);
  const valRange = maxVal - minVal || 1;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(plotX, plotY, plotW, plotH, 2, 2, "F");

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(String(Math.round(maxVal)) + "°", plotX - 2, plotY + 3, { align: "right" });
  doc.text(String(Math.round(minVal)) + "°", plotX - 2, plotY + plotH, { align: "right" });

  if (entries.length > 0) {
    doc.text(new Date(entries[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), plotX + 2, plotY + plotH + 5);
    doc.text(new Date(entries[entries.length - 1].date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), plotX + plotW - 2, plotY + plotH + 5, { align: "right" });
  }

  // ROM line (blue)
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.7);
  const points = entries.map((e, i) => {
    const px = plotX + (entries.length === 1 ? plotW / 2 : (i / (entries.length - 1)) * plotW);
    const py = plotY + plotH - ((e.rom_degrees - minVal) / valRange) * plotH;
    return { x: px, y: py };
  });
  for (let i = 1; i < points.length; i++) {
    doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }
  points.forEach((p) => {
    doc.setFillColor(59, 130, 246);
    doc.circle(p.x, p.y, 0.8, "F");
  });
}

function drawAdherenceChart(doc, logs, x, startY, chartW) {
  const chartH = 42;
  const padding = 8;
  const plotX = x + padding;
  const plotY = startY + 6;
  const plotW = chartW - padding * 2;
  const plotH = chartH - 10;

  // Group by date
  const byDate = {};
  logs.forEach((l) => {
    if (!l.scheduled_date) return;
    if (!byDate[l.scheduled_date]) byDate[l.scheduled_date] = { taken: 0, total: 0 };
    byDate[l.scheduled_date].total++;
    if (l.status === "taken") byDate[l.scheduled_date].taken++;
  });

  const dates = Object.keys(byDate).sort((a, b) => new Date(a) - new Date(b));
  if (dates.length === 0) return;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(plotX, plotY, plotW, plotH, 2, 2, "F");

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text("100%", plotX - 2, plotY + 3, { align: "right" });
  doc.text("50%", plotX - 2, plotY + plotH / 2, { align: "right" });
  doc.text("0%", plotX - 2, plotY + plotH, { align: "right" });

  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.line(plotX, plotY + plotH / 2, plotX + plotW, plotY + plotH / 2);

  doc.text(new Date(dates[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" }), plotX + 2, plotY + plotH + 5);
  doc.text(new Date(dates[dates.length - 1]).toLocaleDateString("en-US", { month: "short", day: "numeric" }), plotX + plotW - 2, plotY + plotH + 5, { align: "right" });

  // Bar chart
  const barW = Math.max(1, Math.min(4, plotW / dates.length - 1));
  dates.forEach((d, i) => {
    const data = byDate[d];
    const adherence = data.total > 0 ? data.taken / data.total : 0;
    const barH = adherence * plotH;
    const bx = plotX + (dates.length === 1 ? plotW / 2 - barW / 2 : (i / (dates.length - 1)) * plotW - barW / 2);
    const by = plotY + plotH - barH;
    doc.setFillColor(adherence >= 0.8 ? 34 : adherence >= 0.5 ? 245 : 239, adherence >= 0.8 ? 197 : adherence >= 0.5 ? 158 : 68, adherence >= 0.8 ? 94 : adherence >= 0.5 ? 11 : 68);
    doc.rect(bx, by, barW, barH, "F");
  });
}

function makeAdherenceBar(pct) {
  const filled = Math.round(pct / 10);
  return "[" + "█".repeat(filled) + "░".repeat(10 - filled) + "]";
}