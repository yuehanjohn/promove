"use client";

import { useState } from "react";
import { useMovementStore } from "@/stores/movement-store";
import { MOVEMENT_TYPES } from "@/lib/movement-types";
import type { MovementType } from "@/lib/movement-types";
import { calcStats } from "@/lib/jump-calculator";
import Link from "next/link";

export default function HistoryPage() {
  const sessions = useMovementStore((s) => s.sessions);
  const [filter, setFilter] = useState<MovementType | "all">("all");

  const filtered = filter === "all" ? sessions : sessions.filter((s) => s.movementType === filter);

  const allValues = filtered.flatMap((s) => s.measurements.map((m) => m.value));
  const stats = calcStats(allValues);

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-1 text-2xl font-bold">History</h1>
      <p className="mb-4 text-sm text-default-500">
        {filtered.length} session{filtered.length !== 1 ? "s" : ""}
        {filter !== "all" && ` · ${MOVEMENT_TYPES[filter].shortLabel}`}
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

      {/* Summary stats */}
      {filtered.length > 0 && (
        <div className="mb-4 grid grid-cols-4 gap-2">
          <MiniStat label="Sessions" value={filtered.length} />
          <MiniStat label="Jumps" value={stats.count} />
          <MiniStat label="Best" value={`${stats.max}`} unit="cm" />
          <MiniStat label="Avg" value={`${stats.avg}`} unit="cm" />
        </div>
      )}

      {/* Session list */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-default-300 p-8 text-center">
          <p className="text-4xl">🏐</p>
          <p className="mt-2 font-medium text-default-600">
            {filter === "all" ? "No sessions yet" : "No sessions for this type"}
          </p>
          <Link
            href="/tracker/record"
            className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Start Recording
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((session) => {
            const typeInfo = MOVEMENT_TYPES[session.movementType];
            const sessionStats = calcStats(session.measurements.map((m) => m.value));
            const date = new Date(session.createdAt);

            return (
              <Link
                key={session.id}
                href={`/tracker/session/${session.id}`}
                className="flex items-center gap-3 rounded-xl border border-default-200 bg-default-50 p-4 transition-colors active:bg-default-100"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl">
                  {typeInfo?.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{typeInfo?.label}</p>
                  <p className="text-xs text-default-400">
                    {date.toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at{" "}
                    {date.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-default-400">
                    {session.measurements.length} jump
                    {session.measurements.length !== 1 ? "s" : ""} · avg {sessionStats.avg} cm
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{sessionStats.max}</p>
                  <p className="text-xs text-default-400">cm best</p>
                </div>
              </Link>
            );
          })}
        </div>
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

function MiniStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="rounded-lg border border-default-200 bg-default-50 p-2 text-center">
      <p className="text-sm font-bold">
        {value}
        {unit && <span className="text-[10px] font-normal text-default-400">{unit}</span>}
      </p>
      <p className="text-[10px] text-default-400">{label}</p>
    </div>
  );
}
