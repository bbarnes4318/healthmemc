import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Syringe, Activity, Apple, Calendar, Stethoscope, Shield, Scissors, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO, differenceInDays } from "date-fns";
import PetSymptomTrendChart from "@/components/veterinary/PetSymptomTrendChart";
import PetMedicalHistoryExport from "@/components/veterinary/PetMedicalHistoryExport";

const recordTypeConfig = {
  vet_visit: { label: "Vet Visit", icon: Stethoscope, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
  vaccination: { label: "Vaccination", icon: Syringe, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  dental_cleaning: { label: "Dental Cleaning", icon: Activity, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
  grooming: { label: "Grooming", icon: Scissors, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  parasite_prevention: { label: "Parasite Prevention", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  other: { label: "Health Item", icon: Bell, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
};

const severityConfig = {
  mild: { color: "text-amber-600", bg: "bg-amber-100" },
  moderate: { color: "text-orange-600", bg: "bg-orange-100" },
  severe: { color: "text-red-600", bg: "bg-red-100" },
};

const observationTypeLabels = {
  pain: "Pain", swelling: "Swelling", lesion: "Lesion", lameness: "Lameness", skin_issue: "Skin Issue", behavior: "Behavior", other: "Other",
};

export default function PetHealthTimeline() {
  const [pets, setPets] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [nutrition, setNutrition] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [petData, symptomData, scheduleData, nutritionData] = await Promise.all([
          base44.entities.PetProfile.list("-created_date", 50),
          base44.entities.PetSymptomLog.list("-logged_at", 500),
          base44.entities.PetHealthSchedule.list("-next_due_date", 200),
          base44.entities.PetNutritionLog.list("-date", 200),
        ]);
        setPets(petData);
        setSymptoms(symptomData);
        setSchedules(scheduleData);
        setNutrition(nutritionData);
        if (petData.length > 0) setSelectedPetId(petData[0].id);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const selectedPet = pets.find((p) => p.id === selectedPetId);

  const timeline = useMemo(() => {
    if (!selectedPet) return [];

    const events = [];

    // Symptoms - match by breed or pet type
    symptoms
      .filter((s) => s.breed === selectedPet.breed || s.pet_type === selectedPet.pet_type)
      .forEach((s) => {
        events.push({
          type: "symptom",
          date: s.logged_at || s.created_date,
          title: `${observationTypeLabels[s.observation_type] || s.observation_type} — ${s.severity}`,
          severity: s.severity,
          bodyRegion: s.body_region,
          description: s.description,
          petName: s.breed,
        });
      });

    // Vaccinations / vet visits from PetHealthSchedule - match by pet name
    schedules
      .filter((s) => s.pet_name === selectedPet.name)
      .forEach((s) => {
        const config = recordTypeConfig[s.record_type] || recordTypeConfig.other;
        events.push({
          type: "schedule",
          scheduleType: s.record_type,
          date: s.last_done_date || s.next_due_date,
          title: `${config.label}${s.vaccine_type ? `: ${s.vaccine_type}` : ""}`,
          status: s.last_done_date ? "completed" : "upcoming",
          dueDate: s.next_due_date,
          clinic: s.clinic_name,
          notes: s.notes,
        });
      });

    // Nutrition logs
    nutrition
      .filter((n) => n.pet_profile_id === selectedPet.id)
      .forEach((n) => {
        events.push({
          type: "nutrition",
          date: n.date,
          title: `${n.meal_type} — ${n.food_name}`,
          portion: n.portion_size ? `${n.portion_size} ${n.portion_unit}` : null,
          appetite: n.appetite,
          notes: n.notes,
        });
      });

    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedPet, symptoms, schedules, nutrition]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;
  }

  if (pets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No pet profiles yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create a pet profile in the Emergency Cards tab to see a full medical history.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" /> Pet Health Timeline
        </h2>
        <p className="text-xs text-muted-foreground">Complete medical history — vaccinations, symptoms & nutrition in one place</p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Select value={selectedPetId} onValueChange={setSelectedPetId}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {pets.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.breed || p.pet_type})</SelectItem>)}
          </SelectContent>
        </Select>
        <PetMedicalHistoryExport pet={selectedPet} />
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <Syringe className="w-4 h-4 text-purple-600 mx-auto mb-1" />
          <p className="text-lg font-bold">{timeline.filter((e) => e.type === "schedule").length}</p>
          <p className="text-[9px] text-muted-foreground">Vaccines & Visits</p>
        </Card>
        <Card className="p-3 text-center">
          <Activity className="w-4 h-4 text-red-500 mx-auto mb-1" />
          <p className="text-lg font-bold">{timeline.filter((e) => e.type === "symptom").length}</p>
          <p className="text-[9px] text-muted-foreground">Symptoms Logged</p>
        </Card>
        <Card className="p-3 text-center">
          <Apple className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
          <p className="text-lg font-bold">{timeline.filter((e) => e.type === "nutrition").length}</p>
          <p className="text-[9px] text-muted-foreground">Meals Tracked</p>
        </Card>
      </div>

      {/* Symptom Trend Chart */}
      <PetSymptomTrendChart />

      {/* Timeline */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3">Full Medical History — {selectedPet?.name}</h3>
        {timeline.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No health events recorded yet for {selectedPet?.name}.</p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 via-sky-200 to-emerald-200" />

            <div className="space-y-3">
              {timeline.slice(0, 50).map((event, i) => {
                const date = new Date(event.date);
                const isUpcoming = event.status === "upcoming";
                const daysUntil = event.dueDate ? differenceInDays(parseISO(event.dueDate), new Date()) : null;

                let icon, iconBg, iconColor;
                if (event.type === "symptom") {
                  const sevCfg = severityConfig[event.severity] || severityConfig.mild;
                  icon = Activity; iconBg = sevCfg.bg; iconColor = sevCfg.color;
                } else if (event.type === "nutrition") {
                  icon = Apple; iconBg = "bg-emerald-100"; iconColor = "text-emerald-600";
                } else {
                  const cfg = recordTypeConfig[event.scheduleType] || recordTypeConfig.other;
                  icon = cfg.icon; iconBg = cfg.bg; iconColor = cfg.color;
                }
                const Icon = icon;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="relative pl-10"
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-2.5 top-1 w-3.5 h-3.5 rounded-full ${iconBg} border-2 border-white shadow-sm flex items-center justify-center`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${iconColor.replace("text-", "bg-")}`} />
                    </div>

                    <div className={`p-3 rounded-lg border ${event.type === "symptom" ? "border-red-100" : event.type === "nutrition" ? "border-emerald-100" : "border-border"} bg-card hover:shadow-sm transition`}>
                      <div className="flex items-start gap-2">
                        <Icon className={`w-3.5 h-3.5 ${iconColor} shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-semibold capitalize">{event.title}</p>
                            {isUpcoming && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                {daysUntil !== null && daysUntil < 0 ? "Overdue" : "Upcoming"}
                              </span>
                            )}
                            {event.portion && <span className="text-[9px] text-muted-foreground">{event.portion}</span>}
                            {event.appetite && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                event.appetite === "good" ? "bg-emerald-100 text-emerald-700" :
                                event.appetite === "fair" ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              }`}>{event.appetite}</span>
                            )}
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {format(date, "MMM d, yyyy")}
                            {event.dueDate && event.status === "upcoming" && ` · Due ${format(parseISO(event.dueDate), "MMM d, yyyy")}`}
                            {event.clinic && ` · ${event.clinic}`}
                            {event.bodyRegion && ` · ${event.bodyRegion.replace(/_/g, " ")}`}
                          </p>
                          {event.description && <p className="text-[10px] text-muted-foreground italic mt-0.5">{event.description}</p>}
                          {event.notes && <p className="text-[10px] text-muted-foreground italic mt-0.5">{event.notes}</p>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}