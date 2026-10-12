import { Canvas } from "@react-three/fiber";
import { XR, XROrigin, createXRStore, useXR } from "@react-three/xr";
import { ChevronDown, HelpCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PLAYER_Z, TABLE } from "@/lib/constants";
import { loadCalibration, useSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Simulation } from "./Simulation";

function XRStatus({ onChange }: { onChange: (active: boolean) => void }) {
  const active = useXR((state) => state.session != null);
  useEffect(() => onChange(active), [active, onChange]);
  return null;
}

function DesktopHelp() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <Button className="fixed left-4 top-4 z-20" size="icon" variant="secondary" onClick={() => setOpen(true)} title="Desktop-Steuerung öffnen" aria-label="Desktop-Steuerung öffnen">
        <HelpCircle />
      </Button>
    );
  }
  return (
    <aside className="fixed left-4 top-4 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-md border border-border bg-card/95 p-4 text-card-foreground shadow-lg backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Desktop-Steuerung</h2>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpen(false)} title="Steuerung einklappen" aria-label="Steuerung einklappen">
          <X />
        </Button>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
        <dt className="font-semibold">Maus</dt><dd>Schläger bewegen</dd>
        <dt className="font-semibold">W / S · Rad</dt><dd>Schläger neigen</dd>
        <dt className="font-semibold">Leertaste</dt><dd>Ball einspielen</dd>
        <dt className="font-semibold">Tab</dt><dd>Einstellungen</dd>
        <dt className="font-semibold">1–3 · J/K/L</dt><dd>Schnitt · Ziel</dd>
        <dt className="font-semibold">5–8 · 9–=</dt><dd>Belag · Rückschläge</dd>
        <dt className="font-semibold">M · R</dt><dd>Zeitlupe · Review</dd>
      </dl>
      <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => setOpen(false)}>
        <ChevronDown /> Einklappen
      </Button>
    </aside>
  );
}

// Zentrale Szenendatei (gemeinsam genutzt – Änderungen absprechen)
export function XRScene() {
  const [store] = useState(() => createXRStore({ hand: false }));
  const [isXR, setIsXR] = useState(false);
  const { tableOffset } = useSettings();
  useEffect(() => {
    loadCalibration(window.localStorage);
  }, []);
  return (
    <div className="fixed inset-0 bg-background">
      <Canvas
        camera={{ position: [-0.1, 1.7, PLAYER_Z + 1.0], fov: 55 }}
        onCreated={({ camera }) => camera.lookAt(0, TABLE.height, 0)}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#d7e6d2"]} />
        <fog attach="fog" args={["#d7e6d2", 8, 18]} />
        <hemisphereLight args={["#fff5e5", "#75987a", 1.3]} />
        <directionalLight position={[2.5, 5, 2.5]} intensity={1.35} color="#fff5e5" />
        <XR store={store}>
          <XRStatus onChange={setIsXR} />
          {/* Spieler tiefer setzen = Tisch wirkt höher; Physik bleibt unverändert */}
          <XROrigin position={[0, -tableOffset, PLAYER_Z]} />
          <Simulation />
        </XR>
      </Canvas>

      {!isXR && <DesktopHelp />}

      {!isXR && <div className="fixed inset-x-0 bottom-6 flex justify-center">
        <Button
          onClick={() => store.enterVR()}
          size="lg"
          className="text-base"
        >
          VR starten
        </Button>
      </div>}
    </div>
  );
}
