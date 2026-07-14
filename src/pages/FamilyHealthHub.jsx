import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Pill, Activity, Loader2, User, Baby, Heart,
} from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import MemberVaccinationSchedule from "@/components/family/MemberVaccinationSchedule";
import MemberHealthTargets from "@/components/family/MemberHealthTargets";
import moment from "moment";

export default function FamilyHealthHub() {
  const { members, currentMemberId, switchMember, isViewingSelf, currentMemberName } = useFamilyMember();
  const [selectedId, setSelectedId] = useState(currentMemberId || null);
  const [medications, setMedications] = useState([]);
  const [recoveryPlans, setRecoveryPlans] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedId(currentMemberId || null);
  }, [currentMemberId]);

  useEffect(() => {
    loadCareData();
  }, [selectedId]);

  const loadCareData = async () => {
    setLoading(true);
    try {
      const filter = selectedId ? { family_member_id: selectedId } : {};
      const medFilter = selectedId ? { family_member_id: selectedId, active: true } : { active: true };
      const [meds, recoveries, appts] = await Promise.all([
        base44.entities.Medication.filter(medFilter),
        base44.entities.RecoveryPlan.filter(filter),
        base44.entities.Appointment.filter({ ...filter, status: "scheduled" }, "-date", 5),
      ]);
      setMedications(meds);
      setRecoveryPlans(recoveries);
      setAppointments(appts);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSelectMember = (id) => {
    setSelectedId(id);
    switchMember(id);
  };

  const selectedName = selectedId
    ? members.find((m) => m.id === selectedId)?.name || "Member"
    : "You";

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-sky-600" />
          Family Health Hub
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage care plans, vaccinations & health targets for your whole family
        </p>
      </div>

      {/* Member Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => handleSelectMember(null)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 shrink-0 transition-all ${
            !selectedId ? "border-sky-400 bg-sky-50 ring-1 ring-sky-200" : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium">You</span>
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => handleSelectMember(m.id)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 shrink-0 transition-all ${
              selectedId === m.id ? "border-sky-400 bg-sky-50 ring-1 ring-sky-200" : "border-border bg-card hover:bg-muted/50"
            }`}
          >
            {m.photo_url ? (
              <img src={m.photo_url} alt={m.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{m.name?.[0] || "?"}</span>
              </div>
            )}
            <div className="text-left">
              <p className="text-sm font-medium leading-tight">{m.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight capitalize">{m.relationship}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Care Plan Summary */}
      <Card className="p-5">
        <h3 className="font-display font-semibold flex items-center gap-2 text-sm mb-3">
          <Activity className="w-4 h-4 text-sky-600" />
          Care Plan — {selectedName}
        </h3>

        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            {/* Active Medications */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Pill className="w-3 h-3" /> Active Medications
              </p>
              {medications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active medications</p>
              ) : (
                <div className="space-y-1.5">
                  {medications.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
                      <Pill className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name} — {m.dosage}</p>
                        <p className="text-xs text-muted-foreground">{m.frequency}
                          {m.refill_date ? ` · Refill: ${moment(m.refill_date).format("MMM D")}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recovery Plans */}
            {recoveryPlans.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Recovery Plans
                </p>
                <div className="space-y-1.5">
                  {recoveryPlans.map((r) => (
                    <div key={r.id} className="p-2 bg-muted/40 rounded-lg">
                      <p className="text-sm font-medium">{r.surgery_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {moment(r.surgery_date).format("MMM D, YYYY")}
                        {r.expected_recovery_weeks ? ` · ~${r.expected_recovery_weeks}w recovery` : ""}
                        {r.follow_up_date ? ` · Follow-up: ${moment(r.follow_up_date).format("MMM D")}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Appointments */}
            {appointments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Upcoming Appointments
                </p>
                <div className="space-y-1.5">
                  {appointments.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-sky-700">{moment(a.date).format("DD")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{moment(a.date).format("MMM D, h:mm A")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {medications.length === 0 && recoveryPlans.length === 0 && appointments.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">No active care plan items</p>
                <Link to="/pharmacy">
                  <Button variant="outline" size="sm">Add Medication</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Vaccinations & Health Targets side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MemberVaccinationSchedule memberId={selectedId} onUpdate={loadCareData} />
        <MemberHealthTargets memberId={selectedId} onUpdate={loadCareData} />
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2">
        <Link to="/family-management"><Button variant="outline" size="sm"><Users className="w-3.5 h-3.5 mr-1" /> Manage Members</Button></Link>
        <Link to="/immunization"><Button variant="outline" size="sm">Full Immunization History</Button></Link>
        <Link to="/wellness"><Button variant="outline" size="sm">Wellness Center</Button></Link>
      </div>
    </div>
  );
}