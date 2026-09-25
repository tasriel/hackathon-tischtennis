import { useFrame, useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BALL_RADIUS } from "@/lib/constants";
import { spinType, type BallState, type RacketState } from "@/lib/physics";
import { Label } from "./Label";

/** Layer nur für die Nahaufnahme (Pfeile, Texte). Hauptkamera sieht ihn nicht. */
export const OVERLAY_LAYER = 5;
/** Layer der Anzeigetafel. Die Nahaufnahme-Kamera sieht ihn nicht (keine Rückkopplung). */
const PANEL_LAYER = 6;

export type ContactSnapshot = {
  active: boolean;
  point: THREE.Vector3;
  friction: THREE.Vector3;
  spinBefore: THREE.Vector3;
  spinAfter: THREE.Vector3;
  explain: string;
};

const SPIN_COLORS = { BACKSPIN: "#2f7de1", TOPSPIN: "#f08a24", "OHNE SPIN": "#9aa3ad" } as const;
const Z = new THREE.Vector3(0, 0, 1);
const Y = new THREE.Vector3(0, 1, 0);

function setLayer(o: THREE.Object3D, l: number) {
  o.traverse((c) => c.layers.set(l));
}

/** Gebogener Pfeil in der XY-Ebene (Achse +Z), Drehsinn gegen den Uhrzeiger um +Z. */
function makeArc(color: string, opacity = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthTest: false });
  const arc = Math.PI * 1.4;
  const torus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 8, 40, arc), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 12), mat);
  head.position.set(Math.cos(arc), Math.sin(arc), 0);
  head.quaternion.setFromUnitVectors(Y, new THREE.Vector3(-Math.sin(arc), Math.cos(arc), 0));
  g.add(torus, head);
  g.renderOrder = 10;
  torus.renderOrder = head.renderOrder = 10;
  return { group: g, mat };
}

/** Gerader Pfeil (Einheitslänge entlang +Y), wird per setArrow ausgerichtet/skaliert. */
function makeArrow(color: string) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 12), mat);
  shaft.renderOrder = head.renderOrder = 10;
  g.add(shaft, head);
  return { group: g, shaft, head, mat };
}

function setArrow(a: ReturnType<typeof makeArrow>, origin: THREE.Vector3, dir: THREE.Vector3, len: number, thick = 0.004) {
  a.group.position.copy(origin);
  a.group.quaternion.setFromUnitVectors(Y, dir);
  const headLen = Math.min(len * 0.4, thick * 6);
  const shaftLen = Math.max(len - headLen, 0.0001);
  a.shaft.scale.set(thick, shaftLen, thick);
  a.shaft.position.y = shaftLen / 2;
  a.head.scale.set(thick * 2.6, headLen, thick * 2.6);
  a.head.position.y = shaftLen + headLen / 2;
}

function speedWord(v: number) {
  if (v < 0.4) return "kaum Bewegung";
  if (v < 3) return "Schupf-Tempo";
  if (v < 5) return "schnell";
  return "Topspin-Tempo";
}

/**
 * Seitliche Nahaufnahme des Schlägers (von links, aus Spielersicht).
 * Rendert dieselbe Szene mit einer zweiten Kamera in eine Textur und zeigt sie
 * am Desktop oben rechts, in VR als Tafel links vor dem Spieler.
 */
