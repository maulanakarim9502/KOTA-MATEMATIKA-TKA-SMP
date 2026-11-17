/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { CHAPTERS_DATA, ChapterModule } from '../data/tkaData';
import {
  ROAD_NODES,
  ROAD_SEGMENTS,
  CHAPTER_BUILDING_PLACEMENTS,
  VEHICLE_ROUTES,
  TRAFFIC_LIGHT_NODES,
  getElevation,
  getRoadsidePlacement,
} from '../data/cityLayout';
import {
  Play,
  Compass,
  Volume2,
  Navigation,
  CheckCircle2,
  Lock,
  Sun,
  Moon,
  Sunrise,
  Clock,
} from 'lucide-react';

type TimeMode = 'auto' | 'day' | 'night';
type DayPhase = 'day' | 'sunset' | 'night';

function computePhase(mode: TimeMode, now: Date): DayPhase {
  if (mode === 'day') return 'day';
  if (mode === 'night') return 'night';
  const h = now.getHours() + now.getMinutes() / 60;
  if (h >= 18.5 || h < 6) return 'night';
  if (h >= 17 && h < 18.5) return 'sunset';
  return 'day';
}

interface ThreeCityProps {
  userProgress: Record<number, { solved: boolean; stars: number; attempts: number }>;
  kickedChapterId?: number | null;
  isMobileLayout?: boolean;
  onSelectChapter: (chapterId: number) => void;
  speakText: (text: string) => void;
}

interface BuildingWorldItem {
  chapter: ChapterModule;
  x: number;
  y: number;
  z: number;
  solvedCount: number;
}

// Helper: distance from point (px, pz) to line segment (ax, az)-(bx, bz)
function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) return Math.hypot(px - ax, pz - az);
  let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

