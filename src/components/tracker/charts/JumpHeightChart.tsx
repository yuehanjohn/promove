"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import type { Measurement } from "@/lib/movement-types";

interface Props {
  measurements: Measurement[];
}

export function JumpHeightChart({ measurements }: Props) {
  if (measurements.length === 0) return null;

  const maxVal = Math.max(...measurements.map((m) => m.value));
  const avgVal = Math.round(
    measurements.reduce((a, m) => a + m.value, 0) / measurements.length
  );

  const data = measurements.map((m, i) => ({
    name: `#${i + 1}`,
    height: m.value,
    isMax: m.value === maxVal,
  }));

  return (
    <div className="rounded-xl border border-default-200 bg-default-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-default-600">Jump Heights</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--heroui-default-400))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--heroui-default-400))" unit="cm" />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--heroui-default-50))",
              border: "1px solid hsl(var(--heroui-default-200))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [`${value} cm`, "Height"]}
          />
          <ReferenceLine
            y={avgVal}
            stroke="hsl(var(--heroui-primary))"
            strokeDasharray="5 5"
            label={{
              value: `Avg: ${avgVal}cm`,
              position: "right",
              fontSize: 10,
              fill: "hsl(var(--heroui-primary))",
            }}
          />
          <Bar dataKey="height" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.isMax
                    ? "hsl(var(--heroui-primary))"
                    : "hsl(var(--heroui-primary) / 0.3)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
