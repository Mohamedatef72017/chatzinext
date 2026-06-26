import fs from "fs";
import path from "path";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AI-first CRM routing", () => {
  it("does not keep phrase-based customer intent or field extraction lists", () => {
    const sources = [
      readSource("src/lib/ai/business-intent.ts"),
      readSource("src/lib/crm/ticket-flow-engine.ts"),
    ].join("\n");

    for (const phrase of [
      "اريد شراء",
      "اكد الطلب",
      "مهتم",
      "رقم الهاتف",
      "my name is",
      "what do you",
      "business activity",
    ]) {
      expect(sources).not.toContain(phrase);
    }
  });
});
