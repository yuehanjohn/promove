import type { SensorReading } from "./movement-types";

const GRAVITY = 9.81; // m/s²

/**
 * Estimate jump height from flight time using projectile motion:
 * h = (1/2) * g * (t_flight / 2)²
 *
 * t_flight is the total airborne time in seconds.
 * Returns height in centimeters.
 */
export function heightFromFlightTime(flightTimeMs: number): number {
  const tFlight = flightTimeMs / 1000;
  const halfT = tFlight / 2;
  const heightM = 0.5 * GRAVITY * halfT * halfT;
  return Math.round(heightM * 100);
}

/**
 * Detect the jump from raw accelerometer data.
 *
 * The algorithm:
 * 1. Compute the magnitude of acceleration at each sample.
 * 2. Detect the "takeoff" moment: acceleration drops well below 1g (free fall).
 * 3. Detect the "landing" moment: acceleration spikes back above 1g.
 * 4. The time between takeoff and landing is the flight time.
 *
 * Returns { flightTimeMs, peakAcceleration, takeoffIndex, landingIndex } or null.
 */
export function detectJump(
  readings: SensorReading[],
  options?: { takeoffThreshold?: number; landingThreshold?: number }
): {
  flightTimeMs: number;
  peakAcceleration: number;
  takeoffIndex: number;
  landingIndex: number;
} | null {
  if (readings.length < 10) return null;

  const takeoffThreshold = options?.takeoffThreshold ?? 4; // m/s², below this = airborne
  const landingThreshold = options?.landingThreshold ?? 12; // m/s², above this = landing

  const magnitudes = readings.map((r) => Math.sqrt(r.ax * r.ax + r.ay * r.ay + r.az * r.az));

  // Find the launch: a big acceleration spike (push off)
  let maxAccIdx = 0;
  let maxAcc = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    if (magnitudes[i] > maxAcc) {
      maxAcc = magnitudes[i];
      maxAccIdx = i;
    }
  }

  // Find takeoff: first point after max acceleration where magnitude drops below threshold
  let takeoffIndex = -1;
  for (let i = maxAccIdx; i < magnitudes.length; i++) {
    if (magnitudes[i] < takeoffThreshold) {
      takeoffIndex = i;
      break;
    }
  }

  if (takeoffIndex === -1) return null;

  // Find landing: first point after takeoff where magnitude exceeds landing threshold
  let landingIndex = -1;
  for (let i = takeoffIndex + 1; i < magnitudes.length; i++) {
    if (magnitudes[i] > landingThreshold) {
      landingIndex = i;
      break;
    }
  }

  if (landingIndex === -1) return null;

  const flightTimeMs = readings[landingIndex].t - readings[takeoffIndex].t;

  // Sanity check: flight time should be between 100ms and 2000ms
  if (flightTimeMs < 100 || flightTimeMs > 2000) return null;

  return {
    flightTimeMs,
    peakAcceleration: maxAcc,
    takeoffIndex,
    landingIndex,
  };
}

/**
 * Calculate stats from an array of values.
 */
export function calcStats(values: number[]): {
  avg: number;
  max: number;
  min: number;
  count: number;
} {
  if (values.length === 0) return { avg: 0, max: 0, min: 0, count: 0 };
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  return { avg, max, min, count: values.length };
}
