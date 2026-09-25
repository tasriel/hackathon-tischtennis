import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { predict, type BallState, type RacketPose } from "@/lib/physics";
import { NET_Z } from "@/lib/constants";

const MAX = 160;

/** Halbtransparente Vorhersage der Flugbahn nach dem Kontakt – reagiert auf Schlägerhaltung. */
export function TrajectoryPreview({
  ballRef, poseRef, activeRef,
}: {
  ballRef: MutableRefObject<BallState>;
  poseRef: MutableRefObject<RacketPose>;
  activeRef: MutableRefObject<boolean>;
}) {
  const frameCount = useRef(0);
  const { line, geom, mat } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX * 3), 3));
    geom.setDrawRange(0, 0);
    const mat = new THREE.LineDashedMaterial({
      color: "#ffffff", transparent: true, opacity: 0.55, dashSize: 0.03, gapSize: 0.02,
    });
    const line = new THREE.Line(geom, mat);
    line.frustumCulled = false;
    return { line, geom, mat };
  }, []);

  useFrame(() => {
    const b = ballRef.current;
    if (!activeRef.current || !poseRef.current.valid || b.p.z < NET_Z - 0.2) {
      geom.setDrawRange(0, 0);
      return;
    }
    if (frameCount.current++ % 4 !== 0) return;
    const pr = predict(b, poseRef.current);
    const pos = geom.getAttribute("position") as THREE.BufferAttribute;
    const n = Math.min(pr.points.length, MAX);
    pr.points.slice(0, n).forEach((pt, i) => pos.setXYZ(i, pt.x, pt.y, pt.z));
    pos.needsUpdate = true;
    geom.setDrawRange(0, n);
    line.computeLineDistances();
    mat.color.set(pr.success ? "#7dffb0" : "#ff9a9a");
  });

  return <primitive object={line} />;
}
