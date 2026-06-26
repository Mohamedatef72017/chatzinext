import { buildOperationalFallbackReply, buildSafeCustomerReply } from "@/lib/ai/safe-customer-reply";
import { routeAiRequest } from "@/lib/ai-router";

jest.mock("@/lib/ai-router", () => ({
  routeAiRequest: jest.fn(),
}));

describe("safe customer reply fallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an Arabic operational fallback when the AI provider is unavailable", async () => {
    (routeAiRequest as jest.Mock).mockRejectedValue(new Error("429 quota exceeded"));

    const reply = await buildSafeCustomerReply({
      tenantId: "tenant",
      botId: "bot",
      customerMessage: "السلام عليكم",
      language: "auto",
      intent: "fallback",
    });

    expect(reply).toContain("وصلت رسالتك");
    expect(reply.toLowerCase()).not.toContain("openai");
    expect(reply.toLowerCase()).not.toContain("workflow");
  });

  it("returns a ticket confirmation fallback without calling a provider", () => {
    const reply = buildOperationalFallbackReply({
      customerMessage: "تم",
      language: "ar",
      intent: "ticket_created",
    });

    expect(reply).toContain("تم استلام طلبك");
  });
});
