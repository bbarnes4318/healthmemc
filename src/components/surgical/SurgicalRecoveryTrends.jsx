import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, Activity, Award, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot, Legend, Scatter, ComposedChart,
} from "recharts";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const woundStatusOrder = {
  fully_healed: 0, clean_healing: 1, redness: 2, swelling: 3, discharge: 4, dehiscence: 5, infection: 6,
};
const woundLabels = {
  fully_healed: "Fully Healed", clean_healing: "Clean & Healing", redness: "Redness",
  swelling: "Swelling", discharge: "Discharge", dehiscence: "Wound Opening", infection: "Infection",
};
const mobilityOrder = {
  bedridden: 0, limited_assistance: 1, with_walker: 2, independent_limited: 3, fully_mobile: 4,
};
const mobilityLabels = {
  bedridden: "Bedridden", limited_assistance: "Limited", with_walker: "Walker",
  independent_limited: "Independent", fully_mobile: "Fully Mobile",
};

export default function SurgicalRecoveryTrends() {
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
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-rose-600" /></div>;
  }

  if (logs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No recovery data yet</p>
        <p className="text-xs text-muted-foreground mt-1">Log your first recovery entry to see your healing trends visualized here.</p>
      </Card>
    );
  }

  // Sort all entries chronologically
  const allEntries = [...logs].sort((a, b) => new Date(a.log_date) - new Date(b.log_date));

  // Combined chart data for pain + wound + mobility
  const chartData = allEntries.map((e) => ({
    date: format(new Date(e.log_date), "MMM d"),
    fullDate: format(new Date(e.log_date), "MMM d, yyyy"),
    day: e.days_post_op,
    pain: e.pain_level,
    wound: woundStatusOrder[e.wound_status] ?? 1,
    mobility: mobilityOrder[e.mobility_level] ?? 1,
    woundLabel: woundLabels[e.wound_status] || e.wound_status,
    mobilityLabel: mobilityLabels[e.mobility_level] || e.mobility_level,
    surgery: e.surgery_name,
    milestones: e.milestones_reached || [],
  }));

  // Milestone scatter points
  const milestonePoints = [];
  allEntries.forEach((e) => {
    (e.milestones_reached || []).forEach((ms) => {
      milestonePoints.push({
        date: format(new Date(e.log_date), "MMM d"),
        pain: e.pain_level,
        milestone: ms,
        surgery: e.surgery_name,
      });
    });
  });

  // All unique milestones
  const allMilestones = [...new Set(logs.flatMap((l) => l.milestones_reached || []))];

  // Stats
  const latest = allEntries[allEntries.length - 1];
  const first = allEntries[0];
  const painChange = allEntries.length >= 2 ? latest.pain_level - first.pain_level : 0;
  const totalDays = latest.days_post_op != null ? latest.days_post_op : differenceInDays(new Date(latest.log_date), new Date(first.log_date));

  const stats = [
    { label: "Entries Logged", value: logs.length, icon: Calendar, color: "text-sky-600", bg: "bg-sky-100" },
    { label: "Days Tracked", value: totalDays, icon: Activity, color: "text-violet-600", bg: "bg-violet-100" },
    { label: "Pain Change", value: painChange === 0 ? "Stable" : painChange > 0 ? `+${painChange}` : `${painChange}`, icon: TrendingDown, color: painChange > 0 ? "text-red-600" : painChange < 0 ? "text-emerald-600" : "text-muted-foreground", bg: "bg-muted" },
    { label: "Milestones", value: allMilestones.length, icon: Award, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
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

      {/* Pain Level Trend with Milestone Markers */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-600" /> Pain Level Trend
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Daily pain score with milestone markers (purple dots)</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value, name) => {
                if (name === "Pain Level") return [`${value}/10`, "Pain"];
                return [value, name];
              }}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.date === label);
                if (!item) return label;
                let s = `${item.fullDate}`;
                if (item.day != null) s += ` · Day ${item.day} post-op`;
                if (item.milestones?.length > 0) s += ` — Milestones: ${item.milestones.join(", ")}`;
                return s;
              }}
            />
            <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Moderate", fontSize: 9, fill: "#f59e0b" }} />
            <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Severe", fontSize: 9, fill: "#ef4444" }} />
            <Line type="monotone" dataKey="pain" name="Pain Level" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
            {milestonePoints.map((mp, idx) => (
              <ReferenceDot key={idx} x={mp.date} y={mp.pain} r={5} fill="#8b5cf6" stroke="#fff" strokeWidth={1.5} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Wound Status + Mobility Progression */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-1">Wound Status Progression</h3>
          <p className="text-xs text-muted-foreground mb-4">Healing status over time (lower = better)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis domain={[0, 6]} ticks={[0, 1, 2, 3, 4, 5, 6]} tickFormatter={(v) => woundLabels[Object.keys(woundStatusOrder).find((k) => woundStatusOrder[k] === v)] || ""} tick={{ fontSize: 8 }} width={70} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value, name, props) => [props?.payload?.woundLabel || "", "Wound Status"]}
              />
              <Line type="stepAfter" dataKey="wound" name="Wound Status" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-1">Mobility Progression</h3>
          <p className="text-xs text-muted-foreground mb-4">Mobility level over time (higher = better)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tickFormatter={(v) => mobilityLabels[Object.keys(mobilityOrder).find((k) => mobilityOrder[k] === v)] || ""} tick={{ fontSize: 8 }} width={70} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value, name, props) => [props?.payload?.mobilityLabel || "", "Mobility"]}
              />
              <Line type="stepAfter" dataKey="mobility" name="Mobility" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Milestone Timeline */}
      {milestonePoints.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-semibold">Healing Milestone Timeline</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">When each milestone was achieved during recovery</p>
          <div className="space-y-2">
            {milestonePoints.map((mp, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{mp.milestone}</p>
                  <p className="text-[10px] text-muted-foreground">{mp.date} · {mp.surgery} · Pain at time: {mp.pain}/10</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">{mp.date}</Badge>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}