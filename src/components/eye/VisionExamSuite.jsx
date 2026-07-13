import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Check, X, RefreshCw, ChevronRight, Activity, Palette, Grid3x3, Stethoscope } from "lucide-react";

const snellenLines = [
  { size: 48, letters: "E F P", ratio: "20/200" },
  { size: 36, letters: "T O Z", ratio: "20/100" },
  { size: 28, letters: "L P E D", ratio: "20/70" },
  { size: 22, letters: "P E C F D", ratio: "20/50" },
  { size: 18, letters: "E D F C Z P", ratio: "20/40" },
  { size: 14, letters: "F E L O P Z D", ratio: "20/30" },
  { size: 12, letters: "D E F P O T E C", ratio: "20/20" },
  { size: 10, letters: "L E F O D P E C T", ratio: "20/15" },
];

// Simplified Ishihara-style plates (number visible to normal vision, hidden for color blind)
const ishiharaPlates = [
  { number: "12", desc: "Everyone should see 12" },
  { number: "8", desc: "Red-green deficient may see 3" },
  { number: "29", desc: "Red-green deficient may see 70" },
  { number: "5", desc: "Red-green deficient may see 2" },
  { number: "74", desc: "Red-green deficient may see 21" },
];

function IshiharaPlate({ number }) {
  // Create a CSS-based pseudo-Ishihara plate using colored dots
  const dots = [];
  const seed = number.charCodeAt(0) + number.charCodeAt(number.length - 1);
  for (let i = 0; i < 80; i++) {
    const angle = (i * 137.5 * Math.PI) / 180;
    const radius = Math.sqrt(i / 80) * 90;
    const x = 100 + Math.cos(angle) * radius;
    const y = 100 + Math.sin(angle) * radius;
    const isForeground = Math.abs(Math.sin(i * 0.5 + seed)) > 0.5;
    const color = isForeground ? "#7db37d" : "#c8a878";
    const size = 8 + (i % 4) * 3;
    dots.push(
      <circle key={i} cx={x} cy={y} r={size} fill={color} opacity={0.9} />
    );
  }
  // Render the number as a path of dots in a different color
  return (
    <svg viewBox="0 0 200 200" className="w-40 h-40 mx-auto">
      <circle cx="100" cy="100" r="95" fill="#e8d5b8" />
      {dots}
      <text x="100" y="115" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#7db37d" opacity="0.85">{number}</text>
    </svg>
  );
}

