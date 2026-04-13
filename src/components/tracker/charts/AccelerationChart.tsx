"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { SensorReading } from "@/lib/movement-types";
import { accelMagnitude } from "@/lib/jump-calculator";

interface Props {
  sensorData: SensorReading[];
  takeoffTimeMs?: number;
  landingTimeMs?: number;
}

export function AccelerationChart({ sensorData, takeoffTimeMs, landingTimeMs }: Props) {
  if (sensorData.length === 0) return null;

  // Downsample if too many points for smooth rendering
  const maxPoints = 200;
  const step = Math.max(1, Math.floor(sensorData.length / maxPoints));

  const data = sensorData
    .filter((_, i) => i % step === 0)
    .map((r) => ({
      t: Math.round(r.t),
      magnitude: Math.round(accelMagnitude(r) * 100) / 100,
      ax: Math.round(Math.abs(r.ax) * 100) / 100,
      ay: Math.round(Math.abs(r.ay) * 100) / 100,
      az: Math.round(Math.abs(r.az) * 100) / 100,
    }));

  return (
    <div className="rounded-xl border border-default-200 bg-default-50 p-4">
      <h3 className="mb-1 text-sm font-semibold text-default-600">Acceleration Profile</h3>
      <p className="mb-3 text-[10px] text-default-400">
        Sensor readings over time (m/s²)
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--heroui-default-200))" />
          <XAxis
            dataKey="t"
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--heroui-default-400))"
            label={{ value: "ms", position: "insideBottomRight", fontSize: 10, offset: -5 }}
          />
          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--heroui-default-400))" />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--heroui-default-50))",
              border: "1px solid hsl(var(--heroui-default-200))",
              borderRadius: 8,
              fontSize: 11,
            }}
            labelFormatter={(v) => `${v}ms`}
          />
          <Line
            type="monotone"
            dataKey="magnitude"
            stroke="hsl(var(--heroui-primary))"
            strokeWidth={2}
            dot={false}
            name="Total"
          />
          <Line
            type="monotone"
            dataKey="ax"
            stroke="#f97316"
            strokeWidth={1}
            dot={false}
            name="X-axis"
            strokeDasharray="3 3"
          />
          <Line
            type="monotone"
            dataKey="ay"
            stroke="#22c55e"
            strokeWidth={1}
            dot={false}
            name="Y-axis"
            strokeDasharray="3 3"
          />
          <Line
            type="monotone"
            dataKey="az"
            stroke="#8b5cf6"
            strokeWidth={1}
            dot={false}
            name="Z-axis"
            strokeDasharray="3 3"
          />
          {takeoffTimeMs != null && (
            <ReferenceLine
              x={Math.round(takeoffTimeMs)}
              stroke="#22c55e"
              strokeDasharray="5 5"
              label={{ value: "Takeoff", fontSize: 9, fill: "#22c55e" }}
            />
          )}
          {landingTimeMs != null && (
            <ReferenceLine
              x={Math.round(landingTimeMs)}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: "Landing", fontSize: 9, fill: "#ef4444" }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
