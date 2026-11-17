import type {
  Cluster,
  ClusterAnchor,
  GalaxyEdge,
  GalaxyNode,
  Term,
} from '../types/galaxy';

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Two-arm spiral galaxy cluster layout centered around core LLM & NLP concepts
const CLUSTER_POSITIONS: Record<string, { x: number; y: number }> = {
  llm: { x: 40, y: -40 },
  nlp: { x: -390, y: -180 },
  'agents-rag': { x: 460, y: -110 },
  'neural-networks': { x: -340, y: 260 },
  'training-optimization': { x: 180, y: 340 },
  'generative-ai': { x: 690, y: 210 },
  'data-evaluation': { x: -40, y: -560 },
  foundations: { x: -860, y: -330 },
  'math-stats': { x: -910, y: 170 },
  'safety-ethics': { x: 530, y: -590 },
  'computer-vision': { x: 1020, y: -220 },
  'reinforcement-learning': { x: 780, y: 660 },
};

export class SpatialGrid {
  private cellSize: number;
  private cells = new Map<string, GalaxyNode[]>();

  constructor(cellSize = 180) {
    this.cellSize = cellSize;
  }

  clear() {
    this.cells.clear();
  }

  private key(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  build(nodes: GalaxyNode[]) {
    this.cells.clear();
    for (const node of nodes) {
      const cx = Math.floor(node.x / this.cellSize);
      const cy = Math.floor(node.y / this.cellSize);
      const k = this.key(cx, cy);
      let bucket = this.cells.get(k);
      if (!bucket) {
        bucket = [];
        this.cells.set(k, bucket);
      }
      bucket.push(node);
    }
  }

  queryRect(minX: number, minY: number, maxX: number, maxY: number): GalaxyNode[] {
    const startX = Math.floor(minX / this.cellSize);
    const endX = Math.floor(maxX / this.cellSize);
    const startY = Math.floor(minY / this.cellSize);
    const endY = Math.floor(maxY / this.cellSize);
    const result: GalaxyNode[] = [];

    for (let cx = startX; cx <= endX; cx++) {
      for (let cy = startY; cy <= endY; cy++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (bucket) {
          for (let i = 0; i < bucket.length; i++) {
            result.push(bucket[i]);
          }
        }
      }
    }
    return result;
  }

  findNearest(worldX: number, worldY: number, maxDist: number): GalaxyNode | null {
    const span = Math.ceil(maxDist / this.cellSize);
    const centerCx = Math.floor(worldX / this.cellSize);
    const centerCy = Math.floor(worldY / this.cellSize);
    let best: GalaxyNode | null = null;
    let bestDistSq = maxDist * maxDist;

    for (let cx = centerCx - span; cx <= centerCx + span; cx++) {
      for (let cy = centerCy - span; cy <= centerCy + span; cy++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const node = bucket[i];
          const dx = node.x - worldX;
          const dy = node.y - worldY;
          const distSq = dx * dx + dy * dy;
          if (distSq <= bestDistSq) {
            bestDistSq = distSq;
            best = node;
          }
        }
      }
    }
    return best;
  }
}

export interface ConstellationBone {
  aId: string;
  bId: string;
  clusterId: string;
}

export interface GalaxyLayout {
  nodes: GalaxyNode[];
  nodeMap: Map<string, GalaxyNode>;
  edges: GalaxyEdge[];
  anchors: ClusterAnchor[];
  constellationBones: ConstellationBone[];
  grid: SpatialGrid;
}

