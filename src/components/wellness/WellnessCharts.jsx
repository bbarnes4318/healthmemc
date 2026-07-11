import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, Activity } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const vitalColors = {
  heart_rate: "#ef4444",
  blood_pressure: "#f97316",
  blood_glucose: "#8b5cf6",
  weight: "#10b981",
  sleep_hours: "#6366f1",
  oxygen_saturation: "#3b82f6",
  activity_minutes: "#14b8a6",
  temperature: "#f59e0b",
};

export default function WellnessCharts() {
  const [vitals, setVitals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [v, p] = await Promise.all([
          base44.entities.VitalRecord.list("-recorded_at", 100),
          base44.entities.HealthProfile.filter({}),
        ]);
        setVitals(v);
        if (p.length > 0) setProfile(p[0]);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentVitals = vitals.filter((v) => new Date(v.recorded_at) >= thirtyDaysAgo);

  if (recentVitals.length === 0) return null;

  const byDate = {};
  recentVitals.forEach((v) => {
    const dateKey = new Date(v.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey };
    byDate[dateKey][v.type] = v.value;
  });
  const chartData = Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date));

  const scoreData = chartData.map((d) => {
    let score = 0, count = 0;
    if (d.heart_rate) { score += d.heart_rate >= 60 && d.heart_rate <= 100 ? 100 : 60; count++; }
    if (d.blood_pressure) { score += d.blood_pressure <= 120 ? 100 : 70; count++; }
    if (d.oxygen_saturation) { score += d.oxygen_saturation >= 95 ? 100 : 70; count++; }
    if (d.sleep_hours) { score += d.sleep_hours >= 7 && d.sleep_hours <= 9 ? 100 : 60; count++; }
    if (d.activity_minutes) { score += d.activity_minutes >= 30 ? 100 : 60; count++; }
    return { date: d.date, score: count > 0 ? Math.round(score / count) : null };
  }).filter((d) => d.score !== null);

  const healthScore = profile?.health_score || 78;
  const improving = scoreData.length > 1 && scoreData[scoreData.length - 1].score > scoreData[0].score;
  const vitalTypes = [...new Set(recentVitals.map((v) => v.type))];

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium">Health Score</span>
          </div>
          <p className="text-4xl font-display font-bold text-emerald-600">{healthScore}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {improving ? `↑ Up from ${scoreData[0].score} this month` : "Keep tracking your vitals!"}
          </p>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-medium mb-3">Wellness Score Trend (30 days)</h3>
          {scoreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={scoreData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No wellness score data yet</p>
          )}
        </Card>
      </div>

      {vitalTypes.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-medium">Vital Trends (30 days)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              {vitalTypes.map((type) => (
                <Line key={type} type="monotone" dataKey={type} stroke={vitalColors[type] || "#64748b"} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3">
            {vitalTypes.map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: vitalColors[type] || "#64748b" }} />
                <span className="text-xs text-muted-foreground capitalize">{type.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}