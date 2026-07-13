import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Loader2, FileText, Calendar, Stethoscope, HeartPulse, Users,
  AlertTriangle, CheckCircle, ArrowLeft, ChevronRight, Activity, ArrowUpDown, Filter
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

const typeIcons = {
  ai_doctor: Stethoscope,
  ai_nurse: HeartPulse,
  ai_specialist: Users,
};

const typeLabels = {
  ai_doctor: "AI Doctor",
  ai_nurse: "AI Nurse",
  ai_specialist: "AI Specialist",
};

const severityColors = {
  low: "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  emergency: "bg-red-100 text-red-700",
};

export default function AppointmentHistory() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedConsult, setSelectedConsult] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [data, members] = await Promise.all([
          base44.entities.Consultation.filter({ status: "completed" }, "-created_date", 200),
          base44.entities.FamilyMember.list("-created_date", 50),
        ]);
        setConsultations(data);
        setFamilyMembers(members);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = consultations.filter((c) => {
    if (filterType !== "all" && c.type !== filterType) return false;
    if (filterMember !== "all" && c.family_member_id !== filterMember) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const summary = c.report?.summary?.toLowerCase() || "";
      const symptoms = c.symptoms?.toLowerCase() || "";
      const specialty = c.specialty?.toLowerCase() || "";
      if (!summary.includes(q) && !symptoms.includes(q) && !specialty.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    return sortOrder === "newest"
      ? new Date(b.created_date) - new Date(a.created_date)
      : new Date(a.created_date) - new Date(b.created_date);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <Link to="/">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Appointment History</h1>
          <p className="text-sm text-muted-foreground">
            {consultations.length} completed {consultations.length === 1 ? "visit" : "visits"} on record
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by symptom, summary, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
        >
          <option value="all">All Family Members</option>
          {familyMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name || "Unnamed"}</option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <div className="flex gap-1 border rounded-lg p-0.5 bg-card">
          {[
            { value: "all", label: "All" },
            { value: "ai_doctor", label: "Doctor" },
            { value: "ai_nurse", label: "Nurse" },
            { value: "ai_specialist", label: "Specialist" },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={filterType === opt.value ? "default" : "ghost"}
              size="sm"
              className={`h-8 text-xs ${filterType === opt.value ? "bg-sky-600 hover:bg-sky-700" : ""}`}
              onClick={() => setFilterType(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {consultations.length === 0
              ? "No completed consultations yet"
              : "No results match your search"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((consult, i) => {
            const Icon = typeIcons[consult.type] || Stethoscope;
            const date = new Date(consult.created_date);
            return (
              <motion.div
                key={consult.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className="p-4 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setSelectedConsult(consult)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold">
                          {typeLabels[consult.type] || consult.type}
                        </h3>
                        {consult.specialty && (
                          <Badge variant="outline" className="text-[10px]">{consult.specialty}</Badge>
                        )}
                        {consult.severity && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${severityColors[consult.severity] || severityColors.low}`}>
                            {consult.severity}
                          </span>
                        )}
                      </div>
                      {consult.report?.summary ? (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {consult.report.summary}
                        </p>
                      ) : consult.symptoms ? (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {consult.symptoms}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(date, "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedConsult} onOpenChange={(v) => !v && setSelectedConsult(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedConsult && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = typeIcons[selectedConsult.type] || Stethoscope;
                    return <Icon className="w-5 h-5 text-sky-600" />;
                  })()}
                  {typeLabels[selectedConsult.type] || selectedConsult.type}
                  {selectedConsult.specialty && ` — ${selectedConsult.specialty}`}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Date & Severity */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(selectedConsult.created_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </span>
                  {selectedConsult.severity && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${severityColors[selectedConsult.severity] || severityColors.low}`}>
                      {selectedConsult.severity} severity
                    </span>
                  )}
                </div>

                {/* Symptoms */}
                {selectedConsult.symptoms && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Reported Symptoms</h4>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedConsult.symptoms}</p>
                  </div>
                )}

                {/* Summary */}
                {selectedConsult.report?.summary && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Summary</h4>
                    <p className="text-sm bg-sky-50 rounded-lg p-3">{selectedConsult.report.summary}</p>
                  </div>
                )}

                {/* Diagnoses */}
                {selectedConsult.report?.diagnoses?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Possible Diagnoses</h4>
                    <div className="space-y-2">
                      {selectedConsult.report.diagnoses.map((d, idx) => (
                        <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{d.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              d.confidence === "High" ? "bg-green-100 text-green-700" :
                              d.confidence === "Moderate" ? "bg-amber-100 text-amber-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>{d.confidence}</span>
                          </div>
                          {d.description && <p className="text-xs text-muted-foreground mt-1">{d.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emergency Warnings */}
                {selectedConsult.report?.emergency_warnings?.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Emergency Warnings
                    </h4>
                    <ul className="space-y-1">
                      {selectedConsult.report.emergency_warnings.map((w, idx) => (
                        <li key={idx} className="text-xs text-red-700 flex items-start gap-1.5">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Tests */}
                {selectedConsult.report?.recommended_tests?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Recommended Tests</h4>
                    <ul className="space-y-1">
                      {selectedConsult.report.recommended_tests.map((t, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Treatments */}
                {selectedConsult.report?.recommended_treatments?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Recommended Treatments</h4>
                    <ul className="space-y-1">
                      {selectedConsult.report.recommended_treatments.map((t, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow-up Plan */}
                {selectedConsult.report?.follow_up_plan && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-up Plan</h4>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedConsult.report.follow_up_plan}</p>
                  </div>
                )}

                {/* Lifestyle Recommendations */}
                {selectedConsult.report?.lifestyle_recommendations?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Lifestyle Recommendations</h4>
                    <ul className="space-y-1">
                      {selectedConsult.report.lifestyle_recommendations.map((r, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Activity className="w-3.5 h-3.5 text-violet-600 mt-0.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}