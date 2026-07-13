import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MilestoneTimeline from "@/components/shared/MilestoneTimeline";
import { Syringe, Stethoscope, Scissors, Shield, Award, PawPrint } from "lucide-react";
import { differenceInDays } from "date-fns";

const recordTypeConfig = {
  vet_visit: { label: "Vet Visit", icon: Stethoscope, color: "text-sky-600" },
  vaccination: { label: "Vaccination", icon: Syringe, color: "text-purple-600" },
  dental_cleaning: { label: "Dental Cleaning", icon: PawPrint, color: "text-cyan-600" },
  grooming: { label: "Grooming", icon: Scissors, color: "text-pink-600" },
  parasite_prevention: { label: "Parasite Prevention", icon: Shield, color: "text-emerald-600" },
  other: { label: "Health Item", icon: Award, color: "text-amber-600" },
};

export default function PetMilestoneTimeline() {
  const [schedules, setSchedules] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [schedData, petData] = await Promise.all([
          base44.entities.PetHealthSchedule.list("-next_due_date", 500),
          base44.entities.PetProfile.list("-created_date", 50),
        ]);
        setSchedules(schedData);
        setPets(petData);
        if (petData.length > 0) setSelectedPet(petData[0].name);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const milestones = useMemo(() => {
    const now = new Date();
    const filtered = selectedPet ? schedules.filter((s) => s.pet_name === selectedPet) : schedules;
    const events = [];

    filtered.forEach((s) => {
      const cfg = recordTypeConfig[s.record_type] || recordTypeConfig.other;

      if (s.last_done_date) {
        events.push({
          date: s.last_done_date,
          title: `${cfg.label}${s.vaccine_type ? `: ${s.vaccine_type}` : ""}`,
          description: s.clinic_name ? `At ${s.clinic_name}` : undefined,
          status: "completed", icon: cfg.icon, color: cfg.color, tag: s.notes,
          daysFromNow: differenceInDays(now, new Date(s.last_done_date)),
        });
      }

      if (s.next_due_date) {
        const days = differenceInDays(new Date(s.next_due_date), now);
        events.push({
          date: s.next_due_date,
          title: `${cfg.label} Due${s.vaccine_type ? `: ${s.vaccine_type}` : ""}`,
          description: s.clinic_name ? `At ${s.clinic_name}` : undefined,
          status: days < 0 ? "overdue" : "upcoming",
          icon: cfg.icon,
          color: days < 0 ? "text-red-600" : "text-sky-600",
          daysFromNow: days,
        });
      }
    });

    return events;
  }, [schedules, selectedPet]);

  if (!loading && pets.length === 0) {
    return (
      <MilestoneTimeline milestones={[]} loading={false} title="Pet Milestone Timeline" icon={Award}
        emptyMessage="No pet profiles yet. Create a pet profile to track health milestones." />
    );
  }

  return (
    <div className="space-y-4">
      {pets.length > 0 && (
        <Select value={selectedPet} onValueChange={setSelectedPet}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {pets.map((p) => <SelectItem key={p.id} value={p.name}>{p.name} ({p.breed || p.pet_type})</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <MilestoneTimeline
        milestones={milestones} loading={loading}
        title="Pet Milestone Timeline" icon={Award}
        emptyMessage="No pet health milestones yet. Schedule vaccinations and vet visits to see them here."
      />
    </div>
  );
}