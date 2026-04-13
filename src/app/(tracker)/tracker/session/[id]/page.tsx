"use client";

import { useMovementStore } from "@/stores/movement-store";
import { MOVEMENT_TYPES } from "@/lib/movement-types";
import { calcStats } from "@/lib/jump-calculator";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

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

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 text-center">
        <p className="text-4xl">🔍</p>
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
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-xl font-bold">{stats.max}</p>
            <p className="text-[10px] text-default-400">Best (cm)</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{stats.avg}</p>
            <p className="text-[10px] text-default-400">Avg (cm)</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{stats.min}</p>
            <p className="text-[10px] text-default-400">Min (cm)</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{stats.count}</p>
            <p className="text-[10px] text-default-400">Jumps</p>
          </div>
        </div>
      </div>

      {/* Visual bar chart */}
      {values.length > 1 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-default-500">
            Jump Distribution
          </h2>
          <div className="flex items-end gap-1 rounded-xl border border-default-200 bg-default-50 p-4">
            {values.map((v, i) => {
              const height = maxValue > 0 ? (v / maxValue) * 100 : 0;
              const isMax = v === maxValue;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium">{v}</span>
                  <div
                    className={`w-full rounded-t transition-all ${
                      isMax ? "bg-primary" : "bg-primary/30"
                    }`}
                    style={{ height: `${Math.max(height, 8)}px`, minHeight: "4px" }}
                  />
                  <span className="text-[9px] text-default-400">#{i + 1}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Individual jumps */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-default-500">
          All Jumps
        </h2>
        <div className="space-y-2">
          {session.measurements.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-default-200 bg-default-50 p-3"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-default-200 text-xs font-bold">
                #{i + 1}
              </span>
              <div className="flex-1">
                <p className="font-semibold">
                  {m.value} cm
                  {m.value === maxValue && <span className="ml-1 text-xs text-primary">Best</span>}
                </p>
                <div className="flex gap-2 text-xs text-default-400">
                  <span className="capitalize">{m.method}</span>
                  {m.flightTimeMs && <span>· {Math.round(m.flightTimeMs)}ms flight</span>}
                </div>
              </div>
              <button
                onClick={() => deleteMeasurement(session.id, m.id)}
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
          ))}
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
