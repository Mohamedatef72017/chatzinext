import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectToDatabase } from "../src/lib/mongodb";
import { BillingPlan, TenantSubscription, UsageRecord } from "../src/lib/models";

dotenv.config();

async function run() {
  await connectToDatabase();
  console.log("Connected to DB");
  
  const freePlan = await BillingPlan.findOne({ name: "Free" });
  console.log("Free plan:", JSON.stringify(freePlan, null, 2));

  const subs = await TenantSubscription.find({});
  console.log("Subs:", subs.length);
  if (subs.length > 0) {
    console.log("First sub planSnapshot features:", JSON.stringify((subs[0] as any).planSnapshot?.features, null, 2));
  }

  process.exit(0);
}

run().catch(console.error);
