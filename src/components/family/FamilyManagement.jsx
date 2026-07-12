import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Pill, Calendar, UserPlus, Users, Edit3, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useToast } from "@/components/ui/use-toast";
import FamilyMemberModal from "@/components/family/FamilyMemberModal";
import { format, differenceInYears } from "date-fns";

const relationshipConfig = {
  child: { label: "Child", color: "bg-sky-100 text-sky-700", icon: "🧒" },
  parent: { label: "Parent", color: "bg-violet-100 text-violet-700", icon: "👨‍🦳" },
  spouse: { label: "Spouse", color: "bg-rose-100 text-rose-700", icon: "💑" },
  sibling: { label: "Sibling", color: "bg-amber-100 text-amber-700", icon: "👥" },
  grandparent: { label: "Grandparent", color: "bg-emerald-100 text-emerald-700", icon: "🧓" },
  other: { label: "Other", color: "bg-muted text-muted-foreground", icon: "👤" },
};

export default function FamilyManagement() {
  const { members, loadMembers, switchMember, currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [memberData, setMemberData] = useState({});
  const [expandedMember, setExpandedMember] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (members.length === 0) { setLoading(false); return; }
      try {
        const data = {};
        for (const m of members) {
          const [meds, appts] = await Promise.all([
            base44.entities.Medication.filter({ family_member_id: m.id, active: true }),
            base44.entities.Appointment.filter({ family_member_id: m.id }, "-date", 5),
          ]);
          const upcoming = appts.filter((a) => new Date(a.date) >= new Date() && a.status !== "cancelled");
          data[m.id] = { medications: meds, appointments: upcoming };
        }
        setMemberData(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [members]);

  const handleDelete = async (id, name) => {
    try {
      await base44.entities.FamilyMember.delete(id);
      if (currentMemberId === id) switchMember(null);
      loadMembers();
      toast({ title: `${name} removed from family` });
    } catch (e) { console.error(e); }
  };

  const handleSaved = () => {
    loadMembers();
    toast({ title: "Family member added" });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-sky-600" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Family Members</h3>
          <p className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""} · medications & appointments linked to your dashboard</p>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700" onClick={() => setModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No family members yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add profiles for your children, parents, or other dependents to track their medications and appointments alongside your own.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {members.map((member, i) => {
            const cfg = relationshipConfig[member.relationship] || relationshipConfig.other;
            const data = memberData[member.id] || { medications: [], appointments: [] };
            const age = member.date_of_birth ? differenceInYears(new Date(), new Date(member.date_of_birth)) : null;
            const isExpanded = expandedMember === member.id;
            const isCurrentlyViewing = currentMemberId === member.id;

            return (
              <motion.div key={member.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center text-2xl shrink-0">{cfg.icon}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm">{member.name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                        {age != null && <span className="text-[10px] text-muted-foreground">{age} yrs</span>}
                        {isCurrentlyViewing && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Viewing on Dashboard</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Pill className="w-3 h-3" />
                          {data.medications.length} active med{data.medications.length !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {data.appointments.length} upcoming appt{data.appointments.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                          {/* Medications */}
                          <div>
                            <p className="text-xs font-medium mb-1.5 flex items-center gap-1"><Pill className="w-3 h-3 text-emerald-600" /> Active Medications</p>
                            {data.medications.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No active medications</p>
                            ) : (
                              <div className="space-y-1">
                                {data.medications.map((med) => (
                                  <div key={med.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <Pill className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{med.name}</p>
                                      <p className="text-[10px] text-muted-foreground">{med.dosage} · {med.frequency}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Appointments */}
                          <div>
                            <p className="text-xs font-medium mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3 text-sky-600" /> Upcoming Appointments</p>
                            {data.appointments.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No upcoming appointments</p>
                            ) : (
                              <div className="space-y-1">
                                {data.appointments.map((appt) => (
                                  <div key={appt.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <Calendar className="w-3 h-3 text-sky-600 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{appt.title}</p>
                                      <p className="text-[10px] text-muted-foreground">{format(new Date(appt.date), "MMM d, yyyy 'at' h:mm a")}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {member.blood_type && member.blood_type !== "unknown" && (
                            <p className="text-xs text-muted-foreground"><strong>Blood Type:</strong> {member.blood_type}</p>
                          )}
                          {member.notes && <p className="text-xs text-muted-foreground"><strong>Notes:</strong> {member.notes}</p>}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => switchMember(isCurrentlyViewing ? null : member.id)}
                      >
                        {isCurrentlyViewing ? "Stop Tracking" : "Track on Dashboard"}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExpandedMember(isExpanded ? null : member.id)}>
                        <Edit3 className="w-3 h-3 mr-1" /> {isExpanded ? "Hide" : "Details"}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(member.id, member.name)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <FamilyMemberModal open={modalOpen} onOpenChange={setModalOpen} onSaved={handleSaved} />
    </div>
  );
}