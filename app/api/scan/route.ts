import { GoogleGenAI } from "@google/genai";
import { config } from "../../../lib/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!config.geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { image } = (await request.json()) as { image: string };

    if (!image) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract base64 content and mime type from Data URL
    // e.g. "data:image/jpeg;base64,/9j/4AAQSk..."
    const match = image.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
    let mimeType = "image/jpeg";
    let base64Data = image;

    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }

    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

    const prompt = `You are a credit/debit card details scanner. Analyze the provided image of a credit or debit card and extract its details.
Return a structured JSON object with the following fields:
- "bank": The name of the bank (e.g. HDFC, SBI, Axis, ICICI, Chase, Citi)
- "variant": The card variant/tier (e.g. Infinia, Regalia, Millennia, Signature, Platinum)
- "number": The card number. Return whatever is visible. If digits are partially visible, use '•' or '*' for unreadable digits. (e.g., "4321 8765 4321 0987" or "•••• •••• •••• 1234")
- "expiry": Expiry date in "MM/YY" format (e.g. "08/29"). If only partially visible or missing, leave empty or format what is seen.
- "holder": The cardholder's name, formatted in Title Case. Leave empty if not printed or not readable.
- "network": The card network (must be one of: "Visa", "Mastercard", "Amex", "RuPay", "Discover", "Unknown")

Rules:
1. ONLY return the structured JSON object. Do not wrap in markdown block formatting like \`\`\`json.
2. DO NOT make up (hallucinate) numbers or names. If a field is not present or blurred, return an empty string.
3. Be precise with the card number and expiry formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        prompt,
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response received from Gemini OCR service");
    }

    // Parse the JSON safely
    const parsedData = JSON.parse(responseText.trim());

    return new Response(JSON.stringify(parsedData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Card scanning error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error during scan",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
