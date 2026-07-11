import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { Loader2, Users, Pill, Calendar, TrendingUp, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronUp, Bell } from "lucide-react";
import RefillAlertBanner from "@/components/pharmacy/RefillAlertBanner";
import AlertConfigPanel from "@/components/caregiver/AlertConfigPanel";
import CaregiverVisitLog from "@/components/caregiver/CaregiverVisitLog";
import ActivityFeed from "@/components/caregiver/ActivityFeed";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";

const vitalLabels = {
  heart_rate: "Heart Rate",
  blood_pressure: "Blood Pressure",
  oxygen_saturation: "Oxygen Sat.",
  blood_glucose: "Blood Glucose",
  weight: "Weight",
  sleep_hours: "Sleep",
  activity_minutes: "Activity",
  temperature: "Temperature",
};

function MemberCard({ member, isSelf, alwaysExpanded }) {
  const [expanded, setExpanded] = useState(alwaysExpanded || false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const filter = isSelf ? {} : { family_member_id: member.id };
        const [meds, logs, appts, vitals] = await Promise.all([
          base44.entities.Medication.filter({ ...filter, active: true }),
          base44.entities.MedicationLog.filter(filter),
          base44.entities.Appointment.filter({ ...filter, status: "scheduled" }, "-date", 5),
          isSelf
            ? base44.entities.VitalRecord.list("-recorded_at", 20)
            : base44.entities.VitalRecord.filter({ family_member_id: member.id }, "-recorded_at", 20),
        ]);

        const today = format(new Date(), "yyyy-MM-dd");
        const last7 = Array.from({ length: 7 }).map((_, i) => {
          const d = subDays(new Date(), 6 - i);
          const dayLogs = logs.filter((l) => l.scheduled_date === format(d, "yyyy-MM-dd"));
          return {
            day: format(d, "EEE"),
            taken: dayLogs.filter((l) => l.status === "taken").length,
            missed: dayLogs.filter((l) => l.status === "missed").length,
          };
        });
        const totalTaken = last7.reduce((s, d) => s + d.taken, 0);
        const totalExpected = (meds.length || 1) * 7;
        const adherence = Math.round((totalTaken / totalExpected) * 100);

        const upcomingAppts = appts.filter((a) => new Date(a.date) >= new Date());

        setData({ meds, logs, appts: upcomingAppts, vitals, adherence, last7 });
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [member, isSelf]);

  const name = isSelf ? "You" : member.name;
  const photo = isSelf ? null : member.photo_url;
  const relationship = isSelf ? "Self" : member.relationship;

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading {name}'s data...</span>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const { meds, appts, vitals, adherence, last7 } = data;
  const missedCount = last7.reduce((s, d) => s + d.missed, 0);

  const latestVitals = {};
  vitals.forEach((v) => {
    if (!latestVitals[v.type]) latestVitals[v.type] = v;
  });

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        {photo ? (
          <img src={photo} alt={name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{name}</p>
            <Badge variant="outline" className="text-[10px] capitalize">{relationship}</Badge>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground">{meds.length} meds</span>
            <span className="text-xs text-muted-foreground">{appts.length} upcoming</span>
            {missedCount > 0 && <span className="text-xs text-red-500 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" />{missedCount} missed</span>}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${adherence >= 80 ? "text-green-600" : adherence >= 50 ? "text-amber-600" : "text-red-600"}`}>
            {adherence}%
          </div>
          <p className="text-[10px] text-muted-foreground">adherence</p>
        </div>
        {!alwaysExpanded && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t border-border space-y-3">
          {/* Medications */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Pill className="w-3 h-3" /> Medications</p>
            {meds.length === 0 ? <p className="text-xs text-muted-foreground/60 pl-4">No active medications</p> : (
              <div className="space-y-1">
                {meds.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 pl-4">
                    {m.photo_url && <img src={m.photo_url} alt="" className="w-6 h-6 rounded object-cover" />}
                    <span className="text-xs">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.dosage}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appointments */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Upcoming Appointments</p>
            {appts.length === 0 ? <p className="text-xs text-muted-foreground/60 pl-4">None scheduled</p> : (
              <div className="space-y-1">
                {appts.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 pl-4">
                    <span className="text-xs">{a.title}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(a.date), "MMM d, h:mm a")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vitals */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Recent Vitals</p>
            {Object.keys(latestVitals).length === 0 ? <p className="text-xs text-muted-foreground/60 pl-4">No vitals recorded</p> : (
              <div className="grid grid-cols-2 gap-2 pl-4">
                {Object.entries(latestVitals).map(([type, v]) => (
                  <div key={type} className="text-xs">
                    <span className="text-muted-foreground">{vitalLabels[type] || type}: </span>
                    <span className="font-medium">{type === "blood_pressure" && v.secondary_value ? `${v.value}/${v.secondary_value}` : v.value}</span>
                    {v.unit && <span className="text-muted-foreground"> {v.unit}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7-day mini bar */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">7-Day Adherence</p>
            <div className="flex items-end gap-1 h-12 pl-4">
              {last7.map((d, i) => {
                const total = d.taken + d.missed;
                const takenH = total > 0 ? (d.taken / total) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full h-full flex flex-col justify-end rounded overflow-hidden bg-muted">
                      <div className="bg-red-400" style={{ height: `${total > 0 ? (d.missed / total) * 100 : 0}%` }} />
                      <div className="bg-green-500" style={{ height: `${takenH}%` }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </Card>
  );
}

export default function CaregiverDashboard() {
  const { members, loading } = useFamilyMember();
  const [selected, setSelected] = useState("all");

  const allOptions = [
    { id: "all", name: "All", isSelf: false },
    { id: "self", name: "You", isSelf: true },
    ...members.map((m) => ({ id: m.id, name: m.name, isSelf: false, photo: m.photo_url, relationship: m.relationship })),
  ];

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Caregiver Dashboard</h1>
          <p className="text-sm text-muted-foreground">Consolidated health overview for your family</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-semibold">Refill Alerts</h2>
        </div>
        <RefillAlertBanner />
      </div>

      <div className="mb-6">
        <AlertConfigPanel />
      </div>

      <div className="mb-6">
        <CaregiverVisitLog />
      </div>

      <div className="mb-6">
        <ActivityFeed />
      </div>

      {/* Member Toggle Selector */}
      {!loading && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Select a family member to view their details:</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {allOptions.map((opt) => {
              const isActive = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 transition whitespace-nowrap ${isActive ? "bg-violet-600 border-violet-600 text-white" : "bg-card border-border hover:bg-muted text-gray-600"}`}
                >
                  {opt.photo ? (
                    <img src={opt.photo} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isActive ? "bg-white/20" : "bg-violet-100"}`}>
                      <Users className="w-3 h-3" />
                    </div>
                  )}
                  <span className="text-xs font-medium">{opt.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 p-4 bg-violet-50 rounded-xl border border-violet-200 mb-6">
        <AlertCircle className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
        <p className="text-xs text-violet-800">
          {selected === "all"
            ? "This view consolidates medication adherence, appointments, and vital trends for all family member profiles. Expand any card for detailed information."
            : "Showing detailed medication logs, upcoming appointments, and vitals for the selected family member."}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>
      ) : selected === "all" ? (
        <div className="space-y-3">
          <MemberCard member={null} isSelf={true} />
          {members.map((m) => (
            <MemberCard key={m.id} member={m} isSelf={false} />
          ))}
          {members.length === 0 && (
            <Card className="p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No family members added yet</p>
              <p className="text-xs text-muted-foreground mt-1">Use the profile switcher in the top bar to add family members</p>
            </Card>
          )}
        </div>
      ) : selected === "self" ? (
        <MemberCard member={null} isSelf={true} alwaysExpanded />
      ) : (
        <MemberCard member={members.find((m) => m.id === selected)} isSelf={false} alwaysExpanded />
      )}
    </div>
  );
}