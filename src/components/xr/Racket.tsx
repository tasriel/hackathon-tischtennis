import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { BLADE_OFFSET, HIT_ZONE_Z } from "@/lib/constants";
import type { RacketPose } from "@/lib/physics";
import { RacketModel } from "@/components/models/RacketModel";

const offset = new THREE.Vector3(...BLADE_OFFSET);
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();

/**
 * Schläger folgt dem rechten Controller (1:1 Position + Drehung).
 * Ohne VR (Desktop-Test): Maus bewegt den Schläger, Mausrad öffnet/schließt ihn.
 */
export function Racket({
  poseRef, onTrigger,
}: {
  poseRef: MutableRefObject<RacketPose>;
  onTrigger: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const angle = useRef(0); // Desktop: Öffnungswinkel in Grad
  const prevCenter = useRef<THREE.Vector3 | null>(null);
  const triggerDown = useRef(false);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      angle.current = THREE.MathUtils.clamp(angle.current - Math.sign(e.deltaY) * 5, -40, 80);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  useFrame((state, delta, frame?: XRFrame) => {
    const g = group.current;
    if (!g) return;
    const pose = poseRef.current;
    let tracked = false;

    const refSpace = gl.xr.getReferenceSpace();
    if (frame && refSpace) {
      for (const src of frame.session.inputSources) {
        if (src.handedness !== "right" || !src.gripSpace) continue;
        const p = frame.getPose(src.gripSpace, refSpace);
        if (!p) continue;
        _m.fromArray(p.transform.matrix);
        _m.decompose(_p, _q, _s);
        g.position.copy(_p);
        g.quaternion.copy(_q);
        tracked = true;
        // Trigger / A-Taste = Neustart
        const pressed = !!src.gamepad && ((src.gamepad.buttons[0]?.pressed ?? false) || (src.gamepad.buttons[4]?.pressed ?? false));
        if (pressed && !triggerDown.current) onTrigger();
        triggerDown.current = pressed;
      }
    }

    if (!tracked && !gl.xr.isPresenting) {
      // Desktop: Normale zeigt zum Gegner, um Öffnungswinkel nach oben gekippt
      const a = THREE.MathUtils.degToRad(angle.current);
      const X = new THREE.Vector3(0, Math.sin(a), -Math.cos(a));
      const Z = new THREE.Vector3(0, -Math.cos(a), -Math.sin(a));
      const Y = new THREE.Vector3().crossVectors(Z, X);
      g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
      const center = new THREE.Vector3(state.pointer.x * 0.5, 0.9 + state.pointer.y * 0.35, HIT_ZONE_Z);
      g.position.copy(center).sub(offset.clone().applyQuaternion(g.quaternion));
      tracked = true;
    }

    pose.valid = tracked;
    if (!tracked) return;
    pose.quat.copy(g.quaternion);
    pose.center.copy(offset).applyQuaternion(g.quaternion).add(g.position);
    pose.normal.set(1, 0, 0).applyQuaternion(g.quaternion);
    const dt = Math.max(delta, 1 / 120);
    if (prevCenter.current) {
      const v = pose.center.clone().sub(prevCenter.current).divideScalar(dt);
      pose.vel.lerp(v, 0.5); // leicht glätten
    }
    prevCenter.current = pose.center.clone();
  });

  return (
    <group ref={group}>
      <group position={BLADE_OFFSET}>
        <RacketModel />
      </group>
    </group>
  );
}
