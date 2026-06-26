import fs from "fs";
import path from "path";
import { shouldFallbackToLegacy } from "../src/lib/ai/orchestrator-flags";
import { validateCustomerReply } from "../src/lib/ai/reply-validators";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Chatzi AI reply behavior smoke tests", () => {
  const forbiddenReplyFragments = ["<think", "[SENTIMENT:", "RAG", "confidence score"];

  beforeEach(() => {
    delete process.env.MASTRA_FALLBACK_TO_LEGACY;
  });

  it("keeps orchestrator to direct fallback enabled by default", () => {
    expect(shouldFallbackToLegacy()).toBe(true);
  });

  it("rejects internal markers that must not reach customers", () => {
    for (const fragment of forbiddenReplyFragments) {
      expect(validateCustomerReply(`hello ${fragment} hidden details`).valid).toBe(false);
    }
  });

  it("keeps knowledge similarity score separate from ranking score", () => {
    const source = readSource("src/lib/knowledge.ts");

    expect(source).toContain("rankScore");
    expect(source).toContain("const score = Math.round(semanticScore * 100);");
    expect(source.replace(/\s+/g, "")).toContain("(b.rankScore??b.score)-(a.rankScore??a.score)");
    expect(source).not.toContain("const score = Math.round((semanticScore * 0.72 + keywordScore * 0.28) * 100);");
  });

  it("does not expose scores or chain-of-thought tags in knowledge prompts", () => {
    const source = readSource("src/lib/knowledge.ts");

    expect(source).not.toContain("score=${result.score}");
    expect(source).not.toContain("Confidence: ${input.confidence}/100");
    expect(source).not.toContain("<think>");
    expect(source).not.toContain("[SENTIMENT:");
  });

  it("does not turn support or complaint tickets into automatic handoff", () => {
    const source = readSource("src/mastra/workflows/ai-reply.workflow.ts");

    expect(source).toContain('inputData.reason === "explicit_human_request"');
    expect(source).not.toContain('"complaint",\n        "technical_support"');
  });

  it("keeps replies human and lightly expressive without overdoing emojis", () => {
    const promptSource = readSource("src/lib/ai/build-system-prompt.ts");
    const cacheSource = readSource("src/lib/ai/prompt-cache.ts");

    expect(promptSource).toContain("HUMAN CHAT STYLE");
    expect(promptSource).toContain("not overly soft, sugary, or exaggerated");
    expect(promptSource).toContain("use at most one relevant emoji");
    expect(promptSource).toContain("flower or smile is acceptable");
    expect(cacheSource).toContain("human-chat-style-v4");
  });

  it("keeps purchase conversations moving without optional question loops", () => {
    const promptSource = readSource("src/lib/ai/build-system-prompt.ts");
    const classifierSource = readSource("src/lib/crm/ticket-ai-classifier.ts");
    const workflowSource = readSource("src/mastra/workflows/ai-reply.workflow.ts");
    const ticketFlowSource = readSource("src/lib/crm/ticket-flow-engine.ts");

    expect(promptSource).toContain("QUESTION ECONOMY & ORDER CONTINUITY");
    expect(promptSource).toContain("Do not ask what they want again");
    expect(promptSource).toContain("Optional details must never block progress");
    expect(promptSource).toContain("stop asking questions in that turn");
    expect(classifierSource).toContain("accumulating customer request");
    expect(classifierSource).toContain("Do not require the customer to repeat");
    expect(workflowSource).not.toContain("CRM FIELD COLLECTION ACTIVE: The runtime context contains a list of fields");
    expect(ticketFlowSource).not.toContain("crmTicketFlow.replyGoal=");
  });

  it("keeps emotion policy in the unified prompt instead of runtime chat instructions", () => {
    const promptSource = readSource("src/lib/ai/build-system-prompt.ts");
    const safeReplySource = readSource("src/lib/ai/safe-customer-reply.ts");
    const ticketFlowSource = readSource("src/lib/crm/ticket-flow-engine.ts");
    const workflowSource = readSource("src/mastra/workflows/ai-reply.workflow.ts");

    expect(promptSource).toContain("telling the assistant to stop talking");
    expect(promptSource).toContain("do not push sales");
    expect(ticketFlowSource).not.toContain("Emotion override");
    expect(ticketFlowSource).not.toContain("angry, abusive");
    expect(workflowSource).not.toContain("Emotion override");
    expect(workflowSource).not.toContain("angry, abusive");
    expect(safeReplySource).not.toContain("asking the assistant to stop talking");
    expect(safeReplySource).not.toContain("Do not sell, list options, ask discovery questions");
  });
});
