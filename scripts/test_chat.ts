import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/mongodb";
import { generateAiReply } from "../src/lib/ai";

async function test() {
  await connectToDatabase();
  console.log("Connected to DB. Testing chat...");
  
  const tenantId = "6a3e72f2c08661521184e7dc";
  const botId = "6a3e72f3c08661521184e7e1";
  
  try {
    const res = await generateAiReply({
      tenantId,
      botId,
      message: "ماهي خدمات الشركة المتحدة؟",
      channel: "web",
      externalUserId: "test_user_123"
    });
    console.log("AI Reply:", res);
  } catch(e) {
    console.error("Error:", e);
  }
  
  process.exit(0);
}
test();
