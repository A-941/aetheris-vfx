import HandVFXStage from "../components/HandVFXStage";

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-[#05070f]">
      <h1 className="sr-only">Aetheris - Browser-Based Real-Time Hand-Tracking VFX and Air-Drawing</h1>
      <HandVFXStage />
    </main>
  );
}
