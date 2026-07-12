import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, addMonths, subMonths, isSameDay, isToday } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { TrendingDown, TrendingUp, Minus, Brain, Moon, Heart, ChevronLeft, ChevronRight, Calendar, BarChart3, LineChart as LineIcon } from "lucide-react";

const moodEmojis = { 5: "😄", 4: "🙂", 3: "😐", 2: "😔", 1: "😢" };
const scoreColors = {
  5: "bg-emerald-500", 4: "bg-lime-500", 3: "bg-amber-500", 2: "bg-orange-500", 1: "bg-red-500", 0: "bg-muted",
};

export default function MoodTrendChart({ entries }) {
  const [view, setView] = useState("line");
  const [heatmapMonth, setHeatmapMonth] = useState(new Date());
  const [heatmapMetric, setHeatmapMetric] = useState("mood");

  const chartData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29);
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    const entryMap = {};
    entries.forEach((e) => { if (e.date) entryMap[e.date] = e; });
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const entry = entryMap[dateStr];
      return {
        date: format(day, "MMM d"),
        mood: entry?.mood_score ?? null,
        stress: entry?.stress_score ?? null,
        sleep: entry?.sleep_score ?? null,
      };
    });
  }, [entries]);

  const averages = useMemo(() => {
    const valid = entries.filter((e) => e.date);
    if (valid.length === 0) return { mood: 0, stress: 0, sleep: 0, count: 0 };
    return {
      mood: valid.reduce((s, e) => s + (e.mood_score || 0), 0) / valid.length,
      stress: valid.reduce((s, e) => s + (e.stress_score || 0), 0) / valid.length,
      sleep: valid.reduce((s, e) => s + (e.sleep_score || 0), 0) / valid.length,
      count: valid.length,
    };
  }, [entries]);

  const stressTrend = useMemo(() => {
    if (chartData.length < 2) return "flat";
    const recent = chartData.slice(-7).filter((d) => d.stress !== null);
    const older = chartData.slice(-14, -7).filter((d) => d.stress !== null);
    if (recent.length === 0 || older.length === 0) return "flat";
    const recentAvg = recent.reduce((s, d) => s + d.stress, 0) / recent.length;
    const olderAvg = older.reduce((s, d) => s + d.stress, 0) / older.length;
    if (recentAvg < olderAvg - 0.3) return "down";
    if (recentAvg > olderAvg + 0.3) return "up";
    return "flat";
  }, [chartData]);

  // Monthly summary data for bar chart
  const monthlySummary = useMemo(() => {
    const months = {};
    entries.forEach((e) => {
      if (!e.date) return;
      const monthKey = e.date.slice(0, 7);
      if (!months[monthKey]) months[monthKey] = { label: format(new Date(monthKey + "-01"), "MMM yyyy"), mood: [], stress: [], sleep: [] };
      months[monthKey].mood.push(e.mood_score || 0);
      months[monthKey].stress.push(e.stress_score || 0);
      months[monthKey].sleep.push(e.sleep_score || 0);
    });
    return Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).map(([_, val]) => ({
      label: val.label,
      mood: val.mood.length ? (val.mood.reduce((s, v) => s + v, 0) / val.mood.length).toFixed(1) : 0,
      stress: val.stress.length ? (val.stress.reduce((s, v) => s + v, 0) / val.stress.length).toFixed(1) : 0,
      sleep: val.sleep.length ? (val.sleep.reduce((s, v) => s + v, 0) / val.sleep.length).toFixed(1) : 0,
    }));
  }, [entries]);

  // Heatmap data
  const heatmapData = useMemo(() => {
    const entryMap = {};
    entries.forEach((e) => { if (e.date) entryMap[e.date] = e; });
    const monthStart = startOfMonth(heatmapMonth);
    const monthEnd = endOfMonth(heatmapMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calStart, end: calEnd });
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const entry = entryMap[dateStr];
      const score = entry ? (entry[`${heatmapMetric}_score`] || 0) : 0;
      return { day, dateStr, score, hasEntry: !!entry, isCurrentMonth: isSameMonth(day, heatmapMonth) };
    });
  }, [entries, heatmapMonth, heatmapMetric]);

  const TrendIcon = stressTrend === "down" ? TrendingDown : stressTrend === "up" ? TrendingUp : Minus;
  const trendColor = stressTrend === "down" ? "text-emerald-600" : stressTrend === "up" ? "text-red-500" : "text-muted-foreground";
  const trendLabel = stressTrend === "down" ? "Improving" : stressTrend === "up" ? "Worsening" : "Stable";

  const metricLabels = { mood: "Mood", stress: "Stress", sleep: "Sleep" };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-violet-600" />
          Well-being Trends
        </h4>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${trendColor}`}>
            <TrendIcon className="w-3 h-3" /> {trendLabel}
          </span>
          {/* View Toggle */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            <button onClick={() => setView("line")} className={`p-1 rounded ${view === "line" ? "bg-white shadow-sm" : ""}`} title="Line Chart">
              <LineIcon className="w-3 h-3" />
            </button>
            <button onClick={() => setView("heatmap")} className={`p-1 rounded ${view === "heatmap" ? "bg-white shadow-sm" : ""}`} title="Calendar Heatmap">
              <Calendar className="w-3 h-3" />
            </button>
            <button onClick={() => setView("summary")} className={`p-1 rounded ${view === "summary" ? "bg-white shadow-sm" : ""}`} title="Monthly Summary">
              <BarChart3 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Average Score Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-rose-50">
          <Heart className="w-3.5 h-3.5 text-rose-500 mx-auto mb-0.5" />
          <p className="text-[10px] text-muted-foreground">Avg Mood</p>
          <p className="text-sm font-bold text-rose-600">{averages.mood.toFixed(1)}/5</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-orange-50">
          <Brain className="w-3.5 h-3.5 text-orange-500 mx-auto mb-0.5" />
          <p className="text-[10px] text-muted-foreground">Avg Stress</p>
          <p className="text-sm font-bold text-orange-600">{averages.stress.toFixed(1)}/5</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-indigo-50">
          <Moon className="w-3.5 h-3.5 text-indigo-500 mx-auto mb-0.5" />
          <p className="text-[10px] text-muted-foreground">Avg Sleep</p>
          <p className="text-sm font-bold text-indigo-600">{averages.sleep.toFixed(1)}/5</p>
        </div>
      </div>

      {/* Line Chart View */}
      {view === "line" && (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={4} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }} labelStyle={{ fontSize: 10, fontWeight: 600 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="mood" stroke="hsl(349, 73%, 56%)" strokeWidth={2} dot={{ r: 2 }} name="Mood" connectNulls />
              <Line type="monotone" dataKey="stress" stroke="hsl(25, 95%, 53%)" strokeWidth={2} dot={{ r: 2 }} name="Stress" connectNulls />
              <Line type="monotone" dataKey="sleep" stroke="hsl(258, 58%, 58%)" strokeWidth={2} dot={{ r: 2 }} name="Sleep" connectNulls />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">30-day trend · {averages.count} {averages.count === 1 ? "entry" : "entries"}</p>
        </>
      )}

      {/* Calendar Heatmap View */}
      {view === "heatmap" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setHeatmapMonth(subMonths(heatmapMonth, 1))}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-semibold min-w-[80px] text-center">{format(heatmapMonth, "MMMM yyyy")}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setHeatmapMonth(addMonths(heatmapMonth, 1))}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
            {/* Metric selector */}
            <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
              {Object.entries(metricLabels).map(([key, label]) => (
                <button key={key} onClick={() => setHeatmapMetric(key)}
                  className={`text-[10px] px-2 py-0.5 rounded ${heatmapMetric === key ? "bg-white shadow-sm font-semibold" : "text-muted-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-[9px] text-center text-muted-foreground font-medium py-0.5">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {heatmapData.map((cell, i) => (
              <div key={i} className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-medium ${cell.hasEntry ? scoreColors[cell.score] || "bg-muted" : "bg-muted/30"} ${!cell.isCurrentMonth ? "opacity-30" : ""} ${isToday(cell.day) ? "ring-1 ring-violet-400" : ""} ${cell.hasEntry && cell.score > 0 ? "text-white" : "text-muted-foreground"}`}>
                {cell.hasEntry ? (heatmapMetric === "mood" ? moodEmojis[cell.score] || "·" : cell.score) : format(cell.day, "d")}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-[9px] text-muted-foreground">Low</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`w-4 h-4 rounded ${scoreColors[s]}`} />
            ))}
            <span className="text-[9px] text-muted-foreground">High</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">{metricLabels[heatmapMetric]} heatmap · {format(heatmapMonth, "MMMM yyyy")}</p>
        </div>
      )}

      {/* Monthly Summary Bar Chart */}
      {view === "summary" && (
        <>
          {monthlySummary.length === 0 ? (
            <div className="py-8 text-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Not enough data for monthly summary yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlySummary} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }} labelStyle={{ fontSize: 10, fontWeight: 600 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="mood" fill="hsl(349, 73%, 56%)" radius={[3, 3, 0, 0]} name="Mood" />
                  <Bar dataKey="stress" fill="hsl(25, 95%, 53%)" radius={[3, 3, 0, 0]} name="Stress" />
                  <Bar dataKey="sleep" fill="hsl(258, 58%, 58%)" radius={[3, 3, 0, 0]} name="Sleep" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">Monthly average scores by metric</p>
            </>
          )}
        </>
      )}
    </Card>
  );
}