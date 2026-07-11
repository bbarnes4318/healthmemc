import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Bookmark, ChevronDown, Trash2, Loader2, Save, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function TemplateLibrary({ form, onLoadTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.IntakeTemplate.list("-created_date", 50);
      setTemplates(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleLoad = (template) => {
    onLoadTemplate({
      chief_complaint: template.chief_complaint || "",
      symptom_duration: template.symptom_duration || "",
      symptom_severity: template.symptom_severity || "moderate",
      current_medications: template.current_medications || "",
      allergies: template.allergies || "",
      medical_history: template.medical_history || "",
      surgical_history: template.surgical_history || "",
      family_history: template.family_history || "",
      lifestyle_notes: template.lifestyle_notes || "",
      questions_for_provider: template.questions_for_provider || "",
    });
    toast({ title: "Template loaded", description: `"${template.template_name}" applied to your form.` });
  };

  const handleSave = async () => {
    if (!templateName.trim() || !form.chief_complaint.trim()) return;
    setSaving(true);
    try {
      await base44.entities.IntakeTemplate.create({
        template_name: templateName,
        chief_complaint: form.chief_complaint,
        symptom_duration: form.symptom_duration,
        symptom_severity: form.symptom_severity,
        current_medications: form.current_medications,
        allergies: form.allergies,
        medical_history: form.medical_history,
        surgical_history: form.surgical_history,
        family_history: form.family_history,
        lifestyle_notes: form.lifestyle_notes,
        questions_for_provider: form.questions_for_provider,
      });
      setTemplateName("");
      setSaveDialogOpen(false);
      toast({ title: "Template saved", description: `"${templateName}" is now available for future intake forms.` });
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await base44.entities.IntakeTemplate.delete(id);
      setTemplates(templates.filter((t) => t.id !== id));
      toast({ title: "Template deleted" });
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu onOpenChange={(open) => { if (open && templates.length === 0) loadTemplates(); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <Bookmark className="w-3.5 h-3.5 mr-1.5" />
              Load Template
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel className="text-xs">Saved Symptom Profiles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="px-2 py-4 text-center">
                <FileText className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No templates saved yet</p>
              </div>
            ) : (
              templates.map((t) => (
                <DropdownMenuItem key={t.id} className="flex items-center justify-between gap-2 py-2" onClick={() => handleLoad(t)}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{t.template_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.chief_complaint}</p>
                  </div>
                  <button onClick={(e) => handleDelete(t.id, e)} className="text-red-400 hover:text-red-600 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          disabled={!form.chief_complaint.trim()}
          onClick={() => setSaveDialogOpen(true)}
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Save as Template
        </Button>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Symptom Profile Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground">Give this symptom profile a name so you can quickly load it before future appointments.</p>
            <Input
              placeholder="e.g., Migraine Profile, Annual Checkup"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!templateName.trim() || saving} className="bg-violet-600 hover:bg-violet-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}