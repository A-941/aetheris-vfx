import "./globals.css";

export const metadata = {
  title: "AETHERIS // Real-Time Hand Tracking VFX & Air-Drawing",
  description: "GPU-accelerated browser-based real-time hand-tracking visual effects and persistent neon light painting powered by MediaPipe and Canvas 2D.",
  keywords: ["hand tracking", "mediapipe", "vfx", "canvas 2d", "air drawing", "energy orb", "computer vision", "nextjs"],
  authors: [{ name: "Aetheris AI" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#05070f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&family=Share+Tech+Mono&family=Inter:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#05070f] text-slate-100 antialiased overflow-hidden w-screen h-screen">
        {children}
      </body>
    </html>
  );
}
