import * as THREE from "three";

export type SpinType = "ÜBERSCHNITT" | "UNTERSCHNITT" | "OHNE";

/** Vorwärtsrotation (rad/s) relativ zur Flugrichtung: + = Überschnitt, - = Unterschnitt. */
export function topspinAmount(w: THREE.Vector3, v: THREE.Vector3) {
  const d = new THREE.Vector3(v.x, 0, v.z);
  if (d.lengthSq() < 1e-6) return 0;
  d.normalize();
  const axis = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), d);
  return w.dot(axis);
}

export function classifySpin(w: THREE.Vector3, v: THREE.Vector3): { type: SpinType; rps: number } {
  const t = topspinAmount(w, v);
  const rps = Math.abs(t) / (2 * Math.PI);
  if (t > 15) return { type: "ÜBERSCHNITT", rps };
  if (t < -15) return { type: "UNTERSCHNITT", rps };
  return { type: "OHNE", rps };
}

export const spinColor = (t: SpinType) =>
  t === "ÜBERSCHNITT" ? "#ff8a3d" : t === "UNTERSCHNITT" ? "#3da9ff" : "#d8d8d8";
