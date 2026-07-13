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
import { PawPrint, RotateCcw, Activity, Loader2, Trash2, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

const petConfigs = {
  dog: {
    label: "Dog",
    icon: "🐕",
    breeds: [
      { name: "Labrador Retriever", color: 0xd4a017, size: 1.2 },
      { name: "German Shepherd", color: 0x6b4423, size: 1.15 },
      { name: "Golden Retriever", color: 0xd4a04a, size: 1.2 },
      { name: "Bulldog", color: 0xe8d8c8, size: 0.85 },
      { name: "Poodle", color: 0xf0f0f0, size: 0.9 },
      { name: "Beagle", color: 0x8B4513, size: 0.8 },
      { name: "Chihuahua", color: 0xc4956a, size: 0.5 },
      { name: "Siberian Husky", color: 0xdddddd, size: 1.1 },
    ],
    build: (color, size) => buildQuadruped(color, size, { earType: "floppy", tailLength: 0.4, snoutLength: 0.2, bodyLength: 0.7, headSize: 0.26 }),
  },
  cat: {
    label: "Cat",
    icon: "🐱",
    breeds: [
      { name: "Persian", color: 0xf5f5f5, size: 0.7 },
      { name: "Siamese", color: 0xf5e6d3, size: 0.65 },
      { name: "Tabby", color: 0xd4760e, size: 0.7 },
      { name: "Maine Coon", color: 0x6b4423, size: 0.85 },
      { name: "Bengal", color: 0xc4956a, size: 0.7 },
      { name: "Black Cat", color: 0x222222, size: 0.65 },
    ],
    build: (color, size) => buildQuadruped(color, size, { earType: "pointy", tailLength: 0.5, snoutLength: 0.08, bodyLength: 0.55, headSize: 0.22, tailAngle: 0 }),
  },
  rabbit: {
    label: "Rabbit",
    icon: "🐰",
    breeds: [
      { name: "Holland Lop", color: 0xf5f5f5, size: 0.4 },
      { name: "Netherland Dwarf", color: 0xc4956a, size: 0.3 },
      { name: "Flemish Giant", color: 0x8B7355, size: 0.6 },
      { name: "Rex", color: 0x6b4423, size: 0.45 },
      { name: "Lionhead", color: 0xe8d8c8, size: 0.38 },
    ],
    build: (color, size) => buildQuadruped(color, size, { earType: "long", tailLength: 0.06, snoutLength: 0.03, bodyLength: 0.4, headSize: 0.2, legHeightRatio: 0.5 }),
  },
  hamster: {
    label: "Hamster",
    icon: "🐹",
    breeds: [
      { name: "Syrian", color: 0xd4a017, size: 0.2 },
      { name: "Dwarf Winter White", color: 0xf5f5f5, size: 0.15 },
      { name: "Roborovski", color: 0xc4956a, size: 0.12 },
      { name: "Chinese", color: 0x8B6B47, size: 0.17 },
    ],
    build: (color, size) => buildQuadruped(color, size, { earType: "tiny", tailLength: 0.02, snoutLength: 0.02, bodyLength: 0.2, headSize: 0.15, legHeightRatio: 0.4 }),
  },
  guinea_pig: {
    label: "Guinea Pig",
    icon: "🐹",
    breeds: [
      { name: "American", color: 0x8B4513, size: 0.3 },
      { name: "Abyssinian", color: 0xf5f5f5, size: 0.3 },
      { name: "Peruvian", color: 0xd4760e, size: 0.32 },
      { name: "Skinny Pig", color: 0xe8c8a8, size: 0.28 },
    ],
    build: (color, size) => buildQuadruped(color, size, { earType: "tiny", tailLength: 0, snoutLength: 0.04, bodyLength: 0.3, headSize: 0.16, legHeightRatio: 0.35 }),
  },
  bird: {
    label: "Bird",
    icon: "🦜",
    breeds: [
      { name: "Parakeet", color: 0x4caf50, size: 0.3 },
      { name: "Cockatiel", color: 0xf5f5f5, size: 0.4 },
      { name: "Canary", color: 0xffd700, size: 0.25 },
      { name: "Lovebird", color: 0xff6b35, size: 0.28 },
      { name: "African Grey", color: 0x808080, size: 0.45 },
    ],
    build: (color, size) => buildBird(color, size),
  },
  ferret: {
    label: "Ferret",
    icon: "🦡",
    breeds: [
      { name: "Sable", color: 0x2F2F2F, size: 0.5 },
      { name: "Albino", color: 0xfff8dc, size: 0.5 },
      { name: "Cinnamon", color: 0x8B4513, size: 0.5 },
      { name: "Silver Mitt", color: 0xC0C0C0, size: 0.5 },
    ],
    build: (color, size) => buildQuadruped(color, size, { earType: "small", tailLength: 0.2, snoutLength: 0.06, bodyLength: 0.5, headSize: 0.16, legHeightRatio: 0.5, bodySlenderness: 0.7 }),
  },
};

function buildQuadruped(color, size, opts) {
  const group = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({ color });
  const s = size;
  const slenderness = opts.bodySlenderness || 1;
  const bodyR = 0.28 * s * slenderness;
  const bodyLen = opts.bodyLength * s;
  const headR = (opts.headSize || 0.24) * s;
  const parts = [];

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(bodyR, bodyLen, 4, 8), mat);
  body.rotation.z = Math.PI / 2;
  body.position.set(0, 0.5 * s, 0);
  body.userData = { region: "torso" };
  group.add(body); parts.push(body);

  const headX = bodyLen / 2 + headR * 0.6;
  const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 12, 12), mat);
  head.position.set(headX, 0.55 * s, 0);
  head.userData = { region: "head" };
  group.add(head); parts.push(head);

  if (opts.snoutLength > 0) {
    const snoutR = 0.09 * s;
    const snout = new THREE.Mesh(new THREE.CapsuleGeometry(snoutR, opts.snoutLength * s, 4, 8), mat);
    snout.rotation.z = Math.PI / 2;
    snout.position.set(headX + headR * 0.5 + opts.snoutLength * s * 0.5, 0.48 * s, 0);
    snout.userData = { region: "snout" };
    group.add(snout); parts.push(snout);
  }

  const earX = headX - headR * 0.3;
  const earY = 0.55 * s + headR * 0.7;
  const earConfigs = [
    { type: "floppy", geo: () => new THREE.SphereGeometry(0.08 * s, 8, 8), scale: [0.4, 1.5, 0.3], yOffset: -0.05 * s, rot: true },
    { type: "pointy", geo: () => new THREE.ConeGeometry(0.07 * s, 0.18 * s, 4), scale: null, yOffset: 0.05 * s, rot: true },
    { type: "long", geo: () => new THREE.CapsuleGeometry(0.05 * s, 0.3 * s, 4, 8), scale: null, yOffset: 0.1 * s, rot: false },
    { type: "tiny", geo: () => new THREE.SphereGeometry(0.04 * s, 6, 6), scale: null, yOffset: 0, rot: false },
    { type: "small", geo: () => new THREE.ConeGeometry(0.05 * s, 0.1 * s, 4), scale: null, yOffset: 0, rot: false },
  ];
  const earConfig = earConfigs.find((e) => e.type === opts.earType);
  if (earConfig) {
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earConfig.geo(), mat);
      if (earConfig.scale) ear.scale.set(...earConfig.scale);
      ear.position.set(earX, earY + earConfig.yOffset, side * 0.12 * s);
      if (earConfig.rot) ear.rotation.z = -side * 0.15;
      ear.userData = { region: side === 1 ? "left_ear" : "right_ear" };
      group.add(ear); parts.push(ear);
    }
  }

  const legR = (opts.legRadius || 0.07) * s;
  const legH = 0.5 * s * (opts.legHeightRatio || 1);
  const legX = bodyLen * 0.3;
  const legZ = bodyR * 0.7;
  const legPositions = [
    { x: legX, z: legZ, region: "front_right_leg" },
    { x: legX, z: -legZ, region: "front_left_leg" },
    { x: -legX, z: legZ, region: "back_right_leg" },
    { x: -legX, z: -legZ, region: "back_left_leg" },
  ];
  legPositions.forEach(({ x, z, region }) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(legR, legR, legH, 6), mat);
    leg.position.set(x, legH / 2, z);
    leg.userData = { region };
    group.add(leg); parts.push(leg);
  });

  if (opts.tailLength > 0) {
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.05 * s, opts.tailLength * s, 4, 8), mat);
    tail.position.set(-bodyLen / 2 - opts.tailLength * s * 0.4, 0.55 * s, 0);
    tail.rotation.z = opts.tailAngle ?? -0.4;
    tail.userData = { region: "tail" };
    group.add(tail); parts.push(tail);
  }

  const eyeMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03 * s, 6, 6), eyeMat);
    eye.position.set(headX + headR * 0.4, 0.6 * s, side * 0.1 * s);
    group.add(eye);
  }

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035 * s, 6, 6), new THREE.MeshPhongMaterial({ color: 0x222222 }));
  nose.position.set(headX + headR * 0.5 + opts.snoutLength * s + 0.06 * s, 0.48 * s, 0);
  group.add(nose);

  // Center the model
  group.position.y = -0.2 * s;
  return { group, parts };
}

