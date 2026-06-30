"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = {
  whatsapp: "#25D366",
  messenger: "#0099FF",
  facebook: "#0099FF",
  telegram: "#2CA5E0",
  instagram: "#E1306C",
  web: "#6366f1",
  mock_provider: "#94a3b8",
  unknown: "#94a3b8"
};

const LABELS = {
  whatsapp: "WhatsApp",
  messenger: "Messenger",
  facebook: "Facebook",
  telegram: "Telegram",
  instagram: "Instagram",
  web: "Web",
  mock_provider: "Mock (Seed)",
  unknown: "Unknown"
};

export function ChannelPieChart({ data, isAr }: { data: any[]; isAr: boolean }) {
  if (!data || data.length === 0) return <div className="p-8 text-center text-slate-500">{isAr ? "لا تتوفر بيانات كافية" : "No sufficient data"}</div>;

  // Format data for display
  const displayData = data.map(item => ({
    name: LABELS[item.name as keyof typeof LABELS] || item.name,
    value: item.value,
    color: COLORS[item.name as keyof typeof COLORS] || COLORS.unknown
  }));

  return (
    <div className="h-[200px] w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', backgroundColor: '#ffffff' }}
            labelStyle={{ color: '#0B0C1E', fontWeight: 'bold' }}
            itemStyle={{ color: '#0B0C1E', fontWeight: 700 }}
            formatter={(value: any) => [value, isAr ? "رسالة" : "Messages"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
