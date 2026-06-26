import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/server/auth/guards";
import { AiProvider } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { encryptSecret } from "@/lib/crypto";
import { validateApiKey } from "@/lib/ai/validate-key";
const schema = z.object({
  providerId: z.enum(["openai", "anthropic", "gemini", "openrouter", "deepseek", "xai", "groq", "ollama"]),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  defaultModel: z.string().optional(),
  isActive: z.boolean(),
  isDefault: z.boolean().optional(),
  priority: z.number().optional()
});


export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = schema.parse(await request.json());
    await connectToDatabase();

    const providerNames: Record<string, string> = {
      "openai": "OpenAI",
      "anthropic": "Anthropic",
      "gemini": "Google Gemini",
      "openrouter": "OpenRouter",
      "deepseek": "DeepSeek",
      "xai": "xAI (Grok)",
      "groq": "Groq",
      "ollama": "Ollama"
    };

    const existing = await AiProvider.findOne({ providerId: body.providerId });
    
    // If setting as default, unset others
    if (body.isDefault) {
      await AiProvider.updateMany({}, { $set: { isDefault: false } });
    }

    const updateData: any = {
      name: providerNames[body.providerId] || body.providerId,
      isActive: body.isActive,
      ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.baseUrl !== undefined && { baseUrl: body.baseUrl }),
      ...(body.defaultModel !== undefined && { defaultModel: body.defaultModel })
    };

    if (body.apiKey && body.apiKey.trim().length > 0) {
      const apiKey = body.apiKey.trim();
      const isValid = await validateApiKey(body.providerId, apiKey, body.baseUrl);
      if (!isValid) {
        return NextResponse.json(
          { error: "المفتاح غير صالح أو مرفوض. يرجى التأكد من صحة المفتاح وتوفره على رصيد كافٍ." },
          { status: 400 }
        );
      }
      updateData.apiKeyEncrypted = encryptSecret(apiKey);
    }

    if (existing) {
      await AiProvider.updateOne({ _id: existing._id }, { $set: updateData });
    } else {
      await AiProvider.create({
        providerId: body.providerId,
        ...updateData
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("AI Provider Setup Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر حفظ إعدادات المزود." },
      { status: 400 }
    );
  }
}
