import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileBarChart, Download, Loader2, DollarSign, Receipt, TrendingUp, Store } from "lucide-react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { motion } from "framer-motion";
import jsPDF from "jspdf";

export default function MonthlyExpenseReport() {
  const { currentMemberId } = useFamilyMember();
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const loadLogs = async () => {
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const data = await base44.entities.MedicationLog.filter(filter, "-scheduled_date", 500);
      setLogs(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, [currentMemberId]);

  const expenseLogs = useMemo(() => logs.filter((l) => l.receipt_amount || l.receipt_url), [logs]);

  const months = useMemo(() => {
    const set = new Set();
    expenseLogs.forEach((l) => {
      if (l.scheduled_date) {
        const d = new Date(l.scheduled_date);
        set.add(format(d, "yyyy-MM"));
      }
    });
    set.add(format(new Date(), "yyyy-MM"));
    return Array.from(set).sort().reverse();
  }, [expenseLogs]);

  const monthData = useMemo(() => {
    const filtered = expenseLogs.filter((l) => {
      if (!l.scheduled_date) return false;
      return format(new Date(l.scheduled_date), "yyyy-MM") === selectedMonth;
    });

    const total = filtered.reduce((sum, l) => sum + (l.receipt_amount || 0), 0);

    const byPharmacy = {};
    filtered.forEach((l) => {
      const name = l.pharmacy_name || "Unknown Pharmacy";
      if (!byPharmacy[name]) byPharmacy[name] = { count: 0, total: 0 };
      byPharmacy[name].count++;
      byPharmacy[name].total += l.receipt_amount || 0;
    });

    const byMedication = {};
    filtered.forEach((l) => {
      const name = l.medication_name || "Unknown";
      if (!byMedication[name]) byMedication[name] = { count: 0, total: 0 };
      byMedication[name].count++;
      byMedication[name].total += l.receipt_amount || 0;
    });

    return { filtered, total, byPharmacy, byMedication };
  }, [expenseLogs, selectedMonth]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const monthLabel = format(new Date(selectedMonth + "-01"), "MMMM yyyy");
    let y = 20;

    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text("Health Me Medical Center", 20, y);
    y += 8;
    doc.setFontSize(13);
    doc.setTextColor(100, 116, 139);
    doc.text(`Monthly Pharmacy Expense Report — ${monthLabel}`, 20, y);
    y += 12;

    doc.setDrawColor(226, 232, 240);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Spent: $${monthData.total.toFixed(2)}`, 20, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`${monthData.filtered.length} expense record(s)`, 20, y);
    y += 12;

    if (Object.keys(monthData.byPharmacy).length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Breakdown by Pharmacy", 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      Object.entries(monthData.byPharmacy)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([name, data]) => {
          doc.text(`  ${name}: $${data.total.toFixed(2)} (${data.count} receipt${data.count === 1 ? "" : "s"})`, 20, y);
          y += 6;
        });
      y += 6;
    }

    if (Object.keys(monthData.byMedication).length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Breakdown by Medication", 20, y);
      y += 7;
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      Object.entries(monthData.byMedication)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([name, data]) => {
          doc.text(`  ${name}: $${data.total.toFixed(2)} (${data.count} purchase${data.count === 1 ? "" : "s"})`, 20, y);
          y += 6;
        });
      y += 6;
    }

    if (monthData.filtered.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Individual Receipts", 20, y);
      y += 7;
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      monthData.filtered.forEach((l) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const date = l.scheduled_date ? format(new Date(l.scheduled_date), "MMM d, yyyy") : "N/A";
        doc.text(`${date} | ${l.medication_name} | ${l.pharmacy_name || "N/A"} | $${(l.receipt_amount || 0).toFixed(2)}`, 20, y);
        y += 5;
      });
    }

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on ${format(new Date(), "MMM d, yyyy")} — Health Me Medical Center`, 20, 285);

    doc.save(`pharmacy-expenses-${selectedMonth}.pdf`);
    toast({ title: "Report downloaded", description: `Expense report for ${monthLabel} saved.` });
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-amber-600" /></div>;
  }

  const monthLabel = format(new Date(selectedMonth + "-01"), "MMMM yyyy");
  const pharmacyEntries = Object.entries(monthData.byPharmacy).sort((a, b) => b[1].total - a[1].total);
  const medEntries = Object.entries(monthData.byMedication).sort((a, b) => b[1].total - a[1].total);
  const maxPharmacyTotal = Math.max(...pharmacyEntries.map((e) => e[1].total), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-sm">Monthly Expense Report</h3>
          <p className="text-xs text-muted-foreground">Track your pharmacy spending over time</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>{format(new Date(m + "-01"), "MMM yyyy")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleDownloadPdf} disabled={monthData.filtered.length === 0} className="bg-amber-600 hover:bg-amber-700">
            <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
          </Button>
        </div>
      </div>

      {monthData.filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <FileBarChart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No expense records for {monthLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">Upload pharmacy receipts in the Receipts tab to see them here</p>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px] text-muted-foreground font-medium">Total</span>
              </div>
              <p className="text-xl font-display font-bold text-amber-700">${monthData.total.toFixed(2)}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200">
              <div className="flex items-center gap-1.5 mb-1">
                <Receipt className="w-3.5 h-3.5 text-sky-600" />
                <span className="text-[10px] text-muted-foreground font-medium">Receipts</span>
              </div>
              <p className="text-xl font-display font-bold text-sky-700">{monthData.filtered.length}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
              <div className="flex items-center gap-1.5 mb-1">
                <Store className="w-3.5 h-3.5 text-violet-600" />
                <span className="text-[10px] text-muted-foreground font-medium">Pharmacies</span>
              </div>
              <p className="text-xl font-display font-bold text-violet-700">{pharmacyEntries.length}</p>
            </Card>
          </div>

          {/* By Pharmacy */}
          {pharmacyEntries.length > 0 && (
            <Card className="p-5">
              <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-600" /> Cost by Pharmacy
              </h4>
              <div className="space-y-2.5">
                {pharmacyEntries.map(([name, data]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{name}</span>
                      <span className="text-muted-foreground">${data.total.toFixed(2)} · {data.count} receipt{data.count === 1 ? "" : "s"}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        style={{ width: `${(data.total / maxPharmacyTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* By Medication */}
          {medEntries.length > 0 && (
            <Card className="p-5">
              <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-sky-600" /> Cost by Medication
              </h4>
              <div className="space-y-1.5">
                {medEntries.map(([name, data]) => (
                  <div key={name} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded-lg">
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground">${data.total.toFixed(2)} · {data.count} purchase{data.count === 1 ? "" : "s"}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Individual Receipts */}
          <Card className="p-5">
            <h4 className="text-xs font-semibold mb-3">Receipt Details — {monthLabel}</h4>
            <div className="space-y-2">
              {monthData.filtered.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                  {log.receipt_url ? (
                    <a href={log.receipt_url} target="_blank" rel="noopener noreferrer">
                      <img src={log.receipt_url} alt="Receipt" className="w-10 h-10 rounded object-cover border" />
                    </a>
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{log.medication_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {log.scheduled_date ? format(new Date(log.scheduled_date), "MMM d") : ""} {log.pharmacy_name ? `· ${log.pharmacy_name}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-amber-700">${(log.receipt_amount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}