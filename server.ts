import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side with telemetry User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEFAULT_SHOP_BACKGROUND =
  'Swami Footwear has been a trusted name in quality footwear for over a decade. We believe in comfort, style, and durability. Our mission is to provide premium footwear that makes every step a confident one.';

function buildSystemInstruction(products: any[] = []): string {
  const productContext = Array.isArray(products)
    ? products
        .map((p: any) => `- ${p.name}: ₹${p.price} (${p.category}) - ${p.description || ''}`)
        .join('\n')
    : '';

  return `
You are a polite, knowledgeable, and helpful AI assistant for "Swami Footwear".
Shop Background: ${DEFAULT_SHOP_BACKGROUND}

Available Products in Store:
${productContext}

Guidelines:
1. Be professional, friendly, and concise.
2. Answer customer questions about products, prices, categories, and sizing.
3. Suggest footwear based on customer needs (formal, sports, casual, daily wear, kids, etc.).
4. If asked about something outside the shop's scope, politely redirect back to footwear.
5. Remind customers that they can place orders directly in the app or contact Swami Footwear on WhatsApp at +91 9904648282 for assistance.
`;
}

// POST /api/chat - Standard response
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { history = [], products = [], userMessage } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    const systemInstruction = buildSystemInstruction(products);

    const contents: any[] = [
      { role: 'user', parts: [{ text: systemInstruction }] },
    ];

    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg && msg.text) {
          contents.push({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }],
          });
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
    });

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Server Gemini Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate content',
      text: "I'm having some trouble connecting right now. Please check back later or contact us directly!",
    });
  }
});

// POST /api/chat/stream - Streaming response via Server-Sent Events (SSE)
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const { history = [], products = [], userMessage } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    const systemInstruction = buildSystemInstruction(products);

    const contents: any[] = [
      { role: 'user', parts: [{ text: systemInstruction }] },
    ];

    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg && msg.text) {
          contents.push({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }],
          });
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents,
    });

    for await (const chunk of stream) {
      const text = chunk.text || '';
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Server Gemini Stream Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error?.message || 'Streaming failed',
        text: "I'm having trouble connecting to the assistant right now. Please try again soon!",
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error?.message })}\n\n`);
      res.end();
    }
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Swami Footwear server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