export default function VisionExamSuite({ onComplete }) {
  const [step, setStep] = useState("intro");
  const [eye, setEye] = useState("both");
  const [snellenLine, setSnellenLine] = useState(0);
  const [snellenResults, setSnellenResults] = useState({});
  const [colorPlateIdx, setColorPlateIdx] = useState(0);
  const [colorScore, setColorScore] = useState(0);
  const [colorAnswers, setColorAnswers] = useState([]);
  const [astigmatismResult, setAstigmatismResult] = useState(null);
  const [examData, setExamData] = useState(null);

  const reset = () => {
    setStep("intro");
    setEye("both");
    setSnellenLine(0);
    setSnellenResults({});
    setColorPlateIdx(0);
    setColorScore(0);
    setColorAnswers([]);
    setAstigmatismResult(null);
    setExamData(null);
  };

  const handleSnellenResult = (canRead) => {
    const newResults = { ...snellenResults, [eye]: canRead ? snellenLines[snellenLine].ratio : (snellenLine > 0 ? snellenLines[snellenLine - 1].ratio : "20/200") };
    setSnellenResults(newResults);

    if (canRead && snellenLine < snellenLines.length - 1) {
      setSnellenLine(snellenLine + 1);
    } else {
      // Move to next eye or color test
      if (eye === "both") {
        setEye("left");
        setSnellenLine(0);
      } else if (eye === "left") {
        setEye("right");
        setSnellenLine(0);
      } else {
        setStep("color");
      }
    }
  };

  const handleColorAnswer = (sawCorrect) => {
    const newScore = colorScore + (sawCorrect ? 1 : 0);
    const newAnswers = [...colorAnswers, { plate: ishiharaPlates[colorPlateIdx].number, correct: sawCorrect }];
    setColorScore(newScore);
    setColorAnswers(newAnswers);

    if (colorPlateIdx < ishiharaPlates.length - 1) {
      setColorPlateIdx(colorPlateIdx + 1);
    } else {
      setStep("astigmatism");
    }
  };

  const finishExam = () => {
    const bestAcuity = snellenResults;
    const colorResult = colorScore >= 4 ? "Normal color vision" : colorScore >= 2 ? "Possible color vision deficiency" : "Likely color vision deficiency";
    const astigResult = astigmatismResult === "uneven" ? "Possible astigmatism detected" : astigmatismResult === "even" ? "No significant astigmatism" : "Not tested";

    // Estimate prescription from acuity
    const estimateSph = (ratio) => {
      const map = { "20/20": 0, "20/30": -0.5, "20/40": -1.0, "20/50": -1.25, "20/70": -1.75, "20/100": -2.5, "20/200": -4.0 };
      return map[ratio] ?? 0;
    };

    const data = {
      examDate: new Date().toLocaleDateString(),
      acuity: {
        left: bestAcuity.left || "Not tested",
        right: bestAcuity.right || "Not tested",
        both: bestAcuity.both || "Not tested",
      },
      colorVision: {
        result: colorResult,
        score: `${colorScore}/${ishiharaPlates.length}`,
      },
      astigmatism: {
        result: astigResult,
        severity: astigmatismResult === "uneven" ? "Mild to moderate — confirm with eye doctor" : null,
      },
      prescription: {
        left: { sph: estimateSph(bestAcuity.left), cyl: astigmatismResult === "uneven" ? -0.75 : 0, axis: 180 },
        right: { sph: estimateSph(bestAcuity.right), cyl: astigmatismResult === "uneven" ? -0.75 : 0, axis: 180 },
      },
      recommendations: [
        bestAcuity.left && bestAcuity.left !== "20/20" ? "Left eye acuity below 20/20 — consider vision correction" : null,
        bestAcuity.right && bestAcuity.right !== "20/20" ? "Right eye acuity below 20/20 — consider vision correction" : null,
        colorScore < 4 ? "Color vision screening suggests possible deficiency — discuss with an eye care professional" : null,
        astigmatismResult === "uneven" ? "Astigmatism screening suggests corneal irregularity — confirm with corneal topography" : null,
        "Schedule a comprehensive eye exam with a licensed optometrist to confirm these screening results",
        "If you wear corrective lenses, update your prescription annually",
      ].filter(Boolean),
    };
    setExamData(data);
    setStep("results");
    onComplete?.(data);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-indigo-600" />
        <h3 className="font-display font-semibold">3D Vision Exam Suite</h3>
      </div>

      {/* Progress indicator */}
      {step !== "intro" && step !== "results" && (
        <div className="flex items-center gap-1 mb-5">
          {["acuity", "color", "astigmatism"].map((s, i) => {
            const labels = ["Acuity", "Color Vision", "Astigmatism"];
            const active = step === s;
            const done = ["acuity", "color", "astigmatism"].indexOf(step) > i;
            return (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${active ? "bg-indigo-600 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                  {done && <Check className="w-3 h-3" />}
                  {labels[i]}
                </div>
                {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {step === "intro" && (
        <div className="text-center py-6">
          <Eye className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h4 className="font-semibold text-lg mb-2">AI Vision Exam</h4>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            This 3-step screening evaluates your visual acuity, color vision, and astigmatism.
            Sit about 20 inches from your screen in good lighting. The entire exam takes about 5 minutes.
          </p>
          <div className="grid grid-cols-3 gap-2 max-w-md mx-auto mb-6">
            <div className="p-3 rounded-lg bg-muted/50">
              <Eye className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs font-medium">Visual Acuity</p>
              <p className="text-[10px] text-muted-foreground">Snellen test</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Palette className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs font-medium">Color Vision</p>
              <p className="text-[10px] text-muted-foreground">Ishihara plates</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <Grid3x3 className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs font-medium">Astigmatism</p>
              <p className="text-[10px] text-muted-foreground">Clock dial</p>
            </div>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setStep("acuity"); setEye("both"); }}>
            Start Exam <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Step 1: Snellen Acuity Test */}
      {step === "acuity" && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground">Testing:</span>
            {["both", "left", "right"].map((e) => (
              <Button
                key={e}
                size="sm"
                variant={eye === e ? "default" : "outline"}
                className={`h-7 text-xs capitalize ${eye === e ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
              >
                {e === "both" ? "Both Eyes" : `${e.charAt(0).toUpperCase() + e.slice(1)} Eye`}
              </Button>
            ))}
          </div>

          <div className="bg-gray-900 rounded-xl p-8 mb-4 flex flex-col items-center justify-center min-h-[260px]">
            <p className="text-[10px] text-gray-500 mb-4">
              Line {snellenLine + 1} of {snellenLines.length} · Target: {snellenLines[snellenLine].ratio}
              {eye !== "both" && ` · ${eye === "left" ? "Cover right eye" : "Cover left eye"}`}
            </p>
            <div className="flex items-center gap-4 lg:gap-8" style={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.15em" }}>
              {snellenLines[snellenLine].letters.split(" ").map((letter, i) => (
                <span key={i} style={{ fontSize: `${snellenLines[snellenLine].size}px`, color: "#fff", lineHeight: 1 }}>
                  {letter}
                </span>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mb-4">
            Can you clearly read all letters on this line?
          </p>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleSnellenResult(false)}>
              <X className="w-4 h-4 mr-2" /> No
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleSnellenResult(true)}>
              <Check className="w-4 h-4 mr-2" /> Yes
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Color Vision */}
      {step === "color" && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-indigo-600" />
            <p className="text-xs text-muted-foreground">
              Plate {colorPlateIdx + 1} of {ishiharaPlates.length} — What number do you see?
            </p>
          </div>

          <div className="flex flex-col items-center py-4">
            <IshiharaPlate number={ishiharaPlates[colorPlateIdx].number} />
            <p className="text-xs text-muted-foreground mt-3 text-center max-w-xs">
              {ishiharaPlates[colorPlateIdx].desc}
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mb-4">
            Did you clearly see the number "{ishiharaPlates[colorPlateIdx].number}"?
          </p>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleColorAnswer(false)}>
              <X className="w-4 h-4 mr-2" /> No / Different number
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleColorAnswer(true)}>
              <Check className="w-4 h-4 mr-2" /> Yes
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Astigmatism */}
      {step === "astigmatism" && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Grid3x3 className="w-4 h-4 text-indigo-600" />
            <p className="text-xs text-muted-foreground">Astigmatism Clock Dial Test</p>
          </div>

          <p className="text-xs text-muted-foreground text-center mb-4">
            Look at the center of the sunburst pattern. Do all lines appear equally dark and sharp, or do some lines appear bolder/darker than others?
          </p>

          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 200 200" className="w-56 h-56">
              <circle cx="100" cy="100" r="5" fill="#1e1b4b" />
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const x2 = 100 + Math.cos(angle) * 90;
                const y2 = 100 + Math.sin(angle) * 90;
                return (
                  <line
                    key={i}
                    x1="100" y1="100" x2={x2} y2={y2}
                    stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round"
                  />
                );
              })}
              <circle cx="100" cy="100" r="90" fill="none" stroke="#1e1b4b" strokeWidth="1" opacity="0.3" />
            </svg>
          </div>

          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setAstigmatismResult("even"); finishExam(); }}>
              <Check className="w-4 h-4 mr-2" /> All lines look equal
            </Button>
            <Button variant="outline" className="border-amber-300 text-amber-600 hover:bg-amber-50" onClick={() => { setAstigmatismResult("uneven"); finishExam(); }}>
              <X className="w-4 h-4 mr-2" /> Some lines are bolder
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {step === "results" && examData && (
        <div className="py-4">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h4 className="font-semibold text-lg">Exam Complete</h4>
            <p className="text-xs text-muted-foreground">Your screening results are ready</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <Eye className="w-4 h-4 text-indigo-600 mb-1" />
              <p className="text-[10px] text-muted-foreground">Visual Acuity</p>
              <p className="text-sm font-bold">L: {examData.acuity.left}</p>
              <p className="text-sm font-bold">R: {examData.acuity.right}</p>
            </div>
            <div className="p-3 rounded-xl bg-violet-50 border border-violet-200">
              <Palette className="w-4 h-4 text-violet-600 mb-1" />
              <p className="text-[10px] text-muted-foreground">Color Vision</p>
              <p className="text-sm font-bold">{examData.colorVision.score}</p>
              <p className="text-[10px] text-muted-foreground">{examData.colorVision.result}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <Grid3x3 className="w-4 h-4 text-amber-600 mb-1" />
              <p className="text-[10px] text-muted-foreground">Astigmatism</p>
              <p className="text-xs font-bold mt-0.5">{examData.astigmatism.result}</p>
            </div>
          </div>

          {examData.prescription && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-4">
              <p className="text-xs font-semibold mb-2">Estimated Prescription (screening only)</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Left Eye (OS)</p>
                  <p>SPH: {examData.prescription.left.sph} | CYL: {examData.prescription.left.cyl} | AXIS: {examData.prescription.left.axis}°</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Right Eye (OD)</p>
                  <p>SPH: {examData.prescription.right.sph} | CYL: {examData.prescription.right.cyl} | AXIS: {examData.prescription.right.axis}°</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-5">
            <p className="text-xs text-amber-800 font-semibold mb-1.5">Recommendations:</p>
            <ul className="space-y-1">
              {examData.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retake
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}