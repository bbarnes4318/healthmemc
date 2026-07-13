import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RotateCcw, Activity, Loader2, Trash2, Calendar, ChevronRight, MousePointerClick, PersonStanding } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format } from "date-fns";

const BODY_COLOR = 0xe8d5c4;
const HOVER_COLOR = 0xfbbf24;
const SELECTED_COLOR = 0xef4444;

const severityColors = {
  mild: { hex: 0xfbbf24, css: "#fbbf24", bg: "bg-amber-100", text: "text-amber-700", label: "Mild" },
  moderate: { hex: 0xf97316, css: "#f97316", bg: "bg-orange-100", text: "text-orange-700", label: "Moderate" },
  severe: { hex: 0xef4444, css: "#ef4444", bg: "bg-red-100", text: "text-red-700", label: "Severe" },
};

const regionLabels = {
  head: "Head", neck: "Neck", chest: "Chest", abdomen: "Abdomen",
  back: "Upper Back", lower_back: "Lower Back",
  left_shoulder: "Left Shoulder", right_shoulder: "Right Shoulder",
  left_arm: "Left Arm", right_arm: "Right Arm",
  left_hip: "Left Hip", right_hip: "Right Hip",
  left_thigh: "Left Thigh", right_thigh: "Right Thigh",
  left_knee: "Left Knee", right_knee: "Right Knee",
  left_calf: "Left Calf", right_calf: "Right Calf",
  left_foot: "Left Foot", right_foot: "Right Foot",
};

const painTypes = ["aching", "sharp", "burning", "throbbing", "stiffness", "numbness", "tingling", "cramping", "other"];

function createLimb(radius, start, end) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const totalLen = dir.length();
  const cylLen = Math.max(0.01, totalLen - 2 * radius);
  const geo = new THREE.CapsuleGeometry(radius, cylLen, 4, 8);
  const mat = new THREE.MeshPhongMaterial({ color: BODY_COLOR });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return mesh;
}

function createSphere(radius, pos, scaleY) {
  const geo = new THREE.SphereGeometry(radius, 16, 16);
  const mat = new THREE.MeshPhongMaterial({ color: BODY_COLOR });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  if (scaleY) mesh.scale.y = scaleY;
  return mesh;
}

function createCylinder(rTop, rBot, h, pos) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, 16);
  const mat = new THREE.MeshPhongMaterial({ color: BODY_COLOR });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  return mesh;
}

function createBox(w, h, d, pos) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshPhongMaterial({ color: BODY_COLOR });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  return mesh;
}

function buildBody() {
  const group = new THREE.Group();
  const parts = [];

  const head = createSphere(0.38, [0, 3.6, 0]);
  head.userData = { region: "head" };
  group.add(head); parts.push(head);

  const eyeMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    eye.position.set(side * 0.12, 3.65, 0.33);
    group.add(eye);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 4), new THREE.MeshPhongMaterial({ color: 0xd4a0a0 }));
  nose.position.set(0, 3.5, 0.36);
  nose.rotation.x = Math.PI / 2;
  group.add(nose);

  const neck = createCylinder(0.16, 0.16, 0.3, [0, 3.1, 0]);
  neck.userData = { region: "neck" };
  group.add(neck); parts.push(neck);

  const torso = createCylinder(0.52, 0.42, 1.3, [0, 2.0, 0]);
  torso.userData = { region: "torso", isTorso: true };
  group.add(torso); parts.push(torso);

  const spineMat = new THREE.MeshPhongMaterial({ color: 0xd4c4b4 });
  for (let i = 0; i < 5; i++) {
    const vertebra = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), spineMat);
    vertebra.position.set(0, 2.5 - i * 0.25, -0.4);
    group.add(vertebra);
  }

  for (const [region, x] of [["left_shoulder", 0.6], ["right_shoulder", -0.6]]) {
    const s = createSphere(0.2, [x, 2.75, 0]);
    s.userData = { region };
    group.add(s); parts.push(s);
  }

  for (const [region, x] of [["left_arm", 0.62], ["right_arm", -0.62]]) {
    const arm = createLimb(0.12, new THREE.Vector3(x, 2.65, 0), new THREE.Vector3(x * 1.5, 1.0, 0));
    arm.userData = { region };
    group.add(arm); parts.push(arm);
  }

  for (const [region, x] of [["left_hip", 0.26], ["right_hip", -0.26]]) {
    const hip = createSphere(0.18, [x, 1.0, 0], 0.8);
    hip.userData = { region };
    group.add(hip); parts.push(hip);
  }

  for (const [region, x] of [["left_thigh", 0.26], ["right_thigh", -0.26]]) {
    const thigh = createLimb(0.17, new THREE.Vector3(x, 0.95, 0), new THREE.Vector3(x * 1.15, 0.0, 0));
    thigh.userData = { region };
    group.add(thigh); parts.push(thigh);
  }

  for (const [region, x] of [["left_knee", 0.3], ["right_knee", -0.3]]) {
    const knee = createSphere(0.15, [x, 0.0, 0]);
    knee.userData = { region };
    group.add(knee); parts.push(knee);
  }

  for (const [region, x] of [["left_calf", 0.3], ["right_calf", -0.3]]) {
    const calf = createLimb(0.13, new THREE.Vector3(x, 0.0, 0), new THREE.Vector3(x * 1.1, -0.9, 0));
    calf.userData = { region };
    group.add(calf); parts.push(calf);
  }

  for (const [region, x] of [["left_foot", 0.33], ["right_foot", -0.33]]) {
    const foot = createBox(0.2, 0.12, 0.4, [x, -1.05, 0.1]);
    foot.userData = { region };
    group.add(foot); parts.push(foot);
  }

  return { group, parts };
}

