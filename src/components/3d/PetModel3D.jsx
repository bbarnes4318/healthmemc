import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PawPrint, RotateCcw, Info } from "lucide-react";

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

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(bodyR, bodyLen, 4, 8), mat);
  body.rotation.z = Math.PI / 2;
  body.position.set(0, 0.5 * s, 0);
  group.add(body);

  const headX = bodyLen / 2 + headR * 0.6;
  const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 12, 12), mat);
  head.position.set(headX, 0.55 * s, 0);
  group.add(head);

  if (opts.snoutLength > 0) {
    const snoutR = 0.09 * s;
    const snout = new THREE.Mesh(new THREE.CapsuleGeometry(snoutR, opts.snoutLength * s, 4, 8), mat);
    snout.rotation.z = Math.PI / 2;
    snout.position.set(headX + headR * 0.5 + opts.snoutLength * s * 0.5, 0.48 * s, 0);
    group.add(snout);
  }

  const earX = headX - headR * 0.3;
  const earY = 0.55 * s + headR * 0.7;
  if (opts.earType === "floppy") {
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.08 * s, 8, 8), mat);
      ear.scale.set(0.4, 1.5, 0.3);
      ear.position.set(earX, earY - 0.05 * s, side * 0.12 * s);
      ear.rotation.x = side * 0.3;
      group.add(ear);
    }
  } else if (opts.earType === "pointy") {
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07 * s, 0.18 * s, 4), mat);
      ear.position.set(earX, earY + 0.05 * s, side * 0.1 * s);
      ear.rotation.z = -side * 0.15;
      group.add(ear);
    }
  } else if (opts.earType === "long") {
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.05 * s, 0.3 * s, 4, 8), mat);
      ear.position.set(earX, earY + 0.1 * s, side * 0.07 * s);
      group.add(ear);
    }
  } else if (opts.earType === "tiny") {
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04 * s, 6, 6), mat);
      ear.position.set(earX, earY, side * 0.08 * s);
      group.add(ear);
    }
  } else if (opts.earType === "small") {
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.1 * s, 4), mat);
      ear.position.set(earX, earY, side * 0.08 * s);
      group.add(ear);
    }
  }

  const legR = (opts.legRadius || 0.07) * s;
  const legH = 0.5 * s * (opts.legHeightRatio || 1);
  const legX = bodyLen * 0.3;
  const legZ = bodyR * 0.7;
  [[legX, legZ], [legX, -legZ], [-legX, legZ], [-legX, -legZ]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(legR, legR, legH, 6), mat);
    leg.position.set(x, legH / 2, z);
    group.add(leg);
  });

  if (opts.tailLength > 0) {
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.05 * s, opts.tailLength * s, 4, 8), mat);
    tail.position.set(-bodyLen / 2 - opts.tailLength * s * 0.4, 0.55 * s, 0);
    tail.rotation.z = opts.tailAngle ?? -0.4;
    group.add(tail);
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
  return group;
}

function buildBird(color, size) {
  const group = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({ color });
  const s = size;

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 12, 12), mat);
  body.scale.set(1.3, 1, 1);
  body.position.set(0, 0.4 * s, 0);
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 10, 10), mat);
  head.position.set(0.28 * s, 0.5 * s, 0);
  group.add(head);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.15 * s, 4), new THREE.MeshPhongMaterial({ color: 0xff8800 }));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.42 * s, 0.48 * s, 0);
  group.add(beak);

  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.15 * s, 8, 8), mat);
    wing.scale.set(0.3, 1, 1.5);
    wing.position.set(-0.05 * s, 0.4 * s, side * 0.12 * s);
    group.add(wing);
  }

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1 * s, 0.25 * s, 4), mat);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-0.3 * s, 0.4 * s, 0);
  group.add(tail);

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 0.2 * s, 4), new THREE.MeshPhongMaterial({ color: 0xff8800 }));
    leg.position.set(0.05 * s, 0.15 * s, side * 0.05 * s);
    group.add(leg);
  }

  const eyeMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025 * s, 6, 6), eyeMat);
    eye.position.set(0.33 * s, 0.55 * s, side * 0.07 * s);
    group.add(eye);
  }

  group.position.y = -0.1 * s;
  return group;
}

export default function PetModel3D({ onPetSelect }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const petGroupRef = useRef(null);
  const controlsRef = useRef(null);
  const [petType, setPetType] = useState("dog");
  const [breedIdx, setBreedIdx] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);

  const currentBreed = petConfigs[petType].breeds[breedIdx];

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
    const petGroup = config.build(breed.color, breed.size);
    scene.add(petGroup);
    petGroupRef.current = petGroup;

    if (onPetSelect) onPetSelect({ type: petType, breed: breed.name });
  }, [sceneReady, petType, breedIdx]);

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
        <span className="text-xs text-muted-foreground ml-auto">Drag to rotate 360°</span>
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

          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{petConfigs[petType].icon}</span>
              <div>
                <p className="text-sm font-semibold text-purple-800">{currentBreed.name}</p>
                <p className="text-[10px] text-purple-600">{petConfigs[petType].label} · 360° Interactive Model</p>
              </div>
            </div>
            <p className="text-[10px] text-purple-600 mt-1">
              Rotate the model to examine your pet from all angles. This helps identify visible symptoms, skin conditions, and body condition.
            </p>
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={resetView}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset View
          </Button>
        </div>
      </div>
    </Card>
  );
}