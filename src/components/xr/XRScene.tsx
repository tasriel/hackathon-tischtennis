import { Canvas } from "@react-three/fiber";
import { XR, XROrigin, createXRStore } from "@react-three/xr";
import { useState } from "react";
import { PLAYER_Z, TABLE } from "@/lib/constants";
import { Simulation } from "./Simulation";

// Zentrale Szenendatei (gemeinsam genutzt – Änderungen absprechen)
export function XRScene() {
  const [store] = useState(() => createXRStore({ hand: false }));
  return (
    <div className="fixed inset-0 bg-background">
      <Canvas
        camera={{ position: [-0.1, 1.7, PLAYER_Z + 1.0], fov: 55 }}
        onCreated={({ camera }) => camera.lookAt(0, TABLE.height, 0)}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#d8dde3"]} />
        <fog attach="fog" args={["#d8dde3", 7, 16]} />
        <hemisphereLight args={["#f8fbff", "#9aa4b1", 1.05]} />
        <directionalLight position={[2.5, 5, 2.5]} intensity={1.25} />
        <XR store={store}>
          <XROrigin position={[0, 0, PLAYER_Z]} />
          <Simulation />
        </XR>
      </Canvas>

      <div className="pointer-events-none fixed inset-x-0 top-0 flex flex-col items-center gap-2 p-4">
        <h1 className="text-lg font-semibold text-foreground">Unterschnitt zurückspielen</h1>
        <p className="max-w-xl text-center text-sm text-muted-foreground">
          In VR: Schläger rechts, rechter Trigger = nächster Ball, Schnitt-Variante und Target links bedienen. Am Desktop: Maus bewegt den Schläger,
          Mausrad oder W/S neigt ihn, Leertaste = nächster Ball, 1/2/3 = Schnitt, J/K/L = Target.
        </p>
      </div>


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
