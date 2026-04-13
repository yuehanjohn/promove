"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from "recharts";
import type { Measurement } from "@/lib/movement-types";

interface Props {
  measurements: Measurement[];
}

export function VelocityComparisonChart({ measurements }: Props) {
  const withMetrics = measurements.filter((m) => m.metrics);
  if (withMetrics.length === 0) return null;

  // Compute averages for radar chart
  const avgHeight =
    withMetrics.reduce((a, m) => a + m.value, 0) / withMetrics.length;
  const avgVelocity =
    withMetrics.reduce((a, m) => a + (m.metrics?.takeoffVelocity ?? 0), 0) /
    withMetrics.length;
  const avgFlight =
    withMetrics.reduce((a, m) => a + (m.metrics?.flightTimeMs ?? 0), 0) /
    withMetrics.length;
  const avgExplosiveness =
    withMetrics.reduce((a, m) => a + (m.metrics?.explosiveness ?? 0), 0) /
    withMetrics.length;
  const avgLateral =
    withMetrics.reduce((a, m) => a + (m.metrics?.horizontalMovement ?? 0), 0) /
    withMetrics.length;
  const avgImpact =
    withMetrics.reduce((a, m) => a + (m.metrics?.landingImpact ?? 0), 0) /
    withMetrics.length;

  // Normalize all values to 0-100 scale for the radar
  const maxHeight = Math.max(...withMetrics.map((m) => m.value));
  const maxVelocity = Math.max(...withMetrics.map((m) => m.metrics?.takeoffVelocity ?? 0));
  const maxFlight = Math.max(...withMetrics.map((m) => m.metrics?.flightTimeMs ?? 0));
  const maxExplosiveness = Math.max(...withMetrics.map((m) => m.metrics?.explosiveness ?? 0));
  const maxLateral = Math.max(...withMetrics.map((m) => m.metrics?.horizontalMovement ?? 0), 1);
  const maxImpact = Math.max(...withMetrics.map((m) => m.metrics?.landingImpact ?? 0));

  const data = [
    { metric: "Height", value: Math.round((avgHeight / maxHeight) * 100) || 0, raw: `${Math.round(avgHeight)}cm` },
    { metric: "Velocity", value: Math.round((avgVelocity / maxVelocity) * 100) || 0, raw: `${avgVelocity.toFixed(1)}m/s` },
    { metric: "Flight", value: Math.round((avgFlight / maxFlight) * 100) || 0, raw: `${Math.round(avgFlight)}ms` },
    { metric: "Power", value: Math.round((avgExplosiveness / maxExplosiveness) * 100) || 0, raw: `${avgExplosiveness.toFixed(1)}` },
    { metric: "Lateral", value: Math.round((avgLateral / maxLateral) * 100) || 0, raw: `${avgLateral.toFixed(1)}m/s²` },
    { metric: "Impact", value: Math.round((avgImpact / maxImpact) * 100) || 0, raw: `${avgImpact.toFixed(1)}m/s²` },
  ];

  return (
    <div className="rounded-xl border border-default-200 bg-default-50 p-4">
      <h3 className="mb-1 text-sm font-semibold text-default-600">Performance Profile</h3>
      <p className="mb-2 text-[10px] text-default-400">Average metrics normalized to session best</p>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="hsl(var(--heroui-default-200))" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 10, fill: "hsl(var(--heroui-default-500))" }}
          />
          <Radar
            dataKey="value"
            stroke="hsl(var(--heroui-primary))"
            fill="hsl(var(--heroui-primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--heroui-default-50))",
              border: "1px solid hsl(var(--heroui-default-200))",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(_: unknown, __: unknown, props: { payload?: { raw?: string } }) => {
              return [props.payload?.raw ?? "", "Avg"];
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
