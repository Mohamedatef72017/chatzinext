import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectToDatabase } from "../src/lib/mongodb";
import { BillingPlan, TenantSubscription } from "../src/lib/models";

dotenv.config();

async function fix() {
  await connectToDatabase();
  console.log("Connected to DB");
  
  const freePlan = await BillingPlan.findOne({ name: "Free" });
  
  const defaultFeatures = [
    { key: "ai_messages", type: "quota", enabled: true, limit: 100, resetPeriod: "monthly", unit: "message", overageAllowed: false },
    { key: "knowledge_enabled", type: "boolean", enabled: true, limit: 0, resetPeriod: "never", overageAllowed: false },
    { key: "max_bots", type: "count", enabled: true, limit: 1, resetPeriod: "never", overageAllowed: false },
    { key: "max_team_members", type: "count", enabled: true, limit: 1, resetPeriod: "never", overageAllowed: false }
  ];

  if (freePlan) {
    (freePlan as any).features = defaultFeatures;
    await freePlan.save();
    console.log("Updated Free plan features.");
  } else {
    console.log("Free plan not found");
  }
  
  const subs = await TenantSubscription.find({});
  for (const sub of subs) {
    if ((sub as any).planSnapshot) {
       (sub as any).planSnapshot.features = defaultFeatures;
    } else {
       (sub as any).planSnapshot = { name: "Free", features: defaultFeatures };
    }
    await sub.save();
    console.log(`Updated sub ${sub._id}`);
  }
  
  process.exit(0);
}

fix().catch(console.error);
