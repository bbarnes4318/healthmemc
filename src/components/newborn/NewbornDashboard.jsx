import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Milk, Moon, Droplets, Syringe, Sparkles, ChevronRight, Clock,
  Baby, TrendingUp, RefreshCw, Loader2, Activity, ChevronDown, ChevronUp
} from "lucide-react";
import { motion } from "framer-motion";
import NewbornSpecialistDirectory from "@/components/newborn/NewbornSpecialistDirectory";
import BabyGrowthChart from "@/components/newborn/BabyGrowthChart";
import BabyMilestoneTracker from "@/components/newborn/BabyMilestoneTracker";
import BabyMonthlyReportButton from "@/components/newborn/BabyMonthlyReportButton";
import QuickLogWidget from "@/components/newborn/QuickLogWidget";

function getTimestamp(log) {
  if (!log.date) return 0;
  const time = log.time || "00:00";
  return new Date(`${log.date}T${time}:00`).getTime();
}

export default function NewbornDashboard({ onNavigateTab }) {
  const [logs, setLogs] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGrowthChart, setShowGrowthChart] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  const now = Date.now();
  const cutoff = now - 24 * 60 * 60 * 1000;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logData, vax, miles, growthData] = await Promise.all([
        base44.entities.BabyDailyLog.list("-date", 500),
        base44.entities.BabyVaccine.list("-vaccine_date", 50),
        base44.entities.BabyMilestone.list("-milestone_date", 10),
        base44.entities.BabyGrowthLog.list("-measurement_date", 5),
      ]);
      setLogs(logData);
      setVaccines(vax);
      setMilestones(miles);
      setGrowth(growthData);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter to last 24 hours
  const last24 = logs.filter((l) => {
    const ts = getTimestamp(l);
    return ts >= cutoff && ts <= now;
  });

  const feedings = last24.filter((l) => l.log_type === "feeding");
  const sleeps = last24.filter((l) => l.log_type === "sleep");
  const diapers = last24.filter((l) => l.log_type === "diaper");
  const sleepTotal = sleeps.reduce((s, l) => s + (l.duration_minutes || 0), 0);
  const totalFeedMl = feedings.reduce((s, l) => s + (l.feeding_amount_ml || 0), 0);

  const today = new Date().toISOString().split("T")[0];
  const upcomingVaccines = vaccines.filter((v) => v.status !== "completed" && v.vaccine_date >= today);
  const nextVaccine = upcomingVaccines.sort((a, b) => new Date(a.vaccine_date) - new Date(b.vaccine_date))[0];
  const completedVaccines = vaccines.filter((v) => v.status === "completed").length;

  // Build a consolidated activity timeline from last 24h logs + recent milestones
  const allActivity = [
    ...last24.map((l) => ({
      id: l.id,
      type: l.log_type,
      timestamp: getTimestamp(l),
      label: l.log_type === "feeding"
        ? `${l.feeding_type || "Feeding"}${l.feeding_amount_ml ? ` · ${l.feeding_amount_ml}ml` : ""}${l.feeding_side ? ` · ${l.feeding_side}` : ""}`
        : l.log_type === "sleep"
          ? `${l.duration_minutes || 0} min${l.sleep_quality ? ` · ${l.sleep_quality}` : ""}`
          : `${l.diaper_type || "Change"}`,
      time: l.time,
      date: l.date,
    })),
    ...milestones
      .filter((m) => new Date(m.milestone_date).getTime() >= cutoff)
      .map((m) => ({
        id: m.id,
        type: "milestone",
        timestamp: new Date(m.milestone_date).getTime(),
        label: m.title || m.milestone_type,
        time: null,
        date: m.milestone_date,
      })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const summaryCards = [
    { icon: Milk, label: "Feedings (24h)", value: feedings.length, sub: totalFeedMl > 0 ? `${totalFeedMl}ml total` : null, color: "from-pink-500 to-rose-600", tab: "journal" },
    { icon: Moon, label: "Sleep (24h)", value: `${Math.floor(sleepTotal / 60)}h ${sleepTotal % 60}m`, sub: `${sleeps.length} session${sleeps.length !== 1 ? "s" : ""}`, color: "from-indigo-500 to-purple-600", tab: "journal" },
    { icon: Droplets, label: "Diapers (24h)", value: diapers.length, sub: diapers.length > 0 ? `${diapers.filter(d => d.diaper_type === "wet").length} wet` : null, color: "from-emerald-500 to-teal-600", tab: "journal" },
    { icon: Syringe, label: "Vaccines Done", value: `${completedVaccines}/${vaccines.length}`, sub: nextVaccine ? `Next: ${nextVaccine.vaccine_date}` : null, color: "from-cyan-500 to-blue-600", tab: "vaccines" },
  ];

  const activityIcon = { feeding: Milk, sleep: Moon, diaper: Droplets, milestone: Sparkles };
  const activityColor = { feeding: "#ec4899", sleep: "#6366f1", diaper: "#22c55e", milestone: "#a855f7" };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-br from-pink-500 to-rose-600 border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <Baby className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Consolidated Dashboard</h3>
              <p className="text-[10px] text-white/80">
                Last 24h: {new Date(cutoff).toLocaleDateString("en-US", { month: "short", day: "numeric" })} {new Date(cutoff).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                {" — "}
                {new Date(now).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BabyMonthlyReportButton />
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 h-8 w-8" onClick={load} title="Refresh">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => onNavigateTab?.(card.tab)}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-2`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-lg font-bold">{loading ? "—" : card.value}</p>
              <p className="text-[10px] text-muted-foreground">{card.label}</p>
              {card.sub && <p className="text-[9px] text-muted-foreground mt-0.5">{card.sub}</p>}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Next vaccine alert */}
      {nextVaccine && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-3 bg-cyan-50/50 border-cyan-200 cursor-pointer hover:shadow-md transition" onClick={() => onNavigateTab?.("vaccines")}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                <Syringe className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-cyan-800">Next Vaccine Due</p>
                <p className="text-xs font-bold">{nextVaccine.vaccine_name}</p>
                <p className="text-[9px] text-muted-foreground">{nextVaccine.vaccine_date}{nextVaccine.age_at_vaccination ? ` · ${nextVaccine.age_at_vaccination}` : ""}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Latest growth */}
      {growth.length > 0 && (
        <Card className="p-3 cursor-pointer hover:shadow-md transition" onClick={() => onNavigateTab?.("growth")}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-emerald-800">Latest Growth Measurement</p>
              <div className="flex items-center gap-3 mt-0.5">
                {growth[0].height_cm && <span className="text-xs font-medium">{growth[0].height_cm}cm</span>}
                {growth[0].weight_kg && <span className="text-xs font-medium">{growth[0].weight_kg}kg</span>}
                {growth[0].head_circumference_cm && <span className="text-xs font-medium">{growth[0].head_circumference_cm}cm head</span>}
                <span className="text-[9px] text-muted-foreground">{growth[0].measurement_date}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400" />
          </div>
        </Card>
      )}

      {/* Consolidated 24-hour activity timeline */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-pink-600" />
            <h3 className="font-semibold text-sm">Last 24 Hours — Activity Timeline</h3>
          </div>
          <button onClick={() => onNavigateTab?.("journal")} className="text-[10px] text-sky-600 hover:underline">
            Open journal
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-pink-600" /></div>
        ) : allActivity.length === 0 ? (
          <div className="text-center py-6">
            <Baby className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No activity logged in the last 24 hours</p>
            <Button size="sm" variant="outline" className="h-7 text-xs mt-2" onClick={() => onNavigateTab?.("journal")}>
              <Milk className="w-3 h-3 mr-1" /> Log a feeding
            </Button>
          </div>
        ) : (
          <div className="relative pl-5">
            <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-pink-300 via-indigo-300 to-emerald-300" />
            <div className="space-y-2">
              {allActivity.slice(0, 15).map((a, i) => {
                const Icon = activityIcon[a.type] || Activity;
                const color = activityColor[a.type] || "#64748b";
                const timeLabel = a.time
                  ? `${new Date(`${a.date}T${a.time}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
                  : new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="relative">
                    <div className="absolute -left-[14px] top-1 w-3 h-3 rounded-full ring-2 ring-white" style={{ backgroundColor: color }} />
                    <div className="flex items-center gap-2 py-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium capitalize truncate">
                          {a.type === "feeding" ? "Feeding" : a.type === "sleep" ? "Sleep" : a.type === "diaper" ? "Diaper" : "Milestone"}
                          <span className="text-muted-foreground font-normal"> · {a.label}</span>
                        </p>
                      </div>
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                        <Clock className="w-2.5 h-2.5" />{timeLabel}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Recent milestones summary */}
      {milestones.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-sm">Milestone Timeline</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowMilestones(!showMilestones)} className="text-[10px] text-sky-600 hover:underline flex items-center gap-0.5">
                {showMilestones ? "Hide" : "Expand"} {showMilestones ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button onClick={() => onNavigateTab?.("milestones")} className="text-[10px] text-sky-600 hover:underline">
                Open tab
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {milestones.slice(0, showMilestones ? 10 : 3).map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{m.title || m.milestone_type}</p>
                  <p className="text-[10px] text-muted-foreground">{m.milestone_date}{m.baby_age_weeks ? ` · ${m.baby_age_weeks}w old` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Growth Chart — embedded */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-sm">Growth Chart</h3>
          </div>
          <button onClick={() => setShowGrowthChart(!showGrowthChart)} className="text-[10px] text-sky-600 hover:underline flex items-center gap-0.5">
            {showGrowthChart ? "Hide" : "Show"} {showGrowthChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        {showGrowthChart && <BabyGrowthChart />}
      </div>

      {/* Shared Journal — recent entries */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Milk className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm">Shared Journal — Recent Entries</h3>
          </div>
          <button onClick={() => onNavigateTab?.("journal")} className="text-[10px] text-sky-600 hover:underline">
            Open journal
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>
        ) : last24.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground">No journal entries in the last 24 hours</p>
          </Card>
        ) : (
          <Card className="p-3">
            <div className="space-y-1.5">
              {last24.sort((a, b) => getTimestamp(b) - getTimestamp(a)).slice(0, showJournal ? 20 : 5).map((l) => {
                const Icon = activityIcon[l.log_type] || Activity;
                const color = activityColor[l.log_type] || "#64748b";
                return (
                  <div key={l.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-muted/20">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                      <Icon className="w-3 h-3" style={{ color }} />
                    </div>
                    <span className="text-xs capitalize flex-1 min-w-0 truncate">{l.log_type}</span>
                    {l.time && <span className="text-[9px] text-muted-foreground">{l.time}</span>}
                  </div>
                );
              })}
              {last24.length > 5 && (
                <button onClick={() => setShowJournal(!showJournal)} className="w-full text-center text-[10px] text-sky-600 hover:underline py-1">
                  {showJournal ? "Show less" : `Show ${last24.length - 5} more`}
                </button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Specialist Directory */}
      <NewbornSpecialistDirectory />

      {/* Floating Quick-Log Widget */}
      <QuickLogWidget onLogged={load} />
    </div>
  );
}