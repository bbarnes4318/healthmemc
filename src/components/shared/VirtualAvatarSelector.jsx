import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Check, Globe } from "lucide-react";
import { motion } from "framer-motion";

const genderOptions = [
  { value: "male", label: "Male", avatar: "👨‍⚕️" },
  { value: "female", label: "Female", avatar: "👩‍⚕️" },
  { value: "non_binary", label: "Non-Binary", avatar: "🧑‍⚕️" },
];

const raceOptions = [
  { value: "caucasian", label: "Caucasian" },
  { value: "african_american", label: "African American" },
  { value: "asian", label: "Asian" },
  { value: "hispanic", label: "Hispanic/Latino" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "south_asian", label: "South Asian" },
  { value: "native_american", label: "Native American" },
  { value: "pacific_islander", label: "Pacific Islander" },
];

export default function VirtualAvatarSelector({ onSelect, serviceName = "consultant" }) {
  const [gender, setGender] = useState(null);
  const [race, setRace] = useState(null);

  const handleConfirm = () => {
    if (!gender || !race) return;
    const genderConfig = genderOptions.find((g) => g.value === gender);
    const raceConfig = raceOptions.find((r) => r.value === race);
    onSelect({
      gender,
      race,
      avatar: genderConfig?.avatar || "🧑‍⚕️",
      genderLabel: genderConfig?.label,
      raceLabel: raceConfig?.label,
    });
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-sky-600" />
        <div>
          <h3 className="font-semibold text-sm">Choose Your Virtual {serviceName}</h3>
          <p className="text-xs text-muted-foreground">Select the appearance of your AI consultant</p>
        </div>
      </div>

      {/* Gender Selection */}
      <div className="mb-5">
        <Label className="text-xs mb-2 block">Gender</Label>
        <div className="grid grid-cols-3 gap-2">
          {genderOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGender(opt.value)}
              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                gender === opt.value
                  ? "border-sky-500 bg-sky-50 shadow-sm"
                  : "border-border hover:border-sky-300 hover:bg-muted/50"
              }`}
            >
              <span className="text-2xl">{opt.avatar}</span>
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Race/Ethnicity Selection */}
      <div className="mb-5">
        <Label className="text-xs mb-2 block">Race / Ethnicity</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {raceOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRace(opt.value)}
              className={`p-2.5 rounded-lg border-2 transition-all text-xs font-medium ${
                race === opt.value
                  ? "border-sky-500 bg-sky-50 text-sky-700 shadow-sm"
                  : "border-border hover:border-sky-300 hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {gender && race && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-lg border border-sky-200 mb-4">
            <span className="text-3xl">{genderOptions.find((g) => g.value === gender)?.avatar}</span>
            <div>
              <p className="text-sm font-medium">
                {genderOptions.find((g) => g.value === gender)?.label} · {raceOptions.find((r) => r.value === race)?.label}
              </p>
              <p className="text-xs text-muted-foreground">Your virtual {serviceName} will appear with this profile</p>
            </div>
          </div>
        </motion.div>
      )}

      <Button onClick={handleConfirm} disabled={!gender || !race} className="w-full bg-sky-600 hover:bg-sky-700">
        <Check className="w-4 h-4 mr-2" /> Continue to Consultation
      </Button>
    </Card>
  );
}