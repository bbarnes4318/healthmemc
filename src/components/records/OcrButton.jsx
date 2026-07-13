import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ScanText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function OcrButton({ record, onExtracted }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleOcr = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("ocrMedicalRecord", {
        file_url: record.file_url,
        record_id: record.id,
      });
      const text = res.data?.extracted_text;
      if (text && text.length > 0) {
        toast({
          title: "Text extracted",
          description: `${text.length} characters of searchable text added to this record's notes.`,
        });
        onExtracted?.();
      } else {
        toast({
          title: "No text found",
          description: "Could not extract readable text from this image. Try a clearer photo.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "OCR failed",
        description: "Could not process this file. Make sure it's a valid image or PDF.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-violet-600 hover:text-violet-700"
      title="Extract text via OCR"
      disabled={loading}
      onClick={handleOcr}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
    </Button>
  );
}