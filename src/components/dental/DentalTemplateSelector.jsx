import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { dentalProcedureTemplates, painLevelColors } from "@/lib/dentalProcedureTemplates";
import { Sparkles, Stethoscope, Wrench, AlertCircle, Trash2, Crown, Anchor, Star, Scan, Link as LinkIcon, Wand2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const iconMap = {
  Sparkles, Stethoscope, Wrench, AlertCircle, Trash2, Crown, Anchor, Star, Scan, Link: LinkIcon,
};

export default function DentalTemplateSelector({ onApply }) {
  const [open, setOpen] = useState(false);

  const handleApply = (template) => {
    onApply(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-cyan-300 text-cyan-700 hover:bg-cyan-50">
          <Wand2 className="w-3.5 h-3.5 mr-1.5" />Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-cyan-600" /> Dental Procedure Templates
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2 mb-3">Select a template to pre-fill procedure notes, typical pain levels, and follow-up care instructions.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {dentalProcedureTemplates.map((tpl, i) => {
            const Icon = iconMap[tpl.icon] || Stethoscope;
            return (
              <motion.div key={tpl.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-3 cursor-pointer hover:shadow-md hover:border-cyan-300 transition-all" onClick={() => handleApply(tpl)}>
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold truncate">{tpl.name}</p>
                        <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      </div>
                      <Badge variant="outline" className="text-[9px] mt-0.5 bg-slate-50">{tpl.category}</Badge>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[9px] ${painLevelColors[tpl.typical_pain_level] || ""}`}>
                          Pain: {tpl.typical_pain_level}
                        </Badge>
                        {tpl.follow_up_recommended && (
                          <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">
                            Follow-up
                          </Badge>
                        )}
                        <span className="text-[9px] text-muted-foreground">~${tpl.typical_cost}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}