export default function BodyModel3D() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const mountRef = useRef(null);
  const partsRef = useRef([]);
  const sceneRef = useRef(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedView, setSelectedView] = useState("front");
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ severity: "mild", symptom_description: "", pain_type: "aching", duration: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const load = async () => {
    try {
      const filter = currentMemberId ? { family_member_id: currentMemberId } : {};
      const data = await base44.entities.SymptomMap.filter(filter, "-logged_at", 200);
      setEntries(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  // 3D scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(2, 5, 4);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-2, 3, -4);
    scene.add(backLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 1.3, 0);
    controls.minDistance = 4;
    controls.maxDistance = 14;
    controls.enablePan = false;

    const { group, parts } = buildBody();
    scene.add(group);
    partsRef.current = parts;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getRegionFromIntersect = (intersect) => {
      const obj = intersect.object;
      if (obj.userData.isTorso) {
        const localPoint = obj.worldToLocal(intersect.point.clone());
        const isFront = localPoint.z > 0;
        const isUpper = localPoint.y > 0;
        const region = isFront ? (isUpper ? "chest" : "abdomen") : (isUpper ? "back" : "lower_back");
        return { region, view: isFront ? "front" : "back" };
      }
      return { region: obj.userData.region, view: "front" };
    };

    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(parts, false);
      if (intersects.length > 0) {
        const { region, view } = getRegionFromIntersect(intersects[0]);
        setSelectedRegion(region);
        setSelectedView(view);
        setForm({ severity: "mild", symptom_description: "", pain_type: "aching", duration: "", notes: "" });
      }
    };

    const handleMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(parts, false);
      if (intersects.length > 0) {
        const { region } = getRegionFromIntersect(intersects[0]);
        setHoveredRegion(region);
        renderer.domElement.style.cursor = "pointer";
      } else {
        setHoveredRegion(null);
        renderer.domElement.style.cursor = "grab";
      }
    };

    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.addEventListener("mousemove", handleMove);

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
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.domElement.removeEventListener("mousemove", handleMove);
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

  // Latest symptom per region
  const latestByRegion = {};
  entries.forEach((e) => {
    if (!latestByRegion[e.body_region] || new Date(e.logged_at) > new Date(latestByRegion[e.body_region].logged_at)) {
      latestByRegion[e.body_region] = e;
    }
  });

  // Update colors
  useEffect(() => {
    if (!sceneReady) return;
    partsRef.current.forEach((mesh) => {
      const region = mesh.userData.region;
      let color = BODY_COLOR;
      let emissive = 0x000000;

      if (selectedRegion === region) {
        color = SELECTED_COLOR;
        emissive = 0x331111;
      } else if (mesh.userData.isTorso) {
        const torsoRegions = ["chest", "abdomen", "back", "lower_back"];
        const symptoms = torsoRegions.map((r) => latestByRegion[r]).filter(Boolean);
        if (symptoms.length > 0) {
          const order = { severe: 3, moderate: 2, mild: 1 };
          const worst = symptoms.sort((a, b) => order[b.severity] - order[a.severity])[0];
          color = severityColors[worst.severity].hex;
        } else if (hoveredRegion && torsoRegions.includes(hoveredRegion)) {
          color = HOVER_COLOR;
        }
      } else if (latestByRegion[region]) {
        color = severityColors[latestByRegion[region].severity].hex;
      } else if (hoveredRegion === region) {
        color = HOVER_COLOR;
      }

      mesh.material.color.setHex(color);
      mesh.material.emissive.setHex(emissive);
    });
  }, [sceneReady, selectedRegion, hoveredRegion, entries]);

  const handleSave = async () => {
    if (!selectedRegion) return;
    setSaving(true);
    try {
      await base44.entities.SymptomMap.create({
        body_region: selectedRegion,
        body_view: selectedView,
        severity: form.severity,
        symptom_description: form.symptom_description || undefined,
        pain_type: form.pain_type,
        duration: form.duration || undefined,
        notes: form.notes || undefined,
        logged_at: new Date().toISOString(),
        family_member_id: currentMemberId || undefined,
      });
      setSelectedRegion(null);
      load();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await base44.entities.SymptomMap.delete(id); load(); } catch (e) { console.error(e); }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <PersonStanding className="w-4 h-4 text-orange-600" /> 3D Body Model
          </h3>
          <p className="text-xs text-muted-foreground">Drag to rotate 360° · Click a body region to log symptoms · {currentMemberName}</p>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowHistory(!showHistory)}>
          <Calendar className="w-3.5 h-3.5 mr-1" /> History
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex justify-center">
          <div ref={mountRef} className="w-full lg:w-[400px] h-[450px] rounded-xl bg-slate-50 border border-border" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {Object.entries(severityColors).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: val.css }} />
                <span className="text-[10px] text-muted-foreground">{val.label}</span>
              </div>
            ))}
          </div>

          {hoveredRegion && !selectedRegion && (
            <div className="p-2 bg-orange-50 rounded-lg mb-3">
              <p className="text-xs text-orange-700 font-medium">{regionLabels[hoveredRegion]}</p>
            </div>
          )}

          {showHistory ? (
            <div>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-orange-600" /> Symptom History</h4>
              {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-orange-600" /></div>
              ) : entries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No symptoms logged yet.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {entries.map((entry, i) => (
                    <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                      <div className="p-2.5 bg-muted/50 rounded-lg flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: severityColors[entry.severity].css }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{regionLabels[entry.body_region] || entry.body_region}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${severityColors[entry.severity].bg} ${severityColors[entry.severity].text}`}>{severityColors[entry.severity].label}</span>
                          </div>
                          {entry.symptom_description && <p className="text-[10px] text-muted-foreground mt-0.5">{entry.symptom_description}</p>}
                          <span className="text-[9px] text-muted-foreground">{format(new Date(entry.logged_at), "MMM d, h:mm a")}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 shrink-0" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-1.5 mb-3">
                <MousePointerClick className="w-3 h-3 mt-0.5 shrink-0 text-orange-500" />
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Drag to rotate the body 360°</p>
                  <p>Click any region to log a symptom</p>
                  <p>Colored parts show existing symptoms</p>
                  <p>Rotate to the back to access spine, lower back</p>
                </div>
              </div>

              {Object.keys(latestByRegion).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2">Active Symptoms</h4>
                  <div className="space-y-1.5">
                    {Object.entries(latestByRegion).map(([region, entry]) => (
                      <div key={region} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: severityColors[entry.severity].css }} />
                        <span className="text-xs font-medium flex-1">{regionLabels[region] || region}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${severityColors[entry.severity].bg} ${severityColors[entry.severity].text}`}>{severityColors[entry.severity].label}</span>
                        <span className="text-[9px] text-muted-foreground">{format(new Date(entry.logged_at), "MMM d")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedRegion} onOpenChange={(v) => { if (!v) setSelectedRegion(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Symptom: {selectedRegion && regionLabels[selectedRegion]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Severity</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {Object.entries(severityColors).map(([key, val]) => (
                  <button key={key} onClick={() => setForm({ ...form, severity: key })}
                    className={`p-2 rounded-lg border-2 text-xs font-medium transition ${form.severity === key ? "border-current" : "border-border"}`}
                    style={form.severity === key ? { color: val.css, background: val.bg } : {}}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Pain Type</Label>
              <Select value={form.pain_type} onValueChange={(v) => setForm({ ...form, pain_type: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{painTypes.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Symptom Description</Label>
              <Input placeholder="e.g., Dull ache, tender to touch" value={form.symptom_description} onChange={(e) => setForm({ ...form, symptom_description: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Duration</Label>
              <Input placeholder="e.g., 3 days" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Additional details..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setSelectedRegion(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Save Symptom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}