import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, Award, Activity, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot, Legend, Scatter,
} from "recharts";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const woundStatusOrder = {
  clean_healing: 1, redness: 2, swelling: 3, discharge: 4, dehiscence: 5, infection: 6, fully_healed: 0,
};
const woundLabels = {
  clean_healing: "Clean & Healing", redness: "Redness", swelling: "Swelling",
  discharge: "Discharge", dehiscence: "Wound Opening", infection: "Infection", fully_healed: "Fully Healed",
};
const mobilityOrder = {
  bedridden: 0, limited_assistance: 1, with_walker: 2, independent_limited: 3, fully_mobile: 4,
};
const mobilityLabels = {
  bedridden: "Bedridden", limited_assistance: "Limited", with_walker: "Walker",
  independent_limited: "Independent", fully_mobile: "Fully Mobile",
};

export default function SurgicalRecoveryDashboard() {
  const { currentMemberId } = useFamilyMember();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.SurgicalRecovery.list("-log_date", 200);
        const filtered = currentMemberId ? data.filter((l) => l.family_member_id === currentMemberId) : data;
        setLogs(filtered);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-rose-600" /></div>;
  }

  if (logs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No recovery data yet</p>
        <p className="text-xs text-muted-foreground mt-1">Log your first recovery entry to see your healing progress visualized here.</p>
      </Card>
    );
  }

  // Group by surgery
  const surgeries = {};
  logs.forEach((l) => {
    const key = l.surgery_name;
    if (!surgeries[key]) surgeries[key] = { name: l.surgery_name, surgeryDate: l.surgery_date, entries: [] };
    surgeries[key].entries.push(l);
  });

  const surgeryList = Object.values(surgeries).sort((a, b) => new Date(b.surgeryDate) - new Date(a.surgeryDate));

  // Overall stats
  const allEntries = [...logs].sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
  const latest = allEntries[allEntries.length - 1];
  const first = allEntries[0];
  const totalDays = latest.days_post_op != null ? latest.days_post_op : differenceInDays(new Date(latest.log_date), new Date(first.log_date));
  const painTrend = allEntries.length >= 2 ? latest.pain_level - first.pain_level : 0;
  const allMilestones = [...new Set(logs.flatMap((l) => l.milestones_reached || []))];

  const stats = [
    { label: "Days Tracked", value: totalDays, icon: Calendar, color: "text-sky-600", bg: "bg-sky-100" },
    { label: "Current Pain", value: `${latest.pain_level}/10`, icon: Activity, color: latest.pain_level >= 7 ? "text-red-600" : latest.pain_level >= 4 ? "text-amber-600" : "text-emerald-600", bg: "bg-muted" },
    { label: "Pain Change", value: painTrend === 0 ? "Stable" : painTrend > 0 ? `+${painTrend}` : `${painTrend}`, icon: TrendingDown, color: painTrend > 0 ? "text-red-600" : painTrend < 0 ? "text-emerald-600" : "text-muted-foreground", bg: "bg-muted" },
    { label: "Milestones", value: allMilestones.length, icon: Award, color: "text-violet-600", bg: "bg-violet-100" },
  ];

  return (
    <div className="space-y-5">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Per-surgery charts */}
      {surgeryList.map((surgery) => {
        const entries = surgery.entries.sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
        const chartData = entries.map((e) => ({
          date: format(new Date(e.log_date), "MMM d"),
          day: e.days_post_op,
          pain: e.pain_level,
          wound: woundStatusOrder[e.wound_status] ?? 1,
          mobility: mobilityOrder[e.mobility_level] ?? 1,
          woundLabel: woundLabels[e.wound_status] || e.wound_status,
          mobilityLabel: mobilityLabels[e.mobility_level] || e.mobility_level,
          milestones: e.milestones_reached || [],
        }));

        // Milestone scatter points
        const milestonePoints = [];
        entries.forEach((e) => {
          (e.milestones_reached || []).forEach((ms) => {
            milestonePoints.push({
              date: format(new Date(e.log_date), "MMM d"),
              pain: e.pain_level,
              milestone: ms,
            });
          });
        });

        const surgeryMilestones = [...new Set(entries.flatMap((e) => e.milestones_reached || []))];

        return (
          <motion.div key={surgery.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm">{surgery.name}</h3>
                <Badge variant="outline" className="text-[10px]">
                  {format(new Date(surgery.surgeryDate), "MMM d, yyyy")} · Day {entries[entries.length - 1].days_post_op ?? 0} post-op
                </Badge>
              </div>

              {/* Pain + Milestones combined chart */}
              <p className="text-xs text-muted-foreground mb-3">Pain level trend with milestone markers</p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value, name, props) => {
                      if (name === "Pain Level") return [`${value}/10`, "Pain"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => {
                      const item = chartData.find((d) => d.date === label);
                      if (item?.milestones?.length > 0) return `${label} — Milestones: ${item.milestones.join(", ")}`;
                      return label;
                    }}
                  />
                  <ReferenceLine yAxisId="left" y={5} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Moderate", fontSize: 9, fill: "#f59e0b" }} />
                  <ReferenceLine yAxisId="left" y={7} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Severe", fontSize: 9, fill: "#ef4444" }} />
                  <Line yAxisId="left" type="monotone" dataKey="pain" name="Pain Level" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
                  {/* Milestone markers */}
                  {milestonePoints.map((mp, idx) => (
                    <ReferenceDot
                      key={idx}
                      yAxisId="left"
                      x={mp.date}
                      y={mp.pain}
                      r={5}
                      fill="#8b5cf6"
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              {/* Wound status + Mobility progression */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Wound Status Progression</p>
                  <div className="space-y-1.5">
                    {entries.map((e, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-16 shrink-0">{format(new Date(e.log_date), "MMM d")}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          e.wound_status === "fully_healed" ? "bg-emerald-100 text-emerald-700" :
                          e.wound_status === "infection" || e.wound_status === "dehiscence" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {woundLabels[e.wound_status] || e.wound_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Mobility Progression</p>
                  <div className="space-y-1.5">
                    {entries.map((e, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-16 shrink-0">{format(new Date(e.log_date), "MMM d")}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-100 text-sky-700">
                          {mobilityLabels[e.mobility_level] || e.mobility_level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Milestones achieved */}
              {surgeryMilestones.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-3.5 h-3.5 text-violet-600" />
                    <p className="text-xs font-medium">Healing Milestones ({surgeryMilestones.length})</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {surgeryMilestones.map((ms, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 flex items-center gap-1">
                        <Award className="w-2.5 h-2.5" /> {ms}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}