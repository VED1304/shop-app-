import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not defined in environment variables');
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server',
        text: "The AI assistant is temporarily unavailable. Please contact us on WhatsApp at +91 9904648282!",
      });
    }

    const { history = [], products = [], userMessage } = req.body || {};

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'userMessage is required' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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

    return res.status(200).json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Vercel Gemini API Error (/api/chat):', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate response',
      text: "I'm having some trouble connecting right now. Please check back later or contact us on WhatsApp at +91 9904648282!",
    });
  }
}
