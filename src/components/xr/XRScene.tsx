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
        <color attach="background" args={["#d7e6d2"]} />
        <fog attach="fog" args={["#d7e6d2", 8, 18]} />
        <hemisphereLight args={["#fff5e5", "#75987a", 1.3]} />
        <directionalLight position={[2.5, 5, 2.5]} intensity={1.35} color="#fff5e5" />
        <XR store={store}>
          <XROrigin position={[0, 0, PLAYER_Z]} />
          <Simulation />
        </XR>
      </Canvas>

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
