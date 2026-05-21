import { GoogleGenAI } from "@google/genai";
import { config } from "../../../lib/config";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are the Tijori AI Card Advisor. You help the user choose the best card from their wallet for purchases.

Your rules:
1. You ONLY answer questions related to the user's credit or debit cards, rewards, cashback, or recommendation of which card to use for a specific purchase.
2. If the user asks general, off-topic, or security-sensitive questions, politely decline and steer them back to card choices. For example: "I'm designed to help you pick the best card for your purchases! Try asking me something like 'Which card should I use for groceries?' or 'What's the best card for booking flights?'"
3. You have access to the user's active cards (provided below). Use this information to give personalized recommendations.
4. For any purchase query (e.g. "buying a TV on Amazon"), use the Google Search tool to find active credit/debit card offers and match them with the user's cards. State the source or logic of the offer. Do not invent offers.
5. NEVER ask for or mention card numbers, CVVs, expiry dates, or full credentials. You only know card metadata (bank, variant, type, network, holder).
6. Be concise, helpful, and format your response clearly with bullet points or numbered lists when comparing cards.
7. If the user has no cards, let them know they need to add cards first in the app.`;

interface SanitizedCard {
  bank: string;
  variant: string;
  type: string;
  network: string;
  holder: string;
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function POST(request: Request) {
  try {
    const { message, cards, history } = (await request.json()) as {
      message: string;
      cards: SanitizedCard[];
      history: ChatMessage[];
    };

    if (!config.geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build the card context string
    const cardsContext =
      cards && cards.length > 0
        ? cards
          .map(
            (c, i) =>
              `${i + 1}. ${c.bank} ${c.variant} (${c.type}, ${c.network}) — Holder: ${c.holder}`
          )
          .join("\n")
        : "No cards registered.";

    const fullSystemPrompt = `${SYSTEM_PROMPT}\n\nUser's active cards:\n${cardsContext}`;

    // Build conversation history for multi-turn
    const contents = [
      ...(history || []).map((msg) => ({
        role: msg.role === "model" ? ("model" as const) : ("user" as const),
        parts: [{ text: msg.text }],
      })),
      {
        role: "user" as const,
        parts: [{ text: message }],
      },
    ];

    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: fullSystemPrompt,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    // Create a ReadableStream that pipes Gemini's async generator
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          // If the client aborted, just close gracefully
          if (err instanceof Error && err.name === "AbortError") {
            controller.close();
          } else {
            controller.error(err);
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
