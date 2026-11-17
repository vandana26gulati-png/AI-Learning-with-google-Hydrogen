import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Shuffle } from 'lucide-react';
import { HIDDEN_DISCOVERIES, type HiddenDiscovery } from '../data/discoveries';
import { galaxyData } from '../data/loadData';
import { buildGalaxyLayout } from '../engine/layout';
import { useGalaxyStore } from '../store/galaxyStore';
import type { CameraState, ClusterAnchor, GalaxyNode } from '../types/galaxy';

interface CameraAnim {
  startX: number;
  startY: number;
  startZoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  startTime: number;
  duration: number;
}

interface DustStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  parallax: number;
  twinklePhase: number;
  twinkleSpeed: number;
  color: string;
}

interface DriftingNebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  driftPhase: number;
  driftRange: number;
}

interface FloatingMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
  color: string;
}

interface Ripple {
  x: number;
  y: number;
  color: string;
  startTime: number;
  duration: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) || 200;
  const g = parseInt(clean.slice(2, 4), 16) || 200;
  const b = parseInt(clean.slice(4, 6), 16) || 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function mixRgb(c1: [number, number, number], c2: [number, number, number], t: number): string {
  return `rgb(${lerpChannel(c1[0], c2[0], t)}, ${lerpChannel(c1[1], c2[1], t)}, ${lerpChannel(
    c1[2],
    c2[2],
    t
  )})`;
}

const STAR_TINTS = ['#f8fafc', '#bae6fd', '#c4b5fd', '#99f6e4', '#fde68a'];

function createLayeredStarfield(count: number): DustStar[] {
  const stars: DustStar[] = [];
  let s = 42917;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const layer = i % 3; // 0 = far, 1 = mid, 2 = near
    let x = (rand() - 0.5) * 5200;
    let y = (rand() - 0.5) * 3800;

    if (i < count * 0.45) {
      const arm = i % 2;
      const t = Math.pow(rand(), 0.78) * 3.2;
      const angle = t * 1.35 + arm * Math.PI + (rand() - 0.5) * 0.85;
      const r = 65 + t * 450 + (rand() - 0.5) * 260;
      x = Math.cos(angle) * r * 1.15;
      y = Math.sin(angle) * r * 0.78;
    }

    const parallax = layer === 0 ? 0.08 : layer === 1 ? 0.22 : 0.45;
    const size = layer === 0 ? 0.85 + rand() * 0.6 : layer === 1 ? 1.1 + rand() * 0.85 : 1.5 + rand() * 1.1;

    stars.push({
      x,
      y,
      size,
      alpha: 0.18 + rand() * (layer === 2 ? 0.65 : 0.45),
      parallax,
      twinklePhase: rand() * Math.PI * 2,
      twinkleSpeed: 0.7 + rand() * 2.1,
      color: STAR_TINTS[i % STAR_TINTS.length],
    });
  }
  return stars;
}

function createDriftingNebula(): DriftingNebula[] {
  const clouds: DriftingNebula[] = [];
  let s = 918273;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  // Purple, blue, and teal nebula palette + warm galactic core
  const palette = ['#8B5CF6', '#3B82F6', '#14B8A6', '#6366F1', '#2DD4BF', '#A855F7'];

  for (let arm = 0; arm < 2; arm++) {
    for (let step = 0; step < 32; step++) {
      const progress = step / 31;
      const angle = progress * 3.45 + arm * Math.PI + (rand() - 0.5) * 0.38;
      const dist = 80 + progress * 1160;
      const x = Math.cos(angle) * dist * 1.12 + (rand() - 0.5) * 140;
      const y = Math.sin(angle) * dist * 0.76 + (rand() - 0.5) * 110;
      const color = progress < 0.16 ? '#F59E0B' : palette[(step + arm * 2) % palette.length];
      clouds.push({
        x,
        y,
        radius: 210 + rand() * 230,
        color,
        alpha: 0.042 + (1 - progress) * 0.036,
        driftPhase: rand() * Math.PI * 2,
        driftRange: 18 + rand() * 24,
      });
    }
  }
  return clouds;
}

function createFloatingMotes(count: number): FloatingMote[] {
  const motes: FloatingMote[] = [];
  let s = 13579;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const colors = ['#a78bfa', '#60a5fa', '#2dd4bf', '#f8fafc'];
  for (let i = 0; i < count; i++) {
    motes.push({
      x: rand(),
      y: rand(),
      vx: (rand() - 0.5) * 0.015,
      vy: -0.008 - rand() * 0.016,
      size: 1 + rand() * 2,
      alpha: 0.12 + rand() * 0.28,
      color: colors[i % colors.length],
    });
  }
  return motes;
}

