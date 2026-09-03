/**
 * lib/particleSystem.js
 * High-performance, zero-allocation pre-pooled particle system for energy sparks,
 * plasma swirls, and glowing visual effects.
 */

export class Particle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.drag = 0.96;
    this.orbitSpeed = 0;
    this.orbitRadius = 0;
    this.orbitAngle = 0;
    this.gravity = 0;
    this.life = 0;
    this.maxLife = 1.0;
    this.size = 3.0;
    this.baseSize = 3.0;
    this.color = "#ff007f";
    this.glowColor = "#ffffff";
    this.alpha = 1.0;
    this.maxAlpha = 1.0;
  }

  reset() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 1.0;
    this.alpha = 0;
  }
}

export class ParticleSystem {
  constructor(maxParticles = 250) {
    this.maxParticles = maxParticles;
    this.pool = new Array(maxParticles);
    for (let i = 0; i < maxParticles; i++) {
      this.pool[i] = new Particle();
    }
  }

  /**
   * Spawns a new particle from the pre-allocated pool.
   */
  spawn(x, y, options = {}) {
    // Find first inactive particle or recycle oldest
    let particle = null;
    let minLife = Infinity;
    let oldest = this.pool[0];

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.pool[i];
      if (!p.active) {
        particle = p;
        break;
      }
      if (p.life < minLife) {
        minLife = p.life;
        oldest = p;
      }
    }

    if (!particle) {
      particle = oldest;
    }

    particle.active = true;
    particle.x = x;
    particle.y = y;
    particle.vx = options.vx ?? (Math.random() - 0.5) * 60;
    particle.vy = options.vy ?? (Math.random() - 0.5) * 60;
    particle.drag = options.drag ?? 0.95;
    particle.gravity = options.gravity ?? 0;
    particle.orbitSpeed = options.orbitSpeed ?? 0;
    particle.orbitRadius = options.orbitRadius ?? 0;
    particle.orbitAngle = options.orbitAngle ?? Math.random() * Math.PI * 2;
    particle.maxLife = options.maxLife ?? (0.6 + Math.random() * 0.8);
    particle.life = particle.maxLife;
    particle.baseSize = options.size ?? (2.0 + Math.random() * 3.5);
    particle.size = particle.baseSize;
    particle.color = options.color ?? "#ff007f";
    particle.glowColor = options.glowColor ?? "#ffffff";
    particle.maxAlpha = options.alpha ?? (0.7 + Math.random() * 0.3);
    particle.alpha = particle.maxAlpha;

    return particle;
  }

  /**
   * Updates all active particles.
   * @param {number} dt Delta time in seconds.
   * @param {number} [targetX] Optional attraction target center X.
   * @param {number} [targetY] Optional attraction target center Y.
   */
  update(dt, targetX = null, targetY = null) {
    const clampedDt = Math.min(dt, 0.1); // Guard against giant delta jumps

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life -= clampedDt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      // Normalized lifetime progress (0..1)
      const progress = p.life / p.maxLife;

      // Smooth fade-in and fade-out envelope
      if (progress > 0.8) {
        p.alpha = ((1.0 - progress) / 0.2) * p.maxAlpha;
      } else {
        p.alpha = (progress / 0.8) * p.maxAlpha;
      }

      p.size = p.baseSize * (0.4 + 0.6 * progress);

      // Central gravitational attraction / inward drift
      if (targetX !== null && targetY !== null) {
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
          const force = (p.gravity || 80) / Math.max(dist, 30);
          p.vx += (dx / dist) * force * clampedDt * 60;
          p.vy += (dy / dist) * force * clampedDt * 60;

          // Tangential swirl
          if (p.orbitSpeed) {
            p.vx += (-dy / dist) * p.orbitSpeed * clampedDt * 60;
            p.vy += (dx / dist) * p.orbitSpeed * clampedDt * 60;
          }
        }
      }

      // Apply drag
      p.vx *= Math.pow(p.drag, clampedDt * 60);
      p.vy *= Math.pow(p.drag, clampedDt * 60);

      // Move particle
      p.x += p.vx * clampedDt;
      p.y += p.vy * clampedDt;
    }
  }

  /**
   * Draws all active particles with glowing additive blending.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.pool[i];
      if (!p.active || p.alpha <= 0.01) continue;

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

      // Inner bright spark
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = p.size * 3;
      ctx.shadowColor = p.color;
      ctx.fill();

      // White-hot pinpoint core
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.size * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = p.glowColor;
      ctx.globalAlpha = Math.min(1.0, p.alpha * 1.5);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Clears all particles.
   */
  clear() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool[i].reset();
    }
  }
}
