import { routeAiRequest } from "@/lib/ai-router";
import { Conversation } from "@/lib/models";
import {
  processTicketFlow,
  type TicketFlowState,
} from "@/lib/crm/ticket-flow-engine";

jest.mock("@/lib/ai-router", () => ({
  routeAiRequest: jest.fn(),
}));

jest.mock("@/lib/models", () => ({
  Conversation: {
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  },
}));

describe("CRM ticket flow engine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses AI structured fields to start a ticket flow", async () => {
    (routeAiRequest as jest.Mock).mockResolvedValue({
      reply: JSON.stringify({
        action: "start_ticket_flow",
        category: "sales_request",
        priority: "medium",
        collectedFields: {
          name: "محمود عادل",
          phone: "٠١٠٠٢٥٤٠٦٣٣",
          issueDescription: "iPhone 15",
        },
        reason: "ai_detected_sales_request",
        confidence: 0.92,
      }),
    });

    const result = await processTicketFlow({
      tenantId: "tenant",
      botId: "bot",
      conversationId: "conversation",
      message: "latest customer message",
      conversationMessages: [
        { sender: "user", content: "iPhone 15" },
        { sender: "user", content: "الاسم / محمود عادل رقم الهاتف/ ٠١٠٠٢٥٤٠٦٣٣" },
      ],
    });

    expect(result.action).toBe("create_ticket");
    expect(result.collectedFields).toMatchObject({
      name: "محمود عادل",
      phone: "01002540633",
      issueDescription: "iPhone 15",
    });
  });

  it("keeps collecting an active ticket flow when the latest message provides missing fields", async () => {
    (routeAiRequest as jest.Mock).mockResolvedValue({
      reply: JSON.stringify({
        action: "answer_current_message",
        category: "sales_request",
        priority: "medium",
        collectedFields: {
          name: "محمود عادل",
          phone: "01005840966",
        },
        reason: "ai_extracted_missing_fields_from_context",
        confidence: 0.88,
      }),
    });

    const activeState: TicketFlowState = {
      version: 1,
      status: "collecting_required_fields",
      category: "sales_request",
      priority: "medium",
      reason: "business_intent_sales",
      requiredFields: ["name", "phone", "issueDescription"],
      missingFields: ["name", "phone", "issueDescription"],
      collectedFields: {},
      startedAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    };

    const result = await processTicketFlow({
      tenantId: "tenant",
      botId: "bot",
      conversationId: "conversation",
      message: "latest customer message",
      conversationMetadata: { crmTicketFlow: activeState },
      conversationMessages: [
        { sender: "user", content: "أسمي محمود عادل رقم الهاتف 01005840966" },
      ],
    });

    expect(result.action).toBe("ask_missing_fields");
    expect(result.collectedFields).toMatchObject({
      name: "محمود عادل",
      phone: "01005840966",
    });
    expect(result.missingFields).toEqual(["issueDescription"]);
    expect(Conversation.updateOne).toHaveBeenCalledWith(
      { _id: "conversation", tenantId: "tenant", botId: "bot" },
      expect.objectContaining({
        $set: expect.objectContaining({
          "metadata.crmTicketFlow": expect.objectContaining({
            status: "collecting_required_fields",
            collectedFields: expect.objectContaining({
              name: "محمود عادل",
              phone: "01005840966",
            }),
          }),
        }),
      })
    );
  });

  it("handles the original purchase conversation without re-asking for provided details", async () => {
    (routeAiRequest as jest.Mock)
      .mockResolvedValueOnce({
        reply: JSON.stringify({
          action: "none",
          category: "general",
          priority: "medium",
          collectedFields: {},
          reason: "informational_business_question",
          confidence: 0.8,
        }),
      })
      .mockResolvedValueOnce({
        reply: JSON.stringify({
          action: "start_ticket_flow",
          category: "sales_request",
          priority: "medium",
          collectedFields: {
            issueDescription: "iPhone 15",
          },
          reason: "customer_wants_to_buy",
          confidence: 0.93,
        }),
      })
      .mockResolvedValueOnce({
        reply: JSON.stringify({
          action: "continue_ticket_flow",
          category: "sales_request",
          priority: "medium",
          collectedFields: {
            name: "محمود عادل",
            phone: "01002540633",
            issueDescription: "iPhone 15",
          },
          reason: "customer_provided_contact_details",
          confidence: 0.95,
        }),
      });

    const tenantId = "tenant";
    const botId = "bot";
    const conversationId = "conversation";
    const transcript = [
      { sender: "user", content: "ماهي خدمات الشركة المتحدة" },
    ];

    const infoTurn = await processTicketFlow({
      tenantId,
      botId,
      conversationId,
      message: "ماهي خدمات الشركة المتحدة",
      conversationMessages: transcript,
    });
    expect(infoTurn.action).toBe("none");

    transcript.push({ sender: "assistant", content: "هذه معلومات الخدمات من المعرفة المتاحة." });
    transcript.push({ sender: "user", content: "اريد شراء ايفون 15" });
    const purchaseTurn = await processTicketFlow({
      tenantId,
      botId,
      conversationId,
      message: "اريد شراء ايفون 15",
      conversationMessages: transcript,
    });
    expect(purchaseTurn.action).toBe("ask_missing_fields");
    expect(purchaseTurn.missingFields).toEqual(["name", "phone"]);
    expect(purchaseTurn.collectedFields).toMatchObject({
      issueDescription: "iPhone 15",
    });

    transcript.push({ sender: "assistant", content: "أحتاج الاسم ورقم الهاتف لإتمام الطلب." });
    transcript.push({ sender: "user", content: "الاسم / محمود عادل رقم الهاتف/ 01002540633" });
    const contactTurn = await processTicketFlow({
      tenantId,
      botId,
      conversationId,
      message: "الاسم / محمود عادل رقم الهاتف/ 01002540633",
      conversationMetadata: { crmTicketFlow: purchaseTurn.state },
      conversationMessages: transcript,
    });

    expect(contactTurn.action).toBe("create_ticket");
    expect(contactTurn.missingFields).toEqual([]);
    expect(contactTurn.readyToCreate).toBe(true);
    expect(contactTurn.collectedFields).toMatchObject({
      name: "محمود عادل",
      phone: "01002540633",
      issueDescription: "iPhone 15",
    });
  });
});
