"use client";

import { Suspense, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMovementStore, generateId } from "@/stores/movement-store";
import { MOVEMENT_TYPES } from "@/lib/movement-types";
import type { MovementType, SensorReading, Measurement, Session } from "@/lib/movement-types";
import { runCountdown, playCompleteBeep, resumeAudioContext } from "@/lib/audio";
import { detectJump, heightFromFlightTime, computeJumpMetrics } from "@/lib/jump-calculator";
import type { JumpMetrics } from "@/lib/movement-types";

type RecordingPhase = "setup" | "countdown" | "recording" | "result" | "session-summary";

export default function RecordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
          <p className="text-default-400">Loading...</p>
        </div>
      }
    >
      <RecordPageContent />
    </Suspense>
  );
}

function RecordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addSession = useMovementStore((s) => s.addSession);

  const [movementType, setMovementType] = useState<MovementType>(
    (searchParams.get("type") as MovementType) || "vertical_jump"
  );
  const [phase, setPhase] = useState<RecordingPhase>("setup");
  const [countdownValue, setCountdownValue] = useState(3);
  const [inputMethod, setInputMethod] = useState<"sensor" | "manual">("manual");
  const [manualValue, setManualValue] = useState("");
  const [currentResult, setCurrentResult] = useState<{
    value: number;
    flightTimeMs?: number;
    peakAcceleration?: number;
    metrics?: JumpMetrics;
    sensorData?: SensorReading[];
  } | null>(null);
  const [sessionMeasurements, setSessionMeasurements] = useState<Measurement[]>([]);
  const sensorAvailable = typeof window !== "undefined" && "DeviceMotionEvent" in window;
  const [isRecording, setIsRecording] = useState(false);

  const sensorDataRef = useRef<SensorReading[]>([]);
  const recordingStartRef = useRef<number>(0);

  const processSensorData = useCallback(() => {
    const data = sensorDataRef.current;
    const result = detectJump(data);

    if (result) {
      const height = heightFromFlightTime(result.flightTimeMs);
      const metrics = computeJumpMetrics(data, result);
      setCurrentResult({
        value: height,
        flightTimeMs: result.flightTimeMs,
        peakAcceleration: result.peakAcceleration,
        metrics,
        sensorData: [...data],
      });
      playCompleteBeep();
    } else {
      // Couldn't detect jump, fallback to manual
      setCurrentResult(null);
      setInputMethod("manual");
    }
    setPhase("result");
  }, []);

  const startSensorRecording = useCallback(() => {
    sensorDataRef.current = [];
    recordingStartRef.current = performance.now();
    setIsRecording(true);

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (acc) {
        sensorDataRef.current.push({
          t: performance.now() - recordingStartRef.current,
          ax: acc.x ?? 0,
          ay: acc.y ?? 0,
          az: acc.z ?? 0,
        });
      }
    };

    window.addEventListener("devicemotion", handleMotion);

    // Auto-stop after 5 seconds
    setTimeout(() => {
      window.removeEventListener("devicemotion", handleMotion);
      setIsRecording(false);
      processSensorData();
    }, 5000);
  }, [processSensorData]);

  const handleStartCountdown = useCallback(async () => {
    resumeAudioContext();
    setPhase("countdown");

    await runCountdown((secondsLeft) => {
      setCountdownValue(secondsLeft);
    }, 3);

    // After countdown, start recording
    if (inputMethod === "sensor") {
      setPhase("recording");
      startSensorRecording();
    } else {
      setPhase("result");
    }
  }, [inputMethod, startSensorRecording]);

  const handleSaveJump = useCallback(() => {
    const value = inputMethod === "manual" ? Number(manualValue) : (currentResult?.value ?? 0);

    if (value <= 0) return;

    const measurement: Measurement = {
      id: generateId(),
      value,
      timestamp: Date.now(),
      method: inputMethod,
      flightTimeMs: currentResult?.flightTimeMs,
      peakAcceleration: currentResult?.peakAcceleration,
      sensorData: currentResult?.sensorData,
      metrics: currentResult?.metrics,
    };

    setSessionMeasurements((prev) => [...prev, measurement]);
    setManualValue("");
    setCurrentResult(null);
    setPhase("setup");
  }, [inputMethod, manualValue, currentResult]);

  const handleFinishSession = useCallback(() => {
    if (sessionMeasurements.length === 0) {
      router.push("/tracker");
      return;
    }

    const session: Session = {
      id: generateId(),
      movementType,
      createdAt: Date.now(),
      measurements: sessionMeasurements,
      notes: "",
    };

    addSession(session);
    router.push(`/tracker/session/${session.id}`);
  }, [sessionMeasurements, movementType, addSession, router]);

  const requestMotionPermission = useCallback(async () => {
    // iOS 13+ requires explicit permission
    const DME = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DME.requestPermission === "function") {
      try {
        const permission = await DME.requestPermission();
        if (permission === "granted") {
          setInputMethod("sensor");
        }
      } catch {
        setInputMethod("manual");
      }
    } else {
      setInputMethod("sensor");
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg flex-col px-4 pt-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() =>
            sessionMeasurements.length > 0 ? setPhase("session-summary") : router.push("/tracker")
          }
          className="flex items-center gap-1 text-sm text-default-500"
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
          {sessionMeasurements.length > 0 ? "Finish" : "Back"}
        </button>
        {sessionMeasurements.length > 0 && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {sessionMeasurements.length} jump
            {sessionMeasurements.length !== 1 ? "s" : ""} recorded
          </span>
        )}
      </div>

      {/* Setup Phase */}
      {phase === "setup" && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-4 text-xl font-bold">Record Jump</h2>

          {/* Movement Type Selector */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-default-600">Movement Type</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(MOVEMENT_TYPES).map((type) => (
                <button
                  key={type.id}
                  onClick={() => setMovementType(type.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-colors ${
                    movementType === type.id
                      ? "border-primary bg-primary/10"
                      : "border-default-200 bg-default-50 active:bg-default-100"
                  }`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <span className="text-xs font-medium">{type.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Method */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-default-600">Input Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setInputMethod("manual")}
                className={`rounded-xl border-2 p-3 text-center text-sm transition-colors ${
                  inputMethod === "manual"
                    ? "border-primary bg-primary/10 font-semibold"
                    : "border-default-200 bg-default-50"
                }`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => (sensorAvailable ? requestMotionPermission() : undefined)}
                className={`rounded-xl border-2 p-3 text-center text-sm transition-colors ${
                  inputMethod === "sensor"
                    ? "border-primary bg-primary/10 font-semibold"
                    : "border-default-200 bg-default-50"
                } ${!sensorAvailable ? "opacity-50" : ""}`}
              >
                Phone Sensor
                {!sensorAvailable && (
                  <span className="mt-0.5 block text-[10px] text-default-400">Not available</span>
                )}
              </button>
            </div>
          </div>

          {/* Start Button */}
          <div className="mt-auto pb-4">
            <button
              onClick={handleStartCountdown}
              className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-lg transition-transform active:scale-[0.98]"
            >
              {inputMethod === "sensor" ? "Start Countdown" : "Record Jump"}
            </button>
          </div>

          {/* Previous jumps in this session */}
          {sessionMeasurements.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-default-600">This session</h3>
                <button onClick={handleFinishSession} className="text-sm font-medium text-primary">
                  Finish Session
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {sessionMeasurements.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex-shrink-0 rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-center"
                  >
                    <p className="text-xs text-default-400">#{i + 1}</p>
                    <p className="font-bold">{m.value}</p>
                    <p className="text-xs text-default-400">cm</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Countdown Phase */}
      {phase === "countdown" && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="animate-pulse text-center">
            <p className="text-8xl font-black tabular-nums">
              {countdownValue > 0 ? countdownValue : "GO!"}
            </p>
            <p className="mt-4 text-lg text-default-500">
              {countdownValue > 0 ? "Get ready..." : "Jump now!"}
            </p>
          </div>
        </div>
      )}

      {/* Recording Phase (sensor) */}
      {phase === "recording" && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-6 h-24 w-24">
              <div className="absolute inset-0 animate-ping rounded-full bg-red-400/30" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-red-500">
                <div className="h-6 w-6 rounded-sm bg-white" />
              </div>
            </div>
            <p className="text-xl font-bold">Recording...</p>
            <p className="mt-2 text-default-500">
              {isRecording ? "Jump now! Sensor is capturing data..." : "Processing..."}
            </p>
          </div>
        </div>
      )}

      {/* Result Phase */}
      {phase === "result" && (
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center">
            {inputMethod === "sensor" && currentResult ? (
              <div className="text-center">
                <p className="text-sm text-default-500">Estimated Height</p>
                <p className="text-6xl font-black">{currentResult.value}</p>
                <p className="text-xl text-default-500">cm</p>
                {currentResult.metrics && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                    <div className="rounded-lg bg-default-100 p-2">
                      <p className="text-[10px] text-default-400">Flight Time</p>
                      <p className="text-sm font-bold">
                        {Math.round(currentResult.metrics.flightTimeMs)}ms
                      </p>
                    </div>
                    <div className="rounded-lg bg-default-100 p-2">
                      <p className="text-[10px] text-default-400">Takeoff Velocity</p>
                      <p className="text-sm font-bold">
                        {currentResult.metrics.takeoffVelocity} m/s
                      </p>
                    </div>
                    <div className="rounded-lg bg-default-100 p-2">
                      <p className="text-[10px] text-default-400">Peak G-Force</p>
                      <p className="text-sm font-bold">
                        {currentResult.metrics.peakAcceleration} m/s²
                      </p>
                    </div>
                    <div className="rounded-lg bg-default-100 p-2">
                      <p className="text-[10px] text-default-400">Direction</p>
                      <p className="text-sm font-bold capitalize">
                        {currentResult.metrics.jumpDirection}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full max-w-xs text-center">
                <p className="mb-4 text-lg font-semibold">Enter Measurement</p>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    placeholder="0"
                    autoFocus
                    className="w-full rounded-2xl border-2 border-default-300 bg-default-50 py-6 text-center text-5xl font-black outline-none focus:border-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-default-400">
                    cm
                  </span>
                </div>
                <p className="mt-2 text-sm text-default-400">
                  {MOVEMENT_TYPES[movementType].description}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 pb-4">
            <button
              onClick={handleSaveJump}
              disabled={
                inputMethod === "manual" ? !manualValue || Number(manualValue) <= 0 : !currentResult
              }
              className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              Save & Record Another
            </button>
            <button
              onClick={() => {
                handleSaveJump();
                setTimeout(handleFinishSession, 100);
              }}
              disabled={
                inputMethod === "manual" ? !manualValue || Number(manualValue) <= 0 : !currentResult
              }
              className="w-full rounded-2xl border-2 border-default-300 py-4 text-lg font-medium transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              Save & Finish
            </button>
            <button
              onClick={() => {
                setManualValue("");
                setCurrentResult(null);
                setPhase("setup");
              }}
              className="w-full py-3 text-sm text-default-500"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Session Summary Phase */}
      {phase === "session-summary" && (
        <div className="flex flex-1 flex-col">
          <h2 className="mb-4 text-xl font-bold">Session Summary</h2>
          <div className="mb-4 rounded-xl border border-default-200 bg-default-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">{MOVEMENT_TYPES[movementType].icon}</span>
              <div>
                <p className="font-semibold">{MOVEMENT_TYPES[movementType].label}</p>
                <p className="text-sm text-default-400">
                  {sessionMeasurements.length} jumps recorded
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Math.max(...sessionMeasurements.map((m) => m.value))}
                </p>
                <p className="text-xs text-default-400">Best (cm)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {Math.round(
                    sessionMeasurements.reduce((a, m) => a + m.value, 0) /
                      sessionMeasurements.length
                  )}
                </p>
                <p className="text-xs text-default-400">Avg (cm)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{sessionMeasurements.length}</p>
                <p className="text-xs text-default-400">Jumps</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {sessionMeasurements.map((m, i) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-default-200 bg-default-50 px-4 py-2"
              >
                <span className="text-sm text-default-400">Jump #{i + 1}</span>
                <span className="font-bold">{m.value} cm</span>
              </div>
            ))}
          </div>

          <div className="mt-auto space-y-2 pb-4 pt-4">
            <button
              onClick={handleFinishSession}
              className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-lg transition-transform active:scale-[0.98]"
            >
              Save Session
            </button>
            <button
              onClick={() => setPhase("setup")}
              className="w-full py-3 text-sm text-default-500"
            >
              Add More Jumps
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
