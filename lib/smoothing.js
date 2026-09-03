/**
 * lib/smoothing.js
 * Exponential Moving Average (EMA) smoother for 21-point hand landmark arrays.
 * Drastically reduces micro-jitter from webcam sensor noise while maintaining instant responsiveness.
 */

export class LandmarkSmoother {
  constructor(defaultAlpha = 0.5) {
    this.defaultAlpha = defaultAlpha;
    // History keyed by hand identifier ('hand_0', 'hand_1' or handedness)
    this.history = new Map();
    this.lastSeenTimestamp = new Map();
  }

  /**
   * Smooths an array of detected hands (each having 21 normalized {x,y,z} points).
   * @param {Array<Array<{x: number, y: number, z: number}>>} handsLandmarks
   * @param {number} [alpha] - Smoothing factor between 0.0 (smooth/delayed) and 1.0 (raw/jittery).
   * @param {number} [timestamp] - Current frame timestamp.
   * @returns {Array<Array<{x: number, y: number, z: number}>>} Smoothed landmarks
   */
  smooth(handsLandmarks, alpha = this.defaultAlpha, timestamp = performance.now()) {
    if (!handsLandmarks || !Array.isArray(handsLandmarks)) {
      return [];
    }

    const smoothedHands = [];

    // Clean up stale hands if not seen in 500ms
    for (const [key, lastTime] of this.lastSeenTimestamp.entries()) {
      if (timestamp - lastTime > 500) {
        this.history.delete(key);
        this.lastSeenTimestamp.delete(key);
      }
    }

    handsLandmarks.forEach((rawPoints, handIdx) => {
      const handKey = `hand_${handIdx}`;
      this.lastSeenTimestamp.set(handKey, timestamp);

      let prevPoints = this.history.get(handKey);

      // If no history exists or length mismatch, initialize with current raw points
      if (!prevPoints || prevPoints.length !== rawPoints.length) {
        const initialPoints = rawPoints.map((pt) => ({ x: pt.x, y: pt.y, z: pt.z || 0 }));
        this.history.set(handKey, initialPoints);
        smoothedHands.push(initialPoints);
        return;
      }

      // Compute EMA per landmark point
      const currentSmoothed = rawPoints.map((rawPt, i) => {
        const prevPt = prevPoints[i];
        return {
          x: alpha * rawPt.x + (1 - alpha) * prevPt.x,
          y: alpha * rawPt.y + (1 - alpha) * prevPt.y,
          z: alpha * (rawPt.z || 0) + (1 - alpha) * (prevPt.z || 0),
        };
      });

      this.history.set(handKey, currentSmoothed);
      smoothedHands.push(currentSmoothed);
    });

    return smoothedHands;
  }

  /**
   * Resets all smoothed history.
   */
  reset() {
    this.history.clear();
    this.lastSeenTimestamp.clear();
  }
}
