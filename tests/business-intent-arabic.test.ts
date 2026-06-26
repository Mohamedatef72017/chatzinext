import { detectBusinessIntent } from "@/lib/ai/business-intent";

describe("business intent fallback", () => {
  it("keeps synchronous fallback broad instead of using phrase rules", () => {
    expect(detectBusinessIntent("any customer text")).toBe("business");
    expect(detectBusinessIntent("")).toBe("unknown");
  });
});
