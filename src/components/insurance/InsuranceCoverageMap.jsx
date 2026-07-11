import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck, AlertTriangle, XCircle, HelpCircle, Calendar, Map as MapIcon } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const STATUS_CONFIG = {
  likely_covered: {
    bg: "bg-emerald-50",
    border: "border-l-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    icon: ShieldCheck,
    iconColor: "text-emerald-600",
    label: "Likely Covered",
  },
  may_require_authorization: {
    bg: "bg-amber-50",
    border: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-700",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    label: "Needs Authorization",
  },
  likely_not_covered: {
    bg: "bg-red-50",
    border: "border-l-red-500",
    badge: "bg-red-100 text-red-700",
    icon: XCircle,
    iconColor: "text-red-600",
    label: "Likely Not Covered",
  },
  unknown: {
    bg: "bg-gray-50",
    border: "border-l-gray-400",
    badge: "bg-gray-100 text-gray-600",
    icon: HelpCircle,
    iconColor: "text-gray-500",
    label: "Unknown",
  },
};

function getCoverageInfo(apptType, planType) {
  if (["checkup", "screening", "vaccination"].includes(apptType)) {
    return { status: "likely_covered", reason: "Preventive care covered under most plans", estCost: "$0–25" };
  }
  if (apptType === "follow_up") {
    return { status: "likely_covered", reason: "Follow-up visits typically covered", estCost: "$10–30" };
  }
  if (apptType === "ai_consultation") {
    return { status: "may_require_authorization", reason: "Telehealth coverage varies by plan", estCost: "$0–40" };
  }
  if (apptType === "specialist") {
    const specialistRules = {
      hmo: { status: "may_require_authorization", reason: "HMO plans typically require a referral", estCost: "$30–60" },
      ppo: { status: "likely_covered", reason: "PPO covers specialists without referral", estCost: "$30–50" },
      epo: { status: "likely_covered", reason: "EPO covers in-network specialists", estCost: "$30–50" },
      pos: { status: "may_require_authorization", reason: "POS may require referral for specialists", estCost: "$30–60" },
      medicare: { status: "likely_covered", reason: "Covered if provider accepts assignment", estCost: "$0–20" },
      medicaid: { status: "likely_covered", reason: "Specialist visits covered with referral", estCost: "$0–10" },
      other: { status: "may_require_authorization", reason: "Check with your provider for specialist coverage", estCost: "Varies" },
    };
    return specialistRules[planType] || specialistRules.other;
  }
  return { status: "unknown", reason: "Coverage depends on your specific plan", estCost: "Varies" };
}

export default function InsuranceCoverageMap({ insuranceCard }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.Appointment.list("-date", 20);
        setAppointments(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (!insuranceCard) {
    return (
      <Card className="p-6 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <MapIcon className="w-4 h-4 text-sky-600" />
          <h3 className="font-semibold text-sm">Insurance Coverage Map</h3>
        </div>
        <p className="text-xs text-muted-foreground">Add an insurance card above to see coverage eligibility for your procedures.</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
      </div>
    );
  }

  const now = new Date();
  const recent = appointments.filter((a) => new Date(a.date) < now).slice(0, 5);
  const upcoming = appointments.filter((a) => new Date(a.date) >= now).slice(0, 5);
  const allProcedures = [...upcoming, ...recent];

  if (allProcedures.length === 0) {
    return (
      <Card className="p-6 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <MapIcon className="w-4 h-4 text-sky-600" />
          <h3 className="font-semibold text-sm">Insurance Coverage Map</h3>
        </div>
        <p className="text-xs text-muted-foreground">No procedures to display. Schedule appointments to see coverage eligibility.</p>
      </Card>
    );
  }

  const proceduresWithCoverage = allProcedures.map((appt) => {
    const coverage = getCoverageInfo(appt.type, insuranceCard.plan_type);
    return { ...appt, coverage, isUpcoming: new Date(appt.date) >= now };
  });

  const counts = proceduresWithCoverage.reduce((acc, p) => {
    acc[p.coverage.status] = (acc[p.coverage.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card className="p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-sky-600" />
          <h3 className="font-semibold text-sm">Insurance Coverage Map</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {insuranceCard.provider_name} · {insuranceCard.plan_type?.toUpperCase()}
        </span>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = counts[key] || 0;
          if (count === 0) return null;
          return (
            <div key={key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.badge}`}>
              <config.icon className="w-3 h-3" />
              {count} {config.label}
            </div>
          );
        })}
      </div>

      {/* Procedure cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {proceduresWithCoverage.map((proc, i) => {
          const config = STATUS_CONFIG[proc.coverage.status];
          return (
            <motion.div
              key={proc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i }}
              className={`p-3 rounded-lg border-l-4 ${config.bg} ${config.border} border-y border-r border-border`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{proc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {format(new Date(proc.date), "MMM d, yyyy")}
                    </span>
                    {proc.isUpcoming ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">Upcoming</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Recent</span>
                    )}
                  </div>
                </div>
                <config.icon className={`w-4 h-4 shrink-0 ${config.iconColor}`} />
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
                  {config.label}
                </span>
                <span className="text-[10px] text-muted-foreground">Est. {proc.coverage.estCost}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 italic">{proc.coverage.reason}</p>
            </motion.div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground mt-4 italic">
        Coverage estimates are based on your plan type ({insuranceCard.plan_type?.toUpperCase()}) and procedure type. Always verify with your insurance provider before booking.
      </p>
    </Card>
  );
}