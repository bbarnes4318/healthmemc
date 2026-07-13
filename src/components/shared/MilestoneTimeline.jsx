import React from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Loader2, Calendar } from "lucide-react";

const statusConfig = {
  completed: { color: "text-emerald-600", bg: "bg-emerald-100", dot: "bg-emerald-500", label: "Completed" },
  upcoming: { color: "text-sky-600", bg: "bg-sky-100", dot: "bg-sky-500", label: "Upcoming" },
  overdue: { color: "text-red-600", bg: "bg-red-100", dot: "bg-red-500", label: "Overdue" },
  in_progress: { color: "text-amber-600", bg: "bg-amber-100", dot: "bg-amber-500", label: "In Progress" },
};

function formatDate(d) {
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return String(d); }
}

export default function MilestoneTimeline({ milestones, loading, emptyMessage, title, icon: TitleIcon }) {
  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!milestones || milestones.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{emptyMessage || "No milestones yet"}</p>
      </Card>
    );
  }

  const sorted = [...milestones].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <Card className="p-5">
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {TitleIcon && <TitleIcon className="w-4 h-4 text-muted-foreground" />}
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-xs text-muted-foreground ml-auto">{sorted.length} milestones</span>
        </div>
      )}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-200 via-sky-200 to-amber-200" />
        <div className="space-y-3">
          {sorted.map((m, i) => {
            const status = statusConfig[m.status] || statusConfig.completed;
            const Icon = m.icon || Calendar;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className="relative pl-10">
                <div className={`absolute left-2.5 top-1 w-3.5 h-3.5 rounded-full ${status.dot} border-2 border-white shadow-sm flex items-center justify-center`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                </div>
                <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition">
                  <div className="flex items-start gap-2">
                    <Icon className={`w-3.5 h-3.5 ${m.color || status.color} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold">{m.title}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${status.bg} ${status.color} font-medium`}>{status.label}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {formatDate(m.date)}
                        {m.daysFromNow != null && (
                          <span className={`ml-1 ${m.daysFromNow < 0 ? "text-red-500" : ""}`}>
                            {m.daysFromNow === 0 ? "· Today" : m.daysFromNow > 0 ? `· In ${m.daysFromNow} days` : `· ${Math.abs(m.daysFromNow)} days ago`}
                          </span>
                        )}
                      </p>
                      {m.description && <p className="text-[10px] text-muted-foreground italic mt-0.5">{m.description}</p>}
                      {m.tag && <p className="text-[9px] text-muted-foreground mt-0.5">{m.tag}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}