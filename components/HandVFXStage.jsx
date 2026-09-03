"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { initHandLandmarker, detectHands, closeHandLandmarker } from "../lib/handTracking";
import { classifyGesture } from "../lib/gestureClassifier";
import { LandmarkSmoother } from "../lib/smoothing";
import { EnergyOrbRenderer } from "../lib/energyOrb";
import { LightTrailRenderer } from "../lib/lightTrail";
import HUDOverlay from "./HUDOverlay";
import ControlBar, { NEON_PALETTES } from "./ControlBar";
import LoadingScreen from "./LoadingScreen";

export default function HandVFXStage() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Application States
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("INITIALIZING COMPUTER VISION ENGINE...");
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [activePalette, setActivePalette] = useState(NEON_PALETTES[0]);
  const [selectedMode, setSelectedMode] = useState("auto"); // 'auto' | 'orb' | 'drawing'
  const [brushSize, setBrushSize] = useState(6);
  const [showFps, setShowFps] = useState(false);
  const [fps, setFps] = useState(60);
  const [mode, setMode] = useState("idle"); // 'orb' | 'drawing' | 'idle'
  const [trackedHandsData, setTrackedHandsData] = useState([]);
  const [strokeCount, setStrokeCount] = useState(0);

  // Engine Instances Refs
  const smootherRef = useRef(new LandmarkSmoother(0.52));
  const orbRef = useRef(new EnergyOrbRenderer());
  const trailRef = useRef(new LightTrailRenderer());
  
  // Animation Loop State Refs
  const animFrameIdRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const fpsCounterRef = useRef({ frames: 0, lastUpdate: performance.now() });
  const isDetectingRef = useRef(false);
  const lastDetectionTimeRef = useRef(0);
  const lastHudUpdateRef = useRef(0);
  const lastStrokeCountRef = useRef(0);
  const lastLandmarksRef = useRef([]);
  const lastHandednessRef = useRef([]);

  // Coordinate mapping helper
  const mapLandmarksToScreen = useCallback((normalizedHands, width, height) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return normalizedHands.map((hand) =>
        hand.map((pt) => ({
          x: (1.0 - pt.x) * width,
          y: pt.y * height,
          z: pt.z || 0,
        }))
      );
    }

    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = width / height;
    let renderW, renderH, offX, offY;

    if (canvasAspect > videoAspect) {
      renderW = width;
      renderH = width / videoAspect;
      offX = 0;
      offY = (height - renderH) / 2;
    } else {
      renderH = height;
      renderW = height * videoAspect;
      offX = (width - renderW) / 2;
      offY = 0;
    }

    return normalizedHands.map((hand) =>
      hand.map((pt) => ({
        x: offX + (1.0 - pt.x) * renderW,
        y: offY + pt.y * renderH,
        z: pt.z || 0,
      }))
    );
  }, []);

  // Setup and Start Camera Stream (Optimized for Mobile)
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const isMobileDevice = typeof navigator !== "undefined" && (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (typeof window !== "undefined" && window.innerWidth < 768));

      const constraints = {
        video: {
          facingMode: "user",
          width: { ideal: isMobileDevice ? 640 : 1280 },
          height: { ideal: isMobileDevice ? 480 : 720 },
          frameRate: { ideal: isMobileDevice ? 30 : 60, min: 20 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      let msg = "Camera access denied. Please allow camera permissions in your browser settings.";
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No webcam device detected on your system.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "Webcam is already in use by another application.";
      }
      setCameraError(msg);
      setCameraActive(false);
    }
  }, []);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    lastLandmarksRef.current = [];
    smootherRef.current.reset();
  }, []);

  // Toggle Camera
  const handleToggleCamera = useCallback(() => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [cameraActive, startCamera, stopCamera]);

  // Clear Canvas Light Trails
  const handleClearCanvas = useCallback(() => {
    trailRef.current.clear();
    setStrokeCount(0);
    lastStrokeCountRef.current = 0;
  }, []);

  // Resize canvas to fill container (with mobile DPR cap)
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const isMobileDevice = typeof navigator !== "undefined" && (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);
    // Modern phones have DPR of 3.0-4.0 which creates 20+ megapixel canvases. Cap to 1.0 on mobile and 1.5 on desktop.
    const maxDpr = isMobileDevice ? 1.0 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    }
  }, []);

  // Initialize MediaPipe Model and Camera
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        setIsLoading(true);
        await initHandLandmarker((msg) => {
          if (isMounted) setLoadingMessage(msg);
        });

        if (isMounted) {
          setLoadingMessage("STARTING LIVE WEBCAM FEED...");
          await startCamera();
          handleResize();
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Initialization failure:", err);
        if (isMounted) {
          setCameraError("Failed to initialize vision model or camera feed.");
          setIsLoading(false);
        }
      }
    }

    initialize();
    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      stopCamera();
      closeHandLandmarker();
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [startCamera, stopCamera, handleResize]);

  // Main Render & Detection Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderLoop = (timestamp) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1) || 0.016;
      lastTimeRef.current = timestamp;

      // Update FPS calculation
      fpsCounterRef.current.frames++;
      if (timestamp - fpsCounterRef.current.lastUpdate >= 500) {
        const calculatedFps = (fpsCounterRef.current.frames * 1000) / (timestamp - fpsCounterRef.current.lastUpdate);
        setFps(calculatedFps);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastUpdate = timestamp;
      }

      const width = containerRef.current?.clientWidth || window.innerWidth;
      const height = containerRef.current?.clientHeight || window.innerHeight;

      // Asynchronous throttled hand detection (target 30 FPS detection on mobile to leave CPU for rendering)
      const isMobileDevice = typeof navigator !== "undefined" && (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || width < 768);
      const minDetectionInterval = isMobileDevice ? 33 : 16;

      if (cameraActive && video.readyState >= 2 && !isDetectingRef.current && (timestamp - lastDetectionTimeRef.current >= minDetectionInterval)) {
        lastDetectionTimeRef.current = timestamp;
        isDetectingRef.current = true;
        try {
          const result = detectHands(video, timestamp);
          if (result && result.landmarks) {
            lastLandmarksRef.current = result.landmarks;
            lastHandednessRef.current = result.handedness || [];
          }
        } catch (e) {
          console.warn("Detection loop error:", e);
        } finally {
          isDetectingRef.current = false;
        }
      }

      // Smooth detected landmarks
      const rawHands = lastLandmarksRef.current;
      const smoothedNormHands = smootherRef.current.smooth(rawHands, 0.52, timestamp);
      const screenHands = mapLandmarksToScreen(smoothedNormHands, width, height);

      // Classify gestures for each detected hand
      const classifiedHands = rawHands.map((handRaw, idx) => {
        const gesture = classifyGesture(handRaw);
        const handednessInfo = lastHandednessRef.current[idx]?.[0] || {};
        // Note: due to horizontal mirror flip, Left Hand becomes Right on screen
        const rawLabel = handednessInfo.categoryName || "Hand";
        const displayHand = rawLabel === "Left" ? "RIGHT" : rawLabel === "Right" ? "LEFT" : "HAND";
        return {
          gesture,
          handedness: displayHand,
          score: handednessInfo.score || 0.9,
          points: screenHands[idx],
        };
      });

      // Determine active visual mode based on option selection and gestures
      let nextMode = "idle";
      const hasHands = classifiedHands.length > 0;
      const isTwoHands = classifiedHands.length >= 2;
      const bothOpen = isTwoHands && classifiedHands[0].gesture === "OPEN_PALM" && classifiedHands[1].gesture === "OPEN_PALM";
      const pointerHand = classifiedHands.find((h) => h.gesture === "POINTER") || (selectedMode === "drawing" ? classifiedHands[0] : null);
      const fistHand = classifiedHands.find((h) => h.gesture === "FIST");

      if (selectedMode === "orb") {
        nextMode = hasHands ? "orb" : "idle";
      } else if (selectedMode === "drawing") {
        if (fistHand && !pointerHand) {
          nextMode = "idle"; // Fist pauses drawing
        } else {
          nextMode = hasHands ? "drawing" : "idle";
        }
      } else {
        // Auto Mode (AI Gesture switching)
        if (bothOpen) {
          nextMode = "orb";
        } else if (pointerHand && !fistHand) {
          nextMode = "drawing";
        } else if (fistHand) {
          nextMode = "idle";
        }
      }

      setMode((prev) => (prev !== nextMode ? nextMode : prev));

      // Throttle React HUD state update to ~5 times/sec (every 180ms) instead of 60 times/sec to prevent mobile freeze
      if (timestamp - lastHudUpdateRef.current >= 180) {
        lastHudUpdateRef.current = timestamp;
        setTrackedHandsData(classifiedHands);
      }

      // CLEAR CANVAS FOR CURRENT FRAME
      ctx.clearRect(0, 0, width, height);

      // Set additive glowing blend mode for all neon VFX
      ctx.globalCompositeOperation = "lighter";

      // 1. UPDATE & DRAW ENERGY ORB
      const orbEngine = orbRef.current;
      if (nextMode === "orb" && screenHands.length > 0) {
        orbEngine.update(dt, true, screenHands[0], screenHands[1] || null, activePalette);
      } else {
        orbEngine.update(dt, false, null, null, activePalette);
      }
      orbEngine.draw(ctx, activePalette);

      // 2. UPDATE & DRAW LIGHT TRAIL AIR PAINTING
      const trailEngine = trailRef.current;
      let cursorPoint = null;

      if (nextMode === "drawing" && pointerHand && pointerHand.points) {
        // Landmark 8 is Index Fingertip, fallback to landmark 4 or 0 if needed
        cursorPoint = pointerHand.points[8] || pointerHand.points[4] || pointerHand.points[0];
        if (cursorPoint) {
          trailEngine.addPoint(cursorPoint.x, cursorPoint.y, activePalette.hex, brushSize);
        }
      } else if (fistHand || nextMode !== "drawing") {
        trailEngine.endStroke();
      }

      trailEngine.draw(ctx, cursorPoint, activePalette.hex, nextMode === "drawing", dt);

      // Only update strokeCount React state when count actually changes
      if (trailEngine.strokes.length !== lastStrokeCountRef.current) {
        lastStrokeCountRef.current = trailEngine.strokes.length;
        setStrokeCount(trailEngine.strokes.length);
      }

      // Request next frame
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive, activePalette, selectedMode, brushSize, mapLandmarksToScreen]);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-[#05070f] overflow-hidden select-none flex items-center justify-center"
    >
      {/* Loading Overlay */}
      {isLoading && <LoadingScreen statusMessage={loadingMessage} />}

      {/* Mirrored Webcam Feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-700 pointer-events-none ${
          cameraActive && !isLoading ? "opacity-90" : "opacity-0"
        }`}
      />

      {/* Cyber Scanline & Vignette Effect Over Video */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `
            radial-gradient(circle at center, transparent 45%, rgba(5, 7, 15, 0.85) 100%),
            repeating-linear-gradient(0deg, rgba(0, 240, 255, 0.03) 0px, rgba(0, 240, 255, 0.03) 1px, transparent 1px, transparent 3px)
          `,
        }}
      />

      {/* Full-bleed Transparent VFX Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-15"
      />

      {/* Sci-Fi HUD Overlay */}
      {!isLoading && (
        <HUDOverlay
          trackedHands={trackedHandsData}
          mode={mode}
          selectedMode={selectedMode}
          fps={fps}
          showFps={showFps}
          cameraActive={cameraActive}
          cameraError={cameraError}
          colorConfig={activePalette}
        />
      )}

      {/* Floating Futuristic Control Bar with Mode & Option Selectors */}
      {!isLoading && (
        <ControlBar
          cameraActive={cameraActive}
          onToggleCamera={handleToggleCamera}
          onClearCanvas={handleClearCanvas}
          activePalette={activePalette}
          onSelectPalette={setActivePalette}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          brushSize={brushSize}
          onSelectBrushSize={setBrushSize}
          showFps={showFps}
          onToggleFps={() => setShowFps((prev) => !prev)}
          strokeCount={strokeCount}
        />
      )}
    </div>
  );
}
