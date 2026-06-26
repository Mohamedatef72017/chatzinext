"use server";

import { requirePlatformAdmin } from "@/lib/authz";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";
import { revalidatePath } from "next/cache";

export async function toggleUserActivation(userId: string, isActive: boolean) {
  await requirePlatformAdmin();
  await connectToDatabase();

  const user = await User.findByIdAndUpdate(userId, { isActive });
  if (!user) {
    throw new Error("المستخدم غير موجود");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  await requirePlatformAdmin();
  await connectToDatabase();

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new Error("المستخدم غير موجود");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { success: true };
}

import { AiProvider } from "@/lib/models";
import { decryptSecret } from "@/lib/crypto";

export async function fetchAvailableModels(providerId: string, customApiKey?: string, customBaseUrl?: string) {
  await requirePlatformAdmin();
  await connectToDatabase();

  let apiKey = customApiKey || "";
  let baseUrl = customBaseUrl || "";

  if (!apiKey) {
    const providerDoc = await AiProvider.findOne({ providerId }).lean();
    if (providerDoc?.apiKeyEncrypted) {
      apiKey = decryptSecret(providerDoc.apiKeyEncrypted) || "";
    }
    if (!baseUrl && providerDoc?.baseUrl) {
      baseUrl = providerDoc.baseUrl;
    }
  }

  if (providerId !== "ollama" && !apiKey) {
    throw new Error("يجب إدخال مفتاح API لجلب قائمة النماذج.");
  }

  let endpoint = "";
  let headers: Record<string, string> = {};

  switch (providerId) {
    case "openai":
      endpoint = baseUrl || "https://api.openai.com/v1/models";
      if (!endpoint.endsWith("/models")) endpoint = `${endpoint.replace(/\/$/, "")}/models`;
      headers = { Authorization: `Bearer ${apiKey}` };
      break;
    case "openrouter":
      endpoint = "https://openrouter.ai/api/v1/models";
      headers = { Authorization: `Bearer ${apiKey}` };
      break;
    case "groq":
      endpoint = "https://api.groq.com/openai/v1/models";
      headers = { Authorization: `Bearer ${apiKey}` };
      break;
    case "deepseek":
      endpoint = "https://api.deepseek.com/models";
      headers = { Authorization: `Bearer ${apiKey}` };
      break;
    case "xai":
      endpoint = "https://api.x.ai/v1/models";
      headers = { Authorization: `Bearer ${apiKey}` };
      break;
    case "ollama":
      endpoint = baseUrl || "http://localhost:11434";
      endpoint = `${endpoint.replace(/\/$/, "")}/api/tags`;
      break;
    case "anthropic":
      endpoint = "https://api.anthropic.com/v1/models";
      headers = { 
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      };
      break;
    case "gemini":
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      break;
    default:
      throw new Error(`جلب النماذج غير مدعوم حالياً للمزود ${providerId}`);
  }

  try {
    const res = await fetch(endpoint, { headers });
    if (!res.ok) {
      throw new Error(`فشل جلب النماذج: ${res.status}`);
    }
    const data = await res.json();
    let models: string[] = [];

    if (providerId === "ollama") {
      models = data.models?.map((m: any) => m.name) || [];
    } else if (providerId === "gemini") {
      models = data.models?.map((m: any) => m.name.replace("models/", "")) || [];
    } else if (providerId === "anthropic") {
      models = data.data?.map((m: any) => m.id) || [];
    } else {
      models = data.data?.map((m: any) => m.id) || [];
    }

    return { success: true, models };
  } catch (err: any) {
    throw new Error(err.message || "فشل جلب النماذج");
  }
}
