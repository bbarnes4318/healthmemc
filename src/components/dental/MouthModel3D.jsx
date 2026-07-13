import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Smile, Activity, Loader2, Trash2, Calendar, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

const TOOTH_COLOR = 0xf8f8f0;
const SELECTED_COLOR = 0xef4444;
const HOVER_COLOR = 0xfbbf24;
const GUM_COLOR = 0xe88a8a;
const BRACKET_COLOR = 0xc0c0c0;
const WIRE_COLOR = 0xa0a0a0;

const severityColors = { mild: "#fbbf24", moderate: "#f97316", severe: "#ef4444" };
const severityHex = { mild: 0xfbbf24, moderate: 0xf97316, severe: 0xef4444 };

function getToothType(toothNumber) {
  const posInQuad = ((toothNumber - 1) % 8) + 1;
  if (posInQuad <= 3) return "molar";
  if (posInQuad <= 5) return "premolar";
  if (posInQuad === 6) return "canine";
  return "incisor";
}

function getToothSize(toothNumber) {
  const type = getToothType(toothNumber);
  switch (type) {
    case "incisor": return { w: 0.1, h: 0.16, d: 0.07 };
    case "canine": return { w: 0.09, h: 0.18, d: 0.08 };
    case "premolar": return { w: 0.1, h: 0.14, d: 0.1 };
    case "molar": return { w: 0.12, h: 0.12, d: 0.12 };
    default: return { w: 0.1, h: 0.14, d: 0.08 };
  }
}

function getToothPosition(toothNumber) {
  const isUpper = toothNumber <= 16;
  const archIndex = isUpper ? (toothNumber - 1) : (32 - toothNumber);
  const angle = (archIndex / 15) * Math.PI;
  const radius = 0.9;
  const x = -Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius * 0.6;
  const y = isUpper ? 0.35 : -0.35;
  return { x, y, z, angle, isUpper };
}

function buildMouth(showBraces) {
  const group = new THREE.Group();
  const teeth = [];
  const parts = [];

  // Gums (upper and lower)
  for (const isUpper of [true, false]) {
    const gumShape = new THREE.Shape();
    const points = [];
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI;
      const x = -Math.cos(angle) * 1.0;
      const z = Math.sin(angle) * 1.0 * 0.65;
      points.push(new THREE.Vector3(x, isUpper ? 0.25 : -0.25, z));
    }
    for (let i = 16; i >= 0; i--) {
      const angle = (i / 16) * Math.PI;
      const x = -Math.cos(angle) * 0.7;
      const z = Math.sin(angle) * 0.7 * 0.5;
      points.push(new THREE.Vector3(x, isUpper ? 0.25 : -0.25, z));
    }
    const gumGeo = new THREE.BufferGeometry().setFromPoints(points);
    // Use a simple torus segment for gums
    const gumGeo2 = new THREE.TorusGeometry(0.85, 0.15, 8, 16, Math.PI);
    const gum = new THREE.Mesh(gumGeo2, new THREE.MeshPhongMaterial({ color: GUM_COLOR }));
    gum.rotation.x = isUpper ? 0 : Math.PI;
    gum.position.set(0, isUpper ? 0.3 : -0.3, 0);
    gum.rotation.z = 0;
    group.add(gum);
  }

  // Teeth
  for (let toothNum = 1; toothNum <= 32; toothNum++) {
    const pos = getToothPosition(toothNum);
    const size = getToothSize(toothNum);
    const type = getToothType(toothNum);

    let geo;
    if (type === "canine") {
      geo = new THREE.ConeGeometry(size.w * 0.6, size.h, 6);
    } else if (type === "incisor") {
      geo = new THREE.BoxGeometry(size.w, size.h, size.d);
    } else {
      geo = new THREE.BoxGeometry(size.w, size.h, size.d, 2, 2, 2);
    }

    const mat = new THREE.MeshPhongMaterial({ color: TOOTH_COLOR });
    const tooth = new THREE.Mesh(geo, mat);
    tooth.position.set(pos.x, pos.y, pos.z);
    // Tilt teeth outward slightly
    tooth.rotation.x = pos.isUpper ? -0.1 : 0.1;
    tooth.userData = { toothNumber: toothNum, type };
    group.add(tooth);
    parts.push(tooth);
    teeth.push(tooth);

    // Braces bracket
    if (showBraces) {
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(size.w * 0.8, size.h * 0.25, 0.04),
        new THREE.MeshPhongMaterial({ color: BRACKET_COLOR, shininess: 80 })
      );
      const frontZ = pos.z + (size.d / 2) + 0.02;
      bracket.position.set(pos.x, pos.y, frontZ);
      bracket.rotation.x = pos.isUpper ? -0.1 : 0.1;
      group.add(bracket);
    }
  }

  // Braces wire (upper and lower)
  if (showBraces) {
    for (const isUpper of [true, false]) {
      const wirePoints = [];
      for (let i = 0; i <= 16; i++) {
        const archIndex = i;
        const angle = (archIndex / 15) * Math.PI;
        const radius = 0.9;
        const x = -Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius * 0.6 + 0.08;
        const y = isUpper ? 0.35 : -0.35;
        wirePoints.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(wirePoints);
      const wireGeo = new THREE.TubeGeometry(curve, 32, 0.015, 6, false);
      const wire = new THREE.Mesh(wireGeo, new THREE.MeshPhongMaterial({ color: WIRE_COLOR, shininess: 100 }));
      group.add(wire);
    }
  }

  return { group, parts };
}