export function SpinOverlay({
  ball,
  racket,
  snap,
  getScale,
}: {
  ball: BallState;
  racket: RacketState;
  snap: React.MutableRefObject<ContactSnapshot>;
  getScale: () => number;
}) {
  const { gl, scene, camera } = useThree();
  const isXR = useXR((s) => s.session != null);

  const fbo = useMemo(() => {
    const t = new THREE.WebGLRenderTarget(800, 600, { samples: 4 });
    t.texture.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => fbo.dispose(), [fbo]);

  const cam = useMemo(() => {
    const c = new THREE.PerspectiveCamera(32, 4 / 3, 0.2, 6);
    c.layers.enable(OVERLAY_LAYER);
    return c;
  }, []);

  // Hauptkamera sieht die Tafel, aber nicht die Overlay-Pfeile
  useEffect(() => {
    camera.layers.enable(PANEL_LAYER);
    camera.layers.disable(OVERLAY_LAYER);
  }, [camera]);

  const helpers = useMemo(() => {
    const spin = makeArc(SPIN_COLORS.BACKSPIN);
    const ghost = makeArc("#8fb8ee", 0.35);
    const swing = makeArrow("#2ecc71");
    const friction = makeArrow("#e53935");
    const root = new THREE.Group();
    root.add(spin.group, ghost.group, swing.group, friction.group);
    setLayer(root, OVERLAY_LAYER);
    return { root, spin, ghost, swing, friction };
  }, []);

  const labelsRef = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (labelsRef.current) setLayer(labelsRef.current, OVERLAY_LAYER);
  });

  const panel = useRef<THREE.Mesh>(null);
  const frame = useRef<THREE.Mesh>(null);
  const [texts, setTexts] = useState({ angle: "", speed: "", slow: "", explain: "" });
  const tick = useRef(0);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const _v = useMemo(() => new THREE.Vector3(), []);
  const _d = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const s = snap.current;
    // ---- Kamera folgt dem Schläger von links ----
    camTarget.lerp(_v.set(racket.pos.x, racket.pos.y, racket.pos.z - 0.06), 0.25);
    cam.position.set(camTarget.x - 0.8, camTarget.y + 0.04, camTarget.z);
    cam.lookAt(camTarget);

    // ---- Spin-Pfeil am Ball ----
    const w = ball.spin.length();
    const st = spinType(ball);
    helpers.spin.group.visible = w > 5;
    if (w > 5) {
      helpers.spin.group.position.copy(ball.pos);
      helpers.spin.group.quaternion.setFromUnitVectors(Z, _d.copy(ball.spin).divideScalar(w));
      const r = BALL_RADIUS * (1.5 + Math.min(w, 180) / 180);
      helpers.spin.group.scale.setScalar(r);
      helpers.spin.mat.color.set(SPIN_COLORS[st]);
    }

    // ---- Schwung-Pfeil (Echtzeit-Bewegung des Schlägers) ----
    const v = racket.vel.length();
    helpers.swing.group.visible = v > 0.15;
    if (v > 0.15) {
      setArrow(helpers.swing, racket.pos, _d.copy(racket.vel).divideScalar(v), Math.min(0.03 + v * 0.05, 0.28));
    }

    // ---- Kontakt: Reibung + Spin vorher ----
    helpers.friction.group.visible = s.active && s.friction.lengthSq() > 1e-6;
    helpers.ghost.group.visible = s.active && s.spinBefore.lengthSq() > 25;
    if (helpers.friction.group.visible) {
      const f = s.friction.length();
      setArrow(helpers.friction, s.point, _d.copy(s.friction).divideScalar(f), THREE.MathUtils.clamp(f * 0.06, 0.03, 0.14), 0.003);
    }
    if (helpers.ghost.group.visible) {
      const wb = s.spinBefore.length();
      helpers.ghost.group.position.copy(s.point);
      helpers.ghost.group.quaternion.setFromUnitVectors(Z, _d.copy(s.spinBefore).divideScalar(wb));
      helpers.ghost.group.scale.setScalar(BALL_RADIUS * 3.2);
    }

    // ---- Texte (gedrosselt) ----
    if (labelsRef.current) labelsRef.current.position.copy(camTarget);
    if (++tick.current % 6 === 0) {
      const toFar = _d.copy(racket.normal);
      if (toFar.z > 0) toFar.negate();
      const open = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(toFar.y, -1, 1)));
      const next = {
        angle: `Blatt ${Math.abs(Math.round(open))}° ${open >= 0 ? "offen" : "geschlossen"}`,
        speed: `Schwung ${v.toFixed(1).replace(".", ",")} m/s – ${speedWord(v)}`,
        slow: `Zeitlupe ${getScale().toFixed(2).replace(".", ",")}×`,
        explain: s.active ? s.explain : "",
      };
      if (JSON.stringify(next) !== JSON.stringify(texts)) setTexts(next);
    }

    // ---- Nahaufnahme rendern ----
    const xrOn = gl.xr.enabled;
    gl.xr.enabled = false;
    const prev = gl.getRenderTarget();
    gl.setRenderTarget(fbo);
    gl.clear();
    gl.render(scene, cam);
    gl.setRenderTarget(prev);
    gl.xr.enabled = xrOn;

    // ---- Tafel platzieren ----
    const p = panel.current;
    if (!p) return;
    if (isXR) {
      p.position.set(-0.62, 1.3, 1.25);
      p.rotation.set(0, 0.7, 0);
      p.scale.set(0.48, 0.36, 1);
    } else {
      const pc = camera as THREE.PerspectiveCamera;
      const d = 0.5;
      const halfH = Math.tan(THREE.MathUtils.degToRad(pc.fov / 2)) * d;
      const halfW = halfH * pc.aspect;
      const h = halfH * 0.85;
      const wPanel = Math.min(h * (4 / 3), halfW * 0.9);
      const hPanel = wPanel * 0.75;
      _v.set(halfW - wPanel / 2 - halfH * 0.04, halfH - hPanel / 2 - halfH * 0.22, -d);
      p.position.copy(_v.applyQuaternion(pc.quaternion).add(pc.position));
      p.quaternion.copy(pc.quaternion);
      p.scale.set(wPanel, hPanel, 1);
    }
    const f = frame.current;
    if (f) {
      f.position.copy(p.position);
      f.quaternion.copy(p.quaternion);
      f.scale.set(p.scale.x * 1.03, p.scale.y * 1.04, 1);
    }
  });

  return (
    <>
      <primitive object={helpers.root} />
      <group ref={labelsRef}>
        <Label text={texts.angle} position={[0, 0.2, -0.13]} height={0.022} />
        <Label text={texts.speed} position={[0, 0.172, -0.13]} height={0.02} color="#bff5cf" />
        <Label text={texts.slow} position={[0, 0.2, 0.22]} height={0.022} color="#ffe066" />
        <Label text={texts.explain} position={[0, -0.18, 0]} height={0.022} />
      </group>
      <mesh ref={frame} renderOrder={19} onUpdate={(m) => m.layers.set(PANEL_LAYER)}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#1b2430" depthTest={false} />
      </mesh>
      <mesh ref={panel} renderOrder={20} onUpdate={(m) => m.layers.set(PANEL_LAYER)}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={fbo.texture} toneMapped={false} depthTest={false} />
      </mesh>
    </>
  );
}
