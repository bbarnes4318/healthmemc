import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, Eye, Info } from "lucide-react";

const PARTS = [
  { name: "Cornea", color: 0x93c5fd, desc: "The clear front surface of the eye that focuses light. Damage or irregular curvature causes astigmatism." },
  { name: "Iris", color: 0x6366f1, desc: "The colored part of the eye that controls how much light enters through the pupil." },
  { name: "Pupil", color: 0x1e1b4b, desc: "The black circle in the center that expands and contracts to regulate light entry." },
  { name: "Lens", color: 0xa7f3d0, desc: "Behind the pupil, it fine-focuses light onto the retina. Clouding causes cataracts." },
  { name: "Retina", color: 0xfb7185, desc: "The light-sensitive tissue at the back of the eye. It converts light into neural signals." },
  { name: "Optic Nerve", color: 0xfde68a, desc: "Transmits visual information from the retina to the brain. Damage causes glaucoma." },
];

export default function EyeModel3D({ selectedPart, onSelectPart }) {
  const mountRef = useRef(null);
  const [hovered, setHovered] = useState(null);
  const sceneRef = useRef({});
  const partsRef = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = 400;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 15;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0x60a5fa, 0.5, 20);
    pointLight.position.set(-5, 3, 5);
    scene.add(pointLight);

    // Eye group
    const eyeGroup = new THREE.Group();

    // Sclera (white of eye)
    const scleraGeo = new THREE.SphereGeometry(2, 64, 64);
    const scleraMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 30, transparent: true, opacity: 0.15 });
    const sclera = new THREE.Mesh(scleraGeo, scleraMat);
    eyeGroup.add(sclera);

    // Cornea (clear front bulge)
    const corneaGeo = new THREE.SphereGeometry(0.9, 32, 32);
    const corneaMat = new THREE.MeshPhongMaterial({ color: 0x93c5fd, shininess: 100, transparent: true, opacity: 0.3 });
    const cornea = new THREE.Mesh(corneaGeo, corneaMat);
    cornea.position.set(0, 0, 1.8);
    cornea.scale.set(1, 1, 0.5);
    eyeGroup.add(cornea);
    partsRef.current["Cornea"] = cornea;

    // Iris
    const irisGeo = new THREE.RingGeometry(0.3, 0.7, 64);
    const irisMat = new THREE.MeshPhongMaterial({ color: 0x6366f1, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.set(0, 0, 1.85);
    eyeGroup.add(iris);
    partsRef.current["Iris"] = iris;

    // Pupil
    const pupilGeo = new THREE.CircleGeometry(0.3, 64);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(0, 0, 1.86);
    eyeGroup.add(pupil);
    partsRef.current["Pupil"] = pupil;

    // Lens
    const lensGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const lensMat = new THREE.MeshPhongMaterial({ color: 0xa7f3d0, shininess: 100, transparent: true, opacity: 0.4 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0, 1.2);
    lens.scale.set(1, 1, 0.4);
    eyeGroup.add(lens);
    partsRef.current["Lens"] = lens;

    // Retina (back hemisphere)
    const retinaGeo = new THREE.SphereGeometry(1.95, 64, 64, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.6);
    const retinaMat = new THREE.MeshPhongMaterial({ color: 0xfb7185, side: THREE.BackSide, transparent: true, opacity: 0.6 });
    const retina = new THREE.Mesh(retinaGeo, retinaMat);
    eyeGroup.add(retina);
    partsRef.current["Retina"] = retina;

    // Optic Nerve
    const nerveGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 16);
    const nerveMat = new THREE.MeshPhongMaterial({ color: 0xfde68a, transparent: true, opacity: 0.7 });
    const nerve = new THREE.Mesh(nerveGeo, nerveMat);
    nerve.position.set(0, 0, -2.8);
    nerve.rotation.x = Math.PI / 2;
    eyeGroup.add(nerve);
    partsRef.current["Optic Nerve"] = nerve;

    scene.add(eyeGroup);
    sceneRef.current = { scene, camera, renderer, controls, eyeGroup };

    // Raycaster for clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes = Object.values(partsRef.current);
      const intersects = raycaster.intersectObjects(meshes);
      if (intersects.length > 0) {
        const mesh = intersects[0].object;
        const entry = Object.entries(partsRef.current).find(([_, m]) => m === mesh);
        if (entry) onSelectPart?.(entry[0]);
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      eyeGroup.rotation.y += 0.003;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("click", onClick);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Highlight selected part
  useEffect(() => {
    Object.entries(partsRef.current).forEach(([name, mesh]) => {
      if (!mesh.material) return;
      const part = PARTS.find((p) => p.name === name);
      if (name === selectedPart) {
        mesh.material.emissive = new THREE.Color(part?.color || 0xffffff);
        mesh.material.emissiveIntensity = 0.5;
      } else {
        mesh.material.emissive = new THREE.Color(0x000000);
        mesh.material.emissiveIntensity = 0;
      }
    });
  }, [selectedPart]);

  const currentPart = PARTS.find((p) => p.name === selectedPart);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-600" />
          <h3 className="font-display font-semibold text-sm">3D Interactive Eye Model</h3>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onSelectPart?.(null)}>
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      <div
        ref={mountRef}
        className="rounded-xl overflow-hidden bg-slate-900 mb-3"
        style={{ height: 400 }}
      />

      <div className="flex flex-wrap gap-1.5 mb-3">
        {PARTS.map((part) => (
          <button
            key={part.name}
            onClick={() => onSelectPart?.(part.name)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
              selectedPart === part.name
                ? "bg-indigo-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {part.name}
          </button>
        ))}
      </div>

      {currentPart && (
        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-indigo-700">{currentPart.name}</p>
              <p className="text-xs text-indigo-800 mt-0.5">{currentPart.desc}</p>
            </div>
          </div>
        </div>
      )}
      {!currentPart && (
        <p className="text-xs text-muted-foreground text-center">
          Click any part of the eye or use the buttons above to learn about each structure.
        </p>
      )}
    </Card>
  );
}