export default function MouthModel3D() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const partsRef = useRef([]);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [showBraces, setShowBraces] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [hoveredTooth, setHoveredTooth] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState("mild");
  const [painType, setPainType] = useState("aching");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const load = async () => {
    try {
      const data = await base44.entities.DentalPainLog.list("-logged_at", 100);
      setHistory(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Scene setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-2, 2, -2);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controls.minDistance = 2;
    controls.maxDistance = 8;
    controls.enablePan = false;
    controlsRef.current = controls;

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    setSceneReady(true);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      controls.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) { if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose()); else obj.material.dispose(); }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      setSceneReady(false);
    };
  }, []);

  // Build/rebuild mouth when braces toggle changes
  useEffect(() => {
    if (!sceneReady || !sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove old mouth
    const oldMouth = scene.getObjectByName("mouthGroup");
    if (oldMouth) {
      scene.remove(oldMouth);
      oldMouth.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) { if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose()); else obj.material.dispose(); }
      });
    }

    const { group, parts } = buildMouth(showBraces);
    group.name = "mouthGroup";
    scene.add(group);
    partsRef.current = parts;

    // Add click and hover handlers
    const container = mountRef.current;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const cam = cameraRef.current;
    const canvas = container?.querySelector("canvas");
    if (!cam || !canvas) return;

    const handleClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cam);
      const intersects = raycaster.intersectObjects(parts, false);
      if (intersects.length > 0) {
        const toothNum = intersects[0].object.userData.toothNumber;
        if (toothNum) {
          setSelectedTeeth((prev) => prev.includes(toothNum) ? prev.filter((t) => t !== toothNum) : [...prev, toothNum]);
        }
      }
    };

    const handleMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cam);
      const intersects = raycaster.intersectObjects(parts, false);
      if (intersects.length > 0) {
        setHoveredTooth(intersects[0].object.userData.toothNumber);
        canvas.style.cursor = "pointer";
      } else {
        setHoveredTooth(null);
        canvas.style.cursor = "grab";
      }
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMove);

    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMove);
    };
  }, [sceneReady, showBraces]);

  // Update tooth colors
  useEffect(() => {
    partsRef.current.forEach((mesh) => {
      const toothNum = mesh.userData.toothNumber;
      if (!toothNum) return;

      // Check if this tooth has pain history
      const toothPainLogs = history.filter((h) => h.pain_teeth?.includes(toothNum));
      const hasPain = toothPainLogs.length > 0;
      const latestPain = toothPainLogs[0]; // sorted by -logged_at

      if (selectedTeeth.includes(toothNum)) {
        mesh.material.color.setHex(severityHex[severity]);
      } else if (hasPain && latestPain) {
        mesh.material.color.setHex(severityHex[latestPain.severity] || 0xf97316);
      } else if (hoveredTooth === toothNum) {
        mesh.material.color.setHex(HOVER_COLOR);
      } else {
        mesh.material.color.setHex(TOOTH_COLOR);
      }
    });
  }, [selectedTeeth, hoveredTooth, history, severity, showBraces, sceneReady]);

  const handleSave = async () => {
    if (selectedTeeth.length === 0) return;
    setSaving(true);
    try {
      await base44.entities.DentalPainLog.create({
        pain_teeth: selectedTeeth,
        severity,
        pain_type: painType,
        duration: duration || undefined,
        notes: notes || undefined,
        logged_at: new Date().toISOString(),
      });
      setSelectedTeeth([]);
      setDuration("");
      setNotes("");
      load();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.DentalPainLog.delete(id); load(); } catch (e) { console.error(e); }
  };

  const resetView = () => { controlsRef.current?.reset(); };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Smile className="w-4 h-4 text-cyan-600" /> 3D Mouth Model
          </h3>
          <p className="text-xs text-muted-foreground">Drag to rotate 360° · Click teeth to mark pain</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Braces View</Label>
            <Switch checked={showBraces} onCheckedChange={setShowBraces} />
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={resetView}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowHistory(!showHistory)}>
            <Calendar className="w-3.5 h-3.5 mr-1" /> History
          </Button>
        </div>
      </div>

      {showHistory ? (
        <div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-600" /></div>
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No pain logs yet. Select teeth on the 3D model to start.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                  <div className="p-2.5 bg-muted/50 rounded-lg flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: severityColors[h.severity] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {h.pain_teeth?.length > 0 && <span className="text-xs font-medium">Teeth: {h.pain_teeth.join(", ")}</span>}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: severityColors[h.severity] + "33", color: severityColors[h.severity] }}>{h.severity}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{h.pain_type}</span>
                      </div>
                      {h.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{h.notes}</p>}
                      <span className="text-[9px] text-muted-foreground">{format(new Date(h.logged_at), "MMM d, h:mm a")}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 shrink-0" onClick={() => handleDelete(h.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex justify-center">
            <div ref={mountRef} className="w-full lg:w-[400px] h-[400px] rounded-xl bg-slate-50 border border-border" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {hoveredTooth && (
              <div className="p-2 bg-cyan-50 rounded-lg">
                <p className="text-xs text-cyan-700 font-medium">Tooth #{hoveredTooth} <span className="capitalize text-cyan-500">({getToothType(hoveredTooth)})</span></p>
              </div>
            )}

            <div>
              <Label className="text-xs">Selected Teeth</Label>
              <p className="text-sm font-medium min-h-[28px] flex items-center">
                {selectedTeeth.length > 0 ? selectedTeeth.sort((a, b) => a - b).join(", ") : "None — click teeth on the 3D model"}
              </p>
            </div>

            <div>
              <Label className="text-xs">Severity (applies to selection)</Label>
              <div className="flex gap-2 mt-1">
                {Object.entries(severityColors).map(([key, color]) => (
                  <button key={key} onClick={() => setSeverity(key)}
                    className={`flex-1 p-1.5 rounded-lg border-2 text-xs font-medium transition capitalize ${severity === key ? "border-current" : "border-border"}`}
                    style={severity === key ? { color, background: color + "22" } : {}}>
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Pain Type</Label>
              <Select value={painType} onValueChange={setPainType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["aching", "sharp", "throbbing", "sensitivity", "burning", "other"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Duration</Label>
              <Input placeholder="e.g., 3 days" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-9" />
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Additional details..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="resize-none" />
            </div>

            <Button onClick={handleSave} disabled={selectedTeeth.length === 0 || saving} className="w-full bg-cyan-600 hover:bg-cyan-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
              Save Pain Log
            </Button>

            <div className="p-2 bg-cyan-50 rounded-lg">
              <p className="text-[10px] text-cyan-700">
                <strong>Universal Numbering:</strong> Upper teeth 1-16 (right to left), Lower teeth 17-32 (left to right). Toggle Braces View to see orthodontic brackets and wire overlay.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}