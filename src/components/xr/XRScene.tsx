import { Canvas } from "@react-three/fiber";
import { XR, XROrigin, createXRStore } from "@react-three/xr";
import { useState } from "react";
import { PLAYER_Z, TABLE } from "@/lib/constants";
import { Simulation, type HudState } from "./Simulation";

// Zentrale Szenendatei (gemeinsam genutzt – Änderungen absprechen)
export function XRScene() {
  const [store] = useState(() => createXRStore({ hand: false }));
  const [hud, setHud] = useState<HudState>({ result: null, hint: "", info: "", timeScale: 1 });

  return (
    <div className="fixed inset-0 bg-background">
      <Canvas
        camera={{ position: [0.25, 1.45, PLAYER_Z + 0.5], fov: 60 }}
        onCreated={({ camera }) => camera.lookAt(0, TABLE.height, 0)}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#d9d2c3"]} />
        <fog attach="fog" args={["#d9d2c3", 6, 18]} />
        <hemisphereLight args={["#fff8ec", "#6b5a48", 1.2]} />
        <directionalLight position={[2, 5, 3]} intensity={1.6} />
        <XR store={store}>
          <XROrigin position={[0, 0, PLAYER_Z]} />
          <Simulation onHud={setHud} />
        </XR>
      </Canvas>

      <div className="pointer-events-none fixed inset-x-0 top-0 flex flex-col items-center gap-2 p-4">
        <h1 className="text-lg font-semibold text-foreground">Unterschnitt zurückspielen</h1>
        <p className="max-w-xl text-center text-sm text-muted-foreground">
          In VR: Schläger in der rechten Hand, Trigger = Neustart. Am Desktop: Maus bewegt den Schläger,
          Mausrad oder W/S neigt ihn, Leertaste = Neustart.
        </p>
      </div>

      {hud.hint && (
        <div
          className={`pointer-events-none fixed inset-x-0 bottom-24 mx-auto w-fit rounded-md px-4 py-2 text-sm font-medium ${
            hud.result === "success" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
          }`}
        >
          {hud.hint}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-6 flex justify-center">
        <button
          onClick={() => store.enterVR()}
          className="rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
        >
          VR starten
        </button>
      </div>
    </div>
  );
}
