import { normalizePhone } from "@/lib/leads-from-tickets";

describe("phone normalization", () => {
  it("normalizes Arabic digits and rejects short product-like numbers", () => {
    expect(normalizePhone("٠١٠٠٢٥٤٠٦٣٣")).toBe("01002540633");
    expect(normalizePhone("iPhone 15")).toBe("");
  });
});
