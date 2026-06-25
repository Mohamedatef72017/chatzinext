import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Types } from "mongoose";
import { searchKnowledge } from "@/lib/knowledge";

const searchKnowledgeInputSchema = z.object({
  tenantId: z.string().min(1),
  botId: z.string().min(1),
  question: z.string().min(1),
  limit: z.number().int().min(1).max(10).default(6),
});

const searchKnowledgeOutputSchema = z.object({
  confidence: z.number(),
  intent: z.string(),
  keywords: z.array(z.string()),
  results: z.array(
    z.object({
      text: z.string(),
      score: z.number(),
      sourceTitle: z.string(),
      sourceUrl: z.string().optional(),
    })
  ),
});

export const searchKnowledgeTool = createTool({
  id: "search-knowledge",
  description: [
    "Search the business knowledge base for information relevant to the customer's question.",
    "Use this tool whenever the customer asks about: services, products, prices, availability, booking, hours, location, policies, procedures, offers, or any business-specific fact.",
    "Also use this tool before answering complaints, support requests, or objections — to ensure the answer is grounded in accurate business information.",
    "Always search BEFORE answering a business question. Never answer from general knowledge when business-specific information is available.",
    "Pass the customer's original question or a rephrased version of it as the 'question' field.",
    "The tool returns ranked results with confidence scores. Use the highest-confidence results to ground your response.",
    "If the confidence is below 40, acknowledge that you have limited information and offer to escalate to the team.",
  ].join(" "),
  inputSchema: searchKnowledgeInputSchema,
  outputSchema: searchKnowledgeOutputSchema,
  execute: async (input) => {
    if (
      !Types.ObjectId.isValid(input.tenantId) ||
      !Types.ObjectId.isValid(input.botId)
    ) {
      throw new Error("Invalid tenant or bot identifier.");
    }

    const knowledge = await searchKnowledge({
      tenantId: input.tenantId,
      botId: input.botId,
      question: input.question,
      limit: input.limit,
    });

    return {
      confidence: knowledge.confidence,
      intent: knowledge.intent,
      keywords: knowledge.keywords,
      results: knowledge.results.map((result: any) => ({
        text: result.text,
        score: result.score,
        sourceTitle: result.sourceTitle,
        sourceUrl: result.sourceUrl || undefined,
      })),
    };
  },
});
