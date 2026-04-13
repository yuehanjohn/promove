"use client";

import { useMovementStore, useHydrated } from "@/stores/movement-store";
import { MOVEMENT_TYPES } from "@/lib/movement-types";
import type { MovementType } from "@/lib/movement-types";
import { calcStats } from "@/lib/jump-calculator";
import Link from "next/link";
import { ProgressChart } from "@/components/tracker/charts/ProgressChart";

export default function TrackerDashboard() {
  const hasHydrated = useHydrated();
  const sessions = useMovementStore((s) => s.sessions);
  const getTotalJumps = useMovementStore((s) => s.getTotalJumps);
  const getAllPersonalBests = useMovementStore((s) => s.getAllPersonalBests);
  const getRecentSessions = useMovementStore((s) => s.getRecentSessions);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <p className="text-default-400">Loading...</p>
      </div>
    );
  }

  const totalJumps = getTotalJumps();
  const personalBests = getAllPersonalBests();
  const recentSessions = getRecentSessions(5);
  const totalSessions = sessions.length;

  // Get all measurement values for overall stats
  const allValues = sessions.flatMap((s) => s.measurements.map((m) => m.value));
  const overallStats = calcStats(allValues);

  // Compute velocity and flight metrics across all sessions
  const allMetricMeasurements = sessions.flatMap((s) => s.measurements.filter((m) => m.metrics));
  const avgVelocity =
    allMetricMeasurements.length > 0
      ? Math.round(
          (allMetricMeasurements.reduce((a, m) => a + (m.metrics?.takeoffVelocity ?? 0), 0) /
            allMetricMeasurements.length) *
            100
        ) / 100
      : null;
  const bestFlight =
    allMetricMeasurements.length > 0
      ? Math.round(Math.max(...allMetricMeasurements.map((m) => m.metrics?.flightTimeMs ?? 0)))
      : null;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ProMove</h1>
        <p className="text-sm text-default-500">Volleyball Movement Tracker</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-3 grid grid-cols-3 gap-3">
        <StatCard label="Sessions" value={totalSessions} />
        <StatCard label="Total Jumps" value={totalJumps} />
        <StatCard
          label="Best Jump"
          value={overallStats.max > 0 ? `${overallStats.max}` : "\u2014"}
          suffix={overallStats.max > 0 ? "cm" : ""}
        />
      </div>

      {/* Extended stats row */}
      {(avgVelocity !== null || overallStats.avg > 0) && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard
            label="Avg Height"
            value={overallStats.avg > 0 ? `${overallStats.avg}` : "\u2014"}
            suffix={overallStats.avg > 0 ? "cm" : ""}
          />
          <StatCard
            label="Avg Velocity"
            value={avgVelocity !== null ? `${avgVelocity}` : "\u2014"}
            suffix={avgVelocity !== null ? "m/s" : ""}
          />
          <StatCard
            label="Best Flight"
            value={bestFlight !== null ? `${bestFlight}` : "\u2014"}
            suffix={bestFlight !== null ? "ms" : ""}
          />
        </div>
      )}

      {/* Progress Chart */}
      {sessions.length >= 2 && (
        <section className="mb-6">
          <ProgressChart sessions={sessions} />
        </section>
      )}

      {/* Quick Record Button */}
      <Link
        href="/tracker/record"
        className="mb-6 flex items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-transform active:scale-[0.98]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl">
          +
        </span>
        Start New Session
      </Link>

      {/* Personal Bests */}
      {Object.keys(personalBests).length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-default-500">
            Personal Bests
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(personalBests).map(([type, value]) => (
              <div
                key={type}
                className="flex items-center gap-3 rounded-xl border border-default-200 bg-default-50 p-3"
              >
                <span className="text-xl">{MOVEMENT_TYPES[type as MovementType]?.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-default-500">
                    {MOVEMENT_TYPES[type as MovementType]?.shortLabel}
                  </p>
                  <p className="text-lg font-bold">{value} cm</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Sessions */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-default-500">
            Recent Sessions
          </h2>
          {sessions.length > 0 && (
            <Link href="/tracker/history" className="text-xs font-medium text-primary">
              View all
            </Link>
          )}
        </div>

        {recentSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-default-300 p-8 text-center">
            <p className="text-4xl">🏐</p>
            <p className="mt-2 font-medium text-default-600">No sessions yet</p>
            <p className="mt-1 text-sm text-default-400">
              Start your first recording session to track your progress
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => {
              const typeInfo = MOVEMENT_TYPES[session.movementType];
              const stats = calcStats(session.measurements.map((m) => m.value));
              return (
                <Link
                  key={session.id}
                  href={`/tracker/session/${session.id}`}
                  className="flex items-center gap-3 rounded-xl border border-default-200 bg-default-50 p-3 transition-colors active:bg-default-100"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">
                    {typeInfo?.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{typeInfo?.shortLabel}</p>
                    <p className="text-xs text-default-400">
                      {new Date(session.createdAt).toLocaleDateString()} ·{" "}
                      {session.measurements.length} jump
                      {session.measurements.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{stats.max}</p>
                    <p className="text-xs text-default-400">cm best</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Movement Type Quick Access */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-default-500">
          Movement Types
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(MOVEMENT_TYPES).map((type) => (
            <Link
              key={type.id}
              href={`/tracker/record?type=${type.id}`}
              className="flex flex-col items-center gap-1 rounded-xl border border-default-200 bg-default-50 p-3 text-center transition-colors active:bg-default-100"
            >
              <span className="text-2xl">{type.icon}</span>
              <span className="text-xs font-medium">{type.shortLabel}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-default-200 bg-default-50 p-3 text-center">
      <p className="text-2xl font-bold">
        {value}
        {suffix && <span className="text-sm font-normal text-default-400">{suffix}</span>}
      </p>
      <p className="text-xs text-default-500">{label}</p>
    </div>
  );
}
