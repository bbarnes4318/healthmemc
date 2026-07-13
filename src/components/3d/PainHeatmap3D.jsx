import React, { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Card } from "@/components/ui/card";
import { Loader2, Activity, Flame, TrendingDown, Info } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format } from "date-fns";

const BODY_COLOR = 0xe8d5c4;

function createLimb(radius, start, end) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const totalLen = dir.length();
  const cylLen = Math.max(0.01, totalLen - 2 * radius);
  const geo = new THREE.CapsuleGeometry(radius, cylLen, 4, 8);
  const mat = new THREE.MeshPhongMaterial({ color: BODY_COLOR, transparent: true, opacity: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return mesh;
}

function createSphere(radius, pos, scaleY) {
  const geo = new THREE.SphereGeometry(radius, 16, 16);
  const mat = new THREE.MeshPhongMaterial({ color: BODY_COLOR, transparent: true, opacity: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  if (scaleY) mesh.scale.y = scaleY;
  return mesh;
}

function createCylinder(rTop, rBot, h, pos) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, 16);
  const mat = new THREE.MeshPhongMaterial({ color: BODY_COLOR, transparent: true, opacity: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  return mesh;
}

function createBox(w, h, d, pos) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshPhongMaterial({ color: BODY_COLOR, transparent: true, opacity: 0.85 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  return mesh;
}

function buildBody() {
  const group = new THREE.Group();
  const parts = [];

  const head = createSphere(0.38, [0, 3.6, 0]);
  head.userData = { bodyParts: ["head", "neck"] };
  group.add(head); parts.push(head);

  const neck = createCylinder(0.16, 0.16, 0.3, [0, 3.1, 0]);
  neck.userData = { bodyParts: ["neck"] };
  group.add(neck); parts.push(neck);

  const torso = createCylinder(0.52, 0.42, 1.3, [0, 2.0, 0]);
  torso.userData = { bodyParts: ["spine", "full_body"] };
  group.add(torso); parts.push(torso);

  for (const [bodyParts, x] of [[["shoulder"], 0.6], [["shoulder"], -0.6]]) {
    const s = createSphere(0.2, [x, 2.75, 0]);
    s.userData = { bodyParts };
    group.add(s); parts.push(s);
  }

  for (const [bodyParts, x] of [[["shoulder"], 0.62], [["shoulder"], -0.62]]) {
    const arm = createLimb(0.12, new THREE.Vector3(x, 2.65, 0), new THREE.Vector3(x * 1.5, 1.0, 0));
    arm.userData = { bodyParts };
    group.add(arm); parts.push(arm);
  }

  for (const [bodyParts, x] of [[["hip"], 0.26], [["hip"], -0.26]]) {
    const hip = createSphere(0.18, [x, 1.0, 0], 0.8);
    hip.userData = { bodyParts };
    group.add(hip); parts.push(hip);
  }

  for (const [bodyParts, x] of [[["hip"], 0.26], [["hip"], -0.26]]) {
    const thigh = createLimb(0.17, new THREE.Vector3(x, 0.95, 0), new THREE.Vector3(x * 1.15, 0.0, 0));
    thigh.userData = { bodyParts };
    group.add(thigh); parts.push(thigh);
  }

  for (const [bodyParts, x] of [[["knee"], 0.3], [["knee"], -0.3]]) {
    const knee = createSphere(0.15, [x, 0.0, 0]);
    knee.userData = { bodyParts };
    group.add(knee); parts.push(knee);
  }

  for (const [bodyParts, x] of [[["knee", "ankle"], 0.3], [["knee", "ankle"], -0.3]]) {
    const calf = createLimb(0.13, new THREE.Vector3(x, 0.0, 0), new THREE.Vector3(x * 1.1, -0.9, 0));
    calf.userData = { bodyParts };
    group.add(calf); parts.push(calf);
  }

  for (const [bodyParts, x] of [[["ankle"], 0.33], [["ankle"], -0.33]]) {
    const foot = createBox(0.2, 0.12, 0.4, [x, -1.05, 0.1]);
    foot.userData = { bodyParts };
    group.add(foot); parts.push(foot);
  }

  return { group, parts };
}

// Map pain level (0-10) to a heat color
function painToColor(pain) {
  if (pain == null) return null;
  if (pain <= 2) return { hex: 0xfde68a, css: "#fde68a", label: "Low Pain" };       // yellow
  if (pain <= 5) return { hex: 0xfb923c, css: "#fb923c", label: "Moderate Pain" };  // orange
  if (pain <= 7) return { hex: 0xf97316, css: "#f97316", label: "High Pain" };      // dark orange
  return { hex: 0xef4444, css: "#ef4444", label: "Severe Pain" };                    // red
}

// Map ROM to a color — low ROM = blue (restricted), high ROM = green (good)
function romToColor(rom, maxRom) {
  if (rom == null) return null;
  const ratio = maxRom > 0 ? rom / maxRom : 1;
  if (ratio < 0.4) return { hex: 0x3b82f6, css: "#3b82f6", label: "Low ROM" };     // blue
  if (ratio < 0.7) return { hex: 0x06b6d4, css: "#06b6d4", label: "Moderate ROM" }; // cyan
  return { hex: 0x22c55e, css: "#22c55e", label: "Good ROM" };                       // green
}

const bodyPartLabels = {
  knee: "Knee", shoulder: "Shoulder", hip: "Hip", spine: "Spine",
  ankle: "Ankle", wrist: "Wrist", neck: "Neck", full_body: "Full Body", other: "Other",
};

export default function PainHeatmap3D() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const mountRef = useRef(null);
  const partsRef = useRef([]);
  const sceneRef = useRef(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await base44.entities.ExerciseLog.list("-date", 200);
      const filtered = currentMemberId
        ? data.filter((l) => l.family_member_id === currentMemberId)
        : data;
      setExercises(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentMemberId]);

  // Aggregate pain and ROM per body part
  const heatData = useMemo(() => {
    const byPart = {};
    exercises.forEach((l) => {
      const part = l.body_part;
      if (!byPart[part]) byPart[part] = { painSum: 0, painCount: 0, romValues: [], logs: [] };
      if (l.pain_level != null) { byPart[part].painSum += l.pain_level; byPart[part].painCount++; }
      if (l.rom_degrees != null) byPart[part].romValues.push(l.rom_degrees);
      byPart[part].logs.push(l);
    });

    const result = {};
    const allROMs = exercises.filter((l) => l.rom_degrees != null).map((l) => l.rom_degrees);
    const maxRom = allROMs.length ? Math.max(...allROMs) : 180;

    for (const [part, data] of Object.entries(byPart)) {
      const avgPain = data.painCount > 0 ? data.painSum / data.painCount : null;
      const latestRom = data.romValues.length ? data.romValues[data.romValues.length - 1] : null;
      result[part] = {
        avgPain,
        latestRom,
        maxRom,
        logCount: data.logs.length,
        painColor: painToColor(avgPain),
        romColor: romToColor(latestRom, maxRom),
      };
    }
    return result;
  }, [exercises]);

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

  // Update heat colors
  useEffect(() => {
    if (!sceneReady) return;
    partsRef.current.forEach((mesh) => {
      const bodyParts = mesh.userData.bodyParts || [];
      let bestPainColor = null;
      let bestRomColor = null;
      let worstPain = -1;

      bodyParts.forEach((part) => {
        const data = heatData[part];
        if (!data) return;
        // Prioritize pain color (most important visualization)
        if (data.avgPain != null && data.avgPain > worstPain) {
          worstPain = data.avgPain;
          bestPainColor = data.painColor;
        }
        if (data.romColor && !bestRomColor) {
          bestRomColor = data.romColor;
        }
      });

      let color = BODY_COLOR;
      let emissive = 0x000000;
      let opacity = 0.85;

      if (bestPainColor) {
        // Pain takes priority — red heatmap
        color = bestPainColor.hex;
        emissive = bestPainColor.hex;
        opacity = 0.9;
      } else if (bestRomColor) {
        // ROM restriction shown as blue/green
        color = bestRomColor.hex;
        emissive = bestRomColor.hex;
        opacity = 0.9;
      }

      mesh.material.color.setHex(color);
      mesh.material.emissive.setHex(emissive);
      mesh.material.emissiveIntensity = emissive !== 0x000000 ? 0.3 : 0;
      mesh.material.opacity = opacity;
    });
  }, [sceneReady, heatData]);

  const activeAreas = Object.entries(heatData).filter(([, d]) => d.painColor || d.romColor);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-600" /> 3D Pain & Mobility Heatmap
          </h3>
          <p className="text-xs text-muted-foreground">
            Drag to rotate · Red = high pain · Blue = low ROM · {currentMemberName}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex justify-center">
          <div ref={mountRef} className="w-full lg:w-[400px] h-[450px] rounded-xl bg-slate-50 border border-border" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Legend */}
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-semibold flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-orange-600" /> Heat Legend</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium">Pain Levels</p>
                <LegendItem color="#fde68a" label="Low (0-2)" />
                <LegendItem color="#fb923c" label="Moderate (3-5)" />
                <LegendItem color="#f97316" label="High (6-7)" />
                <LegendItem color="#ef4444" label="Severe (8-10)" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium">Range of Motion</p>
                <LegendItem color="#3b82f6" label="Low ROM" />
                <LegendItem color="#06b6d4" label="Moderate ROM" />
                <LegendItem color="#22c55e" label="Good ROM" />
              </div>
            </div>
          </div>

          {activeAreas.length === 0 ? (
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <Info className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">No PT logs with pain or ROM data yet.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Log exercises with pain levels and ROM values to see your heatmap.</p>
            </div>
          ) : (
            <div>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-orange-600" /> Active Heat Areas
              </h4>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {activeAreas
                  .sort(([, a], [, b]) => (b.avgPain || 0) - (a.avgPain || 0))
                  .map(([part, data]) => (
                    <div key={part} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: data.painColor?.css || data.romColor?.css }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{bodyPartLabels[part] || part}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {data.avgPain != null ? `Avg pain: ${data.avgPain.toFixed(1)}/10` : "No pain data"}
                          {data.latestRom != null ? ` · ROM: ${data.latestRom}°` : ""}
                          {` · ${data.logCount} log${data.logCount !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {data.painColor?.label || data.romColor?.label}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
        </div>
      )}
    </Card>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}