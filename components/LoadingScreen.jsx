"use client";

import React from "react";
import { Cpu, Eye, Sparkles } from "lucide-react";

export default function LoadingScreen({ statusMessage = "INITIALIZING COMPUTER VISION ENGINE..." }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070f] text-cyan-400 select-none overflow-hidden">
      {/* Background Cyber Grid */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#00f0ff 1px, transparent 1px), radial-gradient(#a855f7 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 20px 20px",
        }}
      />

      {/* Holographic Glowing Rings */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        {/* Outer dashed ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin-slow" />
        
        {/* Middle counter-rotating ring with notch */}
        <div className="absolute inset-4 rounded-full border border-fuchsia-500/50 border-t-transparent border-b-transparent animate-spin-reverse" />
        
        {/* Inner pulsing glow circle */}
        <div className="absolute inset-10 rounded-full bg-cyan-500/10 border border-cyan-400/60 shadow-[0_0_30px_rgba(0,240,255,0.4)] animate-pulse" />

        {/* Center Tech Icon */}
        <div className="relative flex flex-col items-center justify-center">
          <Sparkles className="w-10 h-10 text-cyan-300 animate-bounce" />
          <span className="text-[10px] font-mono text-cyan-200 tracking-widest mt-1">AETHERIS</span>
        </div>
      </div>

      {/* Status Readout */}
      <div className="flex flex-col items-center max-w-md text-center px-6 z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono text-cyan-400 font-semibold tracking-wider">
            [SYSTEM BOOT SEQUENCE]
          </span>
        </div>

        <h2 className="text-lg font-mono font-bold text-white tracking-widest mb-3 uppercase">
          {statusMessage}
        </h2>

        <p className="text-xs font-mono text-cyan-400/70 tracking-wide leading-relaxed">
          Loading WASM vision binaries and 21-point neural skeleton tracker. Please allow camera permissions when prompted.
        </p>

        {/* Progress scan bar */}
        <div className="w-64 h-1 bg-cyan-950 rounded-full mt-6 overflow-hidden border border-cyan-500/30">
          <div className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-fuchsia-500 w-full animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
