import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Product } from "../types";
import { SHOP_NAME, SHOP_STORY } from "../constants";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getChatResponse(history: ChatMessage[], products: Product[], userMessage: string): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const productContext = products.map(p => `- ${p.name}: ₹${p.price} (${p.category}) - ${p.description}`).join('\n');
  
  const systemInstruction = `
    You are a polite and helpful AI assistant for "${SHOP_NAME}".
    Shop Background: ${SHOP_STORY}
    
    Available Products:
    ${productContext}
    
    Guidelines:
    1. Be professional, friendly, and concise.
    2. Answer questions about products, prices, and categories.
    3. Suggest footwear based on user needs (e.g., formal, sports, casual).
    4. If asked about something outside the shop's scope, politely redirect to footwear.
    5. Always mention that customers can visit the shop or contact via WhatsApp for more details.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: [
        { role: 'user', parts: [{ text: systemInstruction }] },
        ...history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      }
    });

    return response.text || "I'm sorry, I couldn't process that. Please try again or contact us via WhatsApp.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "I'm having some trouble connecting right now. Please check back later or call us directly!";
  }
}
