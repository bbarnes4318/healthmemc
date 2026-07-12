import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Ear, Loader2, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useFamilyMember } from "@/context/FamilyMemberContext";

const testFrequencies = [250, 500, 1000, 2000, 4000, 8000];
const earLabels = { left: "Left Ear", right: "Right Ear", both: "Both Ears" };
const resultScoreMap = { normal: 4, mild_loss: 3, moderate_loss: 2, severe_loss: 1 };
const resultLabels = { 1: "Severe Loss", 2: "Moderate Loss", 3: "Mild Loss", 4: "Normal" };

export default function HearingTrendChart() {
  const { currentMemberId } = useFamilyMember();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.HearingTestLog.list("-test_date", 100);
        const filtered = currentMemberId ? data.filter((l) => l.family_member_id === currentMemberId) : data;
        setLogs(filtered);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [currentMemberId]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-purple-600" /></div>;
  }

  // Hearing score chart data (% frequencies heard)
  const scoreData = logs
    .filter((l) => l.test_date)
    .sort((a, b) => new Date(a.test_date) - new Date(b.test_date))
    .map((l) => {
      const heard = l.frequencies_heard?.length || 0;
      const total = (l.frequencies_heard?.length || 0) + (l.frequencies_missed?.length || 0) || testFrequencies.length;
      return {
        date: format(new Date(l.test_date), "MMM d, yy"),
        score: Math.round((heard / total) * 100),
        ear: earLabels[l.ear] || l.ear,
        result: l.overall_result?.replace(/_/g, " ") || "",
      };
    });

  // Overall result trend
  const resultData = logs
    .filter((l) => l.test_date && l.overall_result)
    .sort((a, b) => new Date(a.test_date) - new Date(b.test_date))
    .map((l) => ({
      date: format(new Date(l.test_date), "MMM d, yy"),
      resultScore: resultScoreMap[l.overall_result] || 0,
      resultLabel: (l.overall_result || "").replace(/_/g, " "),
      ear: earLabels[l.ear] || l.ear,
    }));

  return (
    <div className="space-y-4">
      {/* Hearing Score Trend */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Ear className="w-4 h-4 text-purple-600" />
          <h3 className="font-display font-semibold">Hearing Score Trend</h3>
        </div>
        {scoreData.length < 2 ? (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            Log at least 2 hearing tests to see trends
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip
                  formatter={(value, name, props) => [`${value}%`, "Frequencies Heard"]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${label} · ${item.ear} · ${item.result}` : label;
                  }}
                />
                <Line type="monotone" dataKey="score" name="Hearing Score" stroke="#9333ea" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground mt-2">Percentage of test frequencies heard. Lower scores may indicate hearing decline.</p>
          </>
        )}
      </Card>

      {/* Overall Result Trend */}
      {resultData.length >= 2 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-purple-600" />
            <h3 className="font-display font-semibold">Hearing Classification Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={resultData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4]} tickFormatter={(v) => resultLabels[v] || ""} tick={{ fontSize: 9 }} width={90} />
              <Tooltip
                formatter={(value, name, props) => [props?.payload?.resultLabel || "", "Result"]}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item ? `${label} · ${item.ear}` : label;
                }}
              />
              <Line type="stepAfter" dataKey="resultScore" name="Result" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground mt-2">Overall hearing classification from each test. Higher = better hearing.</p>
        </Card>
      )}
    </div>
  );
}