function buildBird(color, size) {
  const group = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({ color });
  const s = size;
  const parts = [];

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 12, 12), mat);
  body.scale.set(1.3, 1, 1);
  body.position.set(0, 0.4 * s, 0);
  body.userData = { region: "torso" };
  group.add(body); parts.push(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 10, 10), mat);
  head.position.set(0.28 * s, 0.5 * s, 0);
  head.userData = { region: "head" };
  group.add(head); parts.push(head);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.15 * s, 4), new THREE.MeshPhongMaterial({ color: 0xff8800 }));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.42 * s, 0.48 * s, 0);
  beak.userData = { region: "snout" };
  group.add(beak); parts.push(beak);

  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.15 * s, 8, 8), mat);
    wing.scale.set(0.3, 1, 1.5);
    wing.position.set(-0.05 * s, 0.4 * s, side * 0.12 * s);
    wing.userData = { region: side === 1 ? "left_ear" : "right_ear" };
    group.add(wing); parts.push(wing);
  }

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1 * s, 0.25 * s, 4), mat);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-0.3 * s, 0.4 * s, 0);
  tail.userData = { region: "tail" };
  group.add(tail); parts.push(tail);

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 0.2 * s, 4), new THREE.MeshPhongMaterial({ color: 0xff8800 }));
    leg.position.set(0.05 * s, 0.15 * s, side * 0.05 * s);
    leg.userData = { region: side === 1 ? "front_right_leg" : "front_left_leg" };
    group.add(leg); parts.push(leg);
  }

  const eyeMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025 * s, 6, 6), eyeMat);
    eye.position.set(0.33 * s, 0.55 * s, side * 0.07 * s);
    group.add(eye);
  }

  group.position.y = -0.1 * s;
  return { group, parts };
}

