"use client";

import type { JumpMetrics } from "@/lib/movement-types";

interface Props {
  metrics: JumpMetrics;
}

const directionArrows: Record<string, string> = {
  neutral: "O",
  forward: "↑",
  backward: "↓",
  left: "←",
  right: "→",
};

export function MetricsGrid({ metrics }: Props) {
  const items = [
    { label: "Flight Time", value: `${Math.round(metrics.flightTimeMs)}`, unit: "ms" },
    { label: "Takeoff Velocity", value: `${metrics.takeoffVelocity}`, unit: "m/s" },
    { label: "Peak G-Force", value: `${metrics.peakAcceleration}`, unit: "m/s²" },
    { label: "Landing Impact", value: `${metrics.landingImpact}`, unit: "m/s²" },
    { label: "Rise Time", value: `${metrics.riseTimeMs}`, unit: "ms" },
    { label: "Fall Time", value: `${metrics.fallTimeMs}`, unit: "ms" },
    {
      label: "Lateral Movement",
      value: `${metrics.horizontalMovement}`,
      unit: "m/s²",
    },
    {
      label: "Direction",
      value: `${directionArrows[metrics.jumpDirection] ?? "O"} ${metrics.jumpDirection}`,
      unit: "",
    },
    { label: "Loading Force", value: `${metrics.loadingForce}`, unit: "m/s²" },
    { label: "Explosiveness", value: `${metrics.explosiveness}`, unit: "m/s²" },
  ];

  return (
    <div className="rounded-xl border border-default-200 bg-default-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-default-600">Full Metrics</h3>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg bg-default-100 p-2.5">
            <p className="text-[10px] text-default-400">{item.label}</p>
            <p className="text-sm font-bold">
              {item.value}
              {item.unit && (
                <span className="ml-0.5 text-[10px] font-normal text-default-400">
                  {item.unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
