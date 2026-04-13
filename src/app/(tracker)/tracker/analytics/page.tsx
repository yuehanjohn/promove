"use client";

import { useState } from "react";
import { useMovementStore, useHydrated } from "@/stores/movement-store";
import { MOVEMENT_TYPES } from "@/lib/movement-types";
import type { MovementType, Session } from "@/lib/movement-types";
import { calcStats } from "@/lib/jump-calculator";
import { ProgressChart } from "@/components/tracker/charts/ProgressChart";
import { JumpHeightChart } from "@/components/tracker/charts/JumpHeightChart";
import { VelocityComparisonChart } from "@/components/tracker/charts/VelocityComparisonChart";
import Link from "next/link";

export default function AnalyticsPage() {
  const hasHydrated = useHydrated();
  const sessions = useMovementStore((s) => s.sessions);
  const [filter, setFilter] = useState<MovementType | "all">("all");

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <p className="text-default-400">Loading...</p>
      </div>
    );
  }

  const filtered: Session[] =
    filter === "all" ? sessions : sessions.filter((s) => s.movementType === filter);

  const allMeasurements = filtered.flatMap((s) => s.measurements);
  const allValues = allMeasurements.map((m) => m.value);
  const stats = calcStats(allValues);

  const metricsJumps = allMeasurements.filter((m) => m.metrics);
  const avgVelocity =
    metricsJumps.length > 0
      ? Math.round(
          (metricsJumps.reduce((a, m) => a + (m.metrics?.takeoffVelocity ?? 0), 0) /
            metricsJumps.length) *
            100
        ) / 100
      : null;
  const avgFlight =
    metricsJumps.length > 0
      ? Math.round(
          metricsJumps.reduce((a, m) => a + (m.metrics?.flightTimeMs ?? 0), 0) / metricsJumps.length
        )
      : null;
  const avgExplosiveness =
    metricsJumps.length > 0
      ? Math.round(
          (metricsJumps.reduce((a, m) => a + (m.metrics?.explosiveness ?? 0), 0) /
            metricsJumps.length) *
            100
        ) / 100
      : null;
  const avgLateral =
    metricsJumps.length > 0
      ? Math.round(
          (metricsJumps.reduce((a, m) => a + (m.metrics?.horizontalMovement ?? 0), 0) /
            metricsJumps.length) *
            100
        ) / 100
      : null;
  const avgImpact =
    metricsJumps.length > 0
      ? Math.round(
          (metricsJumps.reduce((a, m) => a + (m.metrics?.landingImpact ?? 0), 0) /
            metricsJumps.length) *
            100
        ) / 100
      : null;

  // Direction breakdown
  const directionCounts: Record<string, number> = {};
  for (const m of metricsJumps) {
    const dir = m.metrics?.jumpDirection ?? "neutral";
    directionCounts[dir] = (directionCounts[dir] ?? 0) + 1;
  }

  // Method breakdown
  const manualCount = allMeasurements.filter((m) => m.method === "manual").length;
  const sensorCount = allMeasurements.filter((m) => m.method === "sensor").length;

  // Session consistency - jumps per session
  const jumpsPerSession =
    filtered.length > 0 ? Math.round((allMeasurements.length / filtered.length) * 10) / 10 : 0;

  if (sessions.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 text-center">
        <h1 className="mb-2 text-2xl font-bold">Analytics</h1>
        <div className="mt-8 rounded-2xl border border-dashed border-default-300 p-8">
          <p className="text-4xl">&#x1f4ca;</p>
          <p className="mt-2 font-medium text-default-600">No data yet</p>
          <p className="mt-1 text-sm text-default-400">Record some jumps to see your analytics</p>
          <Link
            href="/tracker/record"
            className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Start Recording
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-8">
      <h1 className="mb-1 text-2xl font-bold">Analytics</h1>
      <p className="mb-4 text-sm text-default-500">
        {allMeasurements.length} jumps across {filtered.length} sessions
      </p>

      {/* Filter chips */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
        {Object.values(MOVEMENT_TYPES).map((type) => (
          <FilterChip
            key={type.id}
            label={type.shortLabel}
            icon={type.icon}
            active={filter === type.id}
            onClick={() => setFilter(type.id)}
          />
        ))}
      </div>

      {/* Overview Stats Grid */}
      <section className="mb-4">
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="Best" value={`${stats.max}`} unit="cm" highlight />
          <StatBox label="Average" value={`${stats.avg}`} unit="cm" />
          <StatBox label="Min" value={`${stats.min}`} unit="cm" />
          <StatBox label="Total Jumps" value={`${stats.count}`} />
          <StatBox label="Sessions" value={`${filtered.length}`} />
          <StatBox label="Jumps/Session" value={`${jumpsPerSession}`} />
        </div>
      </section>

      {/* Sensor metrics stats */}
      {metricsJumps.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-default-500">
            Sensor Metrics
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Avg Velocity" value={`${avgVelocity}`} unit="m/s" />
            <StatBox label="Avg Flight" value={`${avgFlight}`} unit="ms" />
            <StatBox label="Avg Power" value={`${avgExplosiveness}`} />
            <StatBox label="Avg Lateral" value={`${avgLateral}`} unit="m/s²" />
            <StatBox label="Avg Impact" value={`${avgImpact}`} unit="m/s²" />
            <StatBox
              label="Sensor Jumps"
              value={`${Math.round((sensorCount / allMeasurements.length) * 100)}`}
              unit="%"
            />
          </div>
        </section>
      )}

      {/* Progress Chart */}
      {filtered.length >= 2 && (
        <section className="mb-4">
          <ProgressChart sessions={filtered} />
        </section>
      )}

      {/* All-jumps height distribution */}
      {allMeasurements.length > 1 && (
        <section className="mb-4">
          <JumpHeightChart measurements={allMeasurements.slice(0, 30)} />
        </section>
      )}

      {/* Performance Profile */}
      {metricsJumps.length > 0 && (
        <section className="mb-4">
          <VelocityComparisonChart measurements={allMeasurements} />
        </section>
      )}

      {/* Direction Breakdown */}
      {Object.keys(directionCounts).length > 0 && (
        <section className="mb-4">
          <div className="rounded-xl border border-default-200 bg-default-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-default-600">Jump Directions</h3>
            <div className="space-y-2">
              {Object.entries(directionCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([dir, count]) => {
                  const pct = Math.round((count / metricsJumps.length) * 100);
                  return (
                    <div key={dir} className="flex items-center gap-3">
                      <span className="w-20 text-xs font-medium capitalize text-default-600">
                        {dir}
                      </span>
                      <div className="flex-1">
                        <div className="h-5 overflow-hidden rounded-full bg-default-200">
                          <div
                            className="flex h-full items-center rounded-full bg-primary/60 px-2 text-[10px] font-bold text-primary-foreground transition-all"
                            style={{ width: `${Math.max(pct, 8)}%` }}
                          >
                            {pct}%
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-default-400">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* Recording method breakdown */}
      <section className="mb-4">
        <div className="rounded-xl border border-default-200 bg-default-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-default-600">Recording Methods</h3>
          <div className="flex gap-4">
            <div className="flex-1 text-center">
              <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg font-bold text-primary">{manualCount}</span>
              </div>
              <p className="text-xs text-default-500">Manual</p>
            </div>
            <div className="flex-1 text-center">
              <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
                <span className="text-lg font-bold text-violet-500">{sensorCount}</span>
              </div>
              <p className="text-xs text-default-500">Sensor</p>
            </div>
          </div>
        </div>
      </section>

      {/* Movement type breakdown */}
      {filter === "all" && (
        <section className="mb-4">
          <div className="rounded-xl border border-default-200 bg-default-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-default-600">By Movement Type</h3>
            <div className="space-y-2">
              {Object.values(MOVEMENT_TYPES).map((type) => {
                const typeSessions = sessions.filter((s) => s.movementType === type.id);
                const typeJumps = typeSessions.flatMap((s) => s.measurements);
                if (typeJumps.length === 0) return null;
                const typeStats = calcStats(typeJumps.map((m) => m.value));
                return (
                  <div
                    key={type.id}
                    className="flex items-center gap-3 rounded-lg bg-default-100 p-2.5"
                  >
                    <span className="text-lg">{type.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold">{type.shortLabel}</p>
                      <p className="text-[10px] text-default-400">
                        {typeJumps.length} jumps · {typeSessions.length} sessions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{typeStats.max} cm</p>
                      <p className="text-[10px] text-default-400">best</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-default-100 text-default-600 active:bg-default-200"
      }`}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

function StatBox({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 text-center ${
        highlight ? "border-primary/30 bg-primary/5" : "border-default-200 bg-default-50"
      }`}
    >
      <p className={`text-sm font-bold ${highlight ? "text-primary" : ""}`}>
        {value}
        {unit && <span className="ml-0.5 text-[10px] font-normal text-default-400">{unit}</span>}
      </p>
      <p className="text-[10px] text-default-400">{label}</p>
    </div>
  );
}
