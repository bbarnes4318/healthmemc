import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Calendar, FileText, Stethoscope, Pill, Loader2, ChevronRight,
  Filter, X
} from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const sourceConfig = {
  record: { label: "Medical Record", icon: FileText, color: "bg-rose-100 text-rose-700", path: "/records" },
  consultation: { label: "Consultation", icon: Stethoscope, color: "bg-sky-100 text-sky-700", path: "/appointment-history" },
  medication: { label: "Pharmacy", icon: Pill, color: "bg-amber-100 text-amber-700", path: "/pharmacy" },
};

export default function GlobalRecordSearch() {
  const { currentMemberId } = useFamilyMember();
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const matchesQuery = (text, q) => {
    if (!q) return true;
    return (text || "").toLowerCase().includes(q.toLowerCase());
  };

  const matchesDate = (dateStr, from, to) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (from && d < new Date(from)) return false;
    if (to) {
      const toEnd = new Date(to);
      toEnd.setHours(23, 59, 59);
      if (d > toEnd) return false;
    }
    return true;
  };

  const search = async () => {
    setLoading(true);
    setHasSearched(true);
    const q = query.trim();

    try {
      const [records, consultations, medLogs] = await Promise.all([
        base44.entities.MedicalRecord.list("-date", 100),
        base44.entities.Consultation.list("-created_date", 100),
        base44.entities.MedicationLog.list("-scheduled_date", 100),
      ]);

      let combined = [];

      // Medical records
      if (sourceFilter === "all" || sourceFilter === "record") {
        records.forEach((r) => {
          if (currentMemberId && r.family_member_id !== currentMemberId) return;
          const searchText = `${r.title || ""} ${r.notes || ""} ${r.provider || ""} ${r.category || ""}`;
          if (!matchesQuery(searchText, q)) return;
          if (!matchesDate(r.date || r.created_date, dateFrom, dateTo)) return;
          combined.push({
            id: r.id,
            source: "record",
            title: r.title || "Untitled Record",
            subtitle: r.category || "",
            date: r.date || r.created_date,
            detail: r.notes || r.provider || "",
            link: "/records",
          });
        });
      }

      // Consultations
      if (sourceFilter === "all" || sourceFilter === "consultation") {
        consultations.forEach((c) => {
          const reportText = c.report?.summary ? c.report.summary : "";
          const diagnosesText = c.report?.diagnoses ? c.report.diagnoses.map((d) => d.name || "").join(" ") : "";
          const searchText = `${c.symptoms || ""} ${c.specialty || ""} ${c.type || ""} ${reportText} ${diagnosesText}`;
          if (!matchesQuery(searchText, q)) return;
          if (!matchesDate(c.created_date, dateFrom, dateTo)) return;
          combined.push({
            id: c.id,
            source: "consultation",
            title: c.symptoms ? c.symptoms.slice(0, 80) : `${c.specialty || c.type || "Consultation"}`,
            subtitle: c.specialty || c.type || "",
            date: c.created_date,
            detail: reportText || "",
            link: "/appointment-history",
          });
        });
      }

      // Medication logs
      if (sourceFilter === "all" || sourceFilter === "medication") {
        medLogs.forEach((m) => {
          const searchText = `${m.medication_name || ""} ${m.pharmacy_name || ""} ${m.notes || ""} ${m.status || ""}`;
          if (!matchesQuery(searchText, q)) return;
          if (!matchesDate(m.scheduled_date || m.taken_at || m.created_date, dateFrom, dateTo)) return;
          combined.push({
            id: m.id,
            source: "medication",
            title: m.medication_name || "Medication",
            subtitle: m.status || "",
            date: m.scheduled_date || m.taken_at || m.created_date,
            detail: `${m.pharmacy_name ? m.pharmacy_name + " · " : ""}${m.notes || m.status || ""}`,
            link: "/pharmacy",
          });
        });
      }

      // Sort by date desc
      combined.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setResults(combined);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setQuery("");
    setSourceFilter("all");
    setDateFrom("");
    setDateTo("");
    setResults([]);
    setHasSearched(false);
  };

  const hasFilters = query || sourceFilter !== "all" || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-sky-600" /> Global Record Search
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Search across medical records, consultation reports, and pharmacy history by keyword and date range.</p>

        {/* Keyword search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by keyword (e.g., 'cholesterol', 'rash', 'amoxicillin')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            className="pl-9"
          />
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <Label className="text-xs mb-1 block">Source</Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-9"><Filter className="w-3.5 h-3.5 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="record">Medical Records</SelectItem>
                <SelectItem value="consultation">Consultations</SelectItem>
                <SelectItem value="medication">Pharmacy History</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">From Date</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">To Date</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={search} disabled={loading} className="bg-sky-600 hover:bg-sky-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
            Search
          </Button>
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" /> Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
            </div>
          ) : results.length === 0 ? (
            <Card className="p-8 text-center">
              <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No results found. Try adjusting your search terms or date range.</p>
            </Card>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">{results.length} result{results.length !== 1 ? "s" : ""} found</p>
              <div className="space-y-2">
                {results.map((r, i) => {
                  const cfg = sourceConfig[r.source];
                  const Icon = cfg.icon;
                  return (
                    <motion.div key={`${r.source}-${r.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                      <Link to={r.link}>
                        <Card className="p-3.5 flex items-center gap-3 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
                          <div className={`w-9 h-9 rounded-lg ${cfg.color} flex items-center justify-center shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{r.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                              {r.subtitle && <span className="text-[10px] text-muted-foreground capitalize">{r.subtitle}</span>}
                              {r.date && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {format(new Date(r.date), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                            {r.detail && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.detail}</p>}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}