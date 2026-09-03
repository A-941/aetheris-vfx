/**
 * lib/gestureClassifier.js
 * Geometric gesture classifier operating on MediaPipe 21-point hand landmark arrays.
 * Uses scale-invariant relative joint distances (derived from wrist/MCP ratios)
 * rather than arbitrary pixel thresholds to work across hand sizes and camera depths.
 *
 * MediaPipe 21 Hand Landmarks:
 * 0: WRIST
 * 1-4: THUMB (1: CMC, 2: MCP, 3: IP, 4: TIP)
 * 5-8: INDEX (5: MCP, 6: PIP, 7: DIP, 8: TIP)
 * 9-12: MIDDLE (9: MCP, 10: PIP, 11: DIP, 12: TIP)
 * 13-16: RING (13: MCP, 14: PIP, 15: DIP, 16: TIP)
 * 17-20: PINKY (17: MCP, 18: PIP, 19: DIP, 20: TIP)
 */

/**
 * Calculates Euclidean distance between two 2D/3D landmark points.
 */
export function euclideanDist(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Checks if a specific finger is extended relative to the palm base (wrist #0).
 * @param {Array} landmarks - 21 normalized landmarks
 * @param {number} mcpIndex - MCP joint index (e.g. 5 for index)
 * @param {number} pipIndex - PIP joint index (e.g. 6 for index)
 * @param {number} tipIndex - TIP joint index (e.g. 8 for index)
 * @returns {boolean}
 */
export function isFingerExtended(landmarks, mcpIndex, pipIndex, tipIndex) {
  const wrist = landmarks[0];
  const mcp = landmarks[mcpIndex];
  const pip = landmarks[pipIndex];
  const tip = landmarks[tipIndex];

  const distTipWrist = euclideanDist(tip, wrist);
  const distPipWrist = euclideanDist(pip, wrist);
  const distMcpWrist = euclideanDist(mcp, wrist);

  // A finger is extended when tip is further from the wrist than both PIP and MCP joints
  return distTipWrist > distPipWrist * 1.1 && distTipWrist > distMcpWrist * 1.2;
}

/**
 * Checks if a specific finger is curled close to the palm.
 */
export function isFingerCurled(landmarks, mcpIndex, pipIndex, tipIndex) {
  const wrist = landmarks[0];
  const mcp = landmarks[mcpIndex];
  const pip = landmarks[pipIndex];
  const tip = landmarks[tipIndex];

  const distTipWrist = euclideanDist(tip, wrist);
  const distPipWrist = euclideanDist(pip, wrist);
  const distMcpWrist = euclideanDist(mcp, wrist);

  // A finger is curled when tip is closer to wrist than PIP or very close to MCP
  return distTipWrist < distPipWrist || distTipWrist <= distMcpWrist * 1.1;
}

/**
 * Checks if thumb is extended.
 */
export function isThumbExtended(landmarks) {
  const wrist = landmarks[0];
  const thumbMcp = landmarks[2];
  const thumbTip = landmarks[4];
  const pinkyMcp = landmarks[17];

  const distTipWrist = euclideanDist(thumbTip, wrist);
  const distMcpWrist = euclideanDist(thumbMcp, wrist);
  const distTipPinky = euclideanDist(thumbTip, pinkyMcp);
  const distMcpPinky = euclideanDist(thumbMcp, pinkyMcp);

  return distTipWrist > distMcpWrist * 1.15 && distTipPinky > distMcpPinky * 0.9;
}

/**
 * Open palm gesture:
 * All 4 fingertips (8, 12, 16, 20) are extended away from the palm base (0)
 * relative to their MCP joints.
 * @param {Array} landmarks
 * @returns {boolean}
 */
export function isOpenPalm(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;

  const indexExt = isFingerExtended(landmarks, 5, 6, 8);
  const middleExt = isFingerExtended(landmarks, 9, 10, 12);
  const ringExt = isFingerExtended(landmarks, 13, 14, 16);
  const pinkyExt = isFingerExtended(landmarks, 17, 18, 20);

  return indexExt && middleExt && ringExt && pinkyExt;
}

/**
 * Pointer gesture:
 * Index fingertip (8) extended, middle/ring/pinky curled closer to palm than MCPs.
 * @param {Array} landmarks
 * @returns {boolean}
 */
export function isPointer(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;

  const indexExt = isFingerExtended(landmarks, 5, 6, 8);
  const middleCurled = isFingerCurled(landmarks, 9, 10, 12);
  const ringCurled = isFingerCurled(landmarks, 13, 14, 16);
  const pinkyCurled = isFingerCurled(landmarks, 17, 18, 20);

  return indexExt && middleCurled && ringCurled && pinkyCurled;
}

/**
 * Fist gesture:
 * All 4 fingertips curled close to the palm.
 * @param {Array} landmarks
 * @returns {boolean}
 */
export function isFist(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;

  const indexCurled = isFingerCurled(landmarks, 5, 6, 8);
  const middleCurled = isFingerCurled(landmarks, 9, 10, 12);
  const ringCurled = isFingerCurled(landmarks, 13, 14, 16);
  const pinkyCurled = isFingerCurled(landmarks, 17, 18, 20);

  return indexCurled && middleCurled && ringCurled && pinkyCurled;
}

/**
 * Classifies the given hand landmarks into a primary gesture enum.
 * @param {Array} landmarks
 * @returns {"OPEN_PALM" | "POINTER" | "FIST" | "UNKNOWN"}
 */
export function classifyGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return "UNKNOWN";

  if (isOpenPalm(landmarks)) return "OPEN_PALM";
  if (isPointer(landmarks)) return "POINTER";
  if (isFist(landmarks)) return "FIST";

  return "UNKNOWN";
}
