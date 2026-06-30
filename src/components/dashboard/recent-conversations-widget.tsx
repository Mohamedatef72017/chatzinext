import Link from "next/link";
import { MessageSquare, Clock, MessageCircle, Send, Globe, Users } from "lucide-react";

const getChannelConfig = (channel: string) => {
  const ch = (channel || "").toLowerCase();
  if (ch.includes("whatsapp")) {
    return { icon: MessageCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", gradient: "from-emerald-400 to-emerald-600" };
  }
  if (ch.includes("telegram")) {
    return { icon: Send, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", gradient: "from-blue-400 to-blue-600" };
  }
  if (ch.includes("messenger") || ch.includes("facebook")) {
    return { icon: Users, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10", gradient: "from-indigo-400 to-indigo-600" };
  }
  if (ch.includes("instagram")) {
    return { icon: Globe, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-500/10", gradient: "from-pink-400 to-pink-600" };
  }
  return { icon: Globe, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-500/10", gradient: "from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800" };
};

export function RecentConversationsWidget({ conversations, isAr }: { conversations: any[]; isAr: boolean }) {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
        <MessageSquare size={32} className="text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">{isAr ? "لا توجد محادثات حديثة" : "No recent conversations"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => {
        const date = new Date(conv.updatedAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        const config = getChannelConfig(conv.channel);
        const Icon = config.icon;

        return (
          <Link 
            key={conv.id} 
            href={`/dashboard/conversations?conversationId=${conv.id}`}
            className={`block rounded-xl bg-gradient-to-r ${config.gradient} p-[1.5px] hover:scale-[1.01] transition-transform duration-200`}
          >
            <div className="flex items-center justify-between p-3.5 rounded-[10px] bg-white dark:bg-[#12132A] h-full w-full">
              <div className="flex items-center gap-3 truncate">
                <div className={`h-10 w-10 flex-shrink-0 rounded-full ${config.bg} flex items-center justify-center ${config.color}`}>
                  <Icon size={18} />
                </div>
                <div className="truncate">
                  <p className="text-sm font-bold text-[#0B0C1E] dark:text-white truncate">
                    {conv.externalUserId}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-[200px] sm:max-w-[300px]">
                    {conv.lastMessage || (isAr ? "لا توجد رسائل" : "No messages")}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 flex-shrink-0 pl-2 rtl:pr-2 rtl:pl-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  conv.status === 'open' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {conv.status === 'open' ? (isAr ? 'مفتوحة' : 'Open') : (isAr ? 'مغلقة' : 'Closed')}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock size={10} />
                  <span>{date}</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
