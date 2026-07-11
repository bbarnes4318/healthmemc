import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Loader2, ThumbsUp, DollarSign, TrendingUp, GitCompare, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function SpecialistComparison() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.SpecialistFeedback.list("-visit_date", 200);
        setFeedback(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  // Group by specialist_name + specialty
  const grouped = {};
  feedback.forEach((f) => {
    const key = `${f.specialist_name}__${f.specialty}`;
    if (!grouped[key]) {
      grouped[key] = { name: f.specialist_name, specialty: f.specialty, ratings: [], costs: [], recommends: 0, visits: 0, tags: {} };
    }
    grouped[key].ratings.push(f.rating || 0);
    grouped[key].visits++;
    if (f.would_recommend) grouped[key].recommends++;
    if (f.visit_cost != null) grouped[key].costs.push(f.visit_cost);
    f.tags?.forEach((t) => { grouped[key].tags[t] = (grouped[key].tags[t] || 0) + 1; });
  });

  const specialists = Object.values(grouped).map((s) => ({
    ...s,
    avgRating: s.ratings.length > 0 ? (s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length) : 0,
    avgCost: s.costs.length > 0 ? (s.costs.reduce((a, b) => a + b, 0) / s.costs.length) : null,
    recommendRate: s.visits > 0 ? (s.recommends / s.visits) * 100 : 0,
    topTags: Object.entries(s.tags).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t),
  }));

  const toggleSelect = (name) => {
    setSelected((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : prev.length < 4 ? [...prev, name] : prev);
  };

  const compareList = specialists.filter((s) => selected.includes(s.name));
  const bestRating = Math.max(...compareList.map((s) => s.avgRating), 0);
  const lowestCost = compareList.filter((s) => s.avgCost != null).length > 0
    ? Math.min(...compareList.filter((s) => s.avgCost != null).map((s) => s.avgCost)) : null;
  const bestRecommend = Math.max(...compareList.map((s) => s.recommendRate), 0);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>;
  }

  if (specialists.length === 0) {
    return (
      <Card className="p-12 text-center">
        <GitCompare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No specialist feedback yet</p>
        <p className="text-xs text-muted-foreground mt-1">Add reviews from your visits to compare providers side-by-side.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-1">
          <GitCompare className="w-4 h-4 text-amber-600" /> Select Specialists to Compare
        </h3>
        <p className="text-xs text-muted-foreground mb-3">Tap up to 4 providers to see a side-by-side comparison of ratings, costs, and recommendations.</p>
        <div className="space-y-2">
          {specialists.map((s) => (
            <button
              key={s.name}
              onClick={() => toggleSelect(s.name)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition text-left ${selected.includes(s.name) ? "border-amber-400 bg-amber-50" : "border-border hover:bg-muted/50"}`}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-xs font-bold text-amber-700">
                {s.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.specialty} · {s.visits} visit{s.visits !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`w-3 h-3 ${n <= Math.round(s.avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-amber-600">{s.avgRating.toFixed(1)}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {compareList.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 overflow-x-auto">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-600" /> Side-by-Side Comparison
            </h3>
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-xs text-muted-foreground font-medium">Metric</th>
                  {compareList.map((s) => (
                    <th key={s.name} className="text-center p-2 text-xs font-semibold min-w-[100px]">{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 text-xs text-muted-foreground">Specialty</td>
                  {compareList.map((s) => <td key={s.name} className="text-center p-2 text-xs">{s.specialty}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="p-2 text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />Avg Rating</td>
                  {compareList.map((s) => (
                    <td key={s.name} className="text-center p-2">
                      <span className={`font-bold ${s.avgRating === bestRating ? "text-emerald-600" : ""}`}>{s.avgRating.toFixed(1)}</span>
                      {s.avgRating === bestRating && <Trophy className="w-3 h-3 text-emerald-500 inline ml-1" />}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3 text-blue-500" />Visits</td>
                  {compareList.map((s) => <td key={s.name} className="text-center p-2 text-xs">{s.visits}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="p-2 text-xs text-muted-foreground flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-emerald-500" />Recommend %</td>
                  {compareList.map((s) => (
                    <td key={s.name} className="text-center p-2">
                      <span className={`text-xs font-medium ${s.recommendRate === bestRecommend ? "text-emerald-600" : ""}`}>{s.recommendRate.toFixed(0)}%</span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3 text-green-500" />Avg Cost</td>
                  {compareList.map((s) => (
                    <td key={s.name} className="text-center p-2">
                      {s.avgCost != null ? (
                        <span className={`text-xs font-medium ${s.avgCost === lowestCost ? "text-emerald-600" : ""}`}>${s.avgCost.toFixed(0)}</span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2 text-xs text-muted-foreground">Top Tags</td>
                  {compareList.map((s) => (
                    <td key={s.name} className="text-center p-2">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {s.topTags.map((t) => <Badge key={t} variant="outline" className="text-[9px]">{t}</Badge>)}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </Card>
        </motion.div>
      )}

      {selected.length > 0 && selected.length < 2 && (
        <p className="text-xs text-center text-muted-foreground">Select at least 2 specialists to compare them side-by-side.</p>
      )}
    </div>
  );
}