import React, { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Check, X, RefreshCw, ArrowRight } from "lucide-react";

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

export default function EyeExam() {
  const [currentLine, setCurrentLine] = useState(0);
  const [results, setResults] = useState([]);
  const [eye, setEye] = useState("both");
  const [finished, setFinished] = useState(false);

  const handleResult = (canRead) => {
    const newResults = [...results, { line: currentLine, ratio: snellenLines[currentLine].ratio, canRead, eye }];
    setResults(newResults);

    if (canRead && currentLine < snellenLines.length - 1) {
      setCurrentLine(currentLine + 1);
    } else {
      setFinished(true);
    }
  };

  const reset = () => {
    setCurrentLine(0);
    setResults([]);
    setFinished(false);
  };

  const bestLine = results.filter((r) => r.canRead).pop();
  const resultRatio = bestLine ? bestLine.ratio : "20/200";

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold">Visual Acuity Self-Test</h3>
      </div>

      {!finished ? (
        <div>
          {/* Eye selector */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs text-muted-foreground mr-1">Testing:</span>
            {["left", "right", "both"].map((e) => (
              <Button
                key={e}
                size="sm"
                variant={eye === e ? "default" : "outline"}
                className={`h-7 text-xs capitalize ${eye === e ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                onClick={() => { setEye(e); reset(); }}
              >
                {e === "both" ? "Both Eyes" : `${e.charAt(0).toUpperCase() + e.slice(1)} Eye`}
              </Button>
            ))}
          </div>

          <div className="bg-gray-900 rounded-xl p-8 mb-4 flex flex-col items-center justify-center min-h-[280px]">
            <p className="text-[10px] text-gray-500 mb-4">Line {currentLine + 1} of {snellenLines.length} · Target: {snellenLines[currentLine].ratio}</p>
            <div className="flex items-center gap-4 lg:gap-8" style={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.15em" }}>
              {snellenLines[currentLine].letters.split(" ").map((letter, i) => (
                <span key={i} style={{ fontSize: `${snellenLines[currentLine].size}px`, color: "#fff", lineHeight: 1 }}>
                  {letter}
                </span>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mb-4">
            Cover one eye (if testing individually) and read the letters aloud. Can you clearly identify all letters on this line?
          </p>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleResult(false)}>
              <X className="w-4 h-4 mr-2" /> No, can't read
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleResult(true)}>
              <Check className="w-4 h-4 mr-2" /> Yes, I can read
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-indigo-600" />
          </div>
          <h4 className="font-semibold text-lg mb-1">Test Complete</h4>
          <p className="text-sm text-muted-foreground mb-4 capitalize">{eye === "both" ? "Both eyes" : `${eye} eye`}</p>

          <div className="inline-flex items-center gap-3 bg-indigo-50 rounded-xl px-6 py-4 mb-6">
            <div>
              <p className="text-xs text-muted-foreground">Estimated Acuity</p>
              <p className="text-3xl font-bold text-indigo-700">{resultRatio}</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left mb-6">
            <p className="text-xs text-amber-800">
              <strong>Important:</strong> This is a basic screening test, not a substitute for a professional eye exam. 20/20 is normal acuity. If your result is worse than 20/40 or you have concerns, schedule an exam with an optometrist or ophthalmologist.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retake Test
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}