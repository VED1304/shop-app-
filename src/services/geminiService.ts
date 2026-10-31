import { ChatMessage, Product } from "../types";

export async function getChatResponse(
  history: ChatMessage[],
  products: Product[],
  userMessage: string
): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history,
        products,
        userMessage,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data.text || "I'm sorry, I couldn't process that. Please try again or contact us via WhatsApp.";
  } catch (error) {
    console.error("AI Chat Client Error:", error);
    return "I'm having some trouble connecting right now. Please check back later or call us directly!";
  }
}

export async function streamChatResponse(
  history: ChatMessage[],
  products: Product[],
  userMessage: string,
  onChunk: (text: string) => void
): Promise<string> {
  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history,
        products,
        userMessage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body reader available");
    }

    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const raw = decoder.decode(value, { stream: true });
      const lines = raw.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              accumulated += parsed.text;
              onChunk(accumulated);
            }
          } catch {
            // Ignore partial parse
          }
        }
      }
    }

    return accumulated;
  } catch (error) {
    console.error("AI Chat Stream Client Error:", error);
    return getChatResponse(history, products, userMessage);
  }
}
