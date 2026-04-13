"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { Session } from "@/lib/movement-types";
import { calcStats } from "@/lib/jump-calculator";

interface Props {
  sessions: Session[];
}

export function ProgressChart({ sessions }: Props) {
  if (sessions.length < 2) return null;

  // Order from oldest to newest
  const sorted = [...sessions].sort((a, b) => a.createdAt - b.createdAt);

  const data = sorted.map((s) => {
    const stats = calcStats(s.measurements.map((m) => m.value));
    const date = new Date(s.createdAt);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      best: stats.max,
      avg: stats.avg,
    };
  });

  return (
    <div className="rounded-xl border border-default-200 bg-default-50 p-4">
      <h3 className="mb-1 text-sm font-semibold text-default-600">Progress Over Time</h3>
      <p className="mb-3 text-[10px] text-default-400">Best & average per session</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <defs>
            <linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--heroui-primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--heroui-primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--heroui-default-400))" />
          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--heroui-default-400))" unit="cm" />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--heroui-default-50))",
              border: "1px solid hsl(var(--heroui-default-200))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => [
              `${value} cm`,
              name === "best" ? "Best" : "Average",
            ]}
          />
          <Area
            type="monotone"
            dataKey="best"
            stroke="hsl(var(--heroui-primary))"
            fill="url(#colorBest)"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(var(--heroui-primary))" }}
          />
          <Area
            type="monotone"
            dataKey="avg"
            stroke="#8b5cf6"
            fill="url(#colorAvg)"
            strokeWidth={1.5}
            dot={{ r: 2, fill: "#8b5cf6" }}
            strokeDasharray="4 4"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-default-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" /> Best
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-500" /> Average
        </span>
      </div>
    </div>
  );
}
