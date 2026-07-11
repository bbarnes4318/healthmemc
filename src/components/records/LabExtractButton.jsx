import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Microscope, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function LabExtractButton({ record, onExtracted }) {
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("extractLabValues", {
        file_url: record.file_url,
        family_member_id: record.family_member_id,
      });
      const count = res.data?.extracted ?? 0;
      if (count > 0) {
        toast({
          title: "Lab values extracted",
          description: `${count} vital record${count > 1 ? "s" : ""} added from this lab report.`,
        });
        onExtracted?.();
      } else {
        toast({
          title: "No extractable values found",
          description: "This document didn't contain recognizable lab values (glucose, cholesterol, BP, etc.).",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Extraction failed",
        description: "Could not analyze this file. Make sure it's a valid PDF lab report.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
      title="Extract lab values to vitals"
      disabled={loading}
      onClick={handleExtract}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Microscope className="w-4 h-4" />}
    </Button>
  );
}