const regionLabels = {
  head: "Head", snout: "Snout/Muzzle", neck: "Neck", torso: "Torso/Body",
  front_left_leg: "Front Left Leg", front_right_leg: "Front Right Leg",
  back_left_leg: "Back Left Leg", back_right_leg: "Back Right Leg",
  tail: "Tail", left_ear: "Left Ear/Wing", right_ear: "Right Ear/Wing",
};

const severityColors = {
  mild: { hex: 0xfbbf24, css: "#fbbf24", bg: "bg-amber-100", text: "text-amber-700" },
  moderate: { hex: 0xf97316, css: "#f97316", bg: "bg-orange-100", text: "text-orange-700" },
  severe: { hex: 0xef4444, css: "#ef4444", bg: "bg-red-100", text: "text-red-700" },
};

const observationTypes = ["pain", "swelling", "lesion", "lameness", "skin_issue", "behavior", "other"];

export default function PetModel3D({ onPetSelect }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const petGroupRef = useRef(null);
  const partsRef = useRef([]);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const [petType, setPetType] = useState("dog");
  const [breedIdx, setBreedIdx] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [form, setForm] = useState({ observation_type: "pain", severity: "mild", description: "" });
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const currentBreed = petConfigs[petType].breeds[breedIdx];

  const loadSymptoms = async () => {
    try {
      const data = await base44.entities.PetSymptomLog.list("-logged_at", 100);
      setSymptoms(data);
    } catch (e) { console.error(e); }
    setLoadingSymptoms(false);
  };

  useEffect(() => { loadSymptoms(); }, []);

  // Scene setup (once)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2, 1.5, 4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(3, 5, 3);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-3, 3, -3);
    scene.add(backLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.3, 0);
    controls.minDistance = 2;
    controls.maxDistance = 10;
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

    // Click & hover handlers
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const canvas = renderer.domElement;

    const handleClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(partsRef.current, false);
      if (intersects.length > 0 && intersects[0].object.userData.region) {
        setSelectedRegion(intersects[0].object.userData.region);
        setForm({ observation_type: "pain", severity: "mild", description: "" });
      }
    };

    const handleMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(partsRef.current, false);
      if (intersects.length > 0 && intersects[0].object.userData.region) {
        setHoveredRegion(intersects[0].object.userData.region);
        canvas.style.cursor = "pointer";
      } else {
        setHoveredRegion(null);
        canvas.style.cursor = "grab";
      }
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMove);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      controls.dispose();
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMove);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) { if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose()); else obj.material.dispose(); }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      setSceneReady(false);
    };
  }, []);

  // Rebuild pet when type/breed changes
  useEffect(() => {
    if (!sceneReady || !sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove old pet
    if (petGroupRef.current) {
      scene.remove(petGroupRef.current);
      petGroupRef.current.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) { if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose()); else obj.material.dispose(); }
      });
    }

    // Build new pet
    const config = petConfigs[petType];
    const breed = config.breeds[breedIdx];
    const result = config.build(breed.color, breed.size);
    scene.add(result.group);
    petGroupRef.current = result.group;
    partsRef.current = result.parts;

    if (onPetSelect) onPetSelect({ type: petType, breed: breed.name });
  }, [sceneReady, petType, breedIdx]);

  // Update part colors based on symptoms
  useEffect(() => {
    if (!sceneReady) return;
    const latestByRegion = {};
    symptoms.forEach((s) => {
      if (!latestByRegion[s.body_region] || new Date(s.logged_at) > new Date(latestByRegion[s.body_region].logged_at)) {
        latestByRegion[s.body_region] = s;
      }
    });
    partsRef.current.forEach((mesh) => {
      const region = mesh.userData.region;
      if (!region) return;
      const symptom = latestByRegion[region];
      if (selectedRegion === region) {
        mesh.material.color.setHex(0xef4444);
      } else if (symptom) {
        mesh.material.color.setHex(severityColors[symptom.severity].hex);
      } else if (hoveredRegion === region) {
        mesh.material.color.setHex(0xfbbf24);
      } else {
        mesh.material.color.setHex(currentBreed.color);
      }
    });
  }, [sceneReady, selectedRegion, hoveredRegion, symptoms, currentBreed]);

  const handleSaveSymptom = async () => {
    if (!selectedRegion) return;
    setSaving(true);
    try {
      await base44.entities.PetSymptomLog.create({
        pet_type: petConfigs[petType].label,
        breed: currentBreed.name,
        body_region: selectedRegion,
        observation_type: form.observation_type,
        severity: form.severity,
        description: form.description || undefined,
        logged_at: new Date().toISOString(),
      });
      setSelectedRegion(null);
      loadSymptoms();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDeleteSymptom = async (id) => {
    try { await base44.entities.PetSymptomLog.delete(id); loadSymptoms(); } catch (e) { console.error(e); }
  };

  const latestByRegion = {};
  symptoms.forEach((s) => {
    if (!latestByRegion[s.body_region] || new Date(s.logged_at) > new Date(latestByRegion[s.body_region].logged_at)) {
      latestByRegion[s.body_region] = s;
    }
  });

  const resetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <PawPrint className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-semibold">3D Pet Model</h3>
        <span className="text-xs text-muted-foreground ml-auto">Drag to rotate 360° · Click body parts to log symptoms</span>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowHistory(!showHistory)}>
          <Calendar className="w-3.5 h-3.5 mr-1" /> History
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex justify-center">
          <div ref={mountRef} className="w-full lg:w-[400px] h-[400px] rounded-xl bg-slate-50 border border-border" />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <Label className="text-xs font-medium">Pet Type</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {Object.entries(petConfigs).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => { setPetType(key); setBreedIdx(0); }}
                  className={`p-2 rounded-lg border-2 text-xs font-medium transition flex flex-col items-center gap-0.5 ${
                    petType === key ? "border-purple-500 bg-purple-50 text-purple-700" : "border-border text-muted-foreground"
                  }`}
                >
                  <span className="text-lg">{config.icon}</span>
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Breed</Label>
            <Select value={String(breedIdx)} onValueChange={(v) => setBreedIdx(parseInt(v))}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {petConfigs[petType].breeds.map((breed, i) => (
                  <SelectItem key={i} value={String(i)}>{breed.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showHistory ? (
            <div>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-purple-600" /> Symptom History</h4>
              {loadingSymptoms ? (
                <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-purple-600" /></div>
              ) : symptoms.length === 0 ? (
                <p className="text-xs text-muted-foreground">No symptoms logged yet. Click a body part on the 3D model to start.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {symptoms.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                      <div className="p-2.5 bg-muted/50 rounded-lg flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: severityColors[s.severity].css }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{regionLabels[s.body_region] || s.body_region}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${severityColors[s.severity].bg} ${severityColors[s.severity].text}`}>{s.severity}</span>
                            <span className="text-[10px] text-muted-foreground capitalize">{s.observation_type.replace("_", " ")}</span>
                          </div>
                          {s.description && <p className="text-[10px] text-muted-foreground mt-0.5">{s.description}</p>}
                          <span className="text-[9px] text-muted-foreground">{s.breed} · {format(new Date(s.logged_at), "MMM d, h:mm a")}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 shrink-0" onClick={() => handleDeleteSymptom(s.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {hoveredRegion && !selectedRegion && (
                <div className="p-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-700 font-medium">{regionLabels[hoveredRegion] || hoveredRegion}</p>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(severityColors).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: val.css }} />
                    <span className="text-[10px] text-muted-foreground capitalize">{key}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{petConfigs[petType].icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-purple-800">{currentBreed.name}</p>
                    <p className="text-[10px] text-purple-600">{petConfigs[petType].label} · Click body parts to log symptoms</p>
                  </div>
                </div>
                <p className="text-[10px] text-purple-600 mt-1">
                  Rotate to examine from all angles. Click any body region to log an observation — just like you do for your own body model.
                </p>
              </div>

              {Object.keys(latestByRegion).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-1.5">Active Symptoms</h4>
                  <div className="space-y-1">
                    {Object.entries(latestByRegion).map(([region, sym]) => (
                      <div key={region} className="flex items-center gap-2 p-1.5 bg-muted/30 rounded-lg">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: severityColors[sym.severity].css }} />
                        <span className="text-xs font-medium flex-1">{regionLabels[region] || region}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${severityColors[sym.severity].bg} ${severityColors[sym.severity].text}`}>{sym.severity}</span>
                        <span className="text-[9px] text-muted-foreground">{format(new Date(sym.logged_at), "MMM d")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="outline" size="sm" className="w-full" onClick={resetView}>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset View
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Symptom Logging Dialog */}
      <Dialog open={!!selectedRegion} onOpenChange={(v) => { if (!v) setSelectedRegion(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Observation: {selectedRegion && (regionLabels[selectedRegion] || selectedRegion)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="p-2 bg-purple-50 rounded-lg text-xs text-purple-700">
              <strong>{petConfigs[petType].label}</strong> · {currentBreed.name} · {regionLabels[selectedRegion] || selectedRegion}
            </div>
            <div>
              <Label className="text-xs">Observation Type</Label>
              <Select value={form.observation_type} onValueChange={(v) => setForm({ ...form, observation_type: v })}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {observationTypes.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Severity</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {Object.entries(severityColors).map(([key, val]) => (
                  <button key={key} onClick={() => setForm({ ...form, severity: key })}
                    className={`p-2 rounded-lg border-2 text-xs font-medium capitalize transition ${form.severity === key ? "border-current" : "border-border"}`}
                    style={form.severity === key ? { color: val.css, background: val.bg } : {}}>
                    {key}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="Describe what you observe (e.g., limping on left front leg, swelling near snout...)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="ghost" onClick={() => setSelectedRegion(null)}>Cancel</Button>
            <Button onClick={handleSaveSymptom} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
              Save Observation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}