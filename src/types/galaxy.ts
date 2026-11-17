export type TermLevel = 'beginner' | 'intermediate' | 'advanced';

export type DemoId =
  | 'tokenizer'
  | 'attention-heatmap'
  | 'gradient-descent'
  | 'next-token-prediction';

export interface Cluster {
  id: string;
  name: string;
  shortName: string;
  symbol: string;
  color: string;
  description: string;
  targetCount: number;
}

export interface Term {
  id: string;
  term: string;
  cluster: string;
  level: TermLevel;
  short: string;
  eli5: string;
  example: string;
  related: string[];
  demo?: DemoId;
}

export interface JourneyStep {
  termId: string;
  caption: string;
}

export interface Journey {
  id: string;
  title: string;
  description: string;
  steps: JourneyStep[];
}

export interface GalaxyNode {
  term: Term;
  cluster: Cluster;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  degree: number;
  driftPhase: number;
  driftSpeed: number;
  driftAmplitude: number;
}

export interface GalaxyEdge {
  sourceId: string;
  targetId: string;
  sameCluster: boolean;
}

export interface ClusterAnchor {
  cluster: Cluster;
  x: number;
  y: number;
  radius: number;
  nodeCount: number;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export type ViewMode = 'galaxy' | 'list';
