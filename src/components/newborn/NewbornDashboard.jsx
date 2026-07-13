import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Milk, Moon, Droplets, Syringe, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import NewbornSpecialistDirectory from "@/components/newborn/NewbornSpecialistDirectory";

export default function NewbornDashboard({ onNavigateTab }) {
  const [todayLogs, setTodayLogs] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const load = useCallback(async () => {
    try {
      const [logs, vax, miles] = await Promise.all([
        base44.entities.BabyDailyLog.list("-date", 200),
        base44.entities.BabyVaccine.list("-vaccine_date", 50),
        base44.entities.BabyMilestone.list("-milestone_date", 5),
      ]);
      setTodayLogs(logs.filter((l) => l.date === today));
      setVaccines(vax);
      setMilestones(miles);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const feedings = todayLogs.filter((l) => l.log_type === "feeding");
  const sleeps = todayLogs.filter((l) => l.log_type === "sleep");
  const diapers = todayLogs.filter((l) => l.log_type === "diaper");
  const sleepTotal = sleeps.reduce((s, l) => s + (l.duration_minutes || 0), 0);

  const upcomingVaccines = vaccines.filter((v) => v.status !== "completed" && v.vaccine_date >= today);
  const nextVaccine = upcomingVaccines.sort((a, b) => new Date(a.vaccine_date) - new Date(b.vaccine_date))[0];
  const completedVaccines = vaccines.filter((v) => v.status === "completed").length;

  const summaryCards = [
    { icon: Milk, label: "Feedings Today", value: feedings.length, color: "from-pink-500 to-rose-600", tab: "journal" },
    { icon: Moon, label: "Sleep Today", value: `${Math.floor(sleepTotal / 60)}h ${sleepTotal % 60}m`, color: "from-indigo-500 to-purple-600", tab: "journal" },
    { icon: Droplets, label: "Diapers Today", value: diapers.length, color: "from-emerald-500 to-teal-600", tab: "journal" },
    { icon: Syringe, label: "Vaccines Done", value: `${completedVaccines}/${vaccines.length}`, color: "from-cyan-500 to-blue-600", tab: "vaccines" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card
              className="p-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => onNavigateTab?.(card.tab)}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-2`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-lg font-bold">{loading ? "—" : card.value}</p>
              <p className="text-[10px] text-muted-foreground">{card.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Next vaccine alert */}
      {nextVaccine && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="p-4 bg-cyan-50/50 border-cyan-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                <Syringe className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-cyan-800">Next Vaccine Due</p>
                <p className="text-sm font-bold">{nextVaccine.vaccine_name}</p>
                <p className="text-[10px] text-muted-foreground">{nextVaccine.vaccine_date}{nextVaccine.age_at_vaccination ? ` · ${nextVaccine.age_at_vaccination}` : ""}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recent milestones */}
      {milestones.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-sm">Recent Milestones</h3>
            </div>
            <button onClick={() => onNavigateTab?.("milestones")} className="text-[10px] text-sky-600 hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-2">
            {milestones.slice(0, 3).map((m) => (
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

      {/* Specialist Directory */}
      <NewbornSpecialistDirectory />
    </div>
  );
}