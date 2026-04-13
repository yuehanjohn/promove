"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";
import type { Session, Measurement, MovementType } from "@/lib/movement-types";

interface MovementState {
  sessions: Session[];
  unitSystem: "metric" | "imperial";

  // Actions
  addSession: (session: Session) => void;
  deleteSession: (id: string) => void;
  addMeasurement: (sessionId: string, measurement: Measurement) => void;
  deleteMeasurement: (sessionId: string, measurementId: string) => void;
  updateSessionNotes: (sessionId: string, notes: string) => void;
  setUnitSystem: (system: "metric" | "imperial") => void;
  clearAllData: () => void;

  // Derived helpers
  getSession: (id: string) => Session | undefined;
  getSessionsByType: (type: MovementType) => Session[];
  getRecentSessions: (limit: number) => Session[];
  getPersonalBest: (type: MovementType) => number;
  getAllPersonalBests: () => Record<string, number>;
  getTotalJumps: () => number;
}

export const useMovementStore = create<MovementState>()(
  persist(
    (set, get) => ({
      sessions: [],
      unitSystem: "metric",

      addSession: (session) => set((state) => ({ sessions: [session, ...state.sessions] })),

      deleteSession: (id) =>
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),

      addMeasurement: (sessionId, measurement) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, measurements: [...s.measurements, measurement] } : s
          ),
        })),

      deleteMeasurement: (sessionId, measurementId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  measurements: s.measurements.filter((m) => m.id !== measurementId),
                }
              : s
          ),
        })),

      updateSessionNotes: (sessionId, notes) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, notes } : s)),
        })),

      setUnitSystem: (system) => set({ unitSystem: system }),

      clearAllData: () => set({ sessions: [] }),

      getSession: (id) => get().sessions.find((s) => s.id === id),

      getSessionsByType: (type) => get().sessions.filter((s) => s.movementType === type),

      getRecentSessions: (limit) => get().sessions.slice(0, limit),

      getPersonalBest: (type) => {
        const sessions = get().sessions.filter((s) => s.movementType === type);
        let best = 0;
        for (const session of sessions) {
          for (const m of session.measurements) {
            if (m.value > best) best = m.value;
          }
        }
        return best;
      },

      getAllPersonalBests: () => {
        const bests: Record<string, number> = {};
        for (const session of get().sessions) {
          for (const m of session.measurements) {
            const key = session.movementType;
            if (!bests[key] || m.value > bests[key]) {
              bests[key] = m.value;
            }
          }
        }
        return bests;
      },

      getTotalJumps: () => get().sessions.reduce((total, s) => total + s.measurements.length, 0),
    }),
    {
      name: "promove-movement-data",
    }
  )
);

/** Hook that returns true once Zustand has rehydrated from localStorage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (callback) => useMovementStore.persist.onFinishHydration(callback),
    () => useMovementStore.persist.hasHydrated(),
    () => false
  );
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function convertValue(
  value: number,
  from: "metric" | "imperial",
  to: "metric" | "imperial"
): number {
  if (from === to) return value;
  if (from === "metric" && to === "imperial") return Math.round((value / 2.54) * 10) / 10;
  return Math.round(value * 2.54 * 10) / 10;
}
