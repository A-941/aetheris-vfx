"use client";

import React from "react";
import { Camera, CameraOff, Trash2, Activity, Palette, Sparkles, Wand2, Flame, Edit3 } from "lucide-react";

export const NEON_PALETTES = [
  { id: "magenta", name: "Magenta Flame", hex: "#ff007f", accent: "#ff66cc", glow: "rgba(255, 0, 127, 0.6)" },
  { id: "cyan", name: "Cyber Cyan", hex: "#00f0ff", accent: "#70ffff", glow: "rgba(0, 240, 255, 0.6)" },
  { id: "purple", name: "Electric Violet", hex: "#a855f7", accent: "#d8b4fe", glow: "rgba(168, 85, 247, 0.6)" },
  { id: "gold", name: "Solar Gold", hex: "#ffb700", accent: "#ffe066", glow: "rgba(255, 183, 0, 0.6)" },
  { id: "green", name: "Matrix Emerald", hex: "#00ff9d", accent: "#8affcf", glow: "rgba(0, 255, 157, 0.6)" },
];

export const BRUSH_SIZES = [
  { id: "thin", label: "Fine", size: 3 },
  { id: "medium", label: "Med", size: 6 },
  { id: "thick", label: "Bold", size: 12 },
];

export default function ControlBar({
  cameraActive,
  onToggleCamera,
  onClearCanvas,
  activePalette,
  onSelectPalette,
  selectedMode = "auto", // 'auto' | 'orb' | 'drawing'
  onSelectMode,
  brushSize = 6,
  onSelectBrushSize,
  showFps,
  onToggleFps,
  strokeCount = 0,
}) {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-2 md:gap-3 bg-black/80 backdrop-blur-2xl border border-cyan-500/35 px-4 py-2.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(0,240,255,0.2)] select-none pointer-events-auto transition-all max-w-[96vw] overflow-x-auto">
      
      {/* 1. Mode Selector Buttons */}
      <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-cyan-500/30">
        <button
          onClick={() => onSelectMode("auto")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
            selectedMode === "auto"
              ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)]"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800"
          }`}
          title="Auto Gesture Mode (Switch by Hand Pose)"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>AUTO</span>
        </button>

        <button
          onClick={() => onSelectMode("orb")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
            selectedMode === "orb"
              ? "bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.4)]"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800"
          }`}
          title="Force Energy Orb Mode"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>ORB</span>
        </button>

        <button
          onClick={() => onSelectMode("drawing")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
            selectedMode === "drawing"
              ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)]"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800"
          }`}
          title="Force Air Drawing Mode"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>DRAW</span>
        </button>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-cyan-500/30 hidden sm:block" />

      {/* 2. Brush Size Options (Visible in Draw Mode or Auto) */}
      <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-cyan-500/20">
        <span className="text-[10px] font-mono text-cyan-400/70 px-1 hidden lg:inline">BRUSH:</span>
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelectBrushSize(b.size)}
            className={`px-2 py-1 rounded-md font-mono text-[11px] font-bold transition-all ${
              brushSize === b.size
                ? "bg-cyan-400/20 text-cyan-200 border border-cyan-400/60"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-cyan-500/30 hidden sm:block" />

      {/* 3. Color Palette Selector */}
      <div className="flex items-center gap-1.5 bg-neutral-900/90 p-1 rounded-xl border border-cyan-500/20">
        <span className="text-[10px] font-mono text-cyan-400/70 px-1 hidden md:inline flex items-center gap-1">
          <Palette className="w-3 h-3" /> COLOR:
        </span>
        {NEON_PALETTES.map((palette) => {
          const isSelected = activePalette.id === palette.id;
          return (
            <button
              key={palette.id}
              onClick={() => onSelectPalette(palette)}
              className={`w-6 h-6 md:w-7 md:h-7 rounded-lg transition-transform relative flex items-center justify-center ${
                isSelected ? "scale-110 shadow-lg" : "opacity-60 hover:opacity-100 hover:scale-105"
              }`}
              style={{
                backgroundColor: palette.hex,
                boxShadow: isSelected ? `0 0 12px ${palette.hex}` : "none",
              }}
              title={palette.name}
            >
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#ffffff]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-cyan-500/30 hidden sm:block" />

      {/* 4. Action Controls */}
      <div className="flex items-center gap-2">
        {/* Clear Canvas */}
        <button
          onClick={onClearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-neutral-900/80 text-neutral-300 border border-neutral-700/60 hover:border-fuchsia-500/60 hover:text-white hover:bg-fuchsia-950/40 transition-all hover:shadow-[0_0_15px_rgba(217,70,239,0.3)]"
          title="Clear Drawn Light Trails"
        >
          <Trash2 className="w-3.5 h-3.5 text-fuchsia-400" />
          <span className="hidden sm:inline">CLEAR</span>
          {strokeCount > 0 && (
            <span className="bg-fuchsia-950 border border-fuchsia-500/40 text-[10px] text-fuchsia-300 px-1.5 py-0.2 rounded-full">
              {strokeCount}
            </span>
          )}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={onToggleCamera}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
            cameraActive
              ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-900/80 shadow-[0_0_12px_rgba(0,240,255,0.25)]"
              : "bg-red-950/80 text-red-300 border border-red-500/50 hover:bg-red-900/80 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
          }`}
          title={cameraActive ? "Stop Camera" : "Start Camera"}
        >
          {cameraActive ? <Camera className="w-3.5 h-3.5 text-cyan-400" /> : <CameraOff className="w-3.5 h-3.5 text-red-400" />}
          <span className="hidden sm:inline">{cameraActive ? "ON" : "OFF"}</span>
        </button>

        {/* FPS Toggle */}
        <button
          onClick={onToggleFps}
          className={`p-1.5 rounded-xl font-mono text-xs transition-all border ${
            showFps
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
              : "bg-neutral-900/80 text-neutral-400 border-neutral-700 hover:text-white"
          }`}
          title="Toggle FPS"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
