export type MovementType =
  | "vertical_jump"
  | "approach_jump"
  | "block_jump"
  | "broad_jump"
  | "depth_jump"
  | "spike_approach";

export interface MovementTypeInfo {
  id: MovementType;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  unit: "cm" | "in";
}

export const MOVEMENT_TYPES: Record<MovementType, MovementTypeInfo> = {
  vertical_jump: {
    id: "vertical_jump",
    label: "Standing Vertical Jump",
    shortLabel: "Vertical",
    description: "Max height from standing position",
    icon: "↑",
    unit: "cm",
  },
  approach_jump: {
    id: "approach_jump",
    label: "Approach Jump",
    shortLabel: "Approach",
    description: "Jump with running approach (spike)",
    icon: "⤴",
    unit: "cm",
  },
  block_jump: {
    id: "block_jump",
    label: "Block Jump",
    shortLabel: "Block",
    description: "Reactive block jump at the net",
    icon: "⬆",
    unit: "cm",
  },
  broad_jump: {
    id: "broad_jump",
    label: "Broad Jump",
    shortLabel: "Broad",
    description: "Horizontal standing long jump",
    icon: "→",
    unit: "cm",
  },
  depth_jump: {
    id: "depth_jump",
    label: "Depth Jump",
    shortLabel: "Depth",
    description: "Drop from box, immediately jump up",
    icon: "↕",
    unit: "cm",
  },
  spike_approach: {
    id: "spike_approach",
    label: "Spike Approach",
    shortLabel: "Spike",
    description: "Full spike approach with arm swing",
    icon: "⚡",
    unit: "cm",
  },
};

export interface SensorReading {
  t: number; // ms since recording start
  ax: number;
  ay: number;
  az: number;
}

/** Comprehensive metrics computed from sensor data */
export interface JumpMetrics {
  flightTimeMs: number;
  peakAcceleration: number; // max g-force magnitude during jump
  takeoffVelocity: number; // m/s estimated velocity at takeoff
  landingImpact: number; // peak g-force on landing
  riseTimeMs: number; // time from takeoff to peak height
  fallTimeMs: number; // time from peak height to landing
  horizontalMovement: number; // estimated lateral displacement in m/s²
  jumpDirection: "neutral" | "forward" | "backward" | "left" | "right";
  loadingForce: number; // peak g-force during counter-movement (loading phase)
  explosiveness: number; // ratio of takeoff velocity to loading duration (m/s per second)
}

export interface Measurement {
  id: string;
  value: number; // height in cm (or distance for broad jump)
  timestamp: number;
  method: "manual" | "sensor";
  flightTimeMs?: number;
  peakAcceleration?: number;
  sensorData?: SensorReading[];
  metrics?: JumpMetrics;
}

export interface Session {
  id: string;
  movementType: MovementType;
  createdAt: number;
  measurements: Measurement[];
  notes: string;
}

export interface PersonalBests {
  [key: string]: number; // movementType -> best value
}
