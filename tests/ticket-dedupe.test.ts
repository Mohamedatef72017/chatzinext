import {
  buildTicketDedupeMatches,
  buildTicketIssueIdentityKey,
  type EnsureTicketInput,
} from "@/lib/tickets";

function ticketInput(overrides: Partial<EnsureTicketInput> = {}): EnsureTicketInput {
  return {
    tenantId: "507f1f77bcf86cd799439011",
    botId: "507f1f77bcf86cd799439012",
    conversationId: "507f1f77bcf86cd799439013",
    triggerReason: "crm_ticket_flow_complete",
    category: "sales_request",
    priority: "medium",
    subject: "iPhone 15 256GB",
    description: "Customer wants to buy iPhone 15 256GB",
    metadata: {
      customerName: "محمد عاطف",
      customerPhone: "٠١٠٩٥٨٤٣١٨٣",
      issueDescription: "iPhone 15 256GB",
    },
    ...overrides,
  };
}

describe("ticket dedupe identity", () => {
  it("dedupes by same customer and same issue, not by phone alone", () => {
    const first = ticketInput();
    const second = ticketInput({
      subject: "Nokia 120 availability",
      description: "Customer asks whether Nokia 120 is currently available",
      metadata: {
        customerName: "محمد عاطف",
        customerPhone: "01095843183",
        issueDescription: "Nokia 120 availability",
      },
    });

    const firstIdentity = buildTicketIssueIdentityKey(first);
    const secondIdentity = buildTicketIssueIdentityKey(second);

    expect(firstIdentity).not.toBe(secondIdentity);

    const matches = buildTicketDedupeMatches(first, "same-request-fingerprint", firstIdentity);
    expect(matches).toContainEqual({
      "metadata.normalizedCustomerPhone": "01095843183",
      "metadata.issueIdentityKey": firstIdentity,
    });
    expect(matches).not.toContainEqual({
      "metadata.normalizedCustomerPhone": "01095843183",
    });
    expect(matches).not.toContainEqual({
      "customFields.normalizedPhone": "01095843183",
    });
  });

  it("keeps repeated wording for the same request on the same issue identity", () => {
    const first = ticketInput();
    const repeated = ticketInput({
      subject: "iPhone 15 256GB",
      description: "Customer still wants to buy iPhone 15 256GB",
      metadata: {
        customerName: "محمد عاطف",
        customerPhone: "01095843183",
        issueDescription: "iPhone 15 256GB",
      },
    });

    expect(buildTicketIssueIdentityKey(first)).toBe(buildTicketIssueIdentityKey(repeated));
  });
});
