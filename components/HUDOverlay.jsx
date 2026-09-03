"use client";

import React, { useState } from "react";
import { Flame, Edit3, ShieldAlert, Activity, HelpCircle, X, Sparkles } from "lucide-react";

export default function HUDOverlay({
  trackedHands = [],
  mode = "idle", // 'orb' | 'drawing' | 'idle'
  selectedMode = "auto", // 'auto' | 'orb' | 'drawing'
  fps = 60,
  showFps = false,
  cameraActive = true,
  cameraError = null,
  colorConfig = { name: "Neon Magenta", hex: "#ff007f" },
}) {
  const [showGuideModal, setShowGuideModal] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 md:p-6 select-none overflow-hidden">
      {/* Top Header Row */}
      <div className="flex items-start justify-between">
        {/* Top-Left: System Telemetry */}
        <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 px-4 shadow-[0_0_20px_rgba(0,240,255,0.15)] flex flex-col gap-1.5 max-w-xs pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cameraActive ? "bg-cyan-400" : "bg-red-400"} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cameraActive ? "bg-cyan-500" : "bg-red-500"}`} />
            </span>
            <span className="font-mono text-xs font-bold text-cyan-300 tracking-wider">
              AETHERIS // AR_HUD v1.0
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-cyan-400/80">
            <span>TRACKING: <b className="text-white">{trackedHands.length > 0 ? "LOCK_ACQUIRED" : "SEARCHING"}</b></span>
            {showFps && (
              <span className="border-l border-cyan-500/30 pl-3">
                FPS: <b className={fps > 45 ? "text-green-400" : fps > 25 ? "text-yellow-400" : "text-red-400"}>{Math.round(fps)}</b>
              </span>
            )}
          </div>
        </div>

        {/* Top-Right: Active Mode, Hand Readout, and Help Button */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            {/* Main Mode Badge */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-md shadow-lg transition-all duration-300"
              style={{
                backgroundColor: "rgba(10, 15, 29, 0.75)",
                borderColor: mode === "orb" ? colorConfig.hex : mode === "drawing" ? "#00f0ff" : "rgba(0, 240, 255, 0.3)",
                boxShadow: mode !== "idle" ? `0 0 25px ${mode === "orb" ? colorConfig.hex : "#00f0ff"}44` : "none",
              }}
            >
              {mode === "orb" ? (
                <>
                  <Flame className="w-4 h-4 animate-bounce" style={{ color: colorConfig.hex }} />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: colorConfig.hex }}>
                    ENERGY ORB ACTIVE {selectedMode !== "auto" && `[MANUAL]`}
                  </span>
                </>
              ) : mode === "drawing" ? (
                <>
                  <Edit3 className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-widest">
                    LIGHT PAINTING MODE {selectedMode !== "auto" && `[MANUAL]`}
                  </span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 text-cyan-400/70" />
                  <span className="font-mono text-xs text-cyan-400/70 tracking-wider">
                    [NEURAL VISION STANDBY]
                  </span>
                </>
              )}
            </div>

            {/* Help Toggle Button */}
            <button
              onClick={() => setShowGuideModal((prev) => !prev)}
              className="bg-black/60 hover:bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:text-white p-2 rounded-lg backdrop-blur-md transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              title="Toggle Gesture Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Individual Tracked Hands Indicators */}
          <div className="flex flex-col gap-1 items-end">
            {trackedHands.length === 0 ? (
              <div className="text-[10px] font-mono text-cyan-500/60 flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded border border-cyan-500/20">
                <span>[HAND TRACKING]</span>
                <span className="text-yellow-400/80">AWAITING TARGET</span>
              </div>
            ) : (
              trackedHands.map((hand, idx) => (
                <div
                  key={idx}
                  className="text-[11px] font-mono flex items-center gap-2 bg-black/60 px-3 py-1 rounded border border-cyan-500/40 text-cyan-300 animate-fadeIn"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                  <span className="font-bold text-white">● DETECTED</span>
                  <span className="text-cyan-400/70">
                    HAND_{idx + 1} ({hand.handedness || "HAND"}):
                  </span>
                  <span className="text-cyan-200 font-semibold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    {hand.gesture}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Camera Permission / Error Toast */}
      {cameraError && (
        <div className="self-center bg-red-950/90 border border-red-500 text-red-200 px-6 py-3 rounded-xl backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center gap-3 max-w-lg pointer-events-auto">
          <ShieldAlert className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div className="text-xs font-mono">
            <b className="font-bold text-white block mb-0.5">CAMERA ACCESS ERROR</b>
            {cameraError}
          </div>
        </div>
      )}

      {/* Optional Gesture Guide Modal (Only shown when user clicks help icon) */}
      {showGuideModal && (
        <div className="self-center flex flex-col items-center bg-black/85 backdrop-blur-xl border border-cyan-500/40 p-5 px-7 rounded-2xl max-w-md shadow-[0_0_40px_rgba(0,240,255,0.25)] pointer-events-auto animate-fadeIn relative z-40">
          <button
            onClick={() => setShowGuideModal(false)}
            className="absolute top-3 right-3 text-cyan-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-cyan-300 mb-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase">
              GESTURE & MODE GUIDE
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 text-left w-full mt-1">
            <div className="bg-cyan-950/50 border border-cyan-500/30 p-2.5 rounded-lg">
              <div className="text-cyan-200 text-xs font-bold font-mono flex items-center gap-1.5 mb-1">
                <span>👐</span> 2-HAND ENERGY ORB
              </div>
              <p className="text-[11px] text-cyan-300/80 leading-tight">
                Raise both hands open-palmed facing camera to summon plasma orb & lightning. Or select <b>ORB</b> mode below.
              </p>
            </div>

            <div className="bg-cyan-950/50 border border-cyan-500/30 p-2.5 rounded-lg">
              <div className="text-cyan-200 text-xs font-bold font-mono flex items-center gap-1.5 mb-1">
                <span>☝️</span> 1-HAND AIR DRAWING
              </div>
              <p className="text-[11px] text-cyan-300/80 leading-tight">
                Point with index finger to paint neon trails. Form a fist (✊) to pause drawing. Or select <b>DRAW</b> mode below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom AR Grid & Framing Corners */}
      <div className="flex items-end justify-between pointer-events-none">
        <div className="text-[9px] font-mono text-cyan-500/40 tracking-widest hidden md:block">
          GPU_ACCELERATED // LATENCY: LOW
        </div>
        <div className="text-[9px] font-mono text-cyan-500/40 tracking-widest hidden md:block">
          MODE: {selectedMode.toUpperCase()} | PALETTE: {colorConfig.name.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
