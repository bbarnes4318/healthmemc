import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";

export default function DrugInteractionAlert({ open, interactions, newMedName, onConfirm, onCancel }) {
  const hasSevere = interactions?.some((i) => i.severity === "severe");
  const hasModerate = interactions?.some((i) => i.severity === "moderate");

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <AlertDialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasSevere ? "bg-red-100" : "bg-amber-100"}`}>
              {hasSevere ? (
                <ShieldAlert className="w-5 h-5 text-red-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                {hasSevere ? "Severe Drug Interaction Warning" : "Potential Drug Interaction Found"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                {newMedName} may interact with your existing medications. Review the details below before proceeding.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-2 my-3">
          {interactions?.map((interaction, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                interaction.severity === "severe"
                  ? "bg-red-50 border-red-200"
                  : interaction.severity === "moderate"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-sky-50 border-sky-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-semibold">
                  {interaction.new_medication} + {interaction.existing_medication}
                </p>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                    interaction.severity === "severe"
                      ? "bg-red-200 text-red-800"
                      : interaction.severity === "moderate"
                      ? "bg-amber-200 text-amber-800"
                      : "bg-sky-200 text-sky-800"
                  }`}
                >
                  {interaction.severity}
                </span>
              </div>
              {interaction.risk && (
                <p className="text-xs font-medium text-muted-foreground mb-0.5">{interaction.risk}</p>
              )}
              {interaction.description && (
                <p className="text-xs text-muted-foreground">{interaction.description}</p>
              )}
              {interaction.recommendation && (
                <p className="text-xs italic text-muted-foreground mt-1">
                  💡 {interaction.recommendation}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 bg-muted/50 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground">
            This check is AI-powered and for informational purposes only. Always consult your doctor or pharmacist before starting or stopping medications.
          </p>
        </div>

        <AlertDialogFooter className="gap-2 mt-4">
          <AlertDialogCancel className="mt-0">
            <X className="w-4 h-4 mr-1.5" /> Don't Add
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={hasSevere ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}
          >
            Add Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}