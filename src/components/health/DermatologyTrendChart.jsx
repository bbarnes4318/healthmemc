import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Scan, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const riskScoreMap = { low: 1, moderate: 2, high: 3 };
const riskLabels = { 1: "Low", 2: "Moderate", 3: "High" };

export default function DermatologyTrendChart() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.DermatologyImage.list("-created_date", 100);
        setImages(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-teal-600" /></div>;
  }

  const chartData = images
    .filter((img) => img.ai_risk_level)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .map((img) => ({
      date: format(new Date(img.created_date), "MMM d, yy"),
      risk: riskScoreMap[img.ai_risk_level] || 1,
      concern: img.concern_type?.replace(/_/g, " ") || "",
      location: img.body_location?.replace(/_/g, " ") || "",
    }));

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Scan className="w-4 h-4 text-teal-600" />
        <h3 className="font-display font-semibold">Dermatology Risk Trend</h3>
      </div>
      {chartData.length < 2 ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
          Upload at least 2 dermatology photos with AI analysis to see trends
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={(v) => riskLabels[v] || ""} tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value) => [riskLabels[value] || "Unknown", "Risk Level"]}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item ? `${label} · ${item.concern} (${item.location})` : label;
                }}
              />
              <Line type="stepAfter" dataKey="risk" name="Risk Level" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground mt-2">Risk level trend from AI-analyzed skin photos. Higher = more concerning.</p>
        </>
      )}
    </Card>
  );
}