import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Star, Loader2, ThumbsUp, GitCompare, Stethoscope, Quote,
  TrendingUp, MessageSquare, Phone, Mail, ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function DoctorComparisonTable() {
  const [doctors, setDoctors] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("rating"); // rating | reviews | recommend | name
  const [sortDir, setSortDir] = useState("desc");
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [docs, reviews] = await Promise.all([
          base44.entities.DoctorDirectory.list("-created_date", 100),
          base44.entities.SpecialistFeedback.list("-visit_date", 200),
        ]);
        setDoctors(docs);
        setFeedback(reviews);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadData();
  }, []);

  // Match feedback to doctors by name (fuzzy match on specialist_name containing doctor_name or vice versa)
  const doctorStats = useMemo(() => {
    return doctors.map((doc) => {
      const docNameLower = doc.doctor_name?.toLowerCase().trim() || "";
      // Match by: feedback specialist_name contains doctor_name, or doctor_name contains specialist_name
      // Also try matching without "Dr." prefix
      const cleanDocName = docNameLower.replace(/^dr\.?\s+/, "");
      const matched = feedback.filter((f) => {
        const revName = (f.specialist_name || "").toLowerCase().trim();
        const cleanRevName = revName.replace(/^dr\.?\s+/, "");
        return cleanRevName.includes(cleanDocName) || cleanDocName.includes(cleanRevName) ||
               revName.includes(docNameLower) || docNameLower.includes(revName);
      });

      const ratings = matched.filter((f) => f.rating != null);
      const avgRating = ratings.length > 0 ? ratings.reduce((s, f) => s + f.rating, 0) / ratings.length : 0;
      const recommendCount = matched.filter((f) => f.would_recommend).length;
      const recommendPct = matched.length > 0 ? (recommendCount / matched.length) * 100 : 0;

      // Collect all helpful notes
      const allNotes = matched.flatMap((f) => f.helpful_notes || []);
      // Collect all tags
      const allTags = matched.flatMap((f) => f.tags || []);
      const tagCounts = allTags.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});
      const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

      // Latest visit
      const sortedByDate = [...matched].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
      const latestVisit = sortedByDate[0];

      return {
        ...doc,
        reviewCount: matched.length,
        avgRating,
        recommendCount,
        recommendPct,
        allNotes,
        topTags,
        latestVisit,
        matchedReviews: sortedByDate,
      };
    });
  }, [doctors, feedback]);

  // Sort
  const sorted = useMemo(() => {
    const withRatings = [...doctorStats];
    withRatings.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "rating") cmp = (a.avgRating || 0) - (b.avgRating || 0);
      else if (sortBy === "reviews") cmp = a.reviewCount - b.reviewCount;
      else if (sortBy === "recommend") cmp = a.recommendPct - b.recommendPct;
      else if (sortBy === "name") cmp = (a.doctor_name || "").localeCompare(b.doctor_name || "");
      return sortDir === "desc" ? -cmp : cmp;
    });
    return withRatings;
  }, [doctorStats, sortBy, sortDir]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  if (loading) {
    return <Card className="p-5"><div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-sky-600" /></div></Card>;
  }

  if (doctors.length === 0) {
    return (
      <Card className="p-8 text-center">
        <GitCompare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No doctors in your directory yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Add doctors and log specialist feedback to see comparisons.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        {[
          { key: "rating", label: "Rating" },
          { key: "reviews", label: "Reviews" },
          { key: "recommend", label: "Recommended" },
          { key: "name", label: "Name" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => toggleSort(s.key)}
            className={`text-xs px-2.5 py-1 rounded-full transition flex items-center gap-1 ${
              sortBy === s.key ? "bg-sky-100 text-sky-700 font-medium" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {s.label}
            {sortBy === s.key && <ArrowUpDown className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-semibold text-xs text-muted-foreground">Doctor</th>
              <th className="text-center py-2 px-2 font-semibold text-xs text-muted-foreground">Rating</th>
              <th className="text-center py-2 px-2 font-semibold text-xs text-muted-foreground">Reviews</th>
              <th className="text-center py-2 px-2 font-semibold text-xs text-muted-foreground">Recommended</th>
              <th className="text-left py-2 px-2 font-semibold text-xs text-muted-foreground">Top Tags</th>
              <th className="text-left py-2 px-2 font-semibold text-xs text-muted-foreground">Key Notes</th>
              <th className="text-left py-2 px-2 font-semibold text-xs text-muted-foreground">Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((doc, i) => (
              <motion.tr
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.02 * i }}
                className="border-b hover:bg-muted/30 transition"
              >
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs truncate">{doc.doctor_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{doc.specialty}</p>
                    </div>
                  </div>
                </td>
                <td className="text-center py-2.5 px-2">
                  {doc.avgRating > 0 ? (
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-xs">{doc.avgRating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </td>
                <td className="text-center py-2.5 px-2">
                  <span className={`text-xs font-medium ${doc.reviewCount > 0 ? "text-sky-600" : "text-muted-foreground"}`}>
                    {doc.reviewCount}
                  </span>
                </td>
                <td className="text-center py-2.5 px-2">
                  {doc.reviewCount > 0 ? (
                    <div className="flex items-center justify-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-600">{doc.recommendPct.toFixed(0)}%</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2.5 px-2">
                  {doc.topTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {doc.topTags.map(([tag, count]) => (
                        <span key={tag} className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2.5 px-2 max-w-[200px]">
                  {doc.allNotes.length > 0 ? (
                    <div className="space-y-1">
                      {doc.allNotes.slice(0, 2).map((note, idx) => (
                        <div key={idx} className="flex items-start gap-1 text-[10px] text-emerald-900 bg-emerald-50 rounded px-1.5 py-1">
                          <Quote className="w-2.5 h-2.5 mt-0.5 shrink-0 text-emerald-600" />
                          <span className="truncate">{note}</span>
                        </div>
                      ))}
                      {doc.allNotes.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">+{doc.allNotes.length - 2} more</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2.5 px-2">
                  {doc.latestVisit ? (
                    <span className="text-[10px] text-muted-foreground">{format(new Date(doc.latestVisit.visit_date), "MMM d, yyyy")}</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Insight */}
      {doctorStats.some((d) => d.reviewCount > 0) && (
        <Card className="p-4 bg-sky-50/50 border-sky-200">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
            <div className="text-xs text-sky-800">
              {(() => {
                const reviewed = doctorStats.filter((d) => d.reviewCount > 0);
                const top = [...reviewed].sort((a, b) => b.avgRating - a.avgRating)[0];
                const mostReviewed = [...reviewed].sort((a, b) => b.reviewCount - a.reviewCount)[0];
                const mostRecommended = [...reviewed].sort((a, b) => b.recommendPct - a.recommendPct)[0];
                return (
                  <>
                    <p>
                      <strong>{top.doctor_name}</strong> has your highest rating ({top.avgRating.toFixed(1)}/5).
                      {mostReviewed.doctor_name !== top.doctor_name && (
                        <> <strong>{mostReviewed.doctor_name}</strong> has the most reviews ({mostReviewed.reviewCount}).</>
                      )}
                      {mostRecommended.doctor_name !== top.doctor_name && mostRecommended.doctor_name !== mostReviewed.doctor_name && (
                        <> <strong>{mostRecommended.doctor_name}</strong> is {mostRecommended.recommendPct.toFixed(0)}% recommended.</>
                      )}
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}