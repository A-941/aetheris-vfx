# ⚡ AETHERIS // Real-Time Neural Hand-Tracking & Cyber VFX Studio

> GPU-accelerated, browser-based real-time 21-point hand-tracking visual effects, Iron-Man style plasma energy orbs, and neon air-painting studio powered by **MediaPipe**, **Next.js 15**, and **HTML5 Canvas 2D**.

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Website-00f0ff?style=for-the-badge&logo=vercel)](https://A-941.github.io/aetheris-vfx)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks%20Vision-00f0ff?style=for-the-badge&logo=google)](https://developers.google.com/mediapipe)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

---

## 🚀 Live Demo

Experience the live application right in your browser (webcam required):
👉 **[https://A-941.github.io/aetheris-vfx](https://A-941.github.io/aetheris-vfx)**

---

## ✨ Features

- **👐 Dual-Hand Plasma Energy Orb**:
  - Raise both hands with open palms to conjure a white-hot plasma energy core.
  - Concentric rotating sci-fi HUD ring arcs with tick marks.
  - Dynamic procedural lightning tendrils and electric branching bolts channeling into all 10 fingertips.
  - Interactive distance scaling: bringing palms closer condenses the core; spreading palms expands the orb.
  
- **☝️ Persistent Neon Air Painting**:
  - Point your index finger to paint high-intensity glowing light trails in 3D screen space.
  - Quadratic Bezier spline curve smoothing for zero-corner, liquid-smooth strokes.
  - Multi-pass additive neon halo bloom effects.
  - Adjustable brush thickness (**Fine**, **Medium**, **Bold**).

- **✊ Gesture-Based Clutch & Pause**:
  - Make a fist (`✊`) to pause drawing without clearing your canvas, allowing you to reposition your hand freely.

- **🎨 Multi-Spectrum Cyber Palettes**:
  - **Magenta Flame** (`#ff007f`)
  - **Cyber Cyan** (`#00f0ff`)
  - **Electric Violet** (`#a855f7`)
  - **Solar Gold** (`#ffb700`)
  - **Matrix Emerald** (`#00ff9d`)

- **⚡ Zero-Latency Micro-Jitter Smoothing**:
  - Custom Exponential Moving Average (EMA) mathematical filter eliminates webcam noise and sensor jitter.

- **🖥️ Cyberpunk AR HUD Interface**:
  - Live 21-point tracking lock telemetry and FPS monitor.
  - Real-time gesture classification indicator (Left & Right hands).
  - Glassmorphic controls with one-click canvas clear, camera toggle, and mode switcher.

---

## 🖐️ Gesture Control Guide

| Gesture | Pose | Visual Effect / Action |
| :--- | :--- | :--- |
| **Two Open Palms** | 👐 Both hands facing camera | **Summon Energy Orb** with rotating HUD rings and crackling fingertip lightning |
| **Index Pointer** | ☝️ Index finger extended, others curled | **Paint Neon Light Trails** in active color palette |
| **Closed Fist** | ✊ All fingers curled into fist | **Pause Drawing (Clutch)** without dropping current artwork |
| **Clear Canvas** | Click `CLEAR` or switch mode | Erase drawn light trails |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI & Components**: [React 19](https://react.dev/), [Lucide React](https://lucide.dev/)
- **Styling**: [TailwindCSS 3](https://tailwindcss.com/)
- **Vision Engine**: [@mediapipe/tasks-vision](https://www.npmjs.com/package/@mediapipe/tasks-vision) (HandLandmarker)
- **VFX Rendering**: HTML5 Canvas 2D with additive blending (`globalCompositeOperation = 'lighter'`)
- **Deployment**: GitHub Actions + GitHub Pages / Vercel

---

## 💻 Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ recommended)
- A working webcam

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/A-941/aetheris-vfx.git
   cd aetheris-vfx
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local dev server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) and allow camera permissions when prompted.

---

## 📦 Production Build

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
