export interface HiddenDiscovery {
  id: string;
  name: string;
  symbol: string;
  x: number;
  y: number;
  color: string;
  hint: string;
  note: string;
}

export const HIDDEN_DISCOVERIES: HiddenDiscovery[] = [
  {
    id: 'golden-attention-pulsar',
    name: 'Attention Pulsar',
    symbol: '✵',
    x: 230,
    y: -260,
    color: '#F59E0B',
    hint: 'Shimmers between LLMs and Agents',
    note: 'In 2017, replacing recurrence with pure self-attention let models read entire sequences in parallel—sparking the modern LLM era.',
  },
  {
    id: 'rosetta-embedding-rift',
    name: 'Rosetta Vector Rift',
    symbol: '❖',
    x: -640,
    y: -20,
    color: '#2DD4BF',
    hint: 'Drifts between NLP and Math & Stats',
    note: 'Early word embeddings stunned researchers when vector arithmetic captured analogies like king − man + woman ≈ queen.',
  },
  {
    id: 'gradient-canyon-beacon',
    name: 'Gradient Valley Beacon',
    symbol: '⌖',
    x: -90,
    y: 480,
    color: '#EC4899',
    hint: 'Orbits south of Training & Optimization',
    note: 'Loss landscapes in billions of dimensions have surprisingly few true local traps—most critical points are saddle points.',
  },
  {
    id: 'latent-nebula-prism',
    name: 'Latent Space Prism',
    symbol: '◈',
    x: 880,
    y: 350,
    color: '#FB7185',
    hint: 'Gleams along the outer GenAI spiral arm',
    note: 'Diffusion models reverse noise step by step, sculpting pure Gaussian static into coherent images and audio.',
  },
  {
    id: 'alignment-lighthouse',
    name: 'Alignment Lighthouse',
    symbol: '✧',
    x: 240,
    y: -780,
    color: '#F43F5E',
    hint: 'Guards the northern rim near Safety & Eval',
    note: 'Helpful, honest, and harmless AI emerges not from raw pretraining alone, but from careful human-feedback alignment.',
  },
  {
    id: 'perceptron-echo',
    name: '1958 Perceptron Echo',
    symbol: '✦',
    x: -1120,
    y: -140,
    color: '#38BDF8',
    hint: 'Glows on the far Foundations frontier',
    note: 'Frank Rosenblatt built the Mark I Perceptron in 1958—a hardware neural network wired with 400 photocells and motorized weights.',
  },
  {
    id: 'reward-horizon',
    name: 'Horizon Star',
    symbol: '✺',
    x: 1120,
    y: 440,
    color: '#F97316',
    hint: 'Twinkles between Computer Vision and RL',
    note: 'Temporal-difference learning lets agents assign credit to early moves long before the final game score arrives.',
  },
];
