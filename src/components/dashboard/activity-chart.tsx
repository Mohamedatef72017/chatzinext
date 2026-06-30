"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export function ActivityChart({ data, isAr }: { data: any[]; isAr: boolean }) {
  if (!data || data.length === 0) return <div className="p-8 text-center text-slate-500">لا تتوفر بيانات كافية</div>;

  return (
    <div className="h-[300px] w-full mt-4" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#0B0C1E', fontSize: 12, fontWeight: 700 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#0B0C1E', fontSize: 12, fontWeight: 700 }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', backgroundColor: '#ffffff' }}
            labelStyle={{ color: '#0B0C1E', fontWeight: 'bold', marginBottom: '8px' }}
            itemStyle={{ color: '#0B0C1E', fontWeight: 700 }}
          />
          <Line 
            type="linear" 
            dataKey="messages" 
            name={isAr ? "الرسائل" : "Messages"}
            stroke="#0B0C1E" 
            strokeWidth={3}
            dot={{ stroke: '#0B0C1E', strokeWidth: 3, fill: '#fff', r: 5 }}
            activeDot={{ stroke: '#0B0C1E', strokeWidth: 3, fill: '#fff', r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
