import mongoose from "mongoose";
import { Contact } from "../src/lib/models/contact";
import { Conversation } from "../src/lib/models/conversation";
import { Message } from "../src/lib/models/message";
import { Ticket } from "../src/lib/models/ticket";
import { Lead } from "../src/lib/models/lead";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const TENANT_ID = "6a3ea9764bf166ddd39ebac7";
const NUM_ENTITIES = 200; // 200 conversations, 200 tickets, 200 leads

const firstNames = ["Ahmed", "Mohamed", "Mahmoud", "Ali", "Hassan", "Kareem", "Youssef", "Omar", "Tariq", "Ziad", "Sara", "Mona", "Nour", "Mariam", "Laila", "Hala", "Yasmin", "Salma", "Fatima", "Aisha"];
const lastNames = ["Ibrahim", "Hassan", "Ali", "Saleh", "Mostafa", "Saeed", "Tawfiq", "Fouad", "Kamal", "Zaki", "Nassar", "Fahmy", "Osman", "Radwan", "Khalil"];
const companies = ["TechCorp", "Global Media", "Nile Soft", "Cairo Innovations", "Alexandria Logistics", "Delta Systems", "Giza Dynamics", "Modern Solutions"];
const channels = ["whatsapp", "messenger", "telegram", "web"];
const ticketCategories = ["Billing", "Technical Support", "Sales", "General Inquiry", "Complaint"];
const leadInterests = ["Software Development", "Marketing Services", "Consulting", "CRM Implementation", "SEO Optimization"];

function randomElement(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  const uri = (process.env.MONGODB_URI || "").replace("ChatZi", "chatzi");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const contacts = [];
  const conversations = [];
  const messages = [];
  const tickets = [];
  const leads = [];

  for (let i = 1; i <= NUM_ENTITIES; i++) {
    const fName = randomElement(firstNames);
    const lName = randomElement(lastNames);
    const phone = `+201${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.com`;
    const company = randomElement(companies);
    const contactId = new mongoose.Types.ObjectId();

    // Contact
    contacts.push({
      _id: contactId,
      tenantId: TENANT_ID,
      name: `${fName} ${lName} ${i}`,
      email: email,
      phone: phone,
      company: company,
      country: "EG",
      lifecycleStage: Math.random() > 0.5 ? "lead" : "customer",
      totalOrders: Math.floor(Math.random() * 50),
      customerValue: Math.floor(Math.random() * 5000),
      tags: ["massive_seed", `tag_${i % 5}`],
      notes: `Seed data number ${i}.`,
      lastSeenAt: new Date(Date.now() - Math.random() * 10000000000),
    });

    // Conversation
    const conversationId = new mongoose.Types.ObjectId();
    const messageCount = Math.floor(Math.random() * 10) + 2; // 2 to 11 messages
    
    conversations.push({
      _id: conversationId,
      tenantId: TENANT_ID,
      channel: randomElement(channels),
      contactId: contactId,
      externalUserId: phone,
      provider: "mock_provider",
      status: randomElement(["open", "resolved", "closed", "snoozed"]),
      priority: randomElement(["low", "medium", "high", "urgent"]),
      labels: ["massive_seed", "test"],
      unreadCount: Math.floor(Math.random() * 3),
      lastMessagePreview: `This is a test message ${messageCount}...`,
      lastMessageAt: new Date(Date.now() - Math.random() * 10000000000),
      createdAt: new Date(Date.now() - Math.random() * 10000000000),
    });

    // Messages
    for (let j = 0; j < messageCount; j++) {
      const isUser = j % 2 === 0;
      messages.push({
        tenantId: TENANT_ID,
        conversationId: conversationId,
        contactId: contactId,
        provider: "mock_provider",
        externalMessageId: `msg_${conversationId}_${j}`,
        direction: isUser ? "incoming" : "outgoing",
        sender: isUser ? "user" : "assistant",
        senderType: isUser ? "customer" : "assistant",
        content: isUser ? `Hello, this is message ${j} from user.` : `Hi! This is the response ${j} from the assistant.`,
        deliveryStatus: "delivered",
        createdAt: new Date(Date.now() - Math.random() * 10000000),
      });
    }

    // Ticket
    tickets.push({
      tenantId: TENANT_ID,
      contactId: contactId,
      conversationId: conversationId,
      number: 10000 + i, // Unique number
      title: `Issue with ${randomElement(ticketCategories)} - ${i}`,
      description: `The customer reported an issue regarding their recent interaction. Please investigate and follow up. Seed ${i}.`,
      status: randomElement(["open", "in_progress", "pending", "resolved", "closed"]),
      priority: randomElement(["low", "medium", "high", "urgent"]),
      category: randomElement(ticketCategories),
      tags: ["massive_seed"],
      createdAt: new Date(Date.now() - Math.random() * 10000000000),
    });

    // Lead
    leads.push({
      tenantId: TENANT_ID,
      contactId: contactId,
      stage: randomElement(["new", "qualified", "proposal", "negotiation", "won", "lost"]),
      value: Math.floor(Math.random() * 50000) + 1000,
      currency: "USD",
      name: `${fName} ${lName}`,
      email: email,
      phone: phone,
      normalizedPhone: phone,
      company: company,
      interest: randomElement(leadInterests),
      notes: `Lead generated from massive seed script. Very interested in ${randomElement(leadInterests)}.`,
      tags: ["massive_seed"],
      createdAt: new Date(Date.now() - Math.random() * 10000000000),
    });
  }

  console.log("Inserting contacts...");
  await Contact.insertMany(contacts);
  console.log("Inserting conversations...");
  await Conversation.insertMany(conversations);
  console.log("Inserting messages...");
  // Bulk insert in chunks to avoid memory issues if too large
  const chunkSize = 500;
  for (let i = 0; i < messages.length; i += chunkSize) {
    await Message.insertMany(messages.slice(i, i + chunkSize));
  }
  console.log("Inserting tickets...");
  await Ticket.insertMany(tickets);
  console.log("Inserting leads...");
  await Lead.insertMany(leads);

  console.log(`Successfully inserted massive test data for tenant ${TENANT_ID}!`);
  process.exit(0);
}

const args = process.argv.slice(2);
if (args[0] === "--delete") {
  const uri = (process.env.MONGODB_URI || "").replace("ChatZi", "chatzi");
  mongoose.connect(uri).then(async () => {
    const c = await Contact.deleteMany({ tenantId: TENANT_ID, tags: "massive_seed" });
    const conv = await Conversation.deleteMany({ tenantId: TENANT_ID, labels: "massive_seed" });
    // Messages can be deleted by checking conversationIds, but it's easier to just wipe by provider="mock_provider"
    const m = await Message.deleteMany({ tenantId: TENANT_ID, provider: "mock_provider" });
    const t = await Ticket.deleteMany({ tenantId: TENANT_ID, tags: "massive_seed" });
    const l = await Lead.deleteMany({ tenantId: TENANT_ID, tags: "massive_seed" });
    
    console.log(`Deleted: ${c.deletedCount} contacts, ${conv.deletedCount} conversations, ${m.deletedCount} messages, ${t.deletedCount} tickets, ${l.deletedCount} leads.`);
    process.exit(0);
  });
} else {
  run().catch(console.error);
}
