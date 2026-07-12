import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const earLabels = { left: "Left Eye", right: "Right Eye", both: "Both Eyes" };

const acuityToScore = (num, den) => {
  if (!num || !den) return null;
  return Math.round((den / num) * 100);
};

export default function VisionTrendChart() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.EyeExamLog.list("-exam_date", 100);
        setLogs(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>;
  }

  const chartData = logs
    .filter((l) => l.exam_date && l.acuity_numerator && l.acuity_denominator)
    .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
    .map((l) => ({
      date: format(new Date(l.exam_date), "MMM d, yy"),
      score: acuityToScore(l.acuity_numerator, l.acuity_denominator),
      acuity: `${l.acuity_numerator}/${l.acuity_denominator}`,
      eye: earLabels[l.eye] || l.eye,
    }));

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-indigo-600" />
        <h3 className="font-display font-semibold">Vision Acuity Trend</h3>
      </div>
      {chartData.length < 2 ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
          Log at least 2 eye exams to see vision trends
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 120]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip
                formatter={(value, name, props) => [`${value} (${props?.payload?.acuity || ""})`, "Acuity Score"]}
              />
              <Legend />
              <Line type="monotone" dataKey="score" name="Acuity Score" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground mt-2">Higher score = better acuity (20/20 = 100). Track vision changes over time.</p>
        </>
      )}
    </Card>
  );
}