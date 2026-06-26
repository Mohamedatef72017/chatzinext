import { Tenant, User } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";

export const TENANT_USER_LIMITS = {
  admin: 2,
  manager: 2,
  agent: 4,
  viewer: 25
} as const;

export async function getAdminUsersData(tenantId: string, page: number = 1, limit: number = 20) {
  await connectToDatabase();
  
  const skip = (page - 1) * limit;

  const [tenant, users, totalUsers, roleCounts] = await Promise.all([
    Tenant.findById(tenantId).lean(),
    User.find({ tenantId }).sort({ role: 1, createdAt: 1 }).skip(skip).limit(limit).lean(),
    User.countDocuments({ tenantId }),
    User.aggregate([
      { $match: { tenantId } },
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ])
  ]);

  const usage: Record<string, number> = { admin: 0, manager: 0, agent: 0, viewer: 0 };
  roleCounts.forEach((r: any) => {
    if (usage[r._id] !== undefined) usage[r._id] = r.count;
  });

  return {
    ownerId: tenant?.ownerId?.toString() || "",
    limits: {
      admin: TENANT_USER_LIMITS.admin,
      manager: TENANT_USER_LIMITS.manager,
      agent: TENANT_USER_LIMITS.agent,
      viewer: TENANT_USER_LIMITS.viewer
    },
    usage,
    users: users.map((user: any) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      ownerId: user.ownerId?.toString() || tenant?.ownerId?.toString() || "",
      isActive: user.isActive !== false,
      createdAt: user.createdAt?.toISOString() || ""
    })),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit) || 1,
      totalUsers
    }
  };
}
