import fs from 'node:fs';
import path from 'node:path';

interface ClusterDef {
  id: string;
  name: string;
  color: string;
  description: string;
  targetCount: number;
}

interface TermDef {
  id: string;
  term: string;
  cluster: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  short: string;
  eli5: string;
  example: string;
  related: string[];
  demo?: string;
}

interface JourneyDef {
  id: string;
  title: string;
  description: string;
  steps: { termId: string; caption: string }[];
}

const VALID_LEVELS = new Set(['beginner', 'intermediate', 'advanced']);
const VALID_DEMOS = new Set([
  'tokenizer',
  'attention-heatmap',
  'gradient-descent',
  'next-token-prediction',
]);

const rootDir = process.cwd();
const dataDir = path.join(rootDir, 'data');
const clustersPath = path.join(dataDir, 'clusters.json');
const termsDir = path.join(dataDir, 'terms');
const journeysPath = path.join(dataDir, 'journeys.json');

const errors: string[] = [];

if (!fs.existsSync(clustersPath)) {
  console.error('Missing /data/clusters.json');
  process.exit(1);
}

const clusters: ClusterDef[] = JSON.parse(fs.readFileSync(clustersPath, 'utf-8'));
const clusterMap = new Map<string, ClusterDef>();

for (const c of clusters) {
  if (!c.id || !c.name || !c.color || !c.description || typeof c.targetCount !== 'number') {
    errors.push(`Cluster entry missing required fields: ${JSON.stringify(c)}`);
  }
  if (clusterMap.has(c.id)) {
    errors.push(`Duplicate cluster id: "${c.id}"`);
  }
  clusterMap.set(c.id, c);
}

const allTerms: TermDef[] = [];
const termById = new Map<string, TermDef>();
const countByCluster = new Map<string, number>();

for (const cId of clusterMap.keys()) {
  countByCluster.set(cId, 0);
}

const termFiles = fs
  .readdirSync(termsDir)
  .filter((f) => f.endsWith('.json'))
  .sort();

for (const file of termFiles) {
  const filePath = path.join(termsDir, file);
  const expectedCluster = path.basename(file, '.json');
  if (!clusterMap.has(expectedCluster)) {
    errors.push(`Term file "${file}" does not match any cluster id in clusters.json`);
  }

  let parsed: TermDef[];
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    errors.push(`Invalid JSON in ${file}: ${(err as Error).message}`);
    continue;
  }

  if (!Array.isArray(parsed)) {
    errors.push(`Expected array in ${file}`);
    continue;
  }

  for (const t of parsed) {
    const label = `${file}:${t.id ?? '(missing id)'}`;

    const requiredFields: (keyof TermDef)[] = [
      'id',
      'term',
      'cluster',
      'level',
      'short',
      'eli5',
      'example',
      'related',
    ];
    for (const field of requiredFields) {
      const val = t[field];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        errors.push(`Missing or empty field "${field}" in ${label}`);
      }
    }

    if (t.id) {
      if (termById.has(t.id)) {
        errors.push(`Duplicate term id "${t.id}" found in ${file}`);
      } else {
        termById.set(t.id, t);
      }
    }

    if (t.cluster && !clusterMap.has(t.cluster)) {
      errors.push(`Unknown cluster "${t.cluster}" in ${label}`);
    } else if (t.cluster && t.cluster !== expectedCluster) {
      errors.push(
        `Term "${t.id}" has cluster "${t.cluster}" but resides in "${file}"`
      );
    }

    if (t.level && !VALID_LEVELS.has(t.level)) {
      errors.push(`Invalid level "${t.level}" in ${label}`);
    }

    if (!Array.isArray(t.related)) {
      errors.push(`"related" must be an array in ${label}`);
    }

    if (t.demo && !VALID_DEMOS.has(t.demo)) {
      errors.push(`Unknown demo "${t.demo}" in ${label}`);
    }

    if (t.cluster && countByCluster.has(t.cluster)) {
      countByCluster.set(t.cluster, (countByCluster.get(t.cluster) ?? 0) + 1);
    }

    allTerms.push(t);
  }
}

// Check related IDs
for (const t of allTerms) {
  if (!Array.isArray(t.related)) continue;
  for (const relId of t.related) {
    if (!termById.has(relId)) {
      errors.push(`Broken related id "${relId}" referenced by term "${t.id}"`);
    }
    if (relId === t.id) {
      errors.push(`Self-referencing related id "${relId}" in term "${t.id}"`);
    }
  }
}

// Check journeys
if (fs.existsSync(journeysPath)) {
  const journeys: JourneyDef[] = JSON.parse(fs.readFileSync(journeysPath, 'utf-8'));
  for (const j of journeys) {
    if (!j.id || !j.title || !Array.isArray(j.steps) || j.steps.length === 0) {
      errors.push(`Invalid journey entry: ${JSON.stringify(j)}`);
      continue;
    }
    for (const step of j.steps) {
      if (!termById.has(step.termId)) {
        errors.push(`Journey "${j.id}" references missing termId "${step.termId}"`);
      }
    }
  }
} else {
  errors.push('Missing /data/journeys.json');
}

console.log('\nAI Concept Galaxy — Data Validation Report');
console.log('==========================================');
let totalSeed = 0;
let totalTarget = 0;
for (const c of clusters) {
  const actual = countByCluster.get(c.id) ?? 0;
  totalSeed += actual;
  totalTarget += c.targetCount;
  const pct = ((actual / c.targetCount) * 100).toFixed(1).padStart(5, ' ');
  console.log(
    `${c.name.padEnd(34, ' ')} ${String(actual).padStart(3, ' ')} / ${String(c.targetCount).padStart(3, ' ')} (${pct}%)`
  );
}
console.log('------------------------------------------');
console.log(
  `${'TOTAL'.padEnd(34, ' ')} ${String(totalSeed).padStart(3, ' ')} / ${String(totalTarget).padStart(3, ' ')}\n`
);

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} error(s):`);
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  process.exit(1);
}

console.log(`Validation passed: ${allTerms.length} terms across ${clusters.length} clusters, 0 broken links.`);