// Helper: create sharp Roblox face texture
function createRobloxFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Yellow skin base
  ctx.fillStyle = '#fde047';
  ctx.fillRect(0, 0, 256, 256);

  // Eyebrows
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(58, 78);
  ctx.quadraticCurveTo(80, 66, 102, 76);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(154, 76);
  ctx.quadraticCurveTo(176, 66, 198, 78);
  ctx.stroke();

  // Left & Right Eyes (sharp oval with iris & specular shine)
  [82, 174].forEach((ex) => {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(ex, 114, 15, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex - 5, 104, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + 5, 120, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Rosy cheeks
  ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
  ctx.beginPath();
  ctx.ellipse(54, 145, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(202, 145, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cheerful Roblox smile
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(128, 146, 36, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Helper: create crisp 3D Signboard CanvasTexture for buildings
function createBuildingSignTexture(
  chapterId: number,
  title: string,
  solvedCount: number,
  accentColor: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = solvedCount === 5 ? '#10b981' : accentColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(6, 6, 500, 148);

  // Badge pill
  ctx.fillStyle = solvedCount === 5 ? '#10b981' : accentColor;
  ctx.fillRect(22, 22, 115, 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`BAB ${chapterId}`, 79, 51);

  // Progress badge
  ctx.fillStyle = solvedCount === 5 ? '#065f46' : '#1e293b';
  ctx.fillRect(365, 22, 125, 42);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`${solvedCount}/5 ★`, 427, 50);

  // Title text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  const cleanTitle = title.replace(/^Bab \d+:\s*/, '');
  ctx.fillText(cleanTitle.slice(0, 32), 24, 116);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Helper: create floating NPC nametag texture
function createNameTagTexture(name: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(16, 8, 224, 48, 20);
  ctx.fill();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, 128, 41);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function ThreeCity({
  userProgress,
  kickedChapterId = null,
  isMobileLayout = false,
  onSelectChapter,
  speakText,
}: ThreeCityProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const analogBaseRef = useRef<HTMLDivElement>(null);
  const analogPointerIdRef = useRef<number | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const playerPosRef = useRef<{ x: number; z: number; yaw: number }>({ x: 0, z: 12, yaw: Math.PI });
  const lastAnnouncedChapterRef = useRef<number | null>(null);
  const speakTextRef = useRef(speakText);
  speakTextRef.current = speakText;

  const [nearbyChapter, setNearbyChapter] = useState<ChapterModule | null>(null);
  const [playerMiniPos, setPlayerMiniPos] = useState<{ x: number; z: number; yaw: number }>({
    x: 0,
    z: 12,
    yaw: Math.PI,
  });
  const [isLandscapePrompt, setIsLandscapePrompt] = useState<boolean>(false);
  const [timeMode, setTimeMode] = useState<TimeMode>('auto');
  const timeModeRef = useRef<TimeMode>('auto');
  timeModeRef.current = timeMode;
  const [clockText, setClockText] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [currentPhase, setCurrentPhase] = useState<DayPhase>(() => computePhase('auto', new Date()));

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockText(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setCurrentPhase(computePhase(timeModeRef.current, now));
    };
    updateClock();
    const timer = setInterval(updateClock, 15000);
    return () => clearInterval(timer);
  }, [timeMode]);

  // Precompute all 11 building world coordinates + progress
  const buildingWorldItems: BuildingWorldItem[] = useMemo(() => {
    return CHAPTERS_DATA.map((ch) => {
      const placement = CHAPTER_BUILDING_PLACEMENTS.find((p) => p.chapterId === ch.id)!;
      const pos = getRoadsidePlacement(placement.segmentId, placement.t, placement.side, 10.0);
      const qIds = [1, 2, 3, 4, 5].map((i) => (ch.id - 1) * 5 + i);
      const solvedCount = qIds.filter((qId) => userProgress[qId]?.solved).length;
      return {
        chapter: ch,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        solvedCount,
      };
    });
  }, [userProgress]);

  // Active Voice Quest target: prioritize incomplete chapter other than any currently kicked chapter
  const activeQuest = useMemo(() => {
    return (
      buildingWorldItems.find((b) => b.solvedCount < 5 && b.chapter.id !== kickedChapterId) ||
      buildingWorldItems.find((b) => b.solvedCount < 5) ||
      buildingWorldItems[0]
    );
  }, [buildingWorldItems, kickedChapterId]);

  const questDistance = Math.round(
    Math.hypot(activeQuest.x - playerMiniPos.x, activeQuest.z - playerMiniPos.z)
  );

  const updateAnalogFromClientPos = (clientX: number, clientY: number) => {
    const baseEl = analogBaseRef.current;
    if (!baseEl) return;
    const rect = baseEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxRadius = rect.width * 0.36;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius && dist > 0) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });
    joystickRef.current = {
      x: maxRadius > 0 ? dx / maxRadius : 0,
      y: maxRadius > 0 ? dy / maxRadius : 0,
    };
  };

  const handleAnalogPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (analogPointerIdRef.current !== null) return;
    analogPointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateAnalogFromClientPos(e.clientX, e.clientY);
  };

  const handleAnalogPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== analogPointerIdRef.current) return;
    e.stopPropagation();
    updateAnalogFromClientPos(e.clientX, e.clientY);
  };

  const handleAnalogPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== analogPointerIdRef.current) return;
    e.stopPropagation();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    analogPointerIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    joystickRef.current = { x: 0, y: 0 };
  };

  // Announce quest directions via Voice AI
  const speakQuestGuide = () => {
    const dx = activeQuest.x - playerPosRef.current.x;
    const dz = activeQuest.z - playerPosRef.current.z;
    const dist = Math.round(Math.hypot(dx, dz));
    const ns = dz < -5 ? 'Utara' : dz > 5 ? 'Selatan' : '';
    const ew = dx > 5 ? 'Timur' : dx < -5 ? 'Barat' : '';
    const dir = [ns, ew].filter(Boolean).join(' ') || 'dekat posisimu';
    speakText(
      `Panduan misi aktif: Menuju Gedung ${activeQuest.chapter.title} di arah ${dir}, berjarak sekitar ${dist} meter. Ikuti jalan raya aspal menuju tanda kuning berkedip di peta mini.`
    );
  };

  // Check orientation on mobile
  useEffect(() => {
    const checkOrientation = () => {
      if (window.innerWidth < 768 && window.innerHeight > window.innerWidth) {
        setIsLandscapePrompt(true);
      } else {
        setIsLandscapePrompt(false);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- SCENE, SKY, FOG, RENDERER ---
    const scene = new THREE.Scene();
    const initialPhase = computePhase(timeModeRef.current, new Date());
    scene.background = new THREE.Color(
      initialPhase === 'night' ? 0x060a1a : initialPhase === 'sunset' ? 0xfb923c : 0x7dd3fc
    );
    scene.fog = new THREE.FogExp2(
      initialPhase === 'night' ? 0x0b1026 : initialPhase === 'sunset' ? 0xfdba74 : 0x93c5fd,
      initialPhase === 'night' ? 0.0065 : 0.0072
    );

    const camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / container.clientHeight,
      0.1,
      400
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- LIGHTING (DYNAMIC REAL-TIME DAY/SUNSET/NIGHT) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x15803d, 0.55);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    sunLight.position.set(55, 80, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 220;
    const d = 75;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // --- CELESTIAL BODIES: SUN, MOON, TWINKLING STARS ---
    const sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    sunDisc.position.set(70, 62, -65);
    scene.add(sunDisc);

    const moonDisc = new THREE.Mesh(
      new THREE.SphereGeometry(4.6, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xe2e8f0 })
    );
    moonDisc.position.set(-68, 58, -60);
    scene.add(moonDisc);

    const starCount = 420;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.42; // upper dome only
      const rad = 135 + Math.random() * 25;
      starPositions[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = rad * Math.cos(phi) + 12;
      starPositions[i * 3 + 2] = rad * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xf8fafc,
      size: 1.35,
      transparent: true,
      opacity: initialPhase === 'night' ? 0.95 : 0,
      depthWrite: false,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // --- ROLLING HILLS TERRAIN (Matched exactly to world X, Z via getElevation(vx, -vy)) ---
    const terrainSize = 200;
    const terrainSegs = 100;
    const groundGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
    const posAttr = groundGeo.attributes.position;
    const colors: number[] = [];

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vyLocal = posAttr.getY(i);
      const worldZ = -vyLocal; // Rotation -PI/2 around X maps local Y to -Z!
      const elev = getElevation(vx, worldZ);
      posAttr.setZ(i, elev);

      // Subtle grass shading variation for realism
      const shade = 0.85 + 0.15 * Math.sin(vx * 0.18) * Math.cos(worldZ * 0.18);
      const isHill = elev > 1.5;
      colors.push(
        (isHill ? 0.16 : 0.13) * shade,
        (isHill ? 0.68 : 0.74) * shade,
        (isHill ? 0.28 : 0.34) * shade
      );
    }
    groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.02,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- INTEGRATED BLACK ASPHALT ROAD NETWORK (CLEAN INTERSECTIONS, ZERO OVERLAP) ---
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x050507,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    const capAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x050507,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2,
    });
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide });

    const roadHalfW = 4.4;
    const sidewalkOuterW = 5.9;
    const capRadius = 6.2;

    // Smoothly computes road surface elevation, blending cleanly into exact intersection node elevations near ends
    const getSegmentY = (
      cx: number,
      cz: number,
      px: number,
      pz: number,
      ax: number,
      az: number,
      bx: number,
      bz: number,
      t: number,
      segLen: number
    ) => {
      const yCross = Math.max(
        getElevation(cx, cz),
        getElevation(cx + px * roadHalfW, cz + pz * roadHalfW),
        getElevation(cx - px * roadHalfW, cz - pz * roadHalfW)
      );
      const distFromStart = t * segLen;
      const distFromEnd = (1 - t) * segLen;
      const blendDist = 9.0;
      if (distFromStart < blendDist) {
        const w = distFromStart / blendDist;
        const yA = getElevation(ax, az);
        return yA * (1 - w) + yCross * w;
      }
      if (distFromEnd < blendDist) {
        const w = distFromEnd / blendDist;
        const yB = getElevation(bx, bz);
        return yB * (1 - w) + yCross * w;
      }
      return yCross;
    };

    const minDistToOtherRoads = (x: number, z: number, currentSegId: string): number => {
      let minD = Infinity;
      for (const other of ROAD_SEGMENTS) {
        if (other.id === currentSegId) continue;
        const oa = ROAD_NODES[other.from];
        const ob = ROAD_NODES[other.to];
        const d = distToSegment(x, z, oa.x, oa.z, ob.x, ob.z);
        if (d < minD) minD = d;
      }
      return minD;
    };

    const minDistToAnyRoad = (x: number, z: number): number => {
      let minD = Infinity;
      for (const seg of ROAD_SEGMENTS) {
        const a = ROAD_NODES[seg.from];
        const b = ROAD_NODES[seg.to];
        const d = distToSegment(x, z, a.x, a.z, b.x, b.z);
        if (d < minD) minD = d;
      }
      return minD;
    };

    // Helper to build a clean ribbon strip with optional node-trim & inter-road exclusion check (prevents overlap!)
    const buildRibbonStrip = (
      segId: string,
      ax: number,
      az: number,
      bx: number,
      bz: number,
      offsetA: number,
      offsetB: number,
      yOffsetA: number,
      yOffsetB: number,
      trimEndsMeters: number,
      minClearanceOtherRoad: number,
      mat: THREE.Material
    ) => {
      const dx = bx - ax;
      const dz = bz - az;
      const segLen = Math.hypot(dx, dz) || 1;
      const ux = dx / segLen;
      const uz = dz / segLen;
      const px = -uz;
      const pz = ux;

      const tStart = Math.min(0.45, trimEndsMeters / segLen);
      const tEnd = Math.max(0.55, 1 - trimEndsMeters / segLen);
      const activeLen = (tEnd - tStart) * segLen;
      const steps = Math.max(8, Math.round(activeLen / 1.6));

      const positions: number[] = [];
      const indices: number[] = [];
      const midOffset = (offsetA + offsetB) * 0.5;

      let vIndex = 0;
      for (let i = 0; i < steps; i++) {
        const t0 = tStart + ((tEnd - tStart) * i) / steps;
        const t1 = tStart + ((tEnd - tStart) * (i + 1)) / steps;
        const tMid = (t0 + t1) * 0.5;

        const mx = ax + dx * tMid + px * midOffset;
        const mz = az + dz * tMid + pz * midOffset;

        // Skip sub-quad if it overlaps another road or sits inside an intersection plaza
        if (minClearanceOtherRoad > 0) {
          if (
            Math.hypot(mx - ax, mz - az) < capRadius + 0.5 ||
            Math.hypot(mx - bx, mz - bz) < capRadius + 0.5 ||
            minDistToOtherRoads(mx, mz, segId) < minClearanceOtherRoad
          ) {
            continue;
          }
        }

        const c0x = ax + dx * t0;
        const c0z = az + dz * t0;
        const c1x = ax + dx * t1;
        const c1z = az + dz * t1;

        const y0 = getSegmentY(c0x, c0z, px, pz, ax, az, bx, bz, t0, segLen);
        const y1 = getSegmentY(c1x, c1z, px, pz, ax, az, bx, bz, t1, segLen);

        // Emit independent clean quad so skipped intersection gaps stay sharp
        positions.push(c0x + px * offsetA, y0 + yOffsetA, c0z + pz * offsetA);
        positions.push(c0x + px * offsetB, y0 + yOffsetB, c0z + pz * offsetB);
        positions.push(c1x + px * offsetA, y1 + yOffsetA, c1z + pz * offsetA);
        positions.push(c1x + px * offsetB, y1 + yOffsetB, c1z + pz * offsetB);

        // Outward upward-facing (+Y) CCW winding
        indices.push(vIndex, vIndex + 1, vIndex + 2);
        indices.push(vIndex + 1, vIndex + 3, vIndex + 2);
        vIndex += 4;
      }

      if (indices.length === 0) return;

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      scene.add(mesh);
    };

    const lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.4 });
    const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const lampHaloMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: initialPhase === 'night' ? 0.35 : 0.0,
      depthWrite: false,
    });

    ROAD_SEGMENTS.forEach((seg) => {
      const a = ROAD_NODES[seg.from];
      const b = ROAD_NODES[seg.to];
      const segLen = Math.hypot(b.x - a.x, b.z - a.z);
      const ux = (b.x - a.x) / segLen;
      const uz = (b.z - a.z) / segLen;
      const px = -uz;
      const pz = ux;

      // 1. Main Solid Black Asphalt Surface (trimmed at 4.0m inside intersection plazas so two segments NEVER cross!)
      buildRibbonStrip(seg.id, a.x, a.z, b.x, b.z, -roadHalfW, roadHalfW, 0.19, 0.19, 4.0, 0, asphaltMat);

      // 2. Left & Right Raised Sidewalks + Outer Skirt (automatically skipped near intersections/other roads!)
      buildRibbonStrip(
        seg.id,
        a.x,
        a.z,
        b.x,
        b.z,
        roadHalfW,
        sidewalkOuterW,
        0.30,
        0.30,
        6.2,
        roadHalfW + 0.55,
        sidewalkMat
      );
      buildRibbonStrip(
        seg.id,
        a.x,
        a.z,
        b.x,
        b.z,
        sidewalkOuterW,
        sidewalkOuterW + 0.3,
        0.30,
        -1.6,
        6.2,
        roadHalfW + 0.85,
        sidewalkMat
      );

      buildRibbonStrip(
        seg.id,
        a.x,
        a.z,
        b.x,
        b.z,
        -sidewalkOuterW,
        -roadHalfW,
        0.30,
        0.30,
        6.2,
        roadHalfW + 0.55,
        sidewalkMat
      );
      buildRibbonStrip(
        seg.id,
        a.x,
        a.z,
        b.x,
        b.z,
        -sidewalkOuterW - 0.3,
        -sidewalkOuterW,
        -1.6,
        0.30,
        6.2,
        roadHalfW + 0.85,
        sidewalkMat
      );

      // 3. Crisp White Road Edge Stripes (never cross intersections!)
      buildRibbonStrip(
        seg.id,
        a.x,
        a.z,
        b.x,
        b.z,
        roadHalfW - 0.34,
        roadHalfW - 0.16,
        0.21,
        0.21,
        6.0,
        roadHalfW + 0.15,
        whiteLineMat
      );
      buildRibbonStrip(
        seg.id,
        a.x,
        a.z,
        b.x,
        b.z,
        -roadHalfW + 0.16,
        -roadHalfW + 0.34,
        0.21,
        0.21,
        6.0,
        roadHalfW + 0.15,
        whiteLineMat
      );

      // 4. Yellow Dashed Centerline (only outside intersections)
      const dashCount = Math.floor(segLen / 4.5);
      for (let dIdx = 1; dIdx < dashCount; dIdx++) {
        const t = dIdx / dashCount;
        const cx = a.x + (b.x - a.x) * t;
        const cz = a.z + (b.z - a.z) * t;
        if (
          Math.hypot(cx - a.x, cz - a.z) < capRadius + 0.8 ||
          Math.hypot(cx - b.x, cz - b.z) < capRadius + 0.8 ||
          minDistToOtherRoads(cx, cz, seg.id) < roadHalfW + 0.5
        ) {
          continue;
        }
        const cy = getSegmentY(cx, cz, px, pz, a.x, a.z, b.x, b.z, t, segLen) + 0.215;

        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 2.0), yellowLineMat);
        dash.position.set(cx, cy, cz);
        dash.rotation.y = Math.atan2(ux, uz);
        scene.add(dash);
      }

      // 5. Street Lamps along sidewalk (checked so they NEVER stand inside any road!)
      const lampCount = Math.max(1, Math.floor(segLen / 22));
      for (let lIdx = 1; lIdx <= lampCount; lIdx++) {
        const lt = lIdx / (lampCount + 1);
        const side = lIdx % 2 === 0 ? 1 : -1;
        const lx = a.x + (b.x - a.x) * lt + px * side * 5.4;
        const lz = a.z + (b.z - a.z) * lt + pz * side * 5.4;
        if (
          Math.hypot(lx - a.x, lz - a.z) < capRadius + 1.0 ||
          Math.hypot(lx - b.x, lz - b.z) < capRadius + 1.0 ||
          minDistToOtherRoads(lx, lz, seg.id) < roadHalfW + 0.9
        ) {
          continue;
        }
        const ly = getElevation(lx, lz);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.8, 8), lampPoleMat);
        pole.position.set(lx, ly + 2.4, lz);
        pole.castShadow = true;
        scene.add(pole);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.12), lampPoleMat);
        arm.position.set(lx - px * side * 0.45, ly + 4.7, lz - pz * side * 0.45);
        arm.rotation.y = Math.atan2(ux, uz);
        scene.add(arm);

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), lampBulbMat);
        bulb.position.set(lx - px * side * 0.85, ly + 4.55, lz - pz * side * 0.85);
        scene.add(bulb);

        const halo = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 10), lampHaloMat);
        halo.position.copy(bulb.position);
        scene.add(halo);
      }
    });

    // Clean Black Asphalt Intersection Plaza Caps at every node (seamless junction with zero z-fighting)
    Object.values(ROAD_NODES).forEach((node) => {
      const yNode = getElevation(node.x, node.z);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(capRadius, capRadius + 0.4, 1.8, 32), capAsphaltMat);
      cap.position.set(node.x, yNode - 0.72, node.z);
      cap.receiveShadow = true;
      scene.add(cap);
    });

    // --- TRAFFIC LIGHTS (LAMPU MERAH) SAFELY OUTSIDE ROAD LANES ---
    const trafficLights: {
      red: THREE.MeshBasicMaterial;
      yellow: THREE.MeshBasicMaterial;
      green: THREE.MeshBasicMaterial;
      offset: number;
    }[] = [];

    TRAFFIC_LIGHT_NODES.forEach((nodeId, idx) => {
      const node = ROAD_NODES[nodeId];
      // Pick the safest corner angle around the intersection plaza that is furthest from any road
      let bestX = node.x + 6.4;
      let bestZ = node.z + 6.4;
      let bestClearance = -1;
      for (let k = 0; k < 8; k++) {
        const ang = (Math.PI / 4) + (k * Math.PI) / 4;
        const candX = node.x + Math.cos(ang) * 7.2;
        const candZ = node.z + Math.sin(ang) * 7.2;
        const clr = minDistToAnyRoad(candX, candZ);
        if (clr > bestClearance) {
          bestClearance = clr;
          bestX = candX;
          bestZ = candZ;
        }
      }
      if (bestClearance < 4.9) return;
      const ty = getElevation(bestX, bestZ);

      const tlGroup = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 5.2, 8), lampPoleMat);
      post.position.y = 2.6;
      post.castShadow = true;
      tlGroup.add(post);

      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 1.7, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x0f172a })
      );
      housing.position.y = 4.6;
      tlGroup.add(housing);

      const rMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const yMat = new THREE.MeshBasicMaterial({ color: 0x422006 });
      const gMat = new THREE.MeshBasicMaterial({ color: 0x052e16 });

      const redBulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), rMat);
      redBulb.position.set(0, 5.1, 0.35);
      tlGroup.add(redBulb);

      const yellowBulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), yMat);
      yellowBulb.position.set(0, 4.6, 0.35);
      tlGroup.add(yellowBulb);

      const greenBulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), gMat);
      greenBulb.position.set(0, 4.1, 0.35);
      tlGroup.add(greenBulb);

      tlGroup.position.set(bestX, ty, bestZ);
      scene.add(tlGroup);
      trafficLights.push({ red: rMat, yellow: yMat, green: gMat, offset: idx * 2.5 });
    });

    // --- 11 CHAPTER BUILDINGS + PAVED DRIVEWAY APRONS FACING ROAD ---
    const buildingMeshes: { mesh: THREE.Group; data: ChapterModule; x: number; z: number }[] = [];
    const buildingBounds: { x: number; z: number }[] = [];
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0xfef08a,
      emissiveIntensity: 0.45,
      roughness: 0.1,
      metalness: 0.2,
    });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.5 });
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });

    CHAPTERS_DATA.forEach((ch) => {
      const placement = CHAPTER_BUILDING_PLACEMENTS.find((p) => p.chapterId === ch.id)!;
      const pos = getRoadsidePlacement(placement.segmentId, placement.t, placement.side, 10.0);
      buildingBounds.push({ x: pos.x, z: pos.z });

      const qIds = [1, 2, 3, 4, 5].map((i) => (ch.id - 1) * 5 + i);
      const solvedCount = qIds.filter((qId) => userProgress[qId]?.solved).length;
      const isComplete = solvedCount === 5;

      const group = new THREE.Group();
      const baseHeight = 4.6 + Math.floor(solvedCount / 2) * 1.4;
      const bWidth = 5.4;
      const bDepth = 5.0;

      // Solid foundation plinth sinking into hillside so building NEVER floats
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(bWidth + 0.8, 3.2, bDepth + 0.8), plinthMat);
      plinth.position.y = -1.3;
      plinth.receiveShadow = true;
      group.add(plinth);

      // Paved walkway connecting building front (+Z) neatly to the road sidewalk (never jutting onto asphalt!)
      const apron = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.28, 2.2), apronMat);
      apron.position.set(0, 0.08, 3.4);
      apron.receiveShadow = true;
      group.add(apron);

      // Main Building Body
      const bodyMat = new THREE.MeshStandardMaterial({
        color: isComplete ? 0x059669 : ch.color,
        roughness: 0.35,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(bWidth, baseHeight, bDepth), bodyMat);
      body.position.y = baseHeight / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Rooftop Parapet Trim
      const roofColor = isComplete ? 0xf59e0b : 0x1e1b4b;
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(bWidth + 0.5, 0.55, bDepth + 0.5),
        new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.3 })
      );
      roof.position.y = baseHeight + 0.25;
      roof.castShadow = true;
      group.add(roof);

      // Upgrade Tier: Extra glass penthouse floor if >= 3 solved
      if (solvedCount >= 3) {
        const upper = new THREE.Mesh(
          new THREE.BoxGeometry(3.8, 1.8, 3.4),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.3 })
        );
        upper.position.y = baseHeight + 1.4;
        upper.castShadow = true;
        group.add(upper);
      }

      // Victory Golden Beacon Spire when complete
      const spireHeight = isComplete ? 3.2 : 1.6;
      const spire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.14, spireHeight),
        new THREE.MeshStandardMaterial({ color: isComplete ? 0xfacc15 : 0x94a3b8 })
      );
      spire.position.y = baseHeight + (solvedCount >= 3 ? 2.3 : 0.5) + spireHeight / 2;
      group.add(spire);

      // Front Porch Awning & Pillars
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.25, 1.3),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc })
      );
      awning.position.set(0, 2.3, bDepth / 2 + 0.55);
      awning.castShadow = true;
      group.add(awning);

      [-1.3, 1.3].forEach((px) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.3, 0.24), apronMat);
        pillar.position.set(px, 1.15, bDepth / 2 + 1.0);
        group.add(pillar);
      });

      // Double Entrance Door (+Z front)
      const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.05, 0.25), windowFrameMat);
      doorFrame.position.set(0, 1.02, bDepth / 2 + 0.05);
      group.add(doorFrame);

      const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.9, 0.28), doorMat);
      door.position.set(0, 0.95, bDepth / 2 + 0.07);
      group.add(door);

      // Sharp Multi-Pane Windows on Front, Left, Right, Back walls
      const addWindow = (wx: number, wy: number, wz: number, rotY = 0) => {
        const winGrp = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.2, 0.16), windowFrameMat);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.0, 0.2), windowGlassMat);
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.22), windowFrameMat);
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.22), windowFrameMat);
        winGrp.add(frame, glass, crossV, crossH);
        winGrp.position.set(wx, wy, wz);
        winGrp.rotation.y = rotY;
        group.add(winGrp);
      };

      // Front windows
      [-1.7, 1.7].forEach((wx) => addWindow(wx, 1.6, bDepth / 2 + 0.05));
      if (baseHeight > 4.2) {
        [-1.7, 0, 1.7].forEach((wx) => addWindow(wx, 3.6, bDepth / 2 + 0.05));
      }
      // Side windows
      [-1.2, 1.2].forEach((wz) => {
        addWindow(bWidth / 2 + 0.05, 1.8, wz, Math.PI / 2);
        addWindow(-bWidth / 2 - 0.05, 1.8, wz, Math.PI / 2);
      });

      // Mounted 3D Signboard facing the road
      const signTex = createBuildingSignTexture(ch.id, ch.title, solvedCount, ch.color);
      const signMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 1.35, 0.2),
        new THREE.MeshBasicMaterial({ map: signTex })
      );
      signMesh.position.set(0, baseHeight + 0.95, bDepth / 2 + 0.35);
      group.add(signMesh);

      // Upgrade Tier: Flower planters at entrance if >= 1 solved
      if (solvedCount >= 1) {
        [-1.9, 1.9].forEach((px) => {
          const pot = new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.5, 0.65),
            new THREE.MeshStandardMaterial({ color: 0x92400e })
          );
          pot.position.set(px, 0.3, bDepth / 2 + 0.8);
          const shrub = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x16a34a })
          );
          shrub.position.set(px, 0.75, bDepth / 2 + 0.8);
          group.add(pot, shrub);
        });
      }

      group.position.set(pos.x, pos.y, pos.z);
      group.rotation.y = pos.facingAngle;
      scene.add(group);
      buildingMeshes.push({ mesh: group, data: ch, x: pos.x, z: pos.z });
    });

    // --- AMBIENT CITY BUILDINGS ALONG REMAINING ROADS (Shops, Cafes, Towers) ---
    const ambientPlacements: { segId: string; t: number; side: 1 | -1; color: number; h: number }[] = [
      { segId: 'R9', t: 0.45, side: 1, color: 0x64748b, h: 7.5 },
      { segId: 'R9', t: 0.55, side: -1, color: 0x475569, h: 6.0 },
      { segId: 'R10', t: 0.45, side: -1, color: 0x0ea5e9, h: 5.5 },
      { segId: 'R13', t: 0.50, side: 1, color: 0xf43f5e, h: 5.0 },
      { segId: 'R14', t: 0.48, side: -1, color: 0x8b5cf6, h: 6.5 },
      { segId: 'R15', t: 0.50, side: 1, color: 0xeab308, h: 5.2 },
      { segId: 'R0', t: 0.25, side: 1, color: 0x334155, h: 8.2 },
      { segId: 'R3', t: 0.75, side: 1, color: 0x0284c7, h: 6.8 },
    ];

    ambientPlacements.forEach((ap) => {
      const pos = getRoadsidePlacement(ap.segId, ap.t, ap.side, 9.8);
      // Verify not too close to any chapter building
      if (buildingBounds.some((b) => Math.hypot(b.x - pos.x, b.z - pos.z) < 9.5)) return;
      buildingBounds.push({ x: pos.x, z: pos.z });

      const grp = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.0, 4.8), plinthMat);
      plinth.position.y = -1.3;
      grp.add(plinth);

      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, ap.h, 4.2),
        new THREE.MeshStandardMaterial({ color: ap.color, roughness: 0.45 })
      );
      tower.position.y = ap.h / 2;
      tower.castShadow = true;
      tower.receiveShadow = true;
      grp.add(tower);

      const apron = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.26, 2.0), apronMat);
      apron.position.set(0, 0.08, 3.0);
      grp.add(apron);

      const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.7, 0.2), doorMat);
      door.position.set(0, 0.85, 2.15);
      grp.add(door);

      for (let floor = 1.6; floor < ap.h - 0.8; floor += 1.8) {
        [-1.2, 1.2].forEach((wx) => {
          const w = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.2), windowGlassMat);
          w.position.set(wx, floor, 2.15);
          grp.add(w);
        });
      }

      grp.position.set(pos.x, pos.y, pos.z);
      grp.rotation.y = pos.facingAngle;
      scene.add(grp);
    });

    // --- TREES & NATURE (Placed cleanly on grass parks, NEVER on roads or inside buildings) ---
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const leavesMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const leavesMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });

    const isClearOfRoadsAndBuildings = (x: number, z: number): boolean => {
      for (const seg of ROAD_SEGMENTS) {
        const a = ROAD_NODES[seg.from];
        const b = ROAD_NODES[seg.to];
        if (distToSegment(x, z, a.x, a.z, b.x, b.z) < 8.8) return false;
      }
      for (const b of buildingBounds) {
        if (Math.hypot(x - b.x, z - b.z) < 7.2) return false;
      }
      return true;
    };

    for (let i = 0; i < 65; i++) {
      // Deterministic pseudo-random spread around city
      const angle = i * 2.39996;
      const radius = 14 + (i % 9) * 7.5;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;
      if (!isClearOfRoadsAndBuildings(tx, tz)) continue;

      const ty = getElevation(tx, tz);
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.4, 7), trunkMat);
      trunk.position.y = 1.2;
      trunk.castShadow = true;
      tree.add(trunk);

      const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.75, 1), leavesMat1);
      canopy1.position.y = 2.9;
      canopy1.castShadow = true;
      tree.add(canopy1);

      const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25, 1), leavesMat2);
      canopy2.position.set(0.4, 3.8, 0.2);
      canopy2.castShadow = true;
      tree.add(canopy2);

      tree.position.set(tx, ty - 0.1, tz);
      scene.add(tree);
    }

    // --- MOVING FLUFFY CLOUDS IN SKY (ABUNDANT & CLEARLY VISIBLE IN 3RD-PERSON VIEW) ---
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      transparent: true,
      opacity: 0.92,
    });
    const clouds: { grp: THREE.Group; speed: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const cGrp = new THREE.Group();
      const puffs = 4 + (i % 2);
      for (let p = 0; p < puffs; p++) {
        const radius = p === 1 || p === 2 ? 3.2 : 2.2;
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 1), cloudMat);
        puff.position.set((p - (puffs - 1) / 2) * 2.4, (p % 2) * 0.85, ((p + i) % 3 - 1) * 1.1);
        cGrp.add(puff);
      }
      cGrp.position.set(
        ((i * 37) % 180) - 90,
        21 + (i % 5) * 3.2,
        ((i * 53) % 170) - 85
      );
      scene.add(cGrp);
      clouds.push({ grp: cGrp, speed: 0.014 + (i % 4) * 0.006 });
    }

    // --- VEHICLES DRIVING STRICTLY ON EVERY PAVED ROAD ROUTE ---
    interface RouteVehicle {
      group: THREE.Group;
      waypoints: { x: number; z: number }[];
      segLengths: number[];
      totalLength: number;
      distance: number;
      speed: number;
      wheels: THREE.Mesh[];
    }

    const vehicles: RouteVehicle[] = [];
    const carPalette = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981, 0xf97316, 0xffffff, 0x8b5cf6];
    const headlightBeamMat = new THREE.MeshBasicMaterial({
      color: 0xfef9c3,
      transparent: true,
      opacity: initialPhase === 'night' ? 0.24 : 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const buildVehicleMesh = (color: number, isBus: boolean) => {
      const grp = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.25 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.1, metalness: 0.4 });
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

      const length = isBus ? 4.4 : 2.8;
      const width = isBus ? 1.55 : 1.4;
      const bodyH = isBus ? 1.45 : 0.75;

      // Local forward axis = +Z
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, bodyH, length), bodyMat);
      chassis.position.y = bodyH / 2 + 0.28;
      chassis.castShadow = true;
      grp.add(chassis);

      if (!isBus) {
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(width - 0.15, 0.62, 1.45), glassMat);
        cabin.position.set(0, 1.25, -0.15);
        cabin.castShadow = true;
        grp.add(cabin);
      } else {
        const winStrip = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.55, length - 0.6), glassMat);
        winStrip.position.set(0, 1.35, 0);
        grp.add(winStrip);
      }

      // Headlights (+Z front) + Night Headlight Beams & Taillights (-Z rear)
      [-width * 0.32, width * 0.32].forEach((hx) => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.08), headlightMat);
        hl.position.set(hx, 0.62, length / 2 + 0.02);
        grp.add(hl);

        const beam = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.6, 12, 1, true), headlightBeamMat);
        beam.rotation.x = -Math.PI / 2;
        beam.position.set(hx, 0.55, length / 2 + 1.8);
        grp.add(beam);

        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.08), taillightMat);
        tl.position.set(hx, 0.62, -length / 2 - 0.02);
        grp.add(tl);
      });

      const wheels: THREE.Mesh[] = [];
      const wzPos = isBus ? [-1.45, 1.45] : [-0.85, 0.85];
      [-width / 2 - 0.05, width / 2 + 0.05].forEach((wx) => {
        wzPos.forEach((wz) => {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 14), wheelMat);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.32, wz);
          grp.add(w);
          wheels.push(w);
        });
      });

      return { grp, wheels };
    };

    const getPointOnLoop = (
      waypoints: { x: number; z: number }[],
      segLengths: number[],
      totalLength: number,
      dist: number
    ) => {
      let d = ((dist % totalLength) + totalLength) % totalLength;
      for (let i = 0; i < waypoints.length; i++) {
        const segLen = segLengths[i];
        if (d <= segLen || i === waypoints.length - 1) {
          const a = waypoints[i];
          const b = waypoints[(i + 1) % waypoints.length];
          const t = segLen > 0 ? d / segLen : 0;
          const dx = b.x - a.x;
          const dz = b.z - a.z;
          const len = Math.hypot(dx, dz) || 1;
          const ux = dx / len;
          const uz = dz / len;
          // Right-hand lane offset (+2.1m perpendicular right of travel direction)
          const rx = -uz;
          const rz = ux;
          const x = a.x + dx * t + rx * 2.15;
          const z = a.z + dz * t + rz * 2.15;
          const y = getElevation(x, z) + 0.16;
          return { x, y, z };
        }
        d -= segLen;
      }
      return { x: waypoints[0].x, y: 0.16, z: waypoints[0].z };
    };

    VEHICLE_ROUTES.forEach((routeNodeIds, rIdx) => {
      const waypoints = routeNodeIds.map((nid) => ({ x: ROAD_NODES[nid].x, z: ROAD_NODES[nid].z }));
      const segLengths = waypoints.map((wp, idx) => {
        const nxt = waypoints[(idx + 1) % waypoints.length];
        return Math.hypot(nxt.x - wp.x, nxt.z - wp.z);
      });
      const totalLength = segLengths.reduce((s, v) => s + v, 0);

      const countOnRoute = rIdx < 2 ? 4 : 3;
      for (let c = 0; c < countOnRoute; c++) {
        const isBus = (rIdx + c) % 4 === 0;
        const color = isBus ? 0xf59e0b : carPalette[(rIdx * 3 + c) % carPalette.length];
        const { grp, wheels } = buildVehicleMesh(color, isBus);
        scene.add(grp);

        vehicles.push({
          group: grp,
          waypoints,
          segLengths,
          totalLength,
          distance: (totalLength / countOnRoute) * c,
          speed: isBus ? 0.12 : 0.16 + (c % 3) * 0.025,
          wheels,
        });
      }
    });

    // --- MULTIPLAYER NPC ROBLOX STUDENTS WALKING ON SIDEWALKS ---
    const npcNames = ['Raka', 'Siti', 'Bima', 'Nadia', 'Dimas', 'Putri'];
    const npcColors = [0xef4444, 0xec4899, 0x8b5cf6, 0x06b6d4, 0xf97316, 0x10b981];
    const npcs: {
      group: THREE.Group;
      leftArm: THREE.Group;
      rightArm: THREE.Group;
      leftLeg: THREE.Group;
      rightLeg: THREE.Group;
      route: { x: number; z: number }[];
      segLengths: number[];
      totalLength: number;
      dist: number;
      speed: number;
    }[] = [];

    const buildRobloxAvatar = (shirtColor: number, hairColor: number, faceTex: THREE.CanvasTexture) => {
      const avatar = new THREE.Group();
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.35 });
      const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.45 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });

      // Head with painted sharp Roblox face on +Z
      const headMaterials = [skinMat, skinMat, skinMat, skinMat, new THREE.MeshStandardMaterial({ map: faceTex }), skinMat];
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.76, 0.76), headMaterials);
      head.position.y = 2.38;
      head.castShadow = true;
      avatar.add(head);

      // Cool cap / hair
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.84, 0.26, 0.84),
        new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.5 })
      );
      cap.position.set(0, 2.82, 0);
      avatar.add(cap);
      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.08, 0.35),
        new THREE.MeshStandardMaterial({ color: hairColor })
      );
      visor.position.set(0, 2.72, 0.52);
      avatar.add(visor);

      // Torso + Backpack
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.15, 0.6), shirtMat);
      torso.position.y = 1.42;
      torso.castShadow = true;
      avatar.add(torso);

      const backpack = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.82, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
      );
      backpack.position.set(0, 1.45, -0.44);
      backpack.castShadow = true;
      avatar.add(backpack);

      // Pivoted Arms from shoulder
      const makeArm = (x: number) => {
        const pivot = new THREE.Group();
        pivot.position.set(x, 1.92, 0);
        const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.75, 0.38), shirtMat);
        sleeve.position.y = -0.35;
        sleeve.castShadow = true;
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.34), skinMat);
        hand.position.y = -0.85;
        pivot.add(sleeve, hand);
        avatar.add(pivot);
        return pivot;
      };
      const leftArm = makeArm(-0.76);
      const rightArm = makeArm(0.76);

      // Pivoted Legs from hip
      const makeLeg = (x: number) => {
        const pivot = new THREE.Group();
        pivot.position.set(x, 0.85, 0);
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.72, 0.48), pantsMat);
        leg.position.y = -0.36;
        leg.castShadow = true;
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.56), shoeMat);
        shoe.position.set(0, -0.77, 0.04);
        pivot.add(leg, shoe);
        avatar.add(pivot);
        return pivot;
      };
      const leftLeg = makeLeg(-0.28);
      const rightLeg = makeLeg(0.28);

      return { avatar, leftArm, rightArm, leftLeg, rightLeg };
    };

    const sharedFaceTex = createRobloxFaceTexture();
    const {
      avatar: playerGroup,
      leftArm: pLeftArm,
      rightArm: pRightArm,
      leftLeg: pLeftLeg,
      rightLeg: pRightLeg,
    } = buildRobloxAvatar(0x2563eb, 0x1e293b, sharedFaceTex);

    playerGroup.position.set(
      playerPosRef.current.x,
      getElevation(playerPosRef.current.x, playerPosRef.current.z) + 0.14,
      playerPosRef.current.z
    );
    playerGroup.rotation.y = playerPosRef.current.yaw;
    scene.add(playerGroup);

    // Spawn 6 NPC classmates walking along city sidewalks
    npcNames.forEach((name, idx) => {
      const routeIds = VEHICLE_ROUTES[idx % VEHICLE_ROUTES.length];
      const route = routeIds.map((nid) => ({ x: ROAD_NODES[nid].x, z: ROAD_NODES[nid].z }));
      const segLengths = route.map((wp, i) => {
        const nxt = route[(i + 1) % route.length];
        return Math.hypot(nxt.x - wp.x, nxt.z - wp.z);
      });
      const totalLength = segLengths.reduce((s, v) => s + v, 0);

      const npc = buildRobloxAvatar(npcColors[idx], 0x451a03, sharedFaceTex);
      const tagSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: createNameTagTexture(name), transparent: true })
      );
      tagSprite.scale.set(2.2, 0.55, 1);
      tagSprite.position.set(0, 3.45, 0);
      npc.avatar.add(tagSprite);
      scene.add(npc.avatar);

      npcs.push({
        group: npc.avatar,
        leftArm: npc.leftArm,
        rightArm: npc.rightArm,
        leftLeg: npc.leftLeg,
        rightLeg: npc.rightLeg,
        route,
        segLengths,
        totalLength,
        dist: (totalLength / 6) * idx + 10,
        speed: 0.055 + (idx % 3) * 0.01,
      });
    });

    // --- HIGH-SENSITIVITY MULTI-TOUCH CAMERA ORBIT DRAG + KEYBOARD CONTROLS ---
    let cameraYaw = 0; // Horizontal orbit angle behind player
    let cameraPitch = 0.42; // Vertical elevation pitch (rad)
    let activeCameraPointerId: number | null = null;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const domEl = renderer.domElement;
    domEl.style.touchAction = 'none';

    const onPointerDown = (e: PointerEvent) => {
      if (activeCameraPointerId !== null) return;
      activeCameraPointerId = e.pointerId;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      try {
        domEl.setPointerCapture(e.pointerId);
      } catch {
        // ignore if unsupported
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== activeCameraPointerId) return;
      const deltaX = e.clientX - lastPointerX;
      const deltaY = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      // High responsiveness horizontal & vertical swipe sensitivity
      cameraYaw -= deltaX * 0.015;
      cameraPitch = Math.max(0.16, Math.min(0.92, cameraPitch + deltaY * 0.0085));
    };
    const onPointerUpOrCancel = (e: PointerEvent) => {
      if (e.pointerId !== activeCameraPointerId) return;
      activeCameraPointerId = null;
      try {
        if (domEl.hasPointerCapture(e.pointerId)) {
          domEl.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUpOrCancel);
    window.addEventListener('pointercancel', onPointerUpOrCancel);

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // --- MAIN ANIMATION LOOP ---
    let animationFrameId: number;
    let frameCount = 0;
    const moveSpeed = 0.2;

    const daySky = new THREE.Color(0x7dd3fc);
    const sunsetSky = new THREE.Color(0xf97316);
    const nightSky = new THREE.Color(0x060a1a);

    const dayFog = new THREE.Color(0x93c5fd);
    const sunsetFog = new THREE.Color(0xfdba74);
    const nightFog = new THREE.Color(0x0b1026);

    const dayCloudColor = new THREE.Color(0xffffff);
    const sunsetCloudColor = new THREE.Color(0xfed7aa);
    const nightCloudColor = new THREE.Color(0x475569);

    const sunColorDay = new THREE.Color(0xfffbeb);
    const sunColorSunset = new THREE.Color(0xfb923c);
    const moonColorNight = new THREE.Color(0x93c5fd);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      frameCount++;

      // 0. Real-Time Day / Sunset / Night Atmosphere Update
      const phase = computePhase(timeModeRef.current, new Date());
      const targetSky = phase === 'night' ? nightSky : phase === 'sunset' ? sunsetSky : daySky;
      const targetFog = phase === 'night' ? nightFog : phase === 'sunset' ? sunsetFog : dayFog;
      const targetCloud = phase === 'night' ? nightCloudColor : phase === 'sunset' ? sunsetCloudColor : dayCloudColor;
      const targetDirColor = phase === 'night' ? moonColorNight : phase === 'sunset' ? sunColorSunset : sunColorDay;

      (scene.background as THREE.Color).lerp(targetSky, 0.05);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(targetFog, 0.05);
      }
      cloudMat.color.lerp(targetCloud, 0.05);
      sunLight.color.lerp(targetDirColor, 0.05);

      const targetSunIntensity = phase === 'night' ? 0.52 : phase === 'sunset' ? 1.05 : 1.38;
      const targetAmbient = phase === 'night' ? 0.34 : phase === 'sunset' ? 0.52 : 0.65;
      const targetHemi = phase === 'night' ? 0.32 : phase === 'sunset' ? 0.45 : 0.55;
      sunLight.intensity += (targetSunIntensity - sunLight.intensity) * 0.05;
      ambientLight.intensity += (targetAmbient - ambientLight.intensity) * 0.05;
      hemiLight.intensity += (targetHemi - hemiLight.intensity) * 0.05;

      sunDisc.visible = phase !== 'night';
      moonDisc.visible = phase === 'night';
      const targetStarOpacity = phase === 'night' ? 0.92 + Math.sin(Date.now() * 0.002) * 0.08 : phase === 'sunset' ? 0.25 : 0;
      starMat.opacity += (targetStarOpacity - starMat.opacity) * 0.05;

      const targetWinGlow = phase === 'night' ? 1.35 : phase === 'sunset' ? 0.75 : 0.22;
      windowGlassMat.emissiveIntensity += (targetWinGlow - windowGlassMat.emissiveIntensity) * 0.05;

      const targetLampGlow = phase === 'night' ? 0.38 : phase === 'sunset' ? 0.22 : 0;
      lampHaloMat.opacity += (targetLampGlow - lampHaloMat.opacity) * 0.05;

      const targetBeamOpacity = phase === 'night' ? 0.24 : phase === 'sunset' ? 0.12 : 0;
      headlightBeamMat.opacity += (targetBeamOpacity - headlightBeamMat.opacity) * 0.05;

      // 1. Drift Clouds across sky
      clouds.forEach((c) => {
        c.grp.position.x += c.speed;
        if (c.grp.position.x > 95) c.grp.position.x = -95;
      });

      // 2. Traffic Lights Cycle (Red / Yellow / Green)
      const sec = Date.now() / 1000;
      trafficLights.forEach((tl) => {
        const phase = (sec + tl.offset) % 9;
        if (phase < 4) {
          tl.red.color.setHex(0x450a0a);
          tl.yellow.color.setHex(0x422006);
          tl.green.color.setHex(0x22c55e);
        } else if (phase < 5.2) {
          tl.red.color.setHex(0x450a0a);
          tl.yellow.color.setHex(0xfacc15);
          tl.green.color.setHex(0x052e16);
        } else {
          tl.red.color.setHex(0xef4444);
          tl.yellow.color.setHex(0x422006);
          tl.green.color.setHex(0x052e16);
        }
      });

      // 3. Drive Vehicles strictly along paved roads (with slope pitch + turning)
      vehicles.forEach((v) => {
        v.distance = (v.distance + v.speed) % v.totalLength;
        const curr = getPointOnLoop(v.waypoints, v.segLengths, v.totalLength, v.distance);
        const ahead = getPointOnLoop(v.waypoints, v.segLengths, v.totalLength, v.distance + 1.4);
        v.group.position.set(curr.x, curr.y, curr.z);
        v.group.lookAt(ahead.x, ahead.y, ahead.z);
        v.wheels.forEach((w) => {
          w.rotation.x += 0.25;
        });
      });

      // 4. Move NPCs on sidewalks (5.3m offset from road center)
      npcs.forEach((npc) => {
        npc.dist = (npc.dist + npc.speed) % npc.totalLength;
        let d = npc.dist;
        for (let i = 0; i < npc.route.length; i++) {
          const sl = npc.segLengths[i];
          if (d <= sl || i === npc.route.length - 1) {
            const a = npc.route[i];
            const b = npc.route[(i + 1) % npc.route.length];
            const t = sl > 0 ? d / sl : 0;
            const dx = b.x - a.x;
            const dz = b.z - a.z;
            const len = Math.hypot(dx, dz) || 1;
            const px = -dz / len;
            const pz = dx / len;
            const x = a.x + dx * t + px * 5.3;
            const z = a.z + dz * t + pz * 5.3;
            const y = getElevation(x, z) + 0.26;
            npc.group.position.set(x, y, z);
            npc.group.rotation.y = Math.atan2(dx, dz);
            break;
          }
          d -= sl;
        }
        const walkSwing = Math.sin(Date.now() * 0.01) * 0.45;
        npc.leftLeg.rotation.x = walkSwing;
        npc.rightLeg.rotation.x = -walkSwing;
        npc.leftArm.rotation.x = -walkSwing;
        npc.rightArm.rotation.x = walkSwing;
      });

      // 5. Smooth 360-degree Analog & WASD Input relative to camera yaw
      let inputX = 0;
      let inputZ = 0;
      if (keys['ArrowUp'] || keys['KeyW']) inputZ -= 1;
      if (keys['ArrowDown'] || keys['KeyS']) inputZ += 1;
      if (keys['ArrowLeft'] || keys['KeyA']) inputX -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) inputX += 1;

      if (Math.abs(joystickRef.current.x) > 0.08 || Math.abs(joystickRef.current.y) > 0.08) {
        inputX += joystickRef.current.x;
        inputZ += joystickRef.current.y;
      }

      if (keys['KeyQ']) cameraYaw += 0.045;
      if (keys['KeyE']) cameraYaw -= 0.045;

      const rawMag = Math.hypot(inputX, inputZ);
      if (rawMag > 0.05) {
        const clampedMag = Math.min(1, rawMag);
        const nx = inputX / rawMag;
        const nz = inputZ / rawMag;
        const effectiveSpeed = moveSpeed * clampedMag;

        // Rotate input vector by cameraYaw
        const cosY = Math.cos(cameraYaw);
        const sinY = Math.sin(cameraYaw);
        const worldDx = (nx * cosY + nz * sinY) * effectiveSpeed;
        const worldDz = (-nx * sinY + nz * cosY) * effectiveSpeed;

        playerGroup.position.x = Math.max(-78, Math.min(78, playerGroup.position.x + worldDx));
        playerGroup.position.z = Math.max(-78, Math.min(78, playerGroup.position.z + worldDz));

        // Smoothly rotate character toward movement direction
        const targetAngle = Math.atan2(worldDx, worldDz);
        let diff = targetAngle - playerGroup.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        playerGroup.rotation.y += diff * 0.24;

        // Sharp limb swing animation scaled by speed
        const swing = Math.sin(Date.now() * 0.014) * 0.65 * clampedMag;
        pLeftLeg.rotation.x = swing;
        pRightLeg.rotation.x = -swing;
        pLeftArm.rotation.x = -swing * 0.85;
        pRightArm.rotation.x = swing * 0.85;
      } else {
        pLeftLeg.rotation.x *= 0.8;
        pRightLeg.rotation.x *= 0.8;
        pLeftArm.rotation.x *= 0.8;
        pRightArm.rotation.x *= 0.8;
      }

      // Ground player accurately on terrain/road elevation
      const groundY = getElevation(playerGroup.position.x, playerGroup.position.z) + 0.14;
      playerGroup.position.y += (groundY - playerGroup.position.y) * 0.35;

      playerPosRef.current = {
        x: playerGroup.position.x,
        z: playerGroup.position.z,
        yaw: playerGroup.rotation.y,
      };

      // Update Mini-Map UI periodically (~15fps to avoid excess React re-renders)
      if (frameCount % 4 === 0) {
        setPlayerMiniPos({ ...playerPosRef.current });
      }

      // 6. Responsive Smooth 3rd-Person Chase Camera
      const camDist = 10.2;
      const horizDist = Math.cos(cameraPitch) * camDist;
      const desiredCamX = playerGroup.position.x + Math.sin(cameraYaw) * horizDist;
      const desiredCamZ = playerGroup.position.z + Math.cos(cameraYaw) * horizDist;
      const desiredCamY = Math.max(
        getElevation(desiredCamX, desiredCamZ) + 2.0,
        playerGroup.position.y + 1.8 + Math.sin(cameraPitch) * camDist
      );

      camera.position.x += (desiredCamX - camera.position.x) * 0.28;
      camera.position.z += (desiredCamZ - camera.position.z) * 0.28;
      camera.position.y += (desiredCamY - camera.position.y) * 0.28;
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.9, playerGroup.position.z);

      // 7. Proximity Check with Chapter Buildings + Voice AI arrival announcement
      let found: ChapterModule | null = null;
      for (const bm of buildingMeshes) {
        const dist = Math.hypot(playerGroup.position.x - bm.x, playerGroup.position.z - bm.z);
        if (dist < 6.8) {
          found = bm.data;
          break;
        }
      }
      if (found && lastAnnouncedChapterRef.current !== found.id) {
        lastAnnouncedChapterRef.current = found.id;
        speakTextRef.current(
          `Kamu sudah berada di depan ${found.title}. Tekan Masuk Gedung untuk menonton video dan mengerjakan 5 soal TKA!`
        );
      } else if (!found) {
        lastAnnouncedChapterRef.current = null;
      }
      setNearbyChapter(found);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    return () => {
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUpOrCancel);
      window.removeEventListener('pointercancel', onPointerUpOrCancel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [userProgress]);

  return (
    <div
      className={`relative w-full h-full bg-slate-950 overflow-hidden flex flex-col select-none ${
        isMobileLayout ? 'rounded-none border-0' : 'rounded-2xl shadow-2xl border border-indigo-500/30'
      }`}
    >
      {/* Mobile Landscape Prompt Overlay */}
      {isLandscapePrompt && (
        <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600/30 border border-blue-500 rounded-3xl flex items-center justify-center animate-pulse">
            <Compass className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-white">Putar Perangkat Anda (Landscape)</h2>
          <p className="text-xs text-slate-300 max-w-xs">
            Wajib tampilan horizontal di HP agar kontrol analog dan dunia 3D GTA-Roblox terlihat luas dan nyaman.
          </p>
          <button
            onClick={() => setIsLandscapePrompt(false)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-2xl text-xs shadow-lg transition"
          >
            Lanjutkan Bermain
          </button>
        </div>
      )}

      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

      {/* TOP-LEFT HUD: ACTIVE VOICE AI QUEST GUIDE */}
      {isMobileLayout ? (
        <div className="absolute top-2 left-2 bg-slate-950/75 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-indigo-500/40 text-white shadow-lg max-w-[162px] z-20 space-y-0.5">
          <div className="flex items-center justify-between space-x-1.5">
            <div className="flex items-center space-x-1 min-w-0">
              <Navigation className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" />
              <span className="text-[10px] font-black text-amber-300 whitespace-nowrap">
                {questDistance}m
              </span>
            </div>
            <button
              onClick={speakQuestGuide}
              className="bg-indigo-600/90 hover:bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center space-x-0.5 shrink-0"
            >
              <Volume2 className="w-2.5 h-2.5" />
              <span>Pandu</span>
            </button>
          </div>
          <p className="text-[10px] font-bold leading-tight text-white truncate">
            {activeQuest.chapter.title}
          </p>
        </div>
      ) : (
        <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-4 py-3 rounded-2xl border border-indigo-500/40 text-white shadow-xl max-w-xs z-20 space-y-2">
          <div className="flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                Misi Voice AI ({questDistance}m)
              </span>
            </div>
            <button
              onClick={speakQuestGuide}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 transition"
            >
              <Volume2 className="w-3 h-3" />
              <span>Pandu</span>
            </button>
          </div>
          <p className="text-xs font-bold leading-snug text-white">{activeQuest.chapter.title}</p>
          <p className="text-[10px] text-slate-300">
            Geser layar kanan untuk kamera • Analog kiri (HP) / WASD (Laptop) untuk jalan
          </p>
        </div>
      )}

      {/* TOP-RIGHT HUD: REAL-TIME DAY/NIGHT ATMOSPHERE CLOCK & PREVIEW */}
      <div
        className={`absolute bg-slate-950/80 backdrop-blur-md border border-indigo-500/40 text-white shadow-xl z-20 flex items-center ${
          isMobileLayout
            ? 'top-2 right-2 px-2 py-1 rounded-xl space-x-1.5'
            : 'top-3 right-3 px-3.5 py-2 rounded-2xl space-x-2.5'
        }`}
      >
        <div className={`flex items-center space-x-1 font-bold ${isMobileLayout ? 'text-[10px]' : 'text-xs space-x-1.5'}`}>
          {currentPhase === 'night' ? (
            <Moon className={isMobileLayout ? 'w-3 h-3 text-sky-300' : 'w-4 h-4 text-sky-300'} />
          ) : currentPhase === 'sunset' ? (
            <Sunrise className={isMobileLayout ? 'w-3 h-3 text-amber-400' : 'w-4 h-4 text-amber-400'} />
          ) : (
            <Sun className={isMobileLayout ? 'w-3 h-3 text-yellow-300' : 'w-4 h-4 text-yellow-300'} />
          )}
          <span>
            {currentPhase === 'night' ? 'Malam' : currentPhase === 'sunset' ? 'Sore' : 'Siang'}
          </span>
          {!isMobileLayout && (
            <span className="text-slate-400 flex items-center text-[11px] font-semibold">
              <Clock className="w-3 h-3 mr-1" />
              {clockText}
            </span>
          )}
        </div>
        <button
          onClick={() =>
            setTimeMode((prev) => (prev === 'auto' ? 'day' : prev === 'day' ? 'night' : 'auto'))
          }
          className={`bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold rounded-lg transition ${
            isMobileLayout ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
          }`}
          title="Ganti mode waktu (Otomatis Real-Time / Siang / Malam)"
        >
          {isMobileLayout
            ? timeMode === 'auto'
              ? 'Auto'
              : timeMode === 'day'
              ? 'Siang'
              : 'Malam'
            : timeMode === 'auto'
            ? 'Auto Real-Time'
            : timeMode === 'day'
            ? 'Mode Siang'
            : 'Mode Malam'}
        </button>
      </div>

      {/* KICKED BUILDING COOLDOWN TOP REMINDER */}
      {kickedChapterId !== null && (
        <div
          className={`absolute left-1/2 transform -translate-x-1/2 bg-rose-600/95 backdrop-blur-md text-white border border-rose-300/60 shadow-xl z-20 flex items-center space-x-1.5 font-bold ${
            isMobileLayout
              ? 'top-11 px-2.5 py-1 rounded-xl text-[10px] whitespace-nowrap'
              : 'top-3 px-4 py-2 rounded-2xl text-xs space-x-2'
          }`}
        >
          <Lock className={isMobileLayout ? 'w-3 h-3 text-yellow-300 shrink-0' : 'w-4 h-4 text-yellow-300 shrink-0'} />
          <span>
            {isMobileLayout
              ? `Bab ${kickedChapterId} dikunci! Cari gedung lain.`
              : `Bab ${kickedChapterId} dikunci sementara karena salah jawab! Cari & bangun gedung bab lain dahulu.`}
          </span>
        </div>
      )}

      {/* BOTTOM-LEFT HUD: SMOOTH 360-DEGREE ANALOG JOYSTICK (NO BUTTONS, FOR MOBILE THUMB) */}
      <div
        className={`absolute z-30 flex flex-col items-center space-y-1.5 select-none ${
          isMobileLayout ? 'bottom-3 left-3' : 'bottom-4 left-4'
        }`}
      >
        <div
          ref={analogBaseRef}
          onPointerDown={handleAnalogPointerDown}
          onPointerMove={handleAnalogPointerMove}
          onPointerUp={handleAnalogPointerUp}
          onPointerCancel={handleAnalogPointerUp}
          className={`relative rounded-full bg-slate-950/70 backdrop-blur-md border-2 border-indigo-400/50 shadow-2xl flex items-center justify-center touch-none cursor-pointer ${
            isMobileLayout ? 'w-24 h-24' : 'w-28 h-28 sm:w-32 sm:h-32'
          }`}
        >
          {/* Inner subtle guide ring */}
          <div
            className={`rounded-full border border-white/15 pointer-events-none ${
              isMobileLayout ? 'w-14 h-14' : 'w-16 h-16 sm:w-20 sm:h-20'
            }`}
          />
          {/* Draggable Analog Thumb Knob */}
          <div
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
            className={`absolute rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 border-2 border-white/85 shadow-xl pointer-events-none flex items-center justify-center ${
              isMobileLayout ? 'w-10 h-10' : 'w-12 h-12 sm:w-14 sm:h-14'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white/40" />
          </div>
        </div>
        {!isMobileLayout && (
          <span className="text-[10px] font-bold text-slate-200 bg-slate-950/75 px-2.5 py-0.5 rounded-full border border-white/10 pointer-events-none">
            Analog (HP) • WASD (Laptop)
          </span>
        )}
      </div>

      {/* NEARBY BUILDING ENTRY PROMPT */}
      {nearbyChapter && (
        nearbyChapter.id === kickedChapterId ? (
          <div
            className={`absolute left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-rose-700 to-red-600 text-white shadow-2xl border border-rose-300/40 flex items-center z-30 ${
              isMobileLayout
                ? 'bottom-3 px-3 py-2 rounded-2xl space-x-2 max-w-[230px]'
                : 'bottom-6 px-5 py-3.5 rounded-3xl space-x-3'
            }`}
          >
            <div className={`bg-white/20 rounded-xl shrink-0 ${isMobileLayout ? 'p-1.5' : 'p-2 rounded-2xl'}`}>
              <Lock className={isMobileLayout ? 'w-4 h-4 text-yellow-300' : 'w-5 h-5 text-yellow-300'} />
            </div>
            <div className="min-w-0">
              <h3 className={isMobileLayout ? 'text-[11px] font-black truncate' : 'text-xs sm:text-sm font-black truncate'}>
                {nearbyChapter.title} (Terkunci)
              </h3>
              {!isMobileLayout && (
                <p className="text-[11px] text-rose-100">
                  Kamu baru saja di-kick karena salah menjawab! Cari gedung lain dulu.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`absolute left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white shadow-2xl border border-white/30 flex items-center z-30 ${
              isMobileLayout
                ? 'bottom-3 px-3 py-2 rounded-2xl space-x-2 max-w-[245px]'
                : 'bottom-6 px-5 py-3.5 rounded-3xl space-x-3'
            }`}
          >
            {!isMobileLayout && (
              <div className="bg-white/20 p-2 rounded-2xl shrink-0">
                <Play className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className={isMobileLayout ? 'text-[11px] font-black truncate' : 'text-xs sm:text-sm font-black truncate'}>
                {nearbyChapter.title}
              </h3>
              {!isMobileLayout && (
                <p className="text-[11px] text-indigo-100 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-300" /> Pintu Gedung Terbuka!
                </p>
              )}
            </div>
            <button
              onClick={() => onSelectChapter(nearbyChapter.id)}
              className={`bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black shadow-lg transition transform hover:scale-105 shrink-0 ${
                isMobileLayout ? 'px-2.5 py-1.5 rounded-xl text-[10px]' : 'px-4 py-2 rounded-2xl text-xs'
              }`}
            >
              {isMobileLayout ? 'MASUK' : 'MASUK GEDUNG'}
            </button>
          </div>
        )
      )}

      {/* BOTTOM-RIGHT HUD: GTA-STYLE MINI-MAP RADAR */}
      <div
        className={`absolute bg-slate-950/80 backdrop-blur-md rounded-full border-slate-700/90 shadow-2xl overflow-hidden z-20 pointer-events-none ${
          isMobileLayout
            ? 'bottom-3 right-3 w-24 h-24 border-2'
            : 'bottom-4 right-4 w-32 h-32 sm:w-40 sm:h-40 border-4'
        }`}
      >
        <svg viewBox="-68 -68 136 136" className="w-full h-full">
          {/* Radar Background */}
          <circle cx="0" cy="0" r="68" fill="#14532d" opacity="0.45" />
          {/* Black Asphalt Roads */}
          {ROAD_SEGMENTS.map((seg) => {
            const a = ROAD_NODES[seg.from];
            const b = ROAD_NODES[seg.to];
            return (
              <line
                key={seg.id}
                x1={a.x}
                y1={a.z}
                x2={b.x}
                y2={b.z}
                stroke="#09090b"
                strokeWidth="5.5"
                strokeLinecap="round"
              />
            );
          })}
          {/* 11 Chapter Building Markers */}
          {buildingWorldItems.map((b) => {
            const isTarget = b.chapter.id === activeQuest.chapter.id;
            const isDone = b.solvedCount === 5;
            const isLocked = b.chapter.id === kickedChapterId;
            return (
              <g key={b.chapter.id}>
                {isTarget && (
                  <circle
                    cx={b.x}
                    cy={b.z}
                    r="8"
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="2"
                    opacity="0.9"
                  />
                )}
                <circle
                  cx={b.x}
                  cy={b.z}
                  r="4.2"
                  fill={isLocked ? '#ef4444' : isDone ? '#10b981' : isTarget ? '#facc15' : b.chapter.color}
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <text
                  x={b.x}
                  y={b.z + 1.5}
                  fontSize="4.5"
                  fontWeight="bold"
                  fill="#0f172a"
                  textAnchor="middle"
                >
                  {b.chapter.id}
                </text>
              </g>
            );
          })}
          {/* Player Arrow */}
          <g
            transform={`translate(${playerMiniPos.x}, ${playerMiniPos.z}) rotate(${
              (-playerMiniPos.yaw * 180) / Math.PI + 180
            })`}
          >
            <polygon points="0,-5.5 4,4 0,2 -4,4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
          </g>
        </svg>
        {!isMobileLayout && (
          <div className="absolute bottom-1 inset-x-0 text-center text-[9px] font-bold text-slate-300 pointer-events-none">
            PETA KOTA (11 BAB)
          </div>
        )}
      </div>
    </div>
  );
}
