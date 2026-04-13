import type { SensorReading, JumpMetrics } from "./movement-types";

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

/** Compute acceleration magnitude from a reading */
export function accelMagnitude(r: SensorReading): number {
  return Math.sqrt(r.ax * r.ax + r.ay * r.ay + r.az * r.az);
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

  const magnitudes = readings.map((r) => accelMagnitude(r));

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
 * Compute comprehensive jump metrics from sensor data.
 * This extracts everything we can from the accelerometer readings.
 */
export function computeJumpMetrics(
  readings: SensorReading[],
  detection: {
    flightTimeMs: number;
    peakAcceleration: number;
    takeoffIndex: number;
    landingIndex: number;
  }
): JumpMetrics {
  const { flightTimeMs, peakAcceleration, takeoffIndex, landingIndex } = detection;
  const magnitudes = readings.map((r) => accelMagnitude(r));

  // Takeoff velocity: v = g * (flightTime / 2)
  const tFlightSec = flightTimeMs / 1000;
  const takeoffVelocity = Math.round(GRAVITY * (tFlightSec / 2) * 100) / 100;

  // Rise time vs fall time: split flight at midpoint (peak height)
  const riseTimeMs = Math.round(flightTimeMs / 2);
  const fallTimeMs = flightTimeMs - riseTimeMs;

  // Landing impact: max acceleration in a window after landing
  let landingImpact = 0;
  const landingWindow = Math.min(landingIndex + 20, readings.length);
  for (let i = landingIndex; i < landingWindow; i++) {
    if (magnitudes[i] > landingImpact) landingImpact = magnitudes[i];
  }
  landingImpact = Math.round(landingImpact * 100) / 100;

  // Loading force: max acceleration during the counter-movement phase (before takeoff)
  // Look from the start up to the takeoff point
  let loadingForce = 0;
  for (let i = 0; i < takeoffIndex; i++) {
    if (magnitudes[i] > loadingForce) loadingForce = magnitudes[i];
  }
  loadingForce = Math.round(loadingForce * 100) / 100;

  // Horizontal movement: average lateral acceleration during flight
  // Using X and Z axes (Y is typically vertical on phones)
  let totalHorizontal = 0;
  let flightSamples = 0;
  for (let i = takeoffIndex; i <= landingIndex && i < readings.length; i++) {
    const r = readings[i];
    totalHorizontal += Math.sqrt(r.ax * r.ax + r.az * r.az);
    flightSamples++;
  }
  const horizontalMovement =
    flightSamples > 0 ? Math.round((totalHorizontal / flightSamples) * 100) / 100 : 0;

  // Jump direction: determine dominant horizontal axis during flight
  let avgAx = 0;
  let avgAz = 0;
  if (flightSamples > 0) {
    for (let i = takeoffIndex; i <= landingIndex && i < readings.length; i++) {
      avgAx += readings[i].ax;
      avgAz += readings[i].az;
    }
    avgAx /= flightSamples;
    avgAz /= flightSamples;
  }

  let jumpDirection: JumpMetrics["jumpDirection"] = "neutral";
  const dirThreshold = 1.5; // m/s² threshold for directional bias
  if (Math.abs(avgAz) > Math.abs(avgAx) && Math.abs(avgAz) > dirThreshold) {
    jumpDirection = avgAz > 0 ? "forward" : "backward";
  } else if (Math.abs(avgAx) > dirThreshold) {
    jumpDirection = avgAx > 0 ? "right" : "left";
  }

  // Explosiveness: takeoff velocity / loading duration
  // Loading phase = time from first significant movement to takeoff
  const loadingStartIdx = Math.max(0, takeoffIndex - 50);
  const loadingDurationMs = readings[takeoffIndex].t - readings[loadingStartIdx].t;
  const loadingDurationSec = Math.max(loadingDurationMs / 1000, 0.05);
  const explosiveness = Math.round((takeoffVelocity / loadingDurationSec) * 100) / 100;

  return {
    flightTimeMs,
    peakAcceleration: Math.round(peakAcceleration * 100) / 100,
    takeoffVelocity,
    landingImpact,
    riseTimeMs,
    fallTimeMs,
    horizontalMovement,
    jumpDirection,
    loadingForce,
    explosiveness,
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
