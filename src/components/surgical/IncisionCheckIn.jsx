import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Loader2, AlertTriangle, CheckCircle, Thermometer, Activity, Image as ImageIcon, X } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format } from "date-fns";
import { motion } from "framer-motion";

const woundStatusConfig = {
  clean_healing: { label: "Clean & Healing", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  redness: { label: "Redness", color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertTriangle },
  swelling: { label: "Swelling", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle },
  discharge: { label: "Discharge", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
  dehiscence: { label: "Wound Opening", color: "bg-red-200 text-red-800 border-red-300", icon: AlertTriangle },
  infection: { label: "Infection Signs", color: "bg-red-200 text-red-800 border-red-300", icon: AlertTriangle },
  fully_healed: { label: "Fully Healed", color: "bg-sky-100 text-sky-700 border-sky-200", icon: CheckCircle },
};

export default function IncisionCheckIn() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState("");
  const [surgeries, setSurgeries] = useState([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [woundStatus, setWoundStatus] = useState("clean_healing");
  const [temperature, setTemperature] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const data = await base44.entities.SurgicalRecovery.filter(filter, "-log_date", 50);
      setLogs(data);
      const unique = [...new Set(data.map((d) => d.surgery_name))];
      setSurgeries(unique);
      if (unique.length > 0 && !selectedSurgery) setSelectedSurgery(unique[0]);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentMemberId]);

  useEffect(() => { load(); }, [load]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
      toast({ title: "Photo uploaded", description: "Incision photo attached." });
    } catch (e) {
      console.error(e);
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!selectedSurgery) {
      toast({ title: "Select a surgery first", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const surgeryRecord = logs.find((l) => l.surgery_name === selectedSurgery);
      const surgeryDate = surgeryRecord?.surgery_date;
      const daysPostOp = surgeryDate
        ? Math.floor((new Date(today) - new Date(surgeryDate)) / (1000 * 60 * 60 * 24))
        : 0;

      await base44.entities.SurgicalRecovery.create({
        surgery_name: selectedSurgery,
        surgery_date: surgeryDate || today,
        surgeon: surgeryRecord?.surgeon || "",
        hospital: surgeryRecord?.hospital || "",
        log_date: today,
        days_post_op: daysPostOp,
        wound_status: woundStatus,
        temperature: temperature ? parseFloat(temperature) : null,
        photo_url: photoUrl || null,
        notes,
        family_member_id: currentMemberId || null,
      });

      toast({ title: "Check-in saved", description: "Incision site check-in recorded." });
      setPhotoUrl("");
      setWoundStatus("clean_healing");
      setTemperature("");
      setNotes("");
      load();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const infectionWarning = logs.filter(
    (l) => ["discharge", "dehiscence", "infection"].includes(l.wound_status) ||
    (l.temperature && l.temperature >= 100.4)
  );

  if (loading) {
    return (
      <Card className="p-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {infectionWarning.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-300">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Potential Infection Warning</p>
              <p className="text-xs text-red-700 mt-0.5">
                {infectionWarning.length} check-in(s) show concerning signs. Contact your surgeon immediately if you notice fever, increasing pain, redness, swelling, or discharge.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Check-in form */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-5 h-5 text-rose-600" />
          <h3 className="font-semibold text-sm">Incision Site Check-In</h3>
        </div>

        <div className="space-y-4">
          {surgeries.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Surgery</label>
              <select
                value={selectedSurgery}
                onChange={(e) => setSelectedSurgery(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {surgeries.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Photo upload */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Incision Photo</label>
            {photoUrl ? (
              <div className="relative w-full max-w-xs">
                <img src={photoUrl} alt="Incision" className="w-full rounded-lg border" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => setPhotoUrl("")}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Tap to upload incision photo</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            )}
          </div>

          {/* Wound status */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Wound Status</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(woundStatusConfig).map(([key, cfg]) => {
                const WIcon = cfg.icon;
                const active = woundStatus === key;
                return (
                  <button
                    key={key}
                    onClick={() => setWoundStatus(key)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition ${active ? cfg.color : "border-border bg-background hover:bg-muted/50 text-muted-foreground"}`}
                  >
                    <WIcon className="w-4 h-4" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5" /> Temperature (°F)
            </label>
            <Input
              type="number"
              step="0.1"
              placeholder="98.6"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="max-w-[160px]"
            />
            {temperature && parseFloat(temperature) >= 100.4 && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Fever — contact your surgeon
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
            <Textarea
              placeholder="Any observations about the incision site..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !selectedSurgery} className="bg-rose-600 hover:bg-rose-700">
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Save Check-In
          </Button>
        </div>
      </Card>

      {/* History */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-rose-600" />
          <h3 className="font-semibold text-sm">Incision Check-In History</h3>
        </div>
        {logs.filter((l) => l.wound_status || l.photo_url).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No incision check-ins yet</p>
        ) : (
          <div className="space-y-3">
            {logs.filter((l) => l.wound_status || l.photo_url).slice(0, 15).map((log) => {
              const cfg = woundStatusConfig[log.wound_status] || woundStatusConfig.clean_healing;
              return (
                <motion.div key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex gap-3 p-3 rounded-lg border bg-card">
                    {log.photo_url && (
                      <img src={log.photo_url} alt="Incision" className="w-16 h-16 rounded-md object-cover border shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold">{log.surgery_name}</span>
                        <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                        {log.days_post_op != null && (
                          <span className="text-[10px] text-muted-foreground">Day {log.days_post_op} post-op</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {log.temperature && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Thermometer className="w-3 h-3" />{log.temperature}°F
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {log.log_date ? format(new Date(log.log_date), "MMM d, yyyy") : ""}
                        </span>
                      </div>
                      {log.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{log.notes}</p>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}