import clustersJson from '../../data/clusters.json';
import journeysJson from '../../data/journeys.json';
import type { Cluster, Journey, Term } from '../types/galaxy';

const termModules = import.meta.glob<{ default: Term[] }>('/data/terms/*.json', {
  eager: true,
});

export interface GalaxyDataset {
  clusters: Cluster[];
  clusterMap: Map<string, Cluster>;
  terms: Term[];
  termMap: Map<string, Term>;
  journeys: Journey[];
}

function buildDataset(): GalaxyDataset {
  const clusters = clustersJson as Cluster[];
  const clusterMap = new Map<string, Cluster>();
  for (const cluster of clusters) {
    clusterMap.set(cluster.id, cluster);
  }

  const terms: Term[] = [];
  const termMap = new Map<string, Term>();

  const sortedPaths = Object.keys(termModules).sort();
  for (const modulePath of sortedPaths) {
    const mod = termModules[modulePath];
    const items = Array.isArray(mod?.default) ? mod.default : [];
    for (const item of items) {
      if (!termMap.has(item.id)) {
        terms.push(item);
        termMap.set(item.id, item);
      }
    }
  }

  const journeys = (journeysJson as Journey[]).map((journey) => ({
    ...journey,
    steps: journey.steps.filter((step) => termMap.has(step.termId)),
  }));

  return {
    clusters,
    clusterMap,
    terms,
    termMap,
    journeys,
  };
}

export const galaxyData: GalaxyDataset = buildDataset();
