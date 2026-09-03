/**
 * lib/lightTrail.js
 * Persistent neon light-painting air-drawing engine.
 * Records strokes in continuous pen-down segments and renders buttery-smooth
 * quadratic Bezier curves with multi-pass additive glowing neon halos.
 */

export class LightTrailRenderer {
  constructor() {
    this.strokes = []; // Array of { points: [{x, y}], color: string, baseWidth: number }
    this.currentStroke = null;
    this.isPenDown = false;
    this.minDistance = 3.0; // Min px movement to record new point
    this.cursorPulse = 0;
  }

  /**
   * Starts a new stroke segment (pen-down).
   */
  startStroke(x, y, color = "#ff007f", baseWidth = 5) {
    this.isPenDown = true;
    this.currentStroke = {
      points: [{ x, y }],
      color,
      baseWidth,
    };
    this.strokes.push(this.currentStroke);
  }

  /**
   * Adds a point to the current stroke if distance exceeds minimum threshold.
   */
  addPoint(x, y, color = "#ff007f", baseWidth = 5) {
    if (!this.isPenDown || !this.currentStroke) {
      this.startStroke(x, y, color, baseWidth);
      return;
    }

    const pts = this.currentStroke.points;
    const lastPt = pts[pts.length - 1];
    const dist = Math.hypot(x - lastPt.x, y - lastPt.y);

    if (dist >= this.minDistance) {
      pts.push({ x, y });
    }
  }

  /**
   * Ends current stroke segment (pen-up).
   */
  endStroke() {
    this.isPenDown = false;
    this.currentStroke = null;
  }

  /**
   * Clears all drawn strokes.
   */
  clear() {
    this.strokes = [];
    this.currentStroke = null;
    this.isPenDown = false;
  }

  /**
   * Returns total number of points drawn across all strokes.
   */
  getPointCount() {
    return this.strokes.reduce((total, s) => total + s.points.length, 0);
  }

  /**
   * Draws all persistent strokes and active cursor to canvas context.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object|null} cursorPosition - Current smoothed fingertip {x, y}
   * @param {string} currentColor - Active neon color
   * @param {boolean} isDrawingActive - True if currently in pointer/drawing mode
   * @param {number} dt - Delta time
   */
  draw(ctx, cursorPosition = null, currentColor = "#ff007f", isDrawingActive = false, dt = 0.016) {
    this.cursorPulse += dt * 5;

    // Draw all completed and in-progress strokes
    this.strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 2) {
        if (stroke.points && stroke.points.length === 1) {
          // Draw dot for single point
          const pt = stroke.points[0];
          ctx.save();
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, stroke.baseWidth * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = stroke.color;
          ctx.shadowColor = stroke.color;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.restore();
        }
        return;
      }

      this.renderStrokeCurve(ctx, stroke.points, stroke.color, stroke.baseWidth);
    });

    // Draw animated futuristic drawing cursor if pointer is visible
    if (cursorPosition && isDrawingActive) {
      this.drawCursor(ctx, cursorPosition.x, cursorPosition.y, currentColor, this.isPenDown);
    }
  }

  /**
   * Renders a continuous stroke using midpoint quadratic Bezier curves
   * with multi-pass additive neon glow.
   */
  renderStrokeCurve(ctx, points, color, baseWidth) {
    if (points.length < 2) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Build the smoothed curve path
    const path = new Path2D();
    path.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
      path.lineTo(points[1].x, points[1].y);
    } else {
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        path.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      // Connect to the final point
      const last = points[points.length - 1];
      const secondLast = points[points.length - 2];
      path.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
    }

    // Pass 1: Wide Outer Neon Glow / Bloom
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = baseWidth * 4.5;
    ctx.globalAlpha = 0.22;
    ctx.shadowColor = color;
    ctx.shadowBlur = 24;
    ctx.stroke(path);

    // Pass 2: Vivid Mid-Tone Neon Body
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = baseWidth * 2.2;
    ctx.globalAlpha = 0.75;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.stroke(path);

    // Pass 3: White-Hot Concentrated Core Line
    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(2, baseWidth * 0.75);
    ctx.globalAlpha = 0.95;
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 4;
    ctx.stroke(path);

    ctx.restore();
  }

  /**
   * Draws a futuristic AR drawing reticle at the active fingertip.
   */
  drawCursor(ctx, x, y, color, isPenDown) {
    ctx.save();

    const pulseScale = 1 + Math.sin(this.cursorPulse) * 0.15;
    const baseRadius = isPenDown ? 9 : 14;
    const radius = baseRadius * pulseScale;

    // Glowing outer ring reticle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isPenDown ? "#ffffff" : color;
    ctx.lineWidth = isPenDown ? 2.5 : 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.stroke();

    // Crosshairs
    const chLength = isPenDown ? 5 : 7;
    ctx.beginPath();
    ctx.moveTo(x - radius - chLength, y);
    ctx.lineTo(x - radius + 2, y);
    ctx.moveTo(x + radius - 2, y);
    ctx.lineTo(x + radius + chLength, y);
    ctx.moveTo(x, y - radius - chLength);
    ctx.lineTo(x, y - radius + 2);
    ctx.moveTo(x, y + radius - 2);
    ctx.lineTo(x, y + radius + chLength);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center pinpoint dot
    ctx.beginPath();
    ctx.arc(x, y, isPenDown ? 3.5 : 2.0, 0, Math.PI * 2);
    ctx.fillStyle = isPenDown ? "#ffffff" : color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.restore();
  }
}
