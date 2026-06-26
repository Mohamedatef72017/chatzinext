import { connectToDatabase } from "@/lib/mongodb";
import { Tenant, User, Bot, Conversation, Message, TenantSubscription } from "@/lib/models";

export type GlobalStats = {
  totalTenants: number;
  totalUsers: number;
  totalBots: number;
  totalConversations: number;
  totalMessages: number;
};

export type EmployeeData = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
};

export type TenantWithEmployees = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  employees: EmployeeData[];
  agentCount: number;
  subscriptionStatus?: string;
  subscriptionEndsAt?: string | null;
};

export async function getGlobalAnalytics(): Promise<GlobalStats> {
  await connectToDatabase();

  const [
    totalTenants, totalUsers, totalBots, totalConversations, totalMessages
  ] = await Promise.all([
    Tenant.countDocuments(),
    User.countDocuments(),
    Bot.countDocuments(),
    Conversation.countDocuments(),
    Message.countDocuments(),
  ]);

  return {
    totalTenants,
    totalUsers,
    totalBots,
    totalConversations,
    totalMessages
  };
}

export async function getGlobalActivityChart() {
  await connectToDatabase();
  
  const chartData = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    
    const count = await Message.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });
    
    chartData.push({
      date: start.toLocaleDateString('en-US', { weekday: 'short' }),
      messages: count
    });
  }

  return chartData;
}

export async function getTenantsWithEmployees(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<{ data: TenantWithEmployees[]; total: number; totalPages: number }> {
  await connectToDatabase();

  const skip = (page - 1) * limit;
  let tenantFilter: any = {};
  let matchingTenantIds: string[] | null = null;

  // Search logic
  if (search) {
    const regex = new RegExp(search, 'i');
    
    // Find users matching the search query
    const matchingUsers = await User.find({
      $or: [{ name: regex }, { email: regex }]
    }, { tenantId: 1 }).lean();
    
    matchingTenantIds = matchingUsers.map(u => u.tenantId?.toString()).filter(Boolean);

    // Filter tenants by matching user OR matching tenant name/slug
    tenantFilter = {
      $or: [
        { name: regex },
        { slug: regex },
        { _id: { $in: matchingTenantIds } }
      ]
    };
  }

  const [tenants, total] = await Promise.all([
    Tenant.find(tenantFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Tenant.countDocuments(tenantFilter)
  ]);

  const tenantIds = tenants.map((t) => t._id);

  // Find all users belonging to these tenants
  const users = await User.find({ tenantId: { $in: tenantIds } }).lean();
  
  // Find subscriptions
  const subscriptions = await TenantSubscription.find({ tenantId: { $in: tenantIds } }).lean();

  const tenantsWithEmployees: TenantWithEmployees[] = tenants.map((tenant) => {
    const tenantUsers = users.filter((u) => u.tenantId?.toString() === tenant._id.toString());
    const tenantSub = subscriptions.find(s => s.tenantId?.toString() === tenant._id.toString());
    
    return {
      id: tenant._id.toString(),
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      isActive: tenant.isActive,
      employees: tenantUsers.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive ?? true,
        phone: u.phone || undefined,
        emailVerified: u.emailVerified ?? false,
        phoneVerified: u.phoneVerified ?? false,
      })),
      agentCount: tenantUsers.length,
      subscriptionStatus: tenantSub?.status || "active",
      subscriptionEndsAt: tenantSub?.currentPeriodEnd ? tenantSub.currentPeriodEnd.toISOString() : null,
    };
  });

  return {
    data: tenantsWithEmployees,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

export async function getTenantProfileData(tenantId: string) {
  await connectToDatabase();
  const tenant = await Tenant.findById(tenantId).lean();
  if (!tenant) return null;

  const [users, subscription, bots, conversations, messages] = await Promise.all([
    User.find({ tenantId }).lean(),
    TenantSubscription.findOne({ tenantId }).lean(),
    Bot.countDocuments({ tenantId }),
    Conversation.countDocuments({ tenantId }),
    Message.countDocuments({ tenantId })
  ]);

  return {
    id: tenant._id.toString(),
    name: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan,
    isActive: tenant.isActive,
    businessCategory: tenant.businessCategory,
    createdAt: tenant.createdAt?.toISOString(),
    subscription: subscription ? {
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
      stripeCustomerId: subscription.stripeCustomerId
    } : null,
    stats: {
      users: users.length,
      bots,
      conversations,
      messages
    },
    users: users.map(u => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive ?? true,
      phone: u.phone || undefined,
      emailVerified: u.emailVerified ?? false,
      phoneVerified: u.phoneVerified ?? false,
    }))
  };
}
