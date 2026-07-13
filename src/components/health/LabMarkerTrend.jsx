import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FlaskConical, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, Upload, FileText } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, Dot
} from "recharts";
import moment from "moment";

// Common reference ranges for key lab markers
const REFERENCE_RANGES = {
  glucose: { min: 70, max: 100, unit: "mg/dL", label: "Glucose" },
  cholesterol: { min: 0, max: 200, unit: "mg/dL", label: "Total Cholesterol" },
  ldl: { min: 0, max: 100, unit: "mg/dL", label: "LDL" },
  hdl: { min: 40, max: 60, unit: "mg/dL", label: "HDL" },
  triglycerides: { min: 0, max: 150, unit: "mg/dL", label: "Triglycerides" },
  hemoglobin: { min: 13.5, max: 17.5, unit: "g/dL", label: "Hemoglobin" },
  "white blood cell": { min: 4.5, max: 11.0, unit: "K/uL", label: "WBC" },
  "red blood cell": { min: 4.7, max: 6.1, unit: "M/uL", label: "RBC" },
  platelet: { min: 150, max: 450, unit: "K/uL", label: "Platelets" },
  creatinine: { min: 0.7, max: 1.3, unit: "mg/dL", label: "Creatinine" },
  "thyroid stimulating hormone": { min: 0.4, max: 4.0, unit: "mIU/L", label: "TSH" },
  "vitamin d": { min: 30, max: 100, unit: "ng/mL", label: "Vitamin D" },
  "vitamin b12": { min: 200, max: 900, unit: "pg/mL", label: "Vitamin B12" },
  iron: { min: 60, max: 170, unit: "ug/dL", label: "Iron" },
  sodium: { min: 135, max: 145, unit: "mmol/L", label: "Sodium" },
  potassium: { min: 3.5, max: 5.0, unit: "mmol/L", label: "Potassium" },
  "a1c": { min: 0, max: 5.7, unit: "%", label: "Hemoglobin A1c" },
  "hemoglobin a1c": { min: 0, max: 5.7, unit: "%", label: "Hemoglobin A1c" },
  alt: { min: 7, max: 56, unit: "U/L", label: "ALT" },
  ast: { min: 10, max: 40, unit: "U/L", label: "AST" },
};

function normalizeTestName(name) {
  return (name || "").toLowerCase().trim();
}

function findReferenceRange(testName, extractedRef) {
  const normalized = normalizeTestName(testName);
  // Try exact match
  if (REFERENCE_RANGES[normalized]) return REFERENCE_RANGES[normalized];
  // Try partial match
  for (const key of Object.keys(REFERENCE_RANGES)) {
    if (normalized.includes(key) || key.includes(normalized)) return REFERENCE_RANGES[key];
  }
  // Try to parse from extracted reference range string like "70-100" or "70 - 100 mg/dL"
  if (extractedRef) {
    const match = extractedRef.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    if (match) {
      return {
        min: parseFloat(match[1]),
        max: parseFloat(match[2]),
        unit: "",
        label: testName,
      };
    }
  }
  return null;
}

function isOutOfRange(value, ref) {
  if (!ref || value == null) return false;
  return value < ref.min || value > ref.max;
}

function CustomDot({ cx, cy, payload, testKey }) {
  if (cx == null || cy == null) return null;
  const ref = payload._ref;
  const value = payload[testKey];
  if (!ref || value == null) return <Dot cx={cx} cy={cy} r={3} fill="#3b82f6" />;
  const outOfRange = isOutOfRange(value, ref);
  return <Dot cx={cx} cy={cy} r={4} fill={outOfRange ? "#ef4444" : "#22c55e"} stroke="#fff" strokeWidth={1} />;
}

export default function LabMarkerTrend() {
  const [labRecords, setLabRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { currentMemberId } = useFamilyMember();
  const fileInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.MedicalRecord.filter({ category: "lab_results" }, "-date", 20);
        setLabRecords(data);
        if (data.length > 0) {
          await extractAll(data);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const extractAll = async (records) => {
    const withFiles = records.filter((r) => r.file_url);
    if (withFiles.length === 0) return;
    setExtracting(true);
    try {
      const results = await Promise.all(
        withFiles.map(async (rec) => {
          try {
            const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
              file_url: rec.file_url,
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
            });
            return { record: rec, values: res.output?.values || [] };
          } catch (e) {
            console.error("Failed to extract from", rec.title, e);
            return { record: rec, values: [] };
          }
        })
      );
      setExtractedData(results);

      // Auto-select first available marker
      const allMarkers = getAllMarkers(results);
      if (allMarkers.length > 0 && !selectedMarker) {
        setSelectedMarker(allMarkers[0].key);
      }
    } catch (e) { console.error(e); }
    setExtracting(false);
  };

  const getAllMarkers = (data) => {
    const markerMap = {};
    (data || extractedData).forEach(({ record, values }) => {
      values.forEach((v) => {
        if (v.value == null) return;
        const key = normalizeTestName(v.test_name);
        if (!key) return;
        if (!markerMap[key]) {
          const ref = findReferenceRange(v.test_name, v.reference_range);
          markerMap[key] = {
            key,
            label: v.test_name || ref?.label || key,
            unit: v.unit || ref?.unit || "",
            ref,
          };
        }
      });
    });
    return Object.values(markerMap).sort((a, b) => a.label.localeCompare(b.label));
  };

  const allMarkers = useMemo(() => getAllMarkers(), [extractedData]);

  const chartData = useMemo(() => {
    if (!selectedMarker) return [];
    return extractedData
      .filter(({ values }) => values.some((v) => normalizeTestName(v.test_name) === selectedMarker))
      .sort((a, b) => new Date(a.record.date || a.record.created_date) - new Date(b.record.date || b.record.created_date))
      .map(({ record, values }) => {
        const v = values.find((val) => normalizeTestName(val.test_name) === selectedMarker);
        const markerInfo = allMarkers.find((m) => m.key === selectedMarker);
        const ref = markerInfo?.ref || findReferenceRange(v?.test_name, v?.reference_range);
        return {
          date: moment(record.date || record.created_date).format("MMM D, yy"),
          [selectedMarker]: v?.value,
          _ref: ref,
          _value: v?.value,
          _recordTitle: record.title,
        };
      });
  }, [selectedMarker, extractedData, allMarkers]);

  const selectedMarkerInfo = allMarkers.find((m) => m.key === selectedMarker);
  const ref = selectedMarkerInfo?.ref;

  // Trend analysis: compare latest vs previous
  const trendAnalysis = useMemo(() => {
    if (chartData.length < 2) return null;
    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];
    const latestVal = latest._value;
    const prevVal = previous._value;
    if (latestVal == null || prevVal == null) return null;
    const delta = latestVal - prevVal;
    const pctChange = prevVal !== 0 ? ((delta / Math.abs(prevVal)) * 100) : null;
    const latestOutOfRange = ref ? isOutOfRange(latestVal, ref) : false;
    const prevOutOfRange = ref ? isOutOfRange(prevVal, ref) : false;
    let direction = "stable";
    if (Math.abs(delta) > 0.01) direction = delta > 0 ? "up" : "down";
    // Is this an improvement? Depends on whether moving toward range
    let isImprovement = null;
    if (ref) {
      if (prevOutOfRange && !latestOutOfRange) isImprovement = true;
      else if (!prevOutOfRange && latestOutOfRange) isImprovement = false;
      else if (prevOutOfRange && latestOutOfRange) {
        // Both out of range — check if moving closer
        if (prevVal < ref.min && latestVal < ref.min) isImprovement = latestVal > prevVal;
        else if (prevVal > ref.max && latestVal > ref.max) isImprovement = latestVal < prevVal;
      } else if (!prevOutOfRange && !latestOutOfRange) {
        isImprovement = true; // stayed in range
      }
    }
    return { delta, pctChange, direction, latestOutOfRange, prevOutOfRange, isImprovement, latestVal, prevVal };
  }, [chartData, ref]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const newRecord = await base44.entities.MedicalRecord.create({
        title: file.name.replace(/\.[^/.]+$/, ""),
        category: "lab_results",
        date: new Date().toISOString().split("T")[0],
        file_url: uploadRes.file_url,
        family_member_id: currentMemberId || undefined,
        review_status: "pending",
      });
      toast({
        title: "Lab report uploaded",
        description: "Extracting health markers from your report...",
      });
      // Re-fetch and re-extract
      const data = await base44.entities.MedicalRecord.filter({ category: "lab_results" }, "-date", 20);
      setLabRecords(data);
      await extractAll(data);
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e.message || "Could not upload the file.",
        variant: "destructive",
      });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  if (labRecords.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FlaskConical className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No lab reports uploaded yet</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">Upload a lab result PDF or image to automatically extract and track your key health markers.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          className="bg-sky-600 hover:bg-sky-700"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
          {uploading ? "Uploading..." : "Upload Lab Report"}
        </Button>
      </Card>
    );
  }

  if (extracting) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Extracting lab values from your reports...</p>
      </Card>
    );
  }

  if (allMarkers.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FlaskConical className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No extractable lab values found</p>
        <p className="text-xs text-muted-foreground mt-1">Make sure your lab reports are uploaded as PDF or image files.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-sky-600" />
          <h3 className="font-display font-semibold text-sm">Lab Marker Trends</h3>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
            {uploading ? "Uploading..." : "Upload Lab"}
          </Button>
        </div>
      </div>

      {/* Marker Selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {allMarkers.map((m) => (
          <button
            key={m.key}
            onClick={() => setSelectedMarker(m.key)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
              selectedMarker === m.key
                ? "bg-sky-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Trend Analysis Banner */}
      {trendAnalysis && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
          <div className={`p-3 rounded-lg mb-4 flex items-center gap-3 ${
            trendAnalysis.isImprovement === true
              ? "bg-emerald-50 border border-emerald-200"
              : trendAnalysis.isImprovement === false
              ? "bg-red-50 border border-red-200"
              : "bg-muted/50 border"
          }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              trendAnalysis.isImprovement === true ? "bg-emerald-100" :
              trendAnalysis.isImprovement === false ? "bg-red-100" : "bg-muted"
            }`}>
              {trendAnalysis.direction === "up" ? (
                <ArrowUp className={`w-4 h-4 ${
                  trendAnalysis.isImprovement === false ? "text-red-600" :
                  trendAnalysis.isImprovement === true ? "text-emerald-600" : "text-muted-foreground"
                }`} />
              ) : trendAnalysis.direction === "down" ? (
                <ArrowDown className={`w-4 h-4 ${
                  trendAnalysis.isImprovement === true ? "text-emerald-600" :
                  trendAnalysis.isImprovement === false ? "text-red-600" : "text-muted-foreground"
                }`} />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {selectedMarkerInfo?.label || selectedMarker}
                {selectedMarkerInfo?.unit && <span className="text-xs text-muted-foreground"> ({selectedMarkerInfo.unit})</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {trendAnalysis.prevVal} → {trendAnalysis.latestVal}
                {trendAnalysis.pctChange != null && (
                  <span className={`ml-1 font-medium ${trendAnalysis.delta > 0 ? "text-amber-600" : trendAnalysis.delta < 0 ? "text-sky-600" : ""}`}>
                    ({trendAnalysis.delta > 0 ? "+" : ""}{trendAnalysis.delta.toFixed(1)}, {trendAnalysis.pctChange > 0 ? "+" : ""}{trendAnalysis.pctChange.toFixed(0)}%)
                  </span>
                )}
              </p>
            </div>
            {trendAnalysis.isImprovement === true && (
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 shrink-0">
                <TrendingUp className="w-3.5 h-3.5" /> Improving
              </span>
            )}
            {trendAnalysis.isImprovement === false && (
              <span className="text-xs font-medium text-red-600 flex items-center gap-1 shrink-0">
                <TrendingDown className="w-3.5 h-3.5" /> Needs attention
              </span>
            )}
            {trendAnalysis.latestOutOfRange && ref && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                Out of range
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Chart */}
      {chartData.length < 2 ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
          Need at least 2 reports with this marker to show a trend
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
              formatter={(value) => [value, selectedMarkerInfo?.label || selectedMarker]}
              labelFormatter={(label, payload) => {
                const p = payload?.[0]?.payload;
                return p?._recordTitle ? `${label} — ${p._recordTitle}` : label;
              }}
            />
            {/* Reference range shaded area */}
            {ref && (
              <ReferenceArea
                y1={ref.min}
                y2={ref.max}
                fill="#22c55e"
                fillOpacity={0.08}
                stroke="#22c55e"
                strokeOpacity={0.2}
                strokeDasharray="3 3"
                label={{ value: `Normal: ${ref.min}-${ref.max} ${ref.unit || ""}`, fontSize: 9, fill: "#22c55e", position: "insideTopLeft" }}
              />
            )}
            <Line
              type="monotone"
              dataKey={selectedMarker}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={<CustomDot testKey={selectedMarker} />}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Reference range info */}
      {ref && (
        <p className="text-[10px] text-muted-foreground mt-3 italic">
          Green dots = within normal range ({ref.min}–{ref.max} {ref.unit}). Red dots = out of range. Shaded band shows the reference range. Always consult your provider for interpretation.
        </p>
      )}
    </Card>
  );
}