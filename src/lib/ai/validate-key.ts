import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";

export async function validateApiKey(providerId: string, apiKey: string, baseUrl?: string): Promise<boolean> {
  if (!apiKey || apiKey.trim() === "") return false;
  
  try {
    if (providerId === "gemini") {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      await model.generateContent("hello");
      return true;
    }

    if (providerId === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }]
        })
      });
      return res.ok;
    }

    if (providerId === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      return res.ok;
    }

    if (providerId === "ollama") {
      return true;
    }

    // Default to OpenAI compatible validation
    let clientBaseUrl = baseUrl || undefined;
    if (providerId === "deepseek") clientBaseUrl = "https://api.deepseek.com/v1";
    if (providerId === "xai") clientBaseUrl = "https://api.x.ai/v1";
    if (providerId === "groq") clientBaseUrl = "https://api.groq.com/openai/v1";
    
    const client = new OpenAI({ apiKey, baseURL: clientBaseUrl });
    const model = providerId === "deepseek" ? "deepseek-chat" : 
                  providerId === "xai" ? "grok-beta" : 
                  providerId === "groq" ? "llama-3.1-8b-instant" : "gpt-4o-mini";
    
    await client.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 1,
    });
    
    return true;
  } catch (error) {
    logger.warn(`API Key validation failed for ${providerId}`, {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}
