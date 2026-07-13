import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import {
  Watch, Heart, Activity, Moon, Footprints, RefreshCw, CheckCircle2,
  AlertCircle, ExternalLink, Zap, Loader2, TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

export default function WearableSync() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadConnection();
  }, [currentMemberId]);

  const loadConnection = async () => {
    setLoading(true);
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const conns = await base44.entities.WearableConnection.filter({ ...filter, status: "active" });
      setConnection(conns[0] || null);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!token.trim()) return;
    setError("");
    try {
      await base44.entities.WearableConnection.create({
        wearable_type: "oura",
        access_token: token.trim(),
        status: "active",
        family_member_id: currentMemberId || ""
      });
      setToken("");
      await loadConnection();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError("");
    setSyncResult(null);
    try {
      const res = await base44.functions.invoke("syncWearableData", {});
      setSyncResult(res.data);
      await loadConnection();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setSyncing(false);
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    try {
      await base44.entities.WearableConnection.update(connection.id, { status: "disconnected" });
      setConnection(null);
      setSyncResult(null);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
          <Watch className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold">Wearable Device Sync</h1>
          <p className="text-sm text-muted-foreground">Auto-sync heart rate, activity & sleep · {currentMemberName}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {connection ? (
        /* Connected State */
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Oura Ring Connected</p>
                  <p className="text-xs text-muted-foreground">
                    {connection.last_sync_date
                      ? `Last synced: ${new Date(connection.last_sync_date).toLocaleString()}`
                      : "Not yet synced"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSync} disabled={syncing} className="bg-sky-600 hover:bg-sky-700">
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {syncing ? "Syncing..." : "Sync Now"}
                </Button>
                <Button variant="outline" onClick={handleDisconnect} className="text-red-600 hover:text-red-700">
                  Disconnect
                </Button>
              </div>
            </div>
            {connection.last_error && (
              <div className="mt-3 flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">{connection.last_error}</p>
              </div>
            )}
          </Card>

          {syncResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-sky-600" />
                  <h3 className="font-display font-semibold text-sm">Sync Results</h3>
                </div>
                {syncResult.results?.map((r, i) => (
                  <div key={i} className="flex flex-wrap gap-4 text-sm">
                    {r.records_created != null && (
                      <span className="text-emerald-600 font-medium">{r.records_created} records created</span>
                    )}
                    {r.duplicates_skipped != null && (
                      <span className="text-muted-foreground">{r.duplicates_skipped} duplicates skipped</span>
                    )}
                    {r.error && <span className="text-red-600">{r.error}</span>}
                  </div>
                ))}
              </Card>
            </motion.div>
          )}

          {/* Synced Data Types */}
          <Card className="p-5">
            <h3 className="font-display font-semibold text-sm mb-3">Data Auto-Synced to Health Trends</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: Heart, label: "Resting Heart Rate", unit: "bpm", color: "text-rose-600 bg-rose-50" },
                { icon: Activity, label: "Activity Minutes", unit: "min", color: "text-emerald-600 bg-emerald-50" },
                { icon: Moon, label: "Sleep Duration", unit: "hrs", color: "text-indigo-600 bg-indigo-50" },
                { icon: Footprints, label: "Daily Steps", unit: "steps", color: "text-amber-600 bg-amber-50" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center p-3 rounded-xl bg-muted/40">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium mt-2 text-center">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.unit}</p>
                </div>
              ))}
            </div>
            <Link to="/health-trends-explorer">
              <Button variant="outline" className="w-full mt-4">
                <TrendingUp className="w-4 h-4 mr-2" />
                View on Health Trends Explorer
              </Button>
            </Link>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            Auto-sync runs daily at 8:00 AM UTC. Use "Sync Now" for an immediate update.
          </p>
        </motion.div>
      ) : (
        /* Not Connected State */
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                <Watch className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm">Connect Your Oura Ring</h3>
                <p className="text-xs text-muted-foreground">Automatically sync heart rate, activity & sleep data</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Step 1: Get your Oura Personal Access Token
                </label>
                <a
                  href="https://cloud.ouraring.com/personal-access-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline"
                >
                  Open Oura Token Page <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Log in → "Create new personal access token" → copy the token.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Step 2: Paste your token below
                </label>
                <Input
                  type="password"
                  placeholder="Enter your Oura access token..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                />
              </div>

              <Button onClick={handleConnect} disabled={!token.trim()} className="w-full bg-cyan-600 hover:bg-cyan-700">
                <Watch className="w-4 h-4 mr-2" />
                Connect Device
              </Button>
            </div>
          </Card>

          <Card className="p-5 bg-sky-50 border-sky-200">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-sky-900">How it works</p>
                <p className="text-xs text-sky-700 mt-1">
                  Once connected, your Oura Ring data syncs automatically every day — resting heart rate, daily activity
                  minutes, sleep duration, and step count flow directly into your Health Trends Explorer alongside
                  manually logged vitals.
                </p>
              </div>
            </div>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            More wearable brands (Fitbit, Garmin, Withings) coming soon. Your token is stored securely and only used to
            read your health data.
          </p>
        </motion.div>
      )}
    </div>
  );
}