import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/ask-term', async (req, res) => {
    try {
      const { term, short, clusterName, level, question } = req.body ?? {};

      if (typeof term !== 'string' || !term.trim()) {
        res.status(400).json({ error: 'A selected term is required.' });
        return;
      }
      if (typeof question !== 'string' || !question.trim()) {
        res.status(400).json({ error: 'Please enter a follow-up question.' });
        return;
      }
      if (question.trim().length > 400) {
        res.status(400).json({ error: 'Please keep questions under 400 characters.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'The AI Q&A service is not configured right now. You can still explore definitions, analogies, examples, and interactive demos offline.',
        });
        return;
      }

      const prompt = [
        `Concept: ${term.trim()}`,
        clusterName ? `Topic area: ${String(clusterName).trim()}` : '',
        level ? `Difficulty level: ${String(level).trim()}` : '',
        short ? `Reference definition: ${String(short).trim()}` : '',
        `Learner's question: ${question.trim()}`,
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a clear, accurate AI & machine learning tutor inside an interactive concept atlas. Answer the learner’s follow-up question about the given concept in 3 to 4 concise, plain-language sentences. Stay strictly accurate, avoid jargon walls, and explicitly say when you are unsure or when a detail depends on context.',
        },
      });

      const answer = response.text?.trim();
      if (!answer) {
        res.status(502).json({
          error: 'No explanation was returned. Please try rephrasing your question.',
        });
        return;
      }

      res.json({ answer });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected server error';
      console.error('[api/ask-term] error:', message);
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({
          error: 'Too many requests right now. Please wait a moment and try again.',
        });
        return;
      }
      res.status(502).json({
        error: 'Unable to reach the AI tutor right now. Please try again shortly.',
      });
    }
  });

  if (isProduction) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Concept Galaxy server running on http://0.0.0.0:${PORT}`);
  });
}

createApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
