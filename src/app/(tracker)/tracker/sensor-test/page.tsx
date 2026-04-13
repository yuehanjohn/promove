"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface SensorState {
  ax: number;
  ay: number;
  az: number;
  magnitude: number;
  timestamp: number;
}

export default function SensorTestPage() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permissionState, setPermissionState] = useState<
    "unknown" | "prompt" | "granted" | "denied"
  >("unknown");
  const [listening, setListening] = useState(false);
  const [latest, setLatest] = useState<SensorState | null>(null);
  const [sampleCount, setSampleCount] = useState(0);
  const [sampleRate, setSampleRate] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const countRef = useRef(0);
  const rateWindowRef = useRef<number[]>([]);
  const listenerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Check support on mount
  useEffect(() => {
    const hasAPI = "DeviceMotionEvent" in window;
    setSupported(hasAPI);
    addLog(hasAPI ? "DeviceMotionEvent API found" : "DeviceMotionEvent API NOT found");

    const DME = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DME.requestPermission === "function") {
      setPermissionState("prompt");
      addLog("iOS permission model detected (requestPermission available)");
    } else {
      setPermissionState("granted");
      addLog("No permission gate (non-iOS or older browser)");
    }
  }, [addLog]);

  // Compute sample rate every second
  useEffect(() => {
    if (!listening) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const window = rateWindowRef.current;
      // Remove samples older than 1 second
      while (window.length > 0 && now - window[0] > 1000) {
        window.shift();
      }
      setSampleRate(window.length);
    }, 500);
    return () => clearInterval(interval);
  }, [listening]);

  const requestPermission = useCallback(async () => {
    const DME = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DME.requestPermission === "function") {
      try {
        addLog("Requesting motion permission...");
        const result = await DME.requestPermission();
        addLog(`Permission result: ${result}`);
        if (result === "granted") {
          setPermissionState("granted");
        } else {
          setPermissionState("denied");
          setError(`Permission ${result}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`Permission error: ${msg}`);
        setPermissionState("denied");
        setError(msg);
      }
    }
  }, [addLog]);

  const startListening = useCallback(() => {
    if (listenerRef.current) return;
    addLog("Starting sensor listener...");
    countRef.current = 0;
    rateWindowRef.current = [];
    setSampleCount(0);
    setSampleRate(0);
    setError(null);

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) {
        if (countRef.current === 0) {
          addLog("WARNING: accelerationIncludingGravity is null");
        }
        return;
      }

      const ax = acc.x ?? 0;
      const ay = acc.y ?? 0;
      const az = acc.z ?? 0;
      const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

      countRef.current += 1;
      rateWindowRef.current.push(Date.now());

      // Only update state every few samples to avoid render thrashing
      if (countRef.current % 3 === 0 || countRef.current <= 3) {
        setLatest({ ax, ay, az, magnitude, timestamp: Date.now() });
        setSampleCount(countRef.current);
      }

      if (countRef.current === 1) {
        addLog(`First reading: ax=${ax.toFixed(2)}, ay=${ay.toFixed(2)}, az=${az.toFixed(2)}`);
      }
    };

    window.addEventListener("devicemotion", handler);
    listenerRef.current = handler;
    setListening(true);
    addLog("Listener registered. Waiting for data...");

    // Log a warning if no data after 2 seconds
    setTimeout(() => {
      if (countRef.current === 0) {
        addLog("WARNING: No sensor data received after 2s. Sensor may not be available.");
        setError("No data received - sensor may not be available on this device");
      }
    }, 2000);
  }, [addLog]);

  const stopListening = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener("devicemotion", listenerRef.current);
      listenerRef.current = null;
    }
    setListening(false);
    addLog(`Stopped. Total samples: ${countRef.current}`);
  }, [addLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        window.removeEventListener("devicemotion", listenerRef.current);
      }
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg flex-col px-4 pt-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Link href="/tracker" className="flex items-center gap-1 text-sm text-default-500">
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
          Back
        </Link>
      </div>

      <h1 className="mb-4 text-xl font-bold">Sensor Test</h1>

      {/* Status Cards */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-default-200 bg-default-50 px-4 py-3">
          <span className="text-sm text-default-600">DeviceMotion API</span>
          <span
            className={`text-sm font-semibold ${supported === true ? "text-green-500" : supported === false ? "text-red-500" : "text-default-400"}`}
          >
            {supported === null ? "Checking..." : supported ? "Available" : "Not Available"}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-default-200 bg-default-50 px-4 py-3">
          <span className="text-sm text-default-600">Permission</span>
          <span
            className={`text-sm font-semibold ${
              permissionState === "granted"
                ? "text-green-500"
                : permissionState === "denied"
                  ? "text-red-500"
                  : "text-yellow-500"
            }`}
          >
            {permissionState}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-default-200 bg-default-50 px-4 py-3">
          <span className="text-sm text-default-600">Status</span>
          <span className={`text-sm font-semibold ${listening ? "text-green-500" : "text-default-400"}`}>
            {listening ? "Listening" : "Stopped"}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-default-200 bg-default-50 px-4 py-3">
          <span className="text-sm text-default-600">Samples / Rate</span>
          <span className="text-sm font-semibold">
            {sampleCount} / {sampleRate} Hz
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Live Readings */}
      {latest && (
        <div className="mb-4 rounded-xl border border-default-200 bg-default-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-default-600">
            Live Accelerometer (incl. gravity)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-default-400">X</p>
              <p className="font-mono text-lg font-bold">{latest.ax.toFixed(2)}</p>
              <div className="mt-1 h-2 rounded-full bg-default-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500 transition-all"
                  style={{ width: `${Math.min(Math.abs(latest.ax) / 20 * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-default-400">Y</p>
              <p className="font-mono text-lg font-bold">{latest.ay.toFixed(2)}</p>
              <div className="mt-1 h-2 rounded-full bg-default-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(Math.abs(latest.ay) / 20 * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-default-400">Z</p>
              <p className="font-mono text-lg font-bold">{latest.az.toFixed(2)}</p>
              <div className="mt-1 h-2 rounded-full bg-default-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(Math.abs(latest.az) / 20 * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-default-400">Magnitude</p>
              <p className="font-mono text-lg font-bold">{latest.magnitude.toFixed(2)}</p>
              <div className="mt-1 h-2 rounded-full bg-default-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${Math.min(latest.magnitude / 30 * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-default-400">
            At rest, magnitude should be ~9.81 m/s² (gravity). If all values are 0, the sensor
            isn&apos;t reporting data.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="mb-4 space-y-2">
        {permissionState === "prompt" && (
          <button
            onClick={requestPermission}
            className="w-full rounded-2xl bg-yellow-500 py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
          >
            Grant Motion Permission (iOS)
          </button>
        )}

        {!listening ? (
          <button
            onClick={startListening}
            disabled={!supported || permissionState === "denied"}
            className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            Start Sensor
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="w-full rounded-2xl bg-red-500 py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
          >
            Stop Sensor
          </button>
        )}
      </div>

      {/* Debug Log */}
      <div className="mb-4">
        <h3 className="mb-2 text-sm font-semibold text-default-600">Debug Log</h3>
        <div className="max-h-48 overflow-y-auto rounded-xl border border-default-200 bg-default-950 p-3 font-mono text-xs text-green-400">
          {log.length === 0 ? (
            <p className="text-default-500">Waiting...</p>
          ) : (
            log.map((entry, i) => (
              <p key={i} className="leading-relaxed">
                {entry}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
