import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Activity, ShoppingBag, MapPin, FileDown, Eye as EyeIcon, Stethoscope } from "lucide-react";
import EyeModel3D from "@/components/eye/EyeModel3D";
import VisionExamSuite from "@/components/eye/VisionExamSuite";
import GlassesShop from "@/components/eye/GlassesShop";
import EyeDoctorLocator from "@/components/eye/EyeDoctorLocator";
import { generateEyeExamPdf } from "@/lib/generateEyeExamPdf";
import AIServicePage from "@/components/services/AIServicePage";

const aiConfig = {
  title: "AI Eye Doctor",
  subtitle: "AI-powered eye care guidance, vision screening, and ocular health consultations",
  icon: Eye,
  color: "from-indigo-500 to-purple-600",
  btnClass: "bg-indigo-600 hover:bg-indigo-700",
  textColor: "text-indigo-600",
  systemPrompt: "You are an AI Eye Doctor assistant. You provide guidance on vision health, eye conditions (dry eyes, conjunctivitis, cataracts, glaucoma, macular degeneration), eye strain, digital screen fatigue, contact lens care, and when to see an optometrist or ophthalmologist. Be thorough but accessible. Do not provide definitive diagnoses — recommend seeing a licensed eye care professional for clinical examination and treatment.",
  disclaimer: "This AI eye care guidance is for informational purposes only. Always consult a licensed optometrist or ophthalmologist for diagnosis and treatment.",
  topics: [
    { label: "Blurry Vision", desc: "Sudden or gradual changes", icon: Eye, prompt: "I'm experiencing blurry vision and need help understanding possible causes." },
    { label: "Eye Strain", desc: "Screen fatigue, discomfort", icon: Activity, prompt: "I have eye strain from screens and need relief strategies." },
    { label: "Vision Correction", desc: "Glasses, contacts, LASIK", icon: ShoppingBag, prompt: "I'd like to learn about vision correction options." },
    { label: "Eye Emergency", desc: "Injury, flashes, floaters", icon: Stethoscope, prompt: "I'm having an eye emergency and need guidance." },
  ],
};

export default function AI3DEyeExam() {
  const [activeTab, setActiveTab] = useState("3d");
  const [selectedPart, setSelectedPart] = useState(null);
  const [examData, setExamData] = useState(null);
  const [selectedEyewear, setSelectedEyewear] = useState(null);

  const handleExport = () => {
    if (!examData) return;
    generateEyeExamPdf({
      ...examData,
      selectedEyewear,
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold">3D Eye Exam & Vision Center</h1>
            <p className="text-sm text-indigo-100">Interactive eye anatomy, AI vision screening, eyewear selection & doctor locator</p>
          </div>
        </div>
      </div>

      <div className="sticky top-14 lg:top-0 z-10 bg-white border-b border-border px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 max-w-3xl mx-auto">
            <TabsTrigger value="3d"><EyeIcon className="w-3.5 h-3.5 mr-1.5" />3D Model</TabsTrigger>
            <TabsTrigger value="exam"><Activity className="w-3.5 h-3.5 mr-1.5" />Vision Exam</TabsTrigger>
            <TabsTrigger value="shop"><ShoppingBag className="w-3.5 h-3.5 mr-1.5" />Eyewear</TabsTrigger>
            <TabsTrigger value="doctor"><MapPin className="w-3.5 h-3.5 mr-1.5" />Find Doctor</TabsTrigger>
            <TabsTrigger value="consult"><Stethoscope className="w-3.5 h-3.5 mr-1.5" />AI Consult</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        {activeTab === "3d" && (
          <div className="space-y-4">
            <EyeModel3D selectedPart={selectedPart} onSelectPart={setSelectedPart} />
            <Card className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-sm">Ready to test your vision?</h3>
                  <p className="text-xs text-muted-foreground">Take the 3-step AI vision screening exam</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setActiveTab("exam")}>
                  <Activity className="w-4 h-4 mr-2" /> Start Vision Exam
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "exam" && (
          <div className="space-y-4">
            <VisionExamSuite onComplete={(data) => setExamData(data)} />
            {examData && (
              <Card className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-semibold text-sm">Export Your Exam Results</h3>
                    <p className="text-xs text-muted-foreground">Download a professional PDF report to share with your eye doctor</p>
                  </div>
                  <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleExport}>
                    <FileDown className="w-4 h-4 mr-2" /> Download PDF Report
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "shop" && (
          <GlassesShop
            examData={examData}
            onSelect={setSelectedEyewear}
            onBookDoctor={() => setActiveTab("doctor")}
          />
        )}

        {activeTab === "doctor" && (
          <EyeDoctorLocator selectedEyewear={selectedEyewear} />
        )}

        {activeTab === "consult" && (
          <AIServicePage config={aiConfig} />
        )}
      </div>
    </div>
  );
}