export function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    exploredIds,
    discoveredIds,
    collectDiscovery,
    focusDiscoverySignal,
    selectedTermId,
    selectTerm,
    matchingTermIds,
    hasActiveFilters,
    prefersReducedMotion,
    timeOfDay,
    motionSpeed,
    effectsIntensity,
    photoMode,
    activeJourneyId,
    journeyStepIndex,
    resetCameraSignal,
    triggerResetCamera,
    searchQuery,
    activeClusterIds,
    activeLevels,
  } = useGalaxyStore();

  const layout = useMemo(
    () => buildGalaxyLayout(galaxyData.clusters, galaxyData.clusterMap, galaxyData.terms),
    []
  );
  const dustStars = useMemo(() => createLayeredStarfield(1850), []);
  const nebulaClouds = useMemo(() => createDriftingNebula(), []);
  const floatingMotes = useMemo(() => createFloatingMotes(64), []);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);
  const [hoveredDiscoveryId, setHoveredDiscoveryId] = useState<string | null>(null);
  const [hoverScreenPos, setHoverScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [zoomReadout, setZoomReadout] = useState<number>(0.42);

  const cameraRef = useRef<CameraState>({ x: 40, y: -30, zoom: 0.42 });
  const targetZoomRef = useRef<{ zoom: number; anchorSx: number; anchorSy: number } | null>(null);
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const animRef = useRef<CameraAnim | null>(null);
  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 1200,
    height: 800,
    dpr: 1,
  });

  const pointerWorldRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const mouseNormRef = useRef<{ targetX: number; targetY: number; curX: number; curY: number }>({
    targetX: 0,
    targetY: 0,
    curX: 0,
    curY: 0,
  });

  const ripplesRef = useRef<Ripple[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const nextMeteorAtRef = useRef<number>(1800);
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({
    time: 0,
    x: 0,
    y: 0,
  });

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragStartRef = useRef<{
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    camX: number;
    camY: number;
    moved: number;
    pointerId: number;
  } | null>(null);
  const pinchStartRef = useRef<{
    dist: number;
    midX: number;
    midY: number;
    zoom: number;
    camX: number;
    camY: number;
  } | null>(null);

  const stateRef = useRef({
    exploredIds,
    discoveredIds,
    selectedTermId,
    matchingTermIds,
    hasActiveFilters,
    prefersReducedMotion,
    timeOfDay,
    motionSpeed,
    effectsIntensity,
    photoMode,
    hoveredNodeId,
    hoveredClusterId,
    hoveredDiscoveryId,
    activeJourneyId,
    journeyStepIndex,
  });
  stateRef.current = {
    exploredIds,
    discoveredIds,
    selectedTermId,
    matchingTermIds,
    hasActiveFilters,
    prefersReducedMotion,
    timeOfDay,
    motionSpeed,
    effectsIntensity,
    photoMode,
    hoveredNodeId,
    hoveredClusterId,
    hoveredDiscoveryId,
    activeJourneyId,
    journeyStepIndex,
  };

  const spawnRipple = (x: number, y: number, color = '#38BDF8') => {
    if (stateRef.current.prefersReducedMotion) return;
    ripplesRef.current.push({
      x,
      y,
      color,
      startTime: performance.now(),
      duration: 820,
    });
    if (ripplesRef.current.length > 10) {
      ripplesRef.current.shift();
    }
  };

  const flyCameraTo = (
    worldX: number,
    worldY: number,
    targetZoom: number,
    offsetForPanel = false
  ) => {
    const { width, height } = sizeRef.current;
    const clampedZoom = Math.max(0.24, Math.min(2.6, targetZoom));
    velocityRef.current = { vx: 0, vy: 0 };
    targetZoomRef.current = null;

    let adjX = worldX;
    let adjY = worldY;
    if (offsetForPanel && !stateRef.current.photoMode) {
      if (width >= 1024) {
        adjX += 180 / clampedZoom;
      } else {
        adjY += (height * 0.16) / clampedZoom;
      }
    }

    if (stateRef.current.prefersReducedMotion) {
      cameraRef.current = { x: adjX, y: adjY, zoom: clampedZoom };
      animRef.current = null;
      setZoomReadout(clampedZoom);
      return;
    }

    animRef.current = {
      startX: cameraRef.current.x,
      startY: cameraRef.current.y,
      startZoom: cameraRef.current.zoom,
      targetX: adjX,
      targetY: adjY,
      targetZoom: clampedZoom,
      startTime: performance.now(),
      duration: 540,
    };
  };

  useEffect(() => {
    const { width, height } = sizeRef.current;
    const fitZoom = Math.max(0.26, Math.min(0.52, Math.min(width / 2350, height / 1650)));
    cameraRef.current = { x: 40, y: -30, zoom: fitZoom };
    setZoomReadout(fitZoom);
  }, []);

  useEffect(() => {
    if (resetCameraSignal === 0) return;
    const { width, height } = sizeRef.current;
    const fitZoom = Math.max(0.26, Math.min(0.52, Math.min(width / 2350, height / 1650)));
    flyCameraTo(40, -30, fitZoom, false);
  }, [resetCameraSignal]);

  useEffect(() => {
    if (!focusDiscoverySignal) return;
    const disc = HIDDEN_DISCOVERIES.find((d) => d.id === focusDiscoverySignal.id);
    if (!disc) return;
    spawnRipple(disc.x, disc.y, disc.color);
    flyCameraTo(disc.x, disc.y, 1.15, false);
  }, [focusDiscoverySignal]);

  useEffect(() => {
    if (!selectedTermId) return;
    const node = layout.nodeMap.get(selectedTermId);
    if (!node) return;
    const desiredZoom = Math.max(cameraRef.current.zoom, 1.08);
    spawnRipple(node.baseX, node.baseY, node.cluster.color);
    flyCameraTo(node.baseX, node.baseY, desiredZoom, true);
  }, [selectedTermId, layout]);

  useEffect(() => {
    if (!hasActiveFilters || matchingTermIds.size === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const id of matchingTermIds) {
      const node = layout.nodeMap.get(id);
      if (!node) continue;
      if (node.baseX < minX) minX = node.baseX;
      if (node.baseX > maxX) maxX = node.baseX;
      if (node.baseY < minY) minY = node.baseY;
      if (node.baseY > maxY) maxY = node.baseY;
    }
    if (!Number.isFinite(minX)) return;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const spanX = Math.max(220, maxX - minX + 260);
    const spanY = Math.max(220, maxY - minY + 260);
    const { width, height } = sizeRef.current;
    const targetZoom = Math.max(0.35, Math.min(1.25, Math.min(width / spanX, height / spanY)));
    flyCameraTo(cx, cy, targetZoom, Boolean(selectedTermId));
  }, [searchQuery, activeClusterIds, activeLevels]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      sizeRef.current = { width: rect.width, height: rect.height, dpr };
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let lastZoomReport = 0;

    const render = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) * 0.001));
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height, dpr } = sizeRef.current;
      const s = stateRef.current;
      const speedMul = s.prefersReducedMotion ? 0 : s.motionSpeed;
      const fx = s.effectsIntensity;

      // 1. Camera fly-to animation
      if (animRef.current) {
        const anim = animRef.current;
        const rawT = Math.min(1, (now - anim.startTime) / anim.duration);
        const ease = 1 - Math.pow(1 - rawT, 3);
        cameraRef.current = {
          x: anim.startX + (anim.targetX - anim.startX) * ease,
          y: anim.startY + (anim.targetY - anim.startY) * ease,
          zoom: anim.startZoom + (anim.targetZoom - anim.startZoom) * ease,
        };
        if (rawT >= 1) {
          animRef.current = null;
        }
      } else {
        // 2. Smooth wheel zoom easing
        if (targetZoomRef.current) {
          const tz = targetZoomRef.current;
          const cam = cameraRef.current;
          const nextZoom = cam.zoom + (tz.zoom - cam.zoom) * Math.min(1, dt * 14);
          const worldBeforeX = (tz.anchorSx - width * 0.5) / cam.zoom + cam.x;
          const worldBeforeY = (tz.anchorSy - height * 0.5) / cam.zoom + cam.y;
          cameraRef.current = {
            x: worldBeforeX - (tz.anchorSx - width * 0.5) / nextZoom,
            y: worldBeforeY - (tz.anchorSy - height * 0.5) / nextZoom,
            zoom: nextZoom,
          };
          if (Math.abs(tz.zoom - nextZoom) < 0.001) {
            targetZoomRef.current = null;
          }
        }

        // 3. Smooth inertial pan momentum
        if (
          !dragStartRef.current &&
          (Math.abs(velocityRef.current.vx) > 0.05 || Math.abs(velocityRef.current.vy) > 0.05)
        ) {
          cameraRef.current.x -= (velocityRef.current.vx * dt * 60) / cameraRef.current.zoom;
          cameraRef.current.y -= (velocityRef.current.vy * dt * 60) / cameraRef.current.zoom;
          const damping = Math.pow(0.91, dt * 60);
          velocityRef.current.vx *= damping;
          velocityRef.current.vy *= damping;
        }
      }

      // 4. Smooth mouse parallax easing
      const mn = mouseNormRef.current;
      if (s.prefersReducedMotion) {
        mn.curX = 0;
        mn.curY = 0;
      } else {
        mn.curX += (mn.targetX - mn.curX) * Math.min(1, dt * 4.5);
        mn.curY += (mn.targetY - mn.curY) * Math.min(1, dt * 4.5);
      }

      const cam = cameraRef.current;
      const parallaxWorldX = mn.curX * (32 / Math.max(0.4, cam.zoom));
      const parallaxWorldY = mn.curY * (24 / Math.max(0.4, cam.zoom));
      const viewCamX = cam.x + parallaxWorldX;
      const viewCamY = cam.y + parallaxWorldY;

      if (now - lastZoomReport > 140) {
        lastZoomReport = now;
        setZoomReadout((prev) => (Math.abs(prev - cam.zoom) > 0.02 ? cam.zoom : prev));
      }

      const tSec = now * 0.001 * Math.max(0.1, s.motionSpeed);
      if (s.prefersReducedMotion) {
        for (let i = 0; i < layout.nodes.length; i++) {
          const n = layout.nodes[i];
          n.x = n.baseX;
          n.y = n.baseY;
        }
      } else {
        for (let i = 0; i < layout.nodes.length; i++) {
          const n = layout.nodes[i];
          n.x = n.baseX + Math.cos(tSec * n.driftSpeed + n.driftPhase) * n.driftAmplitude;
          n.y = n.baseY + Math.sin(tSec * (n.driftSpeed * 0.85) + n.driftPhase) * n.driftAmplitude;
        }
      }

      // 5. Sky Phase / Time of Day cinematic grading
      const phase = s.timeOfDay / 100; // 0 = Midnight, 0.5 = Twilight, 1 = Dawn
      const topColor =
        phase < 0.5
          ? mixRgb([4, 6, 16], [11, 16, 42], phase * 2)
          : mixRgb([11, 16, 42], [17, 29, 62], (phase - 0.5) * 2);
      const midColor =
        phase < 0.5
          ? mixRgb([8, 12, 30], [22, 24, 58], phase * 2)
          : mixRgb([22, 24, 58], [26, 46, 82], (phase - 0.5) * 2);
      const horizonColor =
        phase < 0.5
          ? mixRgb([5, 9, 22], [28, 22, 66], phase * 2)
          : mixRgb([28, 22, 66], [42, 68, 96], (phase - 0.5) * 2);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, topColor);
      skyGrad.addColorStop(0.55, midColor);
      skyGrad.addColorStop(1, horizonColor);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle horizon aurora glow at higher sky phases
      if (phase > 0.35 && fx > 0) {
        const auroraAlpha = (phase - 0.35) * 0.22 * fx;
        const auroraGrad = ctx.createRadialGradient(
          width * 0.5 + mn.curX * 40,
          height * 1.05,
          20,
          width * 0.5,
          height * 0.9,
          width * 0.8
        );
        auroraGrad.addColorStop(0, `rgba(20, 184, 166, ${auroraAlpha})`);
        auroraGrad.addColorStop(0.5, `rgba(139, 92, 246, ${auroraAlpha * 0.6})`);
        auroraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = auroraGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 6. Layered 1,850-star deep-space starfield (fast batched rects + bright arcs)
      const nightVisibility = 1 - phase * 0.25;
      const starZoomScale = Math.max(0.32, cam.zoom * 0.72);
      for (let i = 0; i < dustStars.length; i++) {
        const star = dustStars[i];
        const sx =
          (star.x - (cam.x + mn.curX * 70) * star.parallax) * starZoomScale + width * 0.5;
        const sy =
          (star.y - (cam.y + mn.curY * 50) * star.parallax) * starZoomScale + height * 0.5;
        if (sx < -4 || sx > width + 4 || sy < -4 || sy > height + 4) continue;

        const twinkle = s.prefersReducedMotion
          ? 1
          : 0.58 + 0.42 * Math.sin(tSec * star.twinkleSpeed + star.twinklePhase);
        const alpha = star.alpha * twinkle * nightVisibility;
        ctx.fillStyle = hexToRgba(star.color, alpha);
        if (star.size < 1.5) {
          ctx.fillRect(sx, sy, star.size, star.size);
        } else {
          ctx.beginPath();
          ctx.arc(sx, sy, star.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 7. Shooting stars (night meteor streaks)
      if (!s.prefersReducedMotion && fx > 0.05 && phase < 0.78) {
        if (now > nextMeteorAtRef.current) {
          nextMeteorAtRef.current = now + (2200 + Math.random() * 4200) / Math.max(0.4, s.motionSpeed);
          const startX = Math.random() * width * 0.9 + width * 0.05;
          const startY = Math.random() * height * 0.45;
          const angle = Math.PI * (0.14 + Math.random() * 0.22);
          const spd = 620 + Math.random() * 440;
          shootingStarsRef.current.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 0,
            maxLife: 0.55 + Math.random() * 0.4,
            length: 85 + Math.random() * 75,
            color: Math.random() > 0.4 ? '#bae6fd' : '#ddd6fe',
          });
        }

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
          const m = shootingStarsRef.current[i];
          m.life += dt * Math.max(0.4, s.motionSpeed);
          m.x += m.vx * dt * Math.max(0.4, s.motionSpeed);
          m.y += m.vy * dt * Math.max(0.4, s.motionSpeed);
          if (m.life >= m.maxLife) {
            shootingStarsRef.current.splice(i, 1);
            continue;
          }
          const progress = m.life / m.maxLife;
          const alpha = Math.sin(progress * Math.PI) * 0.85 * Math.min(1.2, fx);
          const mag = Math.hypot(m.vx, m.vy) || 1;
          const tailX = m.x - (m.vx / mag) * m.length;
          const tailY = m.y - (m.vy / mag) * m.length;
          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          grad.addColorStop(0, hexToRgba('#ffffff', alpha));
          grad.addColorStop(0.35, hexToRgba(m.color, alpha * 0.65));
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 8. Floating cosmic dust motes (screen space)
      if (fx > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < floatingMotes.length; i++) {
          const mote = floatingMotes[i];
          if (speedMul > 0) {
            mote.x = (mote.x + mote.vx * dt * speedMul + 1) % 1;
            mote.y = (mote.y + mote.vy * dt * speedMul + 1) % 1;
          }
          const mx = (mote.x * width + mn.curX * 18 + width) % width;
          const my = (mote.y * height + mn.curY * 14 + height) % height;
          ctx.fillStyle = hexToRgba(mote.color, mote.alpha * Math.min(1.3, fx));
          ctx.beginPath();
          ctx.arc(mx, my, mote.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Enter world space transform
      ctx.save();
      ctx.translate(width * 0.5, height * 0.5);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-viewCamX, -viewCamY);

      const halfW = width / (2 * cam.zoom) + 240;
      const halfH = height / (2 * cam.zoom) + 240;
      const minX = viewCamX - halfW;
      const maxX = viewCamX + halfW;
      const minY = viewCamY - halfH;
      const maxY = viewCamY + halfH;

      // 9. Soft drifting purple, blue & teal nebula clouds (additive bloom)
      if (fx > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const coreGlow = ctx.createRadialGradient(20, -40, 12, 20, -40, 560);
        coreGlow.addColorStop(0, `rgba(253, 224, 130, ${0.14 * fx})`);
        coreGlow.addColorStop(0.32, `rgba(139, 92, 246, ${0.09 * fx})`);
        coreGlow.addColorStop(0.7, `rgba(20, 184, 166, ${0.04 * fx})`);
        coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(20, -40, 560, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < nebulaClouds.length; i++) {
          const cloud = nebulaClouds[i];
          const cx =
            cloud.x +
            (s.prefersReducedMotion ? 0 : Math.cos(tSec * 0.14 + cloud.driftPhase) * cloud.driftRange);
          const cy =
            cloud.y +
            (s.prefersReducedMotion ? 0 : Math.sin(tSec * 0.11 + cloud.driftPhase) * cloud.driftRange);
          if (
            cx + cloud.radius < minX ||
            cx - cloud.radius > maxX ||
            cy + cloud.radius < minY ||
            cy - cloud.radius > maxY
          ) {
            continue;
          }
          const g = ctx.createRadialGradient(cx, cy, 8, cx, cy, cloud.radius);
          g.addColorStop(0, hexToRgba(cloud.color, cloud.alpha * fx));
          g.addColorStop(1, hexToRgba(cloud.color, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, cloud.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Pointer cosmic light aura
      const ptr = pointerWorldRef.current;
      if (ptr.active && !s.prefersReducedMotion && fx > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const cursorRadius = 220 / Math.max(0.45, cam.zoom);
        const cg = ctx.createRadialGradient(ptr.x, ptr.y, 4, ptr.x, ptr.y, cursorRadius);
        cg.addColorStop(0, `rgba(56, 189, 248, ${0.11 * fx})`);
        cg.addColorStop(0.55, `rgba(139, 92, 246, ${0.05 * fx})`);
        cg.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(ptr.x, ptr.y, cursorRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const isClusterOverview = cam.zoom < 0.5;
      const activeFocusId = s.selectedTermId || s.hoveredNodeId;
      const activeFocusNode = activeFocusId ? layout.nodeMap.get(activeFocusId) : undefined;
      const activeRelatedSet = new Set<string>(activeFocusNode?.term.related ?? []);

      // 10. Cluster nebulae glow
      for (let i = 0; i < layout.anchors.length; i++) {
        const anchor = layout.anchors[i];
        if (
          anchor.x + anchor.radius < minX ||
          anchor.x - anchor.radius > maxX ||
          anchor.y + anchor.radius < minY ||
          anchor.y - anchor.radius > maxY
        ) {
          continue;
        }
        const isHoveredCluster = s.hoveredClusterId === anchor.cluster.id;
        const haloAlpha =
          (isClusterOverview ? (isHoveredCluster ? 0.3 : 0.14) : 0.06) *
          Math.max(0.35, fx);

        const radGrad = ctx.createRadialGradient(
          anchor.x,
          anchor.y,
          10,
          anchor.x,
          anchor.y,
          anchor.radius * 1.25
        );
        radGrad.addColorStop(0, hexToRgba(anchor.cluster.color, haloAlpha));
        radGrad.addColorStop(0.6, hexToRgba(anchor.cluster.color, haloAlpha * 0.35));
        radGrad.addColorStop(1, hexToRgba(anchor.cluster.color, 0));
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, anchor.radius * 1.25, 0, Math.PI * 2);
        ctx.fill();
      }

      // 11. Constellation skeletons
      for (let i = 0; i < layout.constellationBones.length; i++) {
        const bone = layout.constellationBones[i];
        const a = layout.nodeMap.get(bone.aId);
        const b = layout.nodeMap.get(bone.bId);
        if (!a || !b) continue;
        if (
          (a.x < minX && b.x < minX) ||
          (a.x > maxX && b.x > maxX) ||
          (a.y < minY && b.y < minY) ||
          (a.y > maxY && b.y > maxY)
        ) {
          continue;
        }
        const isHovered = s.hoveredClusterId === bone.clusterId;
        const alpha = isClusterOverview ? (isHovered ? 0.62 : 0.24) : 0.09;
        ctx.strokeStyle = hexToRgba(a.cluster.color, alpha);
        ctx.lineWidth = (isHovered ? 1.9 : 1.1) / cam.zoom;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // 12. Semantic concept links
      ctx.lineCap = 'round';
      for (let i = 0; i < layout.edges.length; i++) {
        const edge = layout.edges[i];
        const src = layout.nodeMap.get(edge.sourceId);
        const dst = layout.nodeMap.get(edge.targetId);
        if (!src || !dst) continue;

        if (
          (src.x < minX && dst.x < minX) ||
          (src.x > maxX && dst.x > maxX) ||
          (src.y < minY && dst.y < minY) ||
          (src.y > maxY && dst.y > maxY)
        ) {
          continue;
        }

        const isHighlighted =
          activeFocusId !== null &&
          (edge.sourceId === activeFocusId || edge.targetId === activeFocusId);

        if (isClusterOverview && !isHighlighted) continue;

        const bothMatched =
          !s.hasActiveFilters ||
          (s.matchingTermIds.has(edge.sourceId) && s.matchingTermIds.has(edge.targetId));

        if (isHighlighted && activeFocusNode) {
          ctx.strokeStyle = hexToRgba(activeFocusNode.cluster.color, 0.85);
          ctx.lineWidth = Math.max(1.4, 2.4 / cam.zoom);
        } else {
          const baseAlpha = edge.sameCluster
            ? bothMatched
              ? 0.14
              : 0.03
            : bothMatched
              ? 0.055
              : 0.015;
          ctx.strokeStyle = `rgba(148, 163, 184, ${baseAlpha})`;
          ctx.lineWidth = 1 / cam.zoom;
        }

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(dst.x, dst.y);
        ctx.stroke();
      }

      // Interactive pointer filaments
      if (ptr.active && !isClusterOverview) {
        const nearNodes = layout.grid.queryRect(
          ptr.x - 135,
          ptr.y - 135,
          ptr.x + 135,
          ptr.y + 135
        );
        for (let i = 0; i < nearNodes.length; i++) {
          const n = nearNodes[i];
          const d = Math.hypot(n.x - ptr.x, n.y - ptr.y);
          if (d < 130) {
            const strength = (1 - d / 130) * 0.28;
            ctx.strokeStyle = hexToRgba(n.cluster.color, strength);
            ctx.lineWidth = 1 / cam.zoom;
            ctx.beginPath();
            ctx.moveTo(ptr.x, ptr.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
          }
        }
      }

      // 13. Guided Journey path overlay
      if (s.activeJourneyId) {
        const journey = galaxyData.journeys.find((j) => j.id === s.activeJourneyId);
        if (journey && journey.steps.length > 1) {
          for (let i = 0; i < journey.steps.length - 1; i++) {
            const a = layout.nodeMap.get(journey.steps[i].termId);
            const b = layout.nodeMap.get(journey.steps[i + 1].termId);
            if (!a || !b) continue;
            const visited = i < s.journeyStepIndex;
            ctx.strokeStyle = visited
              ? 'rgba(56, 189, 248, 0.92)'
              : 'rgba(245, 158, 11, 0.55)';
            ctx.lineWidth = (visited ? 2.8 : 1.9) / cam.zoom;
            ctx.setLineDash(visited ? [] : [8 / cam.zoom, 6 / cam.zoom]);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      // 14. Tap expanding starlight ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const rip = ripplesRef.current[i];
        const age = now - rip.startTime;
        if (age >= rip.duration) {
          ripplesRef.current.splice(i, 1);
          continue;
        }
        const p = age / rip.duration;
        const radius = (16 + p * 92) / Math.max(0.4, cam.zoom);
        ctx.strokeStyle = hexToRgba(rip.color, (1 - p) * 0.75);
        ctx.lineWidth = 2 / cam.zoom;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 15. Hidden Cosmic Discoveries (anomalies)
      for (let i = 0; i < HIDDEN_DISCOVERIES.length; i++) {
        const disc = HIDDEN_DISCOVERIES[i];
        if (disc.x < minX || disc.x > maxX || disc.y < minY || disc.y > maxY) continue;
        const isFound = s.discoveredIds.has(disc.id);
        const isHovered = s.hoveredDiscoveryId === disc.id;
        const shimmer = s.prefersReducedMotion ? 1 : 0.7 + 0.3 * Math.sin(tSec * 2.6 + i);
        const r = (isFound ? 8.5 : 7) * (isHovered ? 1.3 : 1);

        // Discovery bloom
        if (fx > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const bg = ctx.createRadialGradient(disc.x, disc.y, 0, disc.x, disc.y, r * 4.5);
          bg.addColorStop(
            0,
            hexToRgba(disc.color, (isFound ? 0.55 : isHovered ? 0.5 : 0.32) * shimmer * Math.min(1.2, fx))
          );
          bg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.arc(disc.x, disc.y, r * 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Orbiting ring
        ctx.strokeStyle = hexToRgba(disc.color, isFound ? 0.8 : isHovered ? 0.9 : 0.42 * shimmer);
        ctx.lineWidth = 1.4 / cam.zoom;
        ctx.beginPath();
        ctx.arc(disc.x, disc.y, r * 1.7, 0, Math.PI * 2);
        ctx.stroke();

        // Diamond relic core
        ctx.save();
        ctx.translate(disc.x, disc.y);
        ctx.rotate(s.prefersReducedMotion ? Math.PI / 4 : tSec * 0.45 + i);
        ctx.fillStyle = isFound ? disc.color : '#f8fafc';
        ctx.fillRect(-r * 0.55, -r * 0.55, r * 1.1, r * 1.1);
        ctx.restore();
      }

      // 16. Visible Concept Stars with additive bloom
      const visibleNodes = layout.grid.queryRect(minX, minY, maxX, maxY);

      for (let i = 0; i < visibleNodes.length; i++) {
        const node = visibleNodes[i];
        const isSelected = s.selectedTermId === node.term.id;
        const isHovered = s.hoveredNodeId === node.term.id;
        const isRelatedToFocus = activeRelatedSet.has(node.term.id);
        const isExplored = s.exploredIds.has(node.term.id);
        const isMatch = !s.hasActiveFilters || s.matchingTermIds.has(node.term.id);

        const dimFactor = isMatch ? 1 : 0.16;
        const breathe =
          !s.prefersReducedMotion && (isExplored || isSelected)
            ? 1 + Math.sin(tSec * 2.1 + node.driftPhase) * 0.09
            : 1;

        const r = node.radius * breathe * (isSelected ? 1.4 : isHovered ? 1.25 : 1);

        if (s.hasActiveFilters && isMatch && !s.prefersReducedMotion) {
          const pulse = (Math.sin(tSec * 4.0 + node.driftPhase) + 1) * 0.5;
          ctx.strokeStyle = hexToRgba(node.cluster.color, 0.25 + pulse * 0.45);
          ctx.lineWidth = 1.5 / cam.zoom;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * (1.8 + pulse * 0.9), 0, Math.PI * 2);
          ctx.stroke();
        }

        // Additive bloom halo
        if (fx > 0.02) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const glowR = r * (isSelected ? 4.8 : isHovered ? 3.8 : isExplored ? 3.2 : 2.3);
          const glowAlpha =
            (isSelected
              ? 0.65
              : isHovered
                ? 0.5
                : isExplored
                  ? 0.38
                  : isRelatedToFocus
                    ? 0.28
                    : 0.16) *
            dimFactor *
            Math.min(1.25, fx);
          const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
          glow.addColorStop(0, hexToRgba(node.cluster.color, glowAlpha));
          glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Sparkle flares
        if (
          !isClusterOverview &&
          fx > 0.2 &&
          (isSelected || isHovered || (isExplored && node.degree >= 3))
        ) {
          const flareLen = r * (isSelected ? 3.6 : 2.5);
          ctx.strokeStyle = hexToRgba('#ffffff', (isSelected ? 0.6 : 0.32) * dimFactor);
          ctx.lineWidth = 1.1 / cam.zoom;
          ctx.beginPath();
          ctx.moveTo(node.x - flareLen, node.y);
          ctx.lineTo(node.x + flareLen, node.y);
          ctx.moveTo(node.x, node.y - flareLen);
          ctx.lineTo(node.x, node.y + flareLen);
          ctx.stroke();
        }

        // Core star body
        const coreAlpha = (isExplored || isSelected || isHovered ? 0.98 : 0.74) * dimFactor;
        ctx.fillStyle = hexToRgba(node.cluster.color, coreAlpha);
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Bright pinpoint center
        ctx.fillStyle = `rgba(255, 255, 255, ${(isExplored || isSelected || isHovered ? 0.96 : 0.55) * dimFactor})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 0.42, 0, Math.PI * 2);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / cam.zoom;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 1.65, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();

      // 17. Screen-space typography (hidden in Photo Mode for clean screenshots)
      if (!s.photoMode) {
        if (isClusterOverview) {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          for (let i = 0; i < layout.anchors.length; i++) {
            const anchor = layout.anchors[i];
            const sx = (anchor.x - viewCamX) * cam.zoom + width * 0.5;
            const sy = (anchor.y - viewCamY) * cam.zoom + height * 0.5;
            if (sx < -140 || sx > width + 140 || sy < -80 || sy > height + 80) continue;

            const isClusterMatched =
              !s.hasActiveFilters ||
              layout.nodes.some(
                (n) => n.cluster.id === anchor.cluster.id && s.matchingTermIds.has(n.term.id)
              );
            const isHovered = s.hoveredClusterId === anchor.cluster.id;
            const alpha = isClusterMatched ? 1 : 0.25;

            const label = `${anchor.cluster.symbol}  ${anchor.cluster.shortName}`;
            ctx.font = isHovered
              ? '600 14px "Outfit", system-ui, sans-serif'
              : '600 13px "Outfit", system-ui, sans-serif';
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = `rgba(5, 8, 20, ${0.88 * alpha})`;
            ctx.strokeText(label, sx, sy);
            ctx.fillStyle = isClusterMatched ? '#f8fafc' : 'rgba(248, 250, 252, 0.35)';
            ctx.fillText(label, sx, sy);

            ctx.font = '500 11px "JetBrains Mono", monospace';
            const sub = `${anchor.nodeCount} stars · tap to zoom`;
            ctx.strokeText(sub, sx, sy + 18);
            ctx.fillStyle = hexToRgba(anchor.cluster.color, (isHovered ? 1 : 0.85) * alpha);
            ctx.fillText(sub, sx, sy + 18);
          }
        } else {
          const placedBoxes: Array<{ x: number; y: number; w: number; h: number }> = [];
          const priorityNodes = [...visibleNodes].sort((a, b) => {
            const aScore =
              (a.term.id === s.selectedTermId ? 1000 : 0) +
              (a.term.id === s.hoveredNodeId ? 500 : 0) +
              (activeRelatedSet.has(a.term.id) ? 200 : 0) +
              (s.hasActiveFilters && s.matchingTermIds.has(a.term.id) ? 150 : 0) +
              a.degree * 5;
            const bScore =
              (b.term.id === s.selectedTermId ? 1000 : 0) +
              (b.term.id === s.hoveredNodeId ? 500 : 0) +
              (activeRelatedSet.has(b.term.id) ? 200 : 0) +
              (s.hasActiveFilters && s.matchingTermIds.has(b.term.id) ? 150 : 0) +
              b.degree * 5;
            return bScore - aScore;
          });

          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          for (let i = 0; i < priorityNodes.length; i++) {
            const node = priorityNodes[i];
            const isSelected = node.term.id === s.selectedTermId;
            const isHovered = node.term.id === s.hoveredNodeId;
            const isRelated = activeRelatedSet.has(node.term.id);
            const isMatch = !s.hasActiveFilters || s.matchingTermIds.has(node.term.id);

            if (!isMatch && !isSelected && !isHovered) continue;

            const showAtThisZoom =
              isSelected ||
              isHovered ||
              isRelated ||
              (s.hasActiveFilters && isMatch) ||
              cam.zoom >= 0.84 ||
              (cam.zoom >= 0.56 && node.degree >= 4);

            if (!showAtThisZoom) continue;

            const sx = (node.x - viewCamX) * cam.zoom + width * 0.5;
            const sy = (node.y - viewCamY) * cam.zoom + height * 0.5 + node.radius * cam.zoom + 6;
            if (sx < -60 || sx > width + 60 || sy < -30 || sy > height + 30) continue;

            ctx.font =
              isSelected || isHovered
                ? '600 12.5px "Outfit", system-ui, sans-serif'
                : '500 11.5px "DM Sans", system-ui, sans-serif';

            const text = node.term.term;
            const textW = ctx.measureText(text).width + 10;
            const box = { x: sx - textW / 2, y: sy, w: textW, h: 16 };

            if (!isSelected && !isHovered) {
              let overlaps = false;
              for (let b = 0; b < placedBoxes.length; b++) {
                const ob = placedBoxes[b];
                if (
                  box.x < ob.x + ob.w &&
                  box.x + box.w > ob.x &&
                  box.y < ob.y + ob.h &&
                  box.y + box.h > ob.y
                ) {
                  overlaps = true;
                  break;
                }
              }
              if (overlaps) continue;
            }

            placedBoxes.push(box);

            ctx.lineWidth = 3.2;
            ctx.strokeStyle = 'rgba(5, 8, 20, 0.9)';
            ctx.strokeText(text, sx, sy);

            ctx.fillStyle = isSelected
              ? '#ffffff'
              : isHovered || isRelated
                ? '#f8fafc'
                : s.exploredIds.has(node.term.id)
                  ? 'rgba(241, 245, 249, 0.94)'
                  : 'rgba(203, 213, 225, 0.82)';
            ctx.fillText(text, sx, sy);
          }
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [layout, dustStars, nebulaClouds, floatingMotes]);

  const screenToWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { wx: 0, wy: 0, sx: 0, sy: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const cam = cameraRef.current;
    const parallaxWorldX = mouseNormRef.current.curX * (32 / Math.max(0.4, cam.zoom));
    const parallaxWorldY = mouseNormRef.current.curY * (24 / Math.max(0.4, cam.zoom));
    return {
      wx: (sx - rect.width * 0.5) / cam.zoom + (cam.x + parallaxWorldX),
      wy: (sy - rect.height * 0.5) / cam.zoom + (cam.y + parallaxWorldY),
      sx,
      sy,
    };
  };

  const hitTestDiscovery = (wx: number, wy: number): HiddenDiscovery | null => {
    const hitDist = Math.max(22, 26 / cameraRef.current.zoom);
    let best: HiddenDiscovery | null = null;
    let bestD = hitDist;
    for (const disc of HIDDEN_DISCOVERIES) {
      const d = Math.hypot(wx - disc.x, wy - disc.y);
      if (d <= bestD) {
        bestD = d;
        best = disc;
      }
    }
    return best;
  };

  const hitTestCluster = (wx: number, wy: number): ClusterAnchor | null => {
    let closest: ClusterAnchor | null = null;
    let closestDist = Infinity;
    for (const anchor of layout.anchors) {
      const d = Math.hypot(wx - anchor.x, wy - anchor.y);
      if (d <= anchor.radius * 0.98 && d < closestDist) {
        closestDist = d;
        closest = anchor;
      }
    }
    return closest;
  };

  const hitTestNode = (wx: number, wy: number): GalaxyNode | null => {
    const hitRadius = Math.max(22, 26 / cameraRef.current.zoom);
    return layout.grid.findNearest(wx, wy, hitRadius);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      animRef.current = null;
      velocityRef.current = { vx: 0, vy: 0 };
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const baseZoom = targetZoomRef.current?.zoom ?? cameraRef.current.zoom;
      const factor = e.deltaY < 0 ? 1.14 : 0.88;
      const nextZoom = Math.max(0.24, Math.min(2.6, baseZoom * factor));

      if (stateRef.current.prefersReducedMotion) {
        const worldBeforeX = (sx - rect.width * 0.5) / cameraRef.current.zoom + cameraRef.current.x;
        const worldBeforeY = (sy - rect.height * 0.5) / cameraRef.current.zoom + cameraRef.current.y;
        cameraRef.current = {
          x: worldBeforeX - (sx - rect.width * 0.5) / nextZoom,
          y: worldBeforeY - (sy - rect.height * 0.5) / nextZoom,
          zoom: nextZoom,
        };
        setZoomReadout(nextZoom);
      } else {
        targetZoomRef.current = { zoom: nextZoom, anchorSx: sx, anchorSy: sy };
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    animRef.current = null;
    targetZoomRef.current = null;
    velocityRef.current = { vx: 0, vy: 0 };
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        lastTime: performance.now(),
        camX: cameraRef.current.x,
        camY: cameraRef.current.y,
        moved: 0,
        pointerId: e.pointerId,
      };
      pinchStartRef.current = null;
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const midX = (pts[0].x + pts[1].x) * 0.5;
      const midY = (pts[0].y + pts[1].y) * 0.5;
      pinchStartRef.current = {
        dist: Math.max(10, dist),
        midX,
        midY,
        zoom: cameraRef.current.zoom,
        camX: cameraRef.current.x,
        camY: cameraRef.current.y,
      };
      dragStartRef.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      mouseNormRef.current.targetX = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      mouseNormRef.current.targetY = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    }

    const { wx, wy, sx, sy } = screenToWorld(e.clientX, e.clientY);
    pointerWorldRef.current = { x: wx, y: wy, active: true };

    if (pointersRef.current.size === 2 && pinchStartRef.current && canvasRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.max(10, Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y));
      const midX = (pts[0].x + pts[1].x) * 0.5;
      const midY = (pts[0].y + pts[1].y) * 0.5;
      const pinch = pinchStartRef.current;

      const rect = canvasRef.current.getBoundingClientRect();
      const scaleRatio = dist / pinch.dist;
      const nextZoom = Math.max(0.24, Math.min(2.6, pinch.zoom * scaleRatio));

      const worldAnchorX = (pinch.midX - rect.left - rect.width * 0.5) / pinch.zoom + pinch.camX;
      const worldAnchorY = (pinch.midY - rect.top - rect.height * 0.5) / pinch.zoom + pinch.camY;

      cameraRef.current = {
        x: worldAnchorX - (midX - rect.left - rect.width * 0.5) / nextZoom,
        y: worldAnchorY - (midY - rect.top - rect.height * 0.5) / nextZoom,
        zoom: nextZoom,
      };
      setZoomReadout(nextZoom);
      return;
    }

    if (dragStartRef.current && dragStartRef.current.pointerId === e.pointerId) {
      const ds = dragStartRef.current;
      const now = performance.now();
      const dtMs = Math.max(8, now - ds.lastTime);
      const stepDx = e.clientX - ds.lastX;
      const stepDy = e.clientY - ds.lastY;
      ds.lastX = e.clientX;
      ds.lastY = e.clientY;
      ds.lastTime = now;

      velocityRef.current = {
        vx: (stepDx / dtMs) * 16,
        vy: (stepDy / dtMs) * 16,
      };

      const dx = e.clientX - ds.x;
      const dy = e.clientY - ds.y;
      ds.moved = Math.max(ds.moved, Math.hypot(dx, dy));
      cameraRef.current = {
        ...cameraRef.current,
        x: ds.camX - dx / cameraRef.current.zoom,
        y: ds.camY - dy / cameraRef.current.zoom,
      };
      setHoverScreenPos(null);
      return;
    }

    if (photoMode) return;

    const discHit = hitTestDiscovery(wx, wy);
    if (discHit) {
      setHoveredDiscoveryId(discHit.id);
      setHoveredNodeId(null);
      setHoveredClusterId(null);
      setHoverScreenPos({ x: sx, y: sy });
      return;
    }
    setHoveredDiscoveryId(null);

    if (cameraRef.current.zoom < 0.5) {
      const clusterHit = hitTestCluster(wx, wy);
      setHoveredClusterId(clusterHit ? clusterHit.cluster.id : null);
      setHoveredNodeId(null);
      setHoverScreenPos(clusterHit ? { x: sx, y: sy } : null);
    } else {
      const nodeHit = hitTestNode(wx, wy);
      setHoveredNodeId(nodeHit ? nodeHit.term.id : null);
      setHoveredClusterId(null);
      setHoverScreenPos(nodeHit ? { x: sx, y: sy } : null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ds = dragStartRef.current;
    pointersRef.current.delete(e.pointerId);

    if (pointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }

    if (ds && ds.pointerId === e.pointerId) {
      dragStartRef.current = null;
      if (ds.moved < 9) {
        velocityRef.current = { vx: 0, vy: 0 };
        const { wx, wy } = screenToWorld(e.clientX, e.clientY);
        const now = performance.now();
        const isDoubleTap =
          now - lastTapRef.current.time < 320 &&
          Math.hypot(e.clientX - lastTapRef.current.x, e.clientY - lastTapRef.current.y) < 32;
        lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };

        const discHit = hitTestDiscovery(wx, wy);
        if (discHit) {
          spawnRipple(discHit.x, discHit.y, discHit.color);
          collectDiscovery(discHit.id);
          return;
        }

        if (cameraRef.current.zoom < 0.5) {
          const clusterHit = hitTestCluster(wx, wy);
          if (clusterHit) {
            spawnRipple(clusterHit.x, clusterHit.y, clusterHit.cluster.color);
            flyCameraTo(clusterHit.x, clusterHit.y, 0.94, false);
            return;
          }
        }

        const nodeHit = hitTestNode(wx, wy);
        if (nodeHit) {
          selectTerm(nodeHit.term.id, { autoMarkExplored: true });
          return;
        }

        spawnRipple(wx, wy, '#38BDF8');
        if (isDoubleTap) {
          flyCameraTo(wx, wy, Math.min(2.2, cameraRef.current.zoom * 1.75), false);
        } else if (cameraRef.current.zoom >= 0.5 && !activeJourneyId) {
          selectTerm(null);
        }
      }
    }
  };

  const adjustZoom = (factor: number) => {
    const cam = cameraRef.current;
    flyCameraTo(cam.x, cam.y, cam.zoom * factor, false);
  };

  const flyToRandomStar = () => {
    const pool =
      hasActiveFilters && matchingTermIds.size > 0
        ? galaxyData.terms.filter((t) => matchingTermIds.has(t.id))
        : galaxyData.terms;
    if (pool.length === 0) return;
    const unvisited = pool.filter((t) => !exploredIds.has(t.id));
    const source = unvisited.length > 0 ? unvisited : pool;
    const chosen = source[Math.floor(Math.random() * source.length)];
    selectTerm(chosen.id, { autoMarkExplored: true });
  };

  const hoveredNode = hoveredNodeId ? layout.nodeMap.get(hoveredNodeId) : null;
  const hoveredCluster = hoveredClusterId
    ? layout.anchors.find((a) => a.cluster.id === hoveredClusterId)
    : null;
  const hoveredDiscovery = hoveredDiscoveryId
    ? HIDDEN_DISCOVERIES.find((d) => d.id === hoveredDiscoveryId)
    : null;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#050814] select-none"
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive AI Concept Galaxy star map. Drag to pan with momentum, scroll or pinch to zoom, and tap any star, constellation, or cosmic anomaly."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          pointerWorldRef.current.active = false;
          mouseNormRef.current.targetX = 0;
          mouseNormRef.current.targetY = 0;
          setHoveredNodeId(null);
          setHoveredClusterId(null);
          setHoveredDiscoveryId(null);
          setHoverScreenPos(null);
        }}
        className={`block h-full w-full touch-none ${
          hoveredNodeId || hoveredClusterId || hoveredDiscoveryId
            ? 'cursor-pointer'
            : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* Hover preview tooltip */}
      {!photoMode &&
        hoverScreenPos &&
        (hoveredDiscovery || hoveredNode || hoveredCluster) && (
          <div
            className="pointer-events-none fixed z-20 hidden md:block max-w-[275px] rounded-xl border border-slate-700/80 bg-[#0B1120]/92 px-3.5 py-2.5 backdrop-blur-xl shadow-2xl"
            style={{
              left: Math.min(sizeRef.current.width - 290, Math.max(16, hoverScreenPos.x + 16)),
              top: Math.min(sizeRef.current.height - 140, Math.max(72, hoverScreenPos.y - 12)),
            }}
          >
            {hoveredDiscovery ? (
              <>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300">
                  <span>{hoveredDiscovery.symbol}</span>
                  <span>
                    {discoveredIds.has(hoveredDiscovery.id)
                      ? 'Discovered Relic'
                      : 'Hidden Cosmic Anomaly'}
                  </span>
                </div>
                <p className="mt-0.5 font-display text-sm font-semibold text-slate-50">
                  {discoveredIds.has(hoveredDiscovery.id)
                    ? hoveredDiscovery.name
                    : 'Uncharted Signal'}
                </p>
                <p className="mt-1 text-xs leading-snug text-slate-300">
                  {discoveredIds.has(hoveredDiscovery.id)
                    ? hoveredDiscovery.note
                    : 'Click to investigate and log this cosmic discovery.'}
                </p>
              </>
            ) : hoveredNode ? (
              <>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span style={{ color: hoveredNode.cluster.color }}>
                    {hoveredNode.cluster.symbol}
                  </span>
                  <span>{hoveredNode.cluster.shortName}</span>
                  <span>·</span>
                  <span className="capitalize">{hoveredNode.term.level}</span>
                </div>
                <p className="mt-0.5 font-display text-sm font-semibold text-slate-50">
                  {hoveredNode.term.term}
                </p>
                <p className="mt-1 text-xs leading-snug text-slate-300 line-clamp-2">
                  {hoveredNode.term.short}
                </p>
                <p className="mt-1.5 text-[11px] font-medium text-cyan-300">
                  {hoveredNode.term.demo ? 'Click to explore + open demo' : 'Click to learn more'}
                </p>
              </>
            ) : hoveredCluster ? (
              <>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <span style={{ color: hoveredCluster.cluster.color }}>
                    {hoveredCluster.cluster.symbol}
                  </span>
                  <span>
                    {hoveredCluster.nodeCount} / {hoveredCluster.cluster.targetCount} concepts
                  </span>
                </div>
                <p className="mt-0.5 font-display text-sm font-semibold text-slate-50">
                  {hoveredCluster.cluster.name}
                </p>
                <p className="mt-1 text-xs leading-snug text-slate-300">
                  {hoveredCluster.cluster.description}
                </p>
                <p className="mt-1.5 text-[11px] font-medium text-cyan-300">
                  Click to fly into constellation
                </p>
              </>
            ) : null}
          </div>
        )}

      {/* Camera controls (hidden in Photo Mode) */}
      {!photoMode && (
        <div
          className={`pointer-events-auto fixed left-3 sm:left-4 z-20 flex items-center gap-1 rounded-xl border border-slate-800/80 bg-[#0B1120]/85 p-1 backdrop-blur-xl transition-all duration-200 ${
            selectedTermId ? 'hidden sm:flex bottom-4' : 'bottom-4 flex'
          }`}
          aria-label="Galaxy navigation controls"
        >
          <button
            type="button"
            onClick={() => adjustZoom(1.32)}
            aria-label="Zoom in"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800/80 focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            +
          </button>
          <span className="min-w-[42px] text-center font-mono text-xs text-slate-400">
            {Math.round(zoomReadout * 100)}%
          </span>
          <button
            type="button"
            onClick={() => adjustZoom(0.76)}
            aria-label="Zoom out"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800/80 focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            −
          </button>
          <div className="h-5 w-px bg-slate-800 mx-0.5" aria-hidden="true" />
          <button
            type="button"
            onClick={triggerResetCamera}
            title="Zoom out to full galaxy"
            aria-label="Zoom out to full galaxy"
            className="flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Galaxy</span>
          </button>
          <button
            type="button"
            onClick={flyToRandomStar}
            title="Fly to a random unvisited concept"
            aria-label="Fly to a random concept"
            className="flex h-10 items-center gap-1.5 rounded-lg bg-cyan-500/15 px-2.5 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-500/25 focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Surprise me</span>
          </button>
        </div>
      )}
    </div>
  );
}
