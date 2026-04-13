"use client";

import { useMovementStore } from "@/stores/movement-store";
import { MOVEMENT_TYPES } from "@/lib/movement-types";
import { calcStats, detectJump } from "@/lib/jump-calculator";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { JumpHeightChart } from "@/components/tracker/charts/JumpHeightChart";
import { AccelerationChart } from "@/components/tracker/charts/AccelerationChart";
import { MetricsGrid } from "@/components/tracker/charts/MetricsGrid";
import { VelocityComparisonChart } from "@/components/tracker/charts/VelocityComparisonChart";

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const getSession = useMovementStore((s) => s.getSession);
  const deleteSession = useMovementStore((s) => s.deleteSession);
  const deleteMeasurement = useMovementStore((s) => s.deleteMeasurement);
  const updateSessionNotes = useMovementStore((s) => s.updateSessionNotes);

  const session = getSession(params.id as string);
  const [notes, setNotes] = useState(session?.notes ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedJump, setExpandedJump] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 text-center">
        <p className="text-4xl">&#x1f50d;</p>
        <p className="mt-2 font-medium text-default-600">Session not found</p>
        <button
          onClick={() => router.push("/tracker/history")}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to History
        </button>
      </div>
    );
  }

  const typeInfo = MOVEMENT_TYPES[session.movementType];
  const values = session.measurements.map((m) => m.value);
  const stats = calcStats(values);
  const date = new Date(session.createdAt);
  const hasMetrics = session.measurements.some((m) => m.metrics);
  const hasSensorData = session.measurements.some((m) => m.sensorData && m.sensorData.length > 0);

  // Compute aggregate metrics
  const metricsJumps = session.measurements.filter((m) => m.metrics);
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
          metricsJumps.reduce((a, m) => a + (m.metrics?.flightTimeMs ?? 0), 0) /
            metricsJumps.length
        )
      : null;

  const handleDeleteSession = () => {
    deleteSession(session.id);
    router.push("/tracker/history");
  };

  const handleSaveNotes = () => {
    updateSessionNotes(session.id, notes);
  };

  const maxValue = stats.max;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-8">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => router.push("/tracker/history")}
          className="flex items-center text-sm text-default-500"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          History
        </button>
      </div>

      {/* Session Header */}
      <div className="mb-6 rounded-2xl border border-default-200 bg-default-50 p-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
            {typeInfo.icon}
          </span>
          <div>
            <h1 className="text-lg font-bold">{typeInfo.label}</h1>
            <p className="text-xs text-default-400">
              {date.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              at{" "}
              {date.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-xl font-bold">{stats.max}</p>
            <p className="text-[10px] text-default-400">Best (cm)</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{stats.avg}</p>
            <p className="text-[10px] text-default-400">Avg (cm)</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{stats.count}</p>
            <p className="text-[10px] text-default-400">Jumps</p>
          </div>
        </div>

        {/* Extended stats row if sensor data exists */}
        {hasMetrics && (
          <div className="mt-2 grid grid-cols-3 gap-2 border-t border-default-200 pt-2">
            <div className="text-center">
              <p className="text-xl font-bold">{avgVelocity}</p>
              <p className="text-[10px] text-default-400">Avg Velocity (m/s)</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{avgFlight}</p>
              <p className="text-[10px] text-default-400">Avg Flight (ms)</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{stats.min}</p>
              <p className="text-[10px] text-default-400">Min (cm)</p>
            </div>
          </div>
        )}
      </div>

      {/* Jump Height Chart */}
      {values.length > 1 && (
        <section className="mb-4">
          <JumpHeightChart measurements={session.measurements} />
        </section>
      )}

      {/* Performance Radar */}
      {hasMetrics && (
        <section className="mb-4">
          <VelocityComparisonChart measurements={session.measurements} />
        </section>
      )}

      {/* Individual jumps with expandable details */}
      <section className="mb-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-default-500">
          All Jumps
        </h2>
        <div className="space-y-2">
          {session.measurements.map((m, i) => {
            const isExpanded = expandedJump === m.id;
            // Detect jump phases for reference lines on chart
            let takeoffTimeMs: number | undefined;
            let landingTimeMs: number | undefined;
            if (m.sensorData && m.sensorData.length > 0) {
              const detection = detectJump(m.sensorData);
              if (detection) {
                takeoffTimeMs = m.sensorData[detection.takeoffIndex]?.t;
                landingTimeMs = m.sensorData[detection.landingIndex]?.t;
              }
            }

            return (
              <div key={m.id}>
                <div
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-default-200 bg-default-50 p-3 transition-colors active:bg-default-100"
                  onClick={() => setExpandedJump(isExpanded ? null : m.id)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-default-200 text-xs font-bold">
                    #{i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {m.value} cm
                      {m.value === maxValue && (
                        <span className="ml-1 text-xs text-primary">Best</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-default-400">
                      <span className="capitalize">{m.method}</span>
                      {m.metrics && (
                        <>
                          <span>· {Math.round(m.metrics.flightTimeMs)}ms flight</span>
                          <span>· {m.metrics.takeoffVelocity} m/s</span>
                          <span className="capitalize">· {m.metrics.jumpDirection}</span>
                        </>
                      )}
                      {!m.metrics && m.flightTimeMs && (
                        <span>· {Math.round(m.flightTimeMs)}ms flight</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {(m.metrics || m.sensorData) && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`text-default-300 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMeasurement(session.id, m.id);
                      }}
                      className="p-2 text-default-300 active:text-red-500"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded detail view */}
                {isExpanded && (
                  <div className="mt-1 space-y-3 rounded-xl border border-default-200 bg-default-50/50 p-3">
                    {/* Acceleration chart */}
                    {m.sensorData && m.sensorData.length > 0 && (
                      <AccelerationChart
                        sensorData={m.sensorData}
                        takeoffTimeMs={takeoffTimeMs}
                        landingTimeMs={landingTimeMs}
                      />
                    )}

                    {/* Full metrics grid */}
                    {m.metrics && <MetricsGrid metrics={m.metrics} />}

                    {/* Sensor data info */}
                    {m.sensorData && (
                      <p className="text-center text-[10px] text-default-400">
                        {m.sensorData.length} sensor readings captured over{" "}
                        {Math.round(m.sensorData[m.sensorData.length - 1]?.t ?? 0)}ms
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Notes */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-default-500">
          Notes
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleSaveNotes}
          placeholder="Add notes about this session..."
          className="w-full resize-none rounded-xl border border-default-200 bg-default-50 p-3 text-sm outline-none focus:border-primary"
          rows={3}
        />
      </section>

      {/* Danger Zone */}
      <section>
        {showDeleteConfirm ? (
          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-950">
            <p className="mb-3 text-sm font-medium">Delete this session? This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-default-300 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full rounded-xl py-3 text-sm text-red-500 active:bg-red-50"
          >
            Delete Session
          </button>
        )}
      </section>
    </div>
  );
}
