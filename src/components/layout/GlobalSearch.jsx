import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Search, FileText, Pill, Calendar, Loader2 } from "lucide-react";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setOpen(true);
      try {
        const [records, logs, appts] = await Promise.all([
          base44.entities.MedicalRecord.list("-date", 30),
          base44.entities.MedicationLog.list("-scheduled_date", 30),
          base44.entities.Appointment.list("-date", 30),
        ]);

        const q = query.toLowerCase();
        const matched = [];

        records.forEach((r) => {
          if (r.title?.toLowerCase().includes(q) || r.notes?.toLowerCase().includes(q) || r.provider?.toLowerCase().includes(q)) {
            matched.push({ type: "record", title: r.title, subtitle: r.provider || r.category, date: r.date, path: "/records", icon: FileText, color: "bg-sky-50 text-sky-600" });
          }
        });
        logs.forEach((l) => {
          if (l.medication_name?.toLowerCase().includes(q) || l.notes?.toLowerCase().includes(q)) {
            matched.push({ type: "log", title: l.medication_name, subtitle: `Medication • ${l.status}`, date: l.scheduled_date, path: "/pharmacy", icon: Pill, color: "bg-emerald-50 text-emerald-600" });
          }
        });
        appts.forEach((a) => {
          if (a.title?.toLowerCase().includes(q) || a.provider?.toLowerCase().includes(q) || a.notes?.toLowerCase().includes(q)) {
            matched.push({ type: "appointment", title: a.title, subtitle: a.provider || a.type, date: a.date, path: "/dashboard", icon: Calendar, color: "bg-violet-50 text-violet-600" });
          }
        });

        setResults(matched.slice(0, 8));
      } catch (e) { console.error(e); }
      setLoading(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = (path) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
      <input
        type="text"
        placeholder="Search records, medications, appointments..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setOpen(true)}
        className="w-full h-9 pl-9 pr-9 rounded-lg border border-input bg-muted/50 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background transition-colors"
      />
      {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      {open && !loading && results.length === 0 && query && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-50 p-3 text-sm text-muted-foreground">
          No results found for "{query}"
        </div>
      )}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <button key={i} onClick={() => handleSelect(r.path)} className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/50 text-left transition border-b last:border-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${r.color}`}>
                <r.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.subtitle}{r.date && ` • ${new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}