export function buildGalaxyLayout(
  clusters: Cluster[],
  clusterMap: Map<string, Cluster>,
  terms: Term[]
): GalaxyLayout {
  const degreeMap = new Map<string, number>();
  const edgeSet = new Set<string>();
  const edges: GalaxyEdge[] = [];

  for (const t of terms) {
    degreeMap.set(t.id, (degreeMap.get(t.id) ?? 0) + t.related.length);
    for (const rel of t.related) {
      degreeMap.set(rel, (degreeMap.get(rel) ?? 0) + 1);
      const a = t.id < rel ? t.id : rel;
      const b = t.id < rel ? rel : t.id;
      const key = `${a}::${b}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        const relTerm = terms.find((x) => x.id === rel);
        edges.push({
          sourceId: a,
          targetId: b,
          sameCluster: relTerm ? relTerm.cluster === t.cluster : false,
        });
      }
    }
  }

  const clusterCenterMap = new Map<string, { x: number; y: number }>();
  clusters.forEach((c, idx) => {
    if (CLUSTER_POSITIONS[c.id]) {
      clusterCenterMap.set(c.id, CLUSTER_POSITIONS[c.id]);
    } else {
      const angle = (idx / Math.max(1, clusters.length)) * Math.PI * 2;
      const dist = 680 + (idx % 2) * 280;
      clusterCenterMap.set(c.id, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
      });
    }
  });

  const nodes: GalaxyNode[] = [];
  const nodeMap = new Map<string, GalaxyNode>();

  for (const term of terms) {
    const cluster = clusterMap.get(term.cluster) ?? clusters[0];
    const center = clusterCenterMap.get(cluster.id) ?? { x: 0, y: 0 };
    const rng = createRng(hashString(term.id));
    const angle = rng() * Math.PI * 2;
    const dist = 30 + Math.sqrt(rng()) * 165;
    const degree = degreeMap.get(term.id) ?? 1;
    const radius = Math.min(11, 5.2 + Math.sqrt(degree) * 1.45);

    const node: GalaxyNode = {
      term,
      cluster,
      x: center.x + Math.cos(angle) * dist,
      y: center.y + Math.sin(angle) * dist,
      baseX: 0,
      baseY: 0,
      radius,
      degree,
      driftPhase: rng() * Math.PI * 2,
      driftSpeed: 0.35 + rng() * 0.45,
      driftAmplitude: 2.2 + rng() * 3.2,
    };
    nodes.push(node);
    nodeMap.set(term.id, node);
  }

  const grid = new SpatialGrid(160);
  const velX = new Float64Array(nodes.length);
  const velY = new Float64Array(nodes.length);
  const indexById = new Map<string, number>();
  nodes.forEach((n, idx) => indexById.set(n.term.id, idx));

  const iterations = 75;
  const repulsionRadius = 118;
  const repulsionStrength = 960;

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations;
    grid.build(nodes);

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const anchor = clusterCenterMap.get(n.cluster.id) ?? { x: 0, y: 0 };

      velX[i] += (anchor.x - n.x) * 0.042;
      velY[i] += (anchor.y - n.y) * 0.042;

      const neighbors = grid.queryRect(
        n.x - repulsionRadius,
        n.y - repulsionRadius,
        n.x + repulsionRadius,
        n.y + repulsionRadius
      );
      for (let j = 0; j < neighbors.length; j++) {
        const other = neighbors[j];
        if (other === n) continue;
        const dx = n.x - other.x;
        const dy = n.y - other.y;
        const distSq = dx * dx + dy * dy + 16;
        if (distSq < repulsionRadius * repulsionRadius) {
          const dist = Math.sqrt(distSq);
          const force =
            (repulsionStrength / distSq) *
            (n.cluster.id === other.cluster.id ? 1.0 : 1.35);
          velX[i] += (dx / dist) * force;
          velY[i] += (dy / dist) * force;
        }
      }
    }

    for (let e = 0; e < edges.length; e++) {
      const edge = edges[e];
      const si = indexById.get(edge.sourceId);
      const ti = indexById.get(edge.targetId);
      if (si === undefined || ti === undefined) continue;
      const sn = nodes[si];
      const tn = nodes[ti];
      const dx = tn.x - sn.x;
      const dy = tn.y - sn.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetLen = edge.sameCluster ? 94 : 280;
      const k = edge.sameCluster ? 0.022 : 0.0025;
      const pull = (dist - targetLen) * k;
      const fx = (dx / dist) * pull;
      const fy = (dy / dist) * pull;
      velX[si] += fx;
      velY[si] += fy;
      velX[ti] -= fx;
      velY[ti] -= fy;
    }

    for (let i = 0; i < nodes.length; i++) {
      velX[i] *= 0.68;
      velY[i] *= 0.68;
      const maxStep = 28 * cooling + 2;
      const stepMag = Math.hypot(velX[i], velY[i]);
      if (stepMag > maxStep) {
        velX[i] = (velX[i] / stepMag) * maxStep;
        velY[i] = (velY[i] / stepMag) * maxStep;
      }
      nodes[i].x += velX[i];
      nodes[i].y += velY[i];
    }
  }

  const clusterNodeGroups = new Map<string, GalaxyNode[]>();
  for (const n of nodes) {
    n.baseX = n.x;
    n.baseY = n.y;
    const list = clusterNodeGroups.get(n.cluster.id) ?? [];
    list.push(n);
    clusterNodeGroups.set(n.cluster.id, list);
  }

  // Build clean astronomical constellation skeleton (Prim's MST) per cluster
  const constellationBones: ConstellationBone[] = [];
  for (const [clusterId, group] of clusterNodeGroups.entries()) {
    if (group.length < 2) continue;
    const visited = new Set<number>([0]);
    while (visited.size < group.length) {
      let bestU = -1;
      let bestV = -1;
      let bestDist = Infinity;
      for (const u of visited) {
        for (let v = 0; v < group.length; v++) {
          if (visited.has(v)) continue;
          const d = Math.hypot(
            group[u].baseX - group[v].baseX,
            group[u].baseY - group[v].baseY
          );
          if (d < bestDist) {
            bestDist = d;
            bestU = u;
            bestV = v;
          }
        }
      }
      if (bestU !== -1 && bestV !== -1) {
        visited.add(bestV);
        constellationBones.push({
          aId: group[bestU].term.id,
          bId: group[bestV].term.id,
          clusterId,
        });
      } else {
        break;
      }
    }
  }

  const anchors: ClusterAnchor[] = clusters.map((cluster) => {
    const group = clusterNodeGroups.get(cluster.id) ?? [];
    if (group.length === 0) {
      const pos = clusterCenterMap.get(cluster.id) ?? { x: 0, y: 0 };
      return { cluster, x: pos.x, y: pos.y, radius: 140, nodeCount: 0 };
    }
    let sumX = 0;
    let sumY = 0;
    for (const n of group) {
      sumX += n.baseX;
      sumY += n.baseY;
    }
    const cx = sumX / group.length;
    const cy = sumY / group.length;
    let maxR = 115;
    for (const n of group) {
      const d = Math.hypot(n.baseX - cx, n.baseY - cy) + 46;
      if (d > maxR) maxR = d;
    }
    return {
      cluster,
      x: cx,
      y: cy,
      radius: maxR,
      nodeCount: group.length,
    };
  });

  grid.build(nodes);

  return {
    nodes,
    nodeMap,
    edges,
    anchors,
    constellationBones,
    grid,
  };
}
