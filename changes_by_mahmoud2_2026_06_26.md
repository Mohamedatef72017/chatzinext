# Changes by Mahmoud2 - 2026-06-26

This document records all the modifications and feature implementations performed on the system.

## 1. User Roles & Permissions Enhancement
- **User Limits (`src/lib/user-admin.ts`)**: Adjusted `TENANT_USER_LIMITS` (manager: 2, agent: 4).
- **User Schema (`src/lib/models/user.ts`)**: Added `permissionMode` (role/custom) and `permissions` array fields to support granular access control.

## 2. Dashboard Sidebar Navigation & Permissions
- **Sidebar Component (`src/components/dashboard/sidebar.tsx`)**: Refactored the sidebar to dynamically hide/show navigation links based on the user's specific permissions (e.g., `inboxRead`, `ticketsRead`, `contactsRead`, `usersManage`, etc.).
- **Sidebar Counts API (`src/app/api/dashboard/sidebar-counts/route.ts`)**: Applied granular permission checks to return accurate counts (Conversations, Tickets, Leads) only if the user has read access, and scoped the counts to assigned items if restricted.

## 3. Data Scoping for Assigned Agents
- **Dashboard Data (`src/lib/dashboard-data.ts`)**: Implemented logic to restrict ticket and conversation queries (`getTicketsPage`, `getTickets`, `getTicketDetail`, `getConversationDetail`) specifically to agents if they are only allowed to view items assigned to them. Added methods like `getAssignedConversationIds` and `applyAssignedTicketScope`.

## 4. AI Provider & Models Integration
- **Dynamic Model Fetching (`src/app/admin/actions.ts` & `src/components/admin/ai-providers-admin.tsx`)**: Replaced the hardcoded AI models list in the Super Admin dashboard. Added a server action `fetchAvailableModels` that connects directly to AI providers (OpenAI, Anthropic, Gemini, Groq, etc.) via their API keys to fetch real-time available models.
- **AI Router Resiliency (`src/lib/ai-router.ts`)**: Improved the AI router to handle optional `temperature` arguments. Added an automatic retry mechanism (`isTemperatureUnsupportedError`) that falls back to removing the `temperature` parameter if the chosen AI model throws an unsupported parameter error.

## 5. Knowledge Base Refactoring
- **Knowledge Service (`src/lib/knowledge.ts`)**: Removed the hardcoded `defaultCategories` array and `ensureDefaultKnowledgeTaxonomy` to allow completely dynamic taxonomy creation by tenants.

## 6. Super Admin Dashboard (Earlier Updates)
- **Tenant Profile (`src/app/admin/tenants/[id]/page.tsx`)**: Created a dedicated profile page for each tenant showing their subscription details, statistics, and full employee list with status and verification badges.
- **Admin Analytics (`src/lib/admin-analytics.ts`)**: Updated the global tenant fetching logic with search, pagination, and a global activity line chart.
- **Main Dashboard UI (`src/components/admin/main-dashboard.tsx`)**: Completely rewrote the Admin Dashboard to include a live search bar, pagination controls, active/inactive toggles for users, and deletion functionality.
