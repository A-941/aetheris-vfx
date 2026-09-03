/**
 * lib/handTracking.js
 * MediaPipe HandLandmarker wrapper for real-time 21-point hand skeleton tracking.
 * Configured for VIDEO running mode with GPU acceleration (and CPU fallback).
 */

import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let handLandmarker = null;
let isInitializing = false;
let initPromise = null;

const WASM_CDN_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/**
 * Initializes the HandLandmarker instance.
 * @param {Function} [onStatusUpdate] Optional callback for initialization status reporting.
 * @returns {Promise<HandLandmarker>}
 */
export async function initHandLandmarker(onStatusUpdate) {
  if (handLandmarker) {
    return handLandmarker;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      if (onStatusUpdate) onStatusUpdate("Fetching vision WASM binaries...");
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN_URL);

      if (onStatusUpdate) onStatusUpdate("Loading neural hand landmarker model...");
      
      // Try GPU delegate first, fallback to CPU if GPU context fails
      try {
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
        });
      } catch (gpuError) {
        console.warn("GPU delegate unavailable, falling back to CPU delegate:", gpuError);
        if (onStatusUpdate) onStatusUpdate("Initializing CPU fallback...");
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
        });
      }

      if (onStatusUpdate) onStatusUpdate("Ready");
      return handLandmarker;
    } catch (err) {
      console.error("Failed to initialize HandLandmarker:", err);
      throw err;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

/**
 * Detects hands in the current video frame.
 * @param {HTMLVideoElement} videoElement
 * @param {number} timestampMs
 * @returns {object|null} Results containing landmarks, handedness, and worldLandmarks
 */
export function detectHands(videoElement, timestampMs) {
  if (!handLandmarker || !videoElement || videoElement.readyState < 2) {
    return null;
  }

  try {
    const results = handLandmarker.detectForVideo(videoElement, timestampMs);
    return {
      landmarks: results.landmarks || [], // Array of 21-point arrays (normalized x,y,z 0..1)
      handedness: results.handedness || [], // Array of [{ index, score, categoryName, displayName }]
      worldLandmarks: results.worldLandmarks || [],
    };
  } catch (err) {
    console.warn("Frame detection error:", err);
    return null;
  }
}

/**
 * Releases resources on unmount.
 */
export function closeHandLandmarker() {
  if (handLandmarker) {
    try {
      handLandmarker.close();
    } catch (e) {
      console.warn("Error closing HandLandmarker:", e);
    }
    handLandmarker = null;
    initPromise = null;
    isInitializing = false;
  }
}
