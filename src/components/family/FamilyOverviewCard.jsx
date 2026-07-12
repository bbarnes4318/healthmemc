import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, Pill, Calendar, ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format } from "date-fns";

export default function FamilyOverviewCard() {
  const { members, switchMember, currentMemberId } = useFamilyMember();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});

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
          data[m.id] = { medCount: meds.length, nextAppt: upcoming[0] || null, meds: meds.slice(0, 2) };
        }
        setSummary(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [members]);

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-sky-600" /></div>;
  }

  if (members.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-600" />
          Family Overview
        </h3>
        <Link to="/family-management" className="text-xs text-sky-600 hover:underline flex items-center gap-1">
          Manage <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {members.map((member, i) => {
          const data = summary[member.id] || { medCount: 0, nextAppt: null, meds: [] };
          const isTracking = currentMemberId === member.id;
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${isTracking ? "bg-emerald-50 border-emerald-200" : "bg-muted/30 border-border hover:bg-muted/50"}`}
              onClick={() => switchMember(isTracking ? null : member.id)}
            >
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-lg shrink-0">
                  {member.relationship === "child" ? "🧒" : member.relationship === "parent" || member.relationship === "grandparent" ? "🧓" : "👤"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.name}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5">
                    <Pill className="w-2.5 h-2.5" /> {data.medCount} med{data.medCount !== 1 ? "s" : ""}
                  </span>
                  {data.nextAppt && (
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" /> {format(new Date(data.nextAppt.date), "MMM d")}
                    </span>
                  )}
                </div>
              </div>
              {isTracking && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-medium whitespace-nowrap">Tracking</span>
              )}
            </motion.div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">Tap a member to view their medications & appointments on your dashboard.</p>
    </Card>
  );
}