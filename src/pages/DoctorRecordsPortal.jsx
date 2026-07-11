import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Share2, FileText, FlaskConical, Loader2, Stethoscope, Shield,
  Clock, Save, CheckCircle2, Mail, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const categoryStyles = {
  lab_results: { label: "Lab Report", icon: FlaskConical, color: "text-emerald-600", bg: "bg-emerald-50" },
  visit_summary: { label: "Visit Summary", icon: FileText, color: "text-sky-600", bg: "bg-sky-50" },
  imaging: { label: "Imaging", icon: FileText, color: "text-violet-600", bg: "bg-violet-50" },
  vaccination: { label: "Vaccination", icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
  prescription: { label: "Prescription", icon: FileText, color: "text-rose-600", bg: "bg-rose-50" },
  allergy: { label: "Allergy", icon: FileText, color: "text-red-600", bg: "bg-red-50" },
  intake_form: { label: "Intake Form", icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
  other: { label: "Other", icon: FileText, color: "text-gray-600", bg: "bg-gray-50" },
};

function RecordRow({ record, checked, onToggle }) {
  const cat = categoryStyles[record.category] || categoryStyles.other;
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
        checked ? "border-sky-300 bg-sky-50" : "border-border hover:bg-muted/50"
      }`}
    >
      <div className="pt-0.5">
        <Checkbox checked={checked} onCheckedChange={() => onToggle(record.id)} />
      </div>
      <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
        <cat.icon className={`w-4 h-4 ${cat.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{record.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${cat.bg} ${cat.color} font-medium`}>{cat.label}</span>
          {record.date && (
            <span className="text-[10px] text-muted-foreground">{new Date(record.date).toLocaleDateString()}</span>
          )}
          {record.provider && (
            <span className="text-[10px] text-muted-foreground truncate">{record.provider}</span>
          )}
        </div>
      </div>
    </label>
  );
}

export default function DoctorRecordsPortal() {
  const [grants, setGrants] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedGrantId, setSelectedGrantId] = useState(null);
  const [assignedIds, setAssignedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [grantData, recordData] = await Promise.all([
        base44.entities.ClinicianAccess.list("-created_date", 50),
        base44.entities.MedicalRecord.list("-date", 100),
      ]);
      const active = grantData.filter((g) => g.status === "active" && new Date(g.expires_at) >= new Date());
      setGrants(active);
      setRecords(recordData);
      if (active.length > 0 && !selectedGrantId) {
        setSelectedGrantId(active[0].id);
        setAssignedIds(active[0].assigned_record_ids || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const selectGrant = (grant) => {
    setSelectedGrantId(grant.id);
    setAssignedIds(grant.assigned_record_ids || []);
  };

  const toggleRecord = (id) => {
    setAssignedIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const selectAll = (ids) => {
    const allAssigned = ids.every((id) => assignedIds.includes(id));
    if (allAssigned) {
      setAssignedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setAssignedIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleSave = async () => {
    const grant = grants.find((g) => g.id === selectedGrantId);
    if (!grant) return;
    setSaving(true);
    try {
      await base44.entities.ClinicianAccess.update(grant.id, { assigned_record_ids: assignedIds });
      setGrants((prev) =>
        prev.map((g) => (g.id === grant.id ? { ...g, assigned_record_ids: assignedIds } : g))
      );
      toast({
        title: "Records assigned",
        description: `${assignedIds.length} record${assignedIds.length !== 1 ? "s" : ""} assigned to ${grant.doctor_name}.`,
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save assignments", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  const selectedGrant = grants.find((g) => g.id === selectedGrantId);
  const labReports = records.filter((r) => r.category === "lab_results");
  const otherRecords = records.filter((r) => r.category !== "lab_results");
  const labIds = labReports.map((r) => r.id);
  const otherIds = otherRecords.map((r) => r.id);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shrink-0">
          <Share2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Doctor Records Portal</h1>
          <p className="text-sm text-muted-foreground">Assign specific records & lab reports to individual doctors</p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-4 bg-sky-50 rounded-xl border border-sky-200">
        <Shield className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
        <p className="text-xs text-sky-800">
          Select a doctor, then choose which specific medical records and lab reports they can view. Only assigned records will be visible through their secure access link. Grant access first in the Clinician Access page.
        </p>
      </div>

      {grants.length === 0 ? (
        <Card className="p-12 text-center">
          <Stethoscope className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No active clinician access grants</p>
          <p className="text-xs text-muted-foreground mt-1">
            Grant access to a doctor in the Clinician Access page first, then return here to assign specific records.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => (window.location.href = "/clinician-dashboard")}
          >
            Go to Clinician Access
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Card>
      ) : (
        <>
          {/* Doctor selector */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {grants.map((grant) => {
              const count = (grant.assigned_record_ids || []).length;
              const isSelected = grant.id === selectedGrantId;
              return (
                <button
                  key={grant.id}
                  onClick={() => selectGrant(grant)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border whitespace-nowrap transition ${
                    isSelected
                      ? "border-sky-400 bg-sky-50 text-sky-700"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium">{grant.doctor_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {count} record{count !== 1 ? "s" : ""} assigned
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedGrant && (
            <>
              {/* Doctor info card */}
              <Card className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-sky-600" />
                    <p className="text-sm font-semibold">{selectedGrant.doctor_name}</p>
                    {selectedGrant.specialty && (
                      <span className="text-xs text-muted-foreground">• {selectedGrant.specialty}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-auto flex-wrap">
                    {selectedGrant.doctor_email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />{selectedGrant.doctor_email}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires {new Date(selectedGrant.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Summary bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${assignedIds.length > 0 ? "text-emerald-600" : "text-muted-foreground/30"}`} />
                  <span className="text-sm font-medium">
                    {assignedIds.length} of {records.length} records assigned
                  </span>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-sky-600 hover:bg-sky-700"
                  size="sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Save Assignments
                </Button>
              </div>

              {/* Lab Reports section */}
              {labReports.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-emerald-600" />
                      Lab Reports ({labReports.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => selectAll(labIds)}
                    >
                      {labIds.every((id) => assignedIds.includes(id)) ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {labReports.map((record) => (
                      <RecordRow
                        key={record.id}
                        record={record}
                        checked={assignedIds.includes(record.id)}
                        onToggle={toggleRecord}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Medical Records section */}
              {otherRecords.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-600" />
                      Medical Records ({otherRecords.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => selectAll(otherIds)}
                    >
                      {otherIds.every((id) => assignedIds.includes(id)) ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {otherRecords.map((record) => (
                      <RecordRow
                        key={record.id}
                        record={record}
                        checked={assignedIds.includes(record.id)}
                        onToggle={toggleRecord}
                      />
                    ))}
                  </div>
                </div>
              )}

              {records.length === 0 && (
                <Card className="p-8 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No medical records found</p>
                  <p className="text-xs text-muted-foreground mt-1">Upload records in the Medical Records page to assign them to doctors.</p>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}