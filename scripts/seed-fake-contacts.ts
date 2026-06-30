import mongoose from "mongoose";
import { Contact } from "../src/lib/models/contact";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const TENANT_ID = "6a3ea9764bf166ddd39ebac7";
const NUM_CONTACTS = 120;

const firstNames = ["Ahmed", "Mohamed", "Mahmoud", "Ali", "Hassan", "Kareem", "Youssef", "Omar", "Tariq", "Ziad", "Sara", "Mona", "Nour", "Mariam", "Laila", "Hala", "Yasmin", "Salma", "Fatima", "Aisha"];
const lastNames = ["Ibrahim", "Hassan", "Ali", "Saleh", "Mostafa", "Saeed", "Tawfiq", "Fouad", "Kamal", "Zaki", "Nassar", "Fahmy", "Osman", "Radwan", "Khalil"];
const companies = ["TechCorp", "Global Media", "Nile Soft", "Cairo Innovations", "Alexandria Logistics", "Delta Systems", "Giza Dynamics", "Modern Solutions"];
const countries = ["EG", "SA", "AE", "KW", "JO", "LB", "QA"];

function randomElement(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  const uri = (process.env.MONGODB_URI || "").replace("ChatZi", "chatzi");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const contacts = [];
  for (let i = 1; i <= NUM_CONTACTS; i++) {
    const fName = randomElement(firstNames);
    const lName = randomElement(lastNames);
    const company = randomElement(companies);
    
    contacts.push({
      tenantId: TENANT_ID,
      name: `${fName} ${lName} ${i}`,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.com`,
      phone: `+201${Math.floor(Math.random() * 900000000 + 100000000)}`, // fake egyptian numbers
      company: company,
      country: randomElement(countries),
      lifecycleStage: Math.random() > 0.5 ? "lead" : "customer",
      totalOrders: Math.floor(Math.random() * 100),
      customerValue: Math.floor(Math.random() * 15000),
      tags: ["test_seed", `tag_${i % 7}`, Math.random() > 0.5 ? "vip" : "regular"],
      notes: `This is a test contact with lots of fake data generated on ${new Date().toISOString()}. Extremely useful for testing the UI, pagination, filters, and performance.`,
      lastSeenAt: new Date(Date.now() - Math.random() * 10000000000),
      customAttributes: {
        isTestUser: true,
        testSeedTimestamp: Date.now(),
        accountManager: randomElement(firstNames),
        lastNpsScore: Math.floor(Math.random() * 10) + 1,
      }
    });
  }

  await Contact.insertMany(contacts);
  console.log(`Successfully inserted ${NUM_CONTACTS} fake contacts for tenant ${TENANT_ID}.`);
  process.exit(0);
}

const args = process.argv.slice(2);
if (args[0] === "--delete") {
  const uri = (process.env.MONGODB_URI || "").replace("ChatZi", "chatzi");
  mongoose.connect(uri).then(async () => {
    const res = await Contact.deleteMany({ tenantId: TENANT_ID, tags: "test_seed" });
    console.log(`Deleted ${res.deletedCount} fake contacts.`);
    process.exit(0);
  });
} else {
  run().catch(console.error);
}
