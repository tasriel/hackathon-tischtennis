import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import tableAsset from "@/assets/models/table.glb.asset.json";
import netAsset from "@/assets/models/net.glb.asset.json";
import paddleAsset from "@/assets/models/paddle.glb.asset.json";
import targetAsset from "@/assets/models/target.glb.asset.json";

export const MODEL_URLS = {
  table: tableAsset.url,
  net: netAsset.url,
  paddle: paddleAsset.url,
  target: targetAsset.url,
} as const;

export type MeshyModelName = keyof typeof MODEL_URLS;

/** Geklonte GLB-Hülle; Physik und Maße bleiben in den jeweiligen Szenenkomponenten. */
export function MeshyModel({
  name,
  tint,
  opacity = 1,
}: {
  name: MeshyModelName;
  tint?: THREE.ColorRepresentation;
  opacity?: number;
}) {
  const { scene } = useGLTF(MODEL_URLS[name]);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (tint === undefined && opacity === 1) return;
      const source = Array.isArray(child.material) ? child.material : [child.material];
      child.material = source.map((material) => {
        const clone = material.clone();
        if (clone instanceof THREE.MeshStandardMaterial) {
          if (tint !== undefined) clone.color.set(tint);
          clone.transparent = opacity < 1;
          clone.opacity = opacity;
          clone.depthWrite = opacity >= 1;
        }
        return clone;
      });
      if (child.material.length === 1) child.material = child.material[0] as THREE.Material;
    });
    return copy;
  }, [opacity, scene, tint]);

  return <primitive object={model} />;
}

Object.values(MODEL_URLS).forEach((url) => useGLTF.preload(url));