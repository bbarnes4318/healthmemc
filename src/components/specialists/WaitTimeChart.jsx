import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, Clock, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from "recharts";
import { differenceInDays } from "date-fns";

const COLORS = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];

function waitColor(days) {
  if (days <= 3) return COLORS[0];
  if (days <= 7) return COLORS[1];
  if (days <= 14) return COLORS[2];
  if (days <= 30) return COLORS[3];
  return COLORS[4];
}

export default function WaitTimeChart() {
  const [doctors, setDoctors] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [docs, fb, appts] = await Promise.all([
          base44.entities.DoctorDirectory.list("-created_date", 100),
          base44.entities.SpecialistFeedback.list("-visit_date", 200),
          base44.entities.Appointment.list("-date", 200),
        ]);
        setDoctors(docs);
        setFeedback(fb);
        setAppointments(appts);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const chartData = useMemo(() => {
    const nameMap = {};

    // Normalize doctor names for matching
    const normalize = (n) => (n || "").toLowerCase().trim();

    // Build a set of known doctor names from the directory
    const doctorNames = doctors.map((d) => ({
      raw: d.doctor_name,
      norm: normalize(d.doctor_name),
      specialty: d.specialty,
    }));

    // Collect wait times from SpecialistFeedback (explicit field)
    feedback.forEach((f) => {
      const name = f.specialist_name?.trim();
      if (!name) return;
      if (!nameMap[name]) nameMap[name] = { name, waits: [], count: 0 };
      if (f.wait_time_days != null && f.wait_time_days >= 0) {
        nameMap[name].waits.push(f.wait_time_days);
      }
    });

    // Collect wait times from Appointments (computed: date - created_date)
    appointments.forEach((a) => {
      const provider = a.provider?.trim();
      if (!provider) return;
      if (!nameMap[provider]) nameMap[provider] = { name: provider, waits: [], count: 0 };
      nameMap[provider].count++;
      if (a.date && a.created_date) {
        const diff = differenceInDays(new Date(a.date), new Date(a.created_date));
        if (diff >= 0) {
          nameMap[provider].waits.push(diff);
        }
      }
    });

    // Build chart data, prioritizing doctors that are in the directory
    const results = Object.values(nameMap)
      .map((entry) => {
        const avg = entry.waits.length > 0
          ? entry.waits.reduce((s, w) => s + w, 0) / entry.waits.length
          : null;
        const docMatch = doctorNames.find((d) => d.norm === normalize(entry.name));
        return {
          name: entry.name,
          avgWait: avg != null ? Math.round(avg * 10) / 10 : null,
          visitCount: entry.waits.length,
          specialty: docMatch?.specialty || "",
          inDirectory: !!docMatch,
        };
      })
      .filter((d) => d.avgWait != null)
      .sort((a, b) => a.avgWait - b.avgWait);

    return results;
  }, [doctors, feedback, appointments]);

  const overallAvg = chartData.length > 0
    ? (chartData.reduce((s, d) => s + d.avgWait, 0) / chartData.length).toFixed(1)
    : "—";

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-600" />
          <div>
            <h3 className="font-semibold text-sm">Average Wait Time by Doctor</h3>
            <p className="text-xs text-muted-foreground">Days from booking to appointment — sorted fastest to slowest</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-sky-600">{overallAvg}</p>
          <p className="text-[10px] text-muted-foreground">avg days</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-8 text-center">
          <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No wait time data yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Wait times are calculated from your appointments (booking date to visit date) and specialist feedback.
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 45)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} label={{ value: "Days", position: "insideBottom", offset: -2, style: { fontSize: 10, fill: "#888" } }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11 }}
                formatter={(value, name, props) => {
                  if (name === "avgWait") return [`${value} days`, "Avg Wait"];
                  return [value, name];
                }}
                labelFormatter={(label) => {
                  const item = chartData.find((d) => d.name === label);
                  return item?.specialty ? `${label} (${item.specialty})` : label;
                }}
              />
              <Bar dataKey="avgWait" radius={[0, 4, 4, 0]} name="avgWait">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={waitColor(entry.avgWait)} />
                ))}
                <LabelList dataKey="avgWait" position="right" formatter={(v) => `${v}d`} style={{ fontSize: 10, fill: "#666" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Color legend:</span>
            <span className="text-[10px] flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> ≤3 days</span>
            <span className="text-[10px] flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-lime-500" /> ≤7 days</span>
            <span className="text-[10px] flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-500" /> ≤14 days</span>
            <span className="text-[10px] flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500" /> ≤30 days</span>
            <span className="text-[10px] flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> 30+ days</span>
          </div>
        </>
      )}
    </Card>
  );
}