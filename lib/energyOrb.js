/**
 * lib/energyOrb.js
 * Multi-layer Iron-Man style Energy Orb renderer.
 * Combines white-hot plasma core, rotating sci-fi HUD ring arcs, orbiting particle field,
 * and procedural crackling lightning tendrils channeling into the user's fingertips.
 */

import { ParticleSystem } from "./particleSystem";

export class EnergyOrbRenderer {
  constructor() {
    this.particles = new ParticleSystem(200);
    this.ringAngle1 = 0;
    this.ringAngle2 = 0;
    this.ringAngle3 = 0;

    // Smoothed transition alpha (0..1) for fading in/out
    this.alpha = 0;

    // Lightning tendrils state
    this.lightningTimer = 0;
    this.lightningArcs = []; // Array of { points, alpha, width }

    // Smoothed position & size
    this.currentCenter = { x: 0, y: 0 };
    this.currentRadius = 80;
    this.baseRadius = 75;
    this.spawnTimer = 0;
  }

  /**
   * Generates a jagged lightning polyline between two 2D points.
   */
  generateLightning(startX, startY, endX, endY, segments = 8, jitter = 18) {
    const points = [{ x: startX, y: startY }];
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / (length || 1);
    const ny = dx / (length || 1);

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      // Envelope dampens jitter at endpoints
      const envelope = Math.sin(t * Math.PI);
      const offset = (Math.random() - 0.5) * 2 * jitter * envelope;
      points.push({
        x: startX + dx * t + nx * offset,
        y: startY + dy * t + ny * offset,
      });
    }

    points.push({ x: endX, y: endY });
    return points;
  }

  /**
   * Updates the orb state, ring rotations, particles, and lightning arcs.
   */
  update(dt, isOrbActive, hand1Points = null, hand2Points = null, colorConfig = {}) {
    const hasHands = Boolean(hand1Points || hand2Points);
    const targetAlpha = isOrbActive && hasHands ? 1.0 : 0.0;
    // Smooth lerp transition (ease in / ease out)
    this.alpha += (targetAlpha - this.alpha) * Math.min(1.0, dt * 7);

    // If completely faded out, skip heavy updates
    if (this.alpha < 0.01) {
      this.particles.clear();
      this.lightningArcs = [];
      return;
    }

    // Color definitions
    const primaryColor = colorConfig.hex || "#ff007f";
    const coreGlow = colorConfig.glow || "rgba(255, 0, 127, 0.6)";

    // Calculate midpoint and distance between palms
    if (hand1Points && hand2Points) {
      // Palm centers (average of wrist #0 and middle MCP #9)
      const palm1 = {
        x: (hand1Points[0].x + hand1Points[9].x) / 2,
        y: (hand1Points[0].y + hand1Points[9].y) / 2,
      };
      const palm2 = {
        x: (hand2Points[0].x + hand2Points[9].x) / 2,
        y: (hand2Points[0].y + hand2Points[9].y) / 2,
      };

      const targetX = (palm1.x + palm2.x) / 2;
      const targetY = (palm1.y + palm2.y) / 2;
      const palmDist = Math.hypot(palm1.x - palm2.x, palm1.y - palm2.y);

      // Smooth center position
      this.currentCenter.x += (targetX - this.currentCenter.x) * Math.min(1.0, dt * 12);
      this.currentCenter.y += (targetY - this.currentCenter.y) * Math.min(1.0, dt * 12);

      // Scale orb radius: closer palms = smaller & tighter orb; wider palms = larger orb
      const targetRadius = Math.max(45, Math.min(180, palmDist * 0.42));
      this.currentRadius += (targetRadius - this.currentRadius) * Math.min(1.0, dt * 8);
    } else if (hand1Points || hand2Points) {
      const activeHand = hand1Points || hand2Points;
      // Hover above palm
      const palm = {
        x: (activeHand[0].x + activeHand[9].x) / 2,
        y: (activeHand[0].y + activeHand[9].y) / 2 - 30,
      };

      this.currentCenter.x += (palm.x - this.currentCenter.x) * Math.min(1.0, dt * 12);
      this.currentCenter.y += (palm.y - this.currentCenter.y) * Math.min(1.0, dt * 12);
      this.currentRadius += (70 - this.currentRadius) * Math.min(1.0, dt * 8);
    }

    if (hasHands) {
      // Rotate HUD rings at varying speeds
      this.ringAngle1 += dt * 1.8;
      this.ringAngle2 -= dt * 2.4;
      this.ringAngle3 += dt * 0.9;

      // Spawn orbiting spark particles around the orb
      this.spawnTimer += dt;
      if (this.spawnTimer > 0.02) {
        this.spawnTimer = 0;
        const count = 3;
        for (let i = 0; i < count; i++) {
          const spawnAngle = Math.random() * Math.PI * 2;
          const spawnDist = this.currentRadius * (0.6 + Math.random() * 0.7);
          const px = this.currentCenter.x + Math.cos(spawnAngle) * spawnDist;
          const py = this.currentCenter.y + Math.sin(spawnAngle) * spawnDist;

          this.particles.spawn(px, py, {
            color: primaryColor,
            glowColor: "#ffffff",
            size: 2.0 + Math.random() * 2.5,
            gravity: 120,
            orbitSpeed: (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 50),
            maxLife: 0.5 + Math.random() * 0.6,
            alpha: 0.85,
          });
        }
      }

      // Update lightning arcs every few frames (approx every ~40-60ms)
      this.lightningTimer += dt;
      if (this.lightningTimer >= 0.045) {
        this.lightningTimer = 0;
        this.lightningArcs = [];

        // Fingertip landmarks (4: Thumb, 8: Index, 12: Middle, 16: Ring, 20: Pinky)
        const tipIndices = [4, 8, 12, 16, 20];
        const handsToProcess = [hand1Points, hand2Points].filter(Boolean);

        handsToProcess.forEach((hand) => {
          tipIndices.forEach((tipIdx) => {
            const tip = hand[tipIdx];
            if (tip) {
              const arc = this.generateLightning(
                this.currentCenter.x,
                this.currentCenter.y,
                tip.x,
                tip.y,
                7,
                Math.max(10, this.currentRadius * 0.22)
              );
              this.lightningArcs.push({
                points: arc,
                alpha: 0.6 + Math.random() * 0.4,
                width: 1.5 + Math.random() * 1.5,
              });

              // Occasional branching sub-arc
              if (Math.random() > 0.6 && arc.length > 4) {
                const branchStart = arc[Math.floor(arc.length / 2)];
                const branchEnd = {
                  x: branchStart.x + (Math.random() - 0.5) * 40,
                  y: branchStart.y + (Math.random() - 0.5) * 40,
                };
                this.lightningArcs.push({
                  points: this.generateLightning(branchStart.x, branchStart.y, branchEnd.x, branchEnd.y, 4, 8),
                  alpha: 0.45,
                  width: 1.0,
                });
              }
            }
          });
        });
      }
    }

    // Update particle swarm
    this.particles.update(dt, this.currentCenter.x, this.currentCenter.y);
  }

  /**
   * Renders the complete Energy Orb to the overlay canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} colorConfig
   */
  draw(ctx, colorConfig = {}) {
    if (this.alpha <= 0.01) return;

    const { x, y } = this.currentCenter;
    const r = this.currentRadius;
    const primary = colorConfig.hex || "#ff007f";
    const accent = colorConfig.accent || "#ff66cc";

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // 1. Draw Outer Corona & Radial Plasma Core
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 1.35);
    gradient.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
    gradient.addColorStop(0.2, "rgba(255, 240, 255, 0.95)");
    gradient.addColorStop(0.45, primary);
    gradient.addColorStop(0.75, accent);
    gradient.addColorStop(1.0, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.35, 0, Math.PI * 2);
    ctx.fill();

    // 2. High-intensity White-Hot Inner Core
    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = primary;
    ctx.shadowBlur = 25;
    ctx.fill();

    // 3. Draw Concentric Rotating Sci-Fi Ring Arcs (HUD Style)
    ctx.shadowBlur = 12;
    ctx.shadowColor = primary;

    // Ring 1 (Inner Segmented Ring)
    this.drawSegmentedRing(ctx, x, y, r * 0.7, this.ringAngle1, 3, 0.5, 3.0, primary);

    // Ring 2 (Middle Fast Reverse Ring with tick marks)
    this.drawSegmentedRing(ctx, x, y, r * 0.95, this.ringAngle2, 4, 0.35, 2.0, "#ffffff");
    this.drawRingTicks(ctx, x, y, r * 0.95, this.ringAngle2, 12, primary);

    // Ring 3 (Outer Scanline Ring)
    this.drawSegmentedRing(ctx, x, y, r * 1.2, this.ringAngle3, 2, 0.7, 1.5, primary);

    // 4. Draw Orbiting Particles Swarm
    this.particles.draw(ctx);

    // 5. Draw Electric Lightning Arcs to Fingertips
    ctx.save();
    this.lightningArcs.forEach((arc) => {
      if (arc.points.length < 2) return;

      // Outer glow line
      ctx.beginPath();
      ctx.moveTo(arc.points[0].x, arc.points[0].y);
      for (let i = 1; i < arc.points.length; i++) {
        ctx.lineTo(arc.points[i].x, arc.points[i].y);
      }
      ctx.strokeStyle = primary;
      ctx.lineWidth = arc.width * 2.2;
      ctx.globalAlpha = this.alpha * arc.alpha * 0.7;
      ctx.shadowColor = primary;
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Sharp white lightning core
      ctx.beginPath();
      ctx.moveTo(arc.points[0].x, arc.points[0].y);
      for (let i = 1; i < arc.points.length; i++) {
        ctx.lineTo(arc.points[i].x, arc.points[i].y);
      }
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(1, arc.width * 0.7);
      ctx.globalAlpha = this.alpha * arc.alpha;
      ctx.shadowBlur = 4;
      ctx.stroke();
    });
    ctx.restore();

    ctx.restore();
  }

  /**
   * Draws a partial segmented ring with multiple arc strokes.
   */
  drawSegmentedRing(ctx, cx, cy, radius, startAngle, segments, arcLengthRatio, lineWidth, color) {
    const step = (Math.PI * 2) / segments;
    const arcLength = step * arcLengthRatio;

    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";

    for (let i = 0; i < segments; i++) {
      const a = startAngle + i * step;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, a, a + arcLength);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Draws sci-fi radial tick marks on ring.
   */
  drawRingTicks(ctx, cx, cy, radius, angleOffset, numTicks, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    for (let i = 0; i < numTicks; i++) {
      const a = angleOffset + (i * Math.PI * 2) / numTicks;
      const r1 = radius - 4;
      const r2 = radius + 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Resets orb state.
   */
  reset() {
    this.alpha = 0;
    this.particles.clear();
    this.lightningArcs = [];
  }
}
