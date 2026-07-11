import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FlaskConical, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

export default function LabComparison() {
  const [labRecords, setLabRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportAId, setReportAId] = useState("");
  const [reportBId, setReportBId] = useState("");
  const [vitalsA, setVitalsA] = useState([]);
  const [vitalsB, setVitalsB] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.MedicalRecord.filter({ category: "lab_results" }, "-date", 50);
        setLabRecords(data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const runComparison = async () => {
    if (!reportAId || !reportBId) return;
    setExtracting(true);
    setComparison(null);
    try {
      const recordA = labRecords.find((r) => r.id === reportAId);
      const recordB = labRecords.find((r) => r.id === reportBId);

      const [resA, resB] = await Promise.all([
        recordA.file_url
          ? base44.integrations.Core.ExtractDataFromUploadedFile({
              file_url: recordA.file_url,
              json_schema: {
                type: "object",
                properties: {
                  values: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        test_name: { type: "string" },
                        value: { type: "number" },
                        unit: { type: "string" },
                        reference_range: { type: "string" },
                      },
                    },
                  },
                },
              },
            })
          : { output: { values: [] } },
        recordB.file_url
          ? base44.integrations.Core.ExtractDataFromUploadedFile({
              file_url: recordB.file_url,
              json_schema: {
                type: "object",
                properties: {
                  values: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        test_name: { type: "string" },
                        value: { type: "number" },
                        unit: { type: "string" },
                        reference_range: { type: "string" },
                      },
                    },
                  },
                },
              },
            })
          : { output: { values: [] } },
      ]);

      setVitalsA(resA.output?.values || []);
      setVitalsB(resB.output?.values || []);

      const valsA = resA.output?.values || [];
      const valsB = resB.output?.values || [];

      const allTestNames = [...new Set([
        ...valsA.map((v) => v.test_name?.toLowerCase().trim()),
        ...valsB.map((v) => v.test_name?.toLowerCase().trim()),
      ])].filter(Boolean);

      const matched = allTestNames.map((name) => {
        const a = valsA.find((v) => v.test_name?.toLowerCase().trim() === name);
        const b = valsB.find((v) => v.test_name?.toLowerCase().trim() === name);
        const delta = a?.value != null && b?.value != null ? b.value - a.value : null;
        const pctChange = a?.value != null && b?.value != null && a.value !== 0
          ? ((b.value - a.value) / Math.abs(a.value)) * 100
          : null;
        return {
          test_name: a?.test_name || b?.test_name || name,
          valueA: a?.value,
          unitA: a?.unit,
          refA: a?.reference_range,
          valueB: b?.value,
          unitB: b?.unit,
          refB: b?.reference_range,
          delta,
          pctChange,
        };
      });

      setComparison(matched);
    } catch (e) {
      console.error(e);
    }
    setExtracting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (labRecords.length < 2) {
    return (
      <Card className="p-12 text-center">
        <FlaskConical className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">You need at least two lab reports to compare</p>
        <p className="text-xs text-muted-foreground mt-1">Upload lab result documents to track changes over time.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-sm">Lab Report Comparison</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Select two lab reports to see side-by-side changes in key values like glucose, cholesterol, and more.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Report A (earlier)</label>
            <Select value={reportAId} onValueChange={setReportAId}>
              <SelectTrigger><SelectValue placeholder="Select first report" /></SelectTrigger>
              <SelectContent>
                {labRecords.map((r) => (
                  <SelectItem key={r.id} value={r.id} disabled={r.id === reportBId}>
                    {r.title}{r.date ? ` — ${new Date(r.date).toLocaleDateString()}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="hidden sm:flex items-center pb-2">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Report B (later)</label>
            <Select value={reportBId} onValueChange={setReportBId}>
              <SelectTrigger><SelectValue placeholder="Select second report" /></SelectTrigger>
              <SelectContent>
                {labRecords.map((r) => (
                  <SelectItem key={r.id} value={r.id} disabled={r.id === reportAId}>
                    {r.title}{r.date ? ` — ${new Date(r.date).toLocaleDateString()}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={runComparison}
            disabled={!reportAId || !reportBId || extracting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {extracting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FlaskConical className="w-4 h-4 mr-2" />}
            Compare
          </Button>
        </div>
      </Card>

      {extracting && (
        <Card className="p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Extracting lab values from both reports...</p>
        </Card>
      )}

      {!extracting && comparison && comparison.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No matching test values found between these two reports.</p>
        </Card>
      )}

      {!extracting && comparison && comparison.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <h4 className="text-sm font-semibold mb-4">Value Changes</h4>
            <div className="space-y-2">
              {comparison.map((row, i) => {
                const hasDelta = row.delta != null;
                const isIncrease = hasDelta && row.delta > 0;
                const isDecrease = hasDelta && row.delta < 0;
                const isSame = hasDelta && row.delta === 0;
                return (
                  <div key={i} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition">
                    <div className="text-left">
                      <p className="text-sm font-medium capitalize">{row.test_name}</p>
                      {row.refA && <p className="text-[10px] text-muted-foreground">Ref: {row.refA}</p>}
                    </div>
                    <div className="text-center min-w-[80px]">
                      <p className="text-lg font-bold">
                        {row.valueA != null ? row.valueA : "—"}
                      </p>
                      {row.unitA && <p className="text-[10px] text-muted-foreground">{row.unitA}</p>}
                    </div>
                    <div className="text-center min-w-[80px]">
                      <p className={`text-lg font-bold ${isIncrease ? "text-amber-600" : isDecrease ? "text-emerald-600" : ""}`}>
                        {row.valueB != null ? row.valueB : "—"}
                      </p>
                      {row.unitB && <p className="text-[10px] text-muted-foreground">{row.unitB}</p>}
                    </div>
                    <div className="flex items-center justify-end min-w-[70px]">
                      {hasDelta ? (
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          isIncrease ? "bg-amber-50 text-amber-600" :
                          isDecrease ? "bg-emerald-50 text-emerald-600" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                          {isIncrease ? <TrendingUp className="w-3 h-3" /> : isDecrease ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {isSame ? "0" : `${isIncrease ? "+" : ""}${row.delta.toFixed(1)}`}
                          {row.pctChange != null && (
                            <span className="text-[10px] opacity-70">({isIncrease ? "+" : ""}{row.pctChange.toFixed(0)}%)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 italic">
              Note: Trend indicators show raw value changes, not whether values moved closer to or further from the reference range. Always consult your healthcare provider for interpretation.
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
}