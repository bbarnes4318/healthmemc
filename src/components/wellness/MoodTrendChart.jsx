import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingDown, TrendingUp, Minus, Brain, Moon, Heart } from "lucide-react";

export default function MoodTrendChart({ entries }) {
  const chartData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29);
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });

    const entryMap = {};
    entries.forEach((e) => {
      if (e.date) entryMap[e.date] = e;
    });

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
    const mood = valid.reduce((s, e) => s + (e.mood_score || 0), 0) / valid.length;
    const stress = valid.reduce((s, e) => s + (e.stress_score || 0), 0) / valid.length;
    const sleep = valid.reduce((s, e) => s + (e.sleep_score || 0), 0) / valid.length;
    return { mood, stress, sleep, count: valid.length };
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

  const TrendIcon = stressTrend === "down" ? TrendingDown : stressTrend === "up" ? TrendingUp : Minus;
  const trendColor = stressTrend === "down" ? "text-emerald-600" : stressTrend === "up" ? "text-red-500" : "text-muted-foreground";
  const trendLabel = stressTrend === "down" ? "Improving" : stressTrend === "up" ? "Worsening" : "Stable";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-violet-600" />
          30-Day Well-being Trends
        </h4>
        <span className={`text-[10px] font-medium flex items-center gap-0.5 ${trendColor}`}>
          <TrendIcon className="w-3 h-3" /> {trendLabel}
        </span>
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

      {/* Line Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={4} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
            labelStyle={{ fontSize: 10, fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="mood" stroke="hsl(349, 73%, 56%)" strokeWidth={2} dot={{ r: 2 }} name="Mood" connectNulls />
          <Line type="monotone" dataKey="stress" stroke="hsl(25, 95%, 53%)" strokeWidth={2} dot={{ r: 2 }} name="Stress" connectNulls />
          <Line type="monotone" dataKey="sleep" stroke="hsl(258, 58%, 58%)" strokeWidth={2} dot={{ r: 2 }} name="Sleep" connectNulls />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        Tracking {averages.count} {averages.count === 1 ? "entry" : "entries"} this period
      </p>
    </Card>
  );
}