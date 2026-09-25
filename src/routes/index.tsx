import { createFileRoute } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { XR, createXRStore } from "@react-three/xr";
import { useEffect, useState } from "react";
import { XRScene } from "@/components/xr/XRScene";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Unterschnitt verstehen – XR Tischtennis-Trainer" },
      { name: "description", content: "VR-Lernmoment: Wie Schlägerwinkel, Bewegung und Timing Rotation und Flugbahn eines Tischtennisballs verändern." },
      { property: "og:title", content: "Unterschnitt verstehen – XR Tischtennis-Trainer" },
      { property: "og:description", content: "Zeitlupe, sichtbare Rotation und Sofort-Feedback in VR für Tischtennis-Anfänger." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const store = createXRStore({
  controller: { rayPointer: false, grabPointer: false, teleportPointer: false },
  hand: false,
  emulate: false,
});

function Index() {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
    if (!xr) setSupported(false);
    else xr.isSessionSupported("immersive-vr").then(setSupported).catch(() => setSupported(false));
  }, []);

  return (
    <div className="fixed inset-0 bg-background">
      <Canvas camera={{ position: [0, 1.5, 0.9], fov: 55 }} onCreated={({ camera }) => camera.lookAt(0, 0.85, -1.6)}>
        <XR store={store}>
          <XRScene />
        </XR>
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-3 p-4">
        <h1 className="rounded-md bg-card/85 px-4 py-2 text-lg font-semibold text-card-foreground">
          Unterschnitt zurückspielen
        </h1>
        <button
          onClick={() => store.enterVR()}
          disabled={supported === false}
          className="pointer-events-auto rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow disabled:opacity-50"
        >
          {supported === false ? "VR nicht verfügbar (Desktop-Test aktiv)" : "VR starten"}
        </button>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-center text-sm text-muted-foreground">
        VR: rechter Controller = Schläger · Trigger = neuer Ball — Desktop: Maus bewegt, Mausrad öffnet/schließt den Schläger
      </div>
    </div>
  );
}
