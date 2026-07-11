import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Loader2, BarChart3, Calendar, TrendingUp, Stethoscope } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format } from "date-fns";

const procedureLabels = {
  cleaning: "Cleaning", filling: "Filling", root_canal: "Root Canal",
  extraction: "Extraction", crown: "Crown", bridge: "Bridge",
  implant: "Implant", whitening: "Whitening", x_ray: "X-Ray",
  examination: "Examination", other: "Other",
};

const procedureColors = [
  "#06b6d4", "#0ea5e9", "#3b82f6", "#8b5cf6", "#ec4899",
  "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#94a3b8",
];

export default function DentalDashboard() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.DentalVisitLog.list("-visit_date", 200);
        setVisits(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <Card className="p-12 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No dental visits logged yet</p>
        <p className="text-xs text-muted-foreground mt-1">Log visits in the Visit Log tab to see your oral health trends here.</p>
      </Card>
    );
  }

  // Procedure type frequency
  const procCounts = {};
  visits.forEach((v) => {
    const type = v.procedure_type || "other";
    procCounts[type] = (procCounts[type] || 0) + 1;
  });
  const procData = Object.entries(procCounts)
    .map(([key, count]) => ({ name: procedureLabels[key] || key, count }))
    .sort((a, b) => b.count - a.count);

  // Visits over time (by month)
  const monthCounts = {};
  visits.forEach((v) => {
    if (!v.visit_date) return;
    const month = format(new Date(v.visit_date), "MMM yyyy");
    const sortKey = new Date(v.visit_date).toISOString().slice(0, 7);
    if (!monthCounts[sortKey]) monthCounts[sortKey] = { label: month, count: 0, cost: 0 };
    monthCounts[sortKey].count++;
    if (v.cost) monthCounts[sortKey].cost += v.cost;
  });
  const timeData = Object.entries(monthCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, val]) => val);

  // Total cost
  const totalCost = visits.reduce((sum, v) => sum + (v.cost || 0), 0);

  // Pie data
  const pieData = procData.map((d, i) => ({ ...d, fill: procedureColors[i % procedureColors.length] }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="w-4 h-4 text-cyan-600" />
            <span className="text-xs text-muted-foreground">Total Visits</span>
          </div>
          <p className="text-2xl font-bold">{visits.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-cyan-600" />
            <span className="text-xs text-muted-foreground">Last Visit</span>
          </div>
          <p className="text-sm font-semibold mt-1">{visits[0] ? format(new Date(visits[0].visit_date), "MMM d, yyyy") : "N/A"}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            <span className="text-xs text-muted-foreground">Procedure Types</span>
          </div>
          <p className="text-2xl font-bold">{Object.keys(procCounts).length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">Total Cost</span>
          </div>
          <p className="text-2xl font-bold">${totalCost.toFixed(0)}</p>
        </Card>
      </div>

      {/* Procedure frequency bar chart */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Procedure Type Frequency</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={procData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visits over time */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Visits Over Time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Procedure type pie chart */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Procedure Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 9 }}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Cost over time */}
      {totalCost > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Dental Spending Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
              <Bar dataKey="cost" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}