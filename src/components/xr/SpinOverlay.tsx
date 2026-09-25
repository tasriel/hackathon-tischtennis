import { useFrame, useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BALL_RADIUS } from "@/lib/constants";
import { racketPointVel, spinType, type BallState, type RacketState } from "@/lib/physics";
import { DEFAULT_IDEAL, type IdealShot } from "@/lib/idealShot";
import { Label } from "./Label";
import { RacketModel } from "./RacketModel";

/** Layer nur für die Nahaufnahme (Pfeile, Texte). Hauptkamera sieht ihn nicht. */
export const OVERLAY_LAYER = 5;
/** Layer der Anzeigetafel. Die Nahaufnahme-Kamera sieht ihn nicht (keine Rückkopplung). */
const PANEL_LAYER = 6;
/** So lange (Echtzeit) zeigt das Overlay nach dem Treffer den eigenen Schlag. */
export const REPLAY_SECONDS = 3;

export type ContactSnapshot = {
  active: boolean;
  t0: number;
  point: THREE.Vector3;
  friction: THREE.Vector3;
  spinBefore: THREE.Vector3;
  spinAfter: THREE.Vector3;
  racketPos: THREE.Vector3;
  racketQuat: THREE.Quaternion;
  racketVel: THREE.Vector3; // wirksam, Simulationszeit
  openDeg: number;
  speed: number;
  dirDeg: number;
  wrist: number;
  scale: number;
  ideal: IdealShot;
  explain: string;
};

export function makeSnapshot(): ContactSnapshot {
  return {
    active: false,
    t0: 0,
    point: new THREE.Vector3(),
    friction: new THREE.Vector3(),
    spinBefore: new THREE.Vector3(),
    spinAfter: new THREE.Vector3(),
    racketPos: new THREE.Vector3(),
    racketQuat: new THREE.Quaternion(),
    racketVel: new THREE.Vector3(),
    openDeg: 0,
    speed: 0,
    dirDeg: 0,
    wrist: 0,
    scale: 1,
    ideal: DEFAULT_IDEAL,
    explain: "",
  };
}

const SPIN_COLORS = { BACKSPIN: "#2f7de1", TOPSPIN: "#f08a24", "OHNE SPIN": "#9aa3ad" } as const;
const OK = "#9ff0b4";
const NEAR = "#ffe066";
const FAR = "#ff8a80";
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
  torus.renderOrder = head.renderOrder = 10;
  return { group: g, mat };
}

/** Gerader Pfeil (Einheitslänge entlang +Y), wird per setArrow ausgerichtet/skaliert. */
function makeArrow(color: string, opacity = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: opacity < 1, opacity });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 12), mat);
  shaft.renderOrder = head.renderOrder = 11;
  g.add(shaft, head);
  return { group: g, shaft, head, mat };
}

/** Pfeil in die Seitenansicht projiziert (nur vor/zurück + hoch/runter). */
function setArrow(a: ReturnType<typeof makeArrow>, origin: THREE.Vector3, vec: THREE.Vector3, len: number, thick = 0.004) {
  const dir = new THREE.Vector3(0, vec.y, vec.z);
  if (dir.lengthSq() < 1e-8) {
    a.group.visible = false;
    return;
  }
  a.group.visible = true;
  dir.normalize();
  a.group.position.copy(origin);
  a.group.quaternion.setFromUnitVectors(Y, dir);
  const headLen = Math.min(len * 0.4, thick * 6);
  const shaftLen = Math.max(len - headLen, 0.0001);
  a.shaft.scale.set(thick, shaftLen, thick);
  a.shaft.position.y = shaftLen / 2;
  a.head.scale.set(thick * 2.6, headLen, thick * 2.6);
  a.head.position.y = shaftLen + headLen / 2;
}

const arrowLen = (v: number) => Math.min(0.03 + v * 0.05, 0.28);
const fmt = (n: number, d = 1) => n.toFixed(d).replace(".", ",");
const grade = (diff: number, ok: number, near: number) => (diff <= ok ? OK : diff <= near ? NEAR : FAR);

function speedWord(v: number) {
  if (v < 0.4) return "kaum Bewegung";
  if (v < 3) return "Schupf-Tempo";
  if (v < 5) return "schnell";
  return "Topspin-Tempo";
}

/** Ein konkreter Verbesserungssatz aus Abweichung zum Ideal. */
function advice(s: ContactSnapshot): string {
  const i = s.ideal;
  const parts: string[] = [];
  const dOpen = i.openDeg - s.openDeg;
  if (Math.abs(dOpen) > 8) parts.push(`Blatt ${Math.abs(Math.round(dOpen))}° ${dOpen > 0 ? "weiter öffnen" : "schließen"}`);
  const dv = i.speed - s.speed;
  if (Math.abs(dv) > 0.5) parts.push(`${dv > 0 ? "schneller" : "langsamer"} (${fmt(s.speed)} → ${fmt(i.speed)} m/s)`);
  const dDir = i.dirDeg - s.dirDeg;
  if (Math.abs(dDir) > 12) parts.push(dDir > 0 ? "mehr nach oben" : "mehr nach vorn statt nach oben");
  if (s.wrist > 6) parts.push("Handgelenk ruhiger");
  return parts.length ? parts.join(", ") : "Fast perfekt – genau so wiederholen!";
}

type Texts = {
  title: string;
  angle: string;
  angleC: string;
  speed: string;
  speedC: string;
  dir: string;
  dirC: string;
  slow: string;
  explain: string;
  advice: string;
};

/**
 * Seitliche Nahaufnahme des Schlägers (von links, aus Spielersicht).
 * Nach einem Treffer zeigt sie 3 s lang den eingefrorenen Kontakt-Moment inkl.
 * Vergleich mit dem idealen Schupf, danach wieder Live-Werte.
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

  useEffect(() => {
    camera.layers.enable(PANEL_LAYER);
    camera.layers.disable(OVERLAY_LAYER);
  }, [camera]);

  const helpers = useMemo(() => {
    const spin = makeArc(SPIN_COLORS.BACKSPIN);
    const ghost = makeArc("#8fb8ee", 0.35);
    const swing = makeArrow("#2ecc71");
    const ideal = makeArrow("#ffffff", 0.85);
    const friction = makeArrow("#e53935");
    const bar = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: "#ffe066", depthTest: false }),
    );
    bar.renderOrder = 12;
    bar.rotation.y = -Math.PI / 2; // zur Kamera (die von -x schaut)
    const root = new THREE.Group();
    root.add(spin.group, ghost.group, swing.group, ideal.group, friction.group);
    setLayer(root, OVERLAY_LAYER);
    setLayer(bar, OVERLAY_LAYER);
    return { root, spin, ghost, swing, ideal, friction, bar };
  }, []);

  const labelsRef = useRef<THREE.Group>(null);
  const userRacketRef = useRef<THREE.Group>(null);
  const idealRacketRef = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (labelsRef.current) setLayer(labelsRef.current, OVERLAY_LAYER);
    if (userRacketRef.current) setLayer(userRacketRef.current, OVERLAY_LAYER);
    if (idealRacketRef.current) setLayer(idealRacketRef.current, OVERLAY_LAYER);
  });

  const panel = useRef<THREE.Mesh>(null);
  const frame = useRef<THREE.Mesh>(null);
  const [texts, setTexts] = useState<Texts>({
    title: "",
    angle: "",
    angleC: "#ffffff",
    speed: "",
    speedC: OK,
    dir: "",
    dirC: "#ffffff",
    slow: "",
    explain: "",
    advice: "",
  });
  const tick = useRef(0);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const _v = useMemo(() => new THREE.Vector3(), []);
  const _d = useMemo(() => new THREE.Vector3(), []);
  const _live = useMemo(() => new THREE.Vector3(), []);
  const _zero = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const s = snap.current;
    const age = (performance.now() - s.t0) / 1000;
    const replay = s.active && age < REPLAY_SECONDS;
    const ideal = s.ideal;

    // ---- Kamera folgt dem Schläger von links (in der Wiederholung: Kontakt-Moment) ----
    const focus = replay ? s.racketPos : racket.pos;
    camTarget.lerp(_v.set(focus.x, focus.y, focus.z - 0.06), replay && age < 0.05 ? 1 : 0.25);
    cam.position.set(camTarget.x - 0.8, camTarget.y + 0.04, camTarget.z);
    cam.lookAt(camTarget);

    // ---- Spin-Pfeil ----
    const spinVec = replay ? s.spinAfter : ball.spin;
    const w = spinVec.length();
    helpers.spin.group.visible = w > 5;
    if (w > 5) {
      helpers.spin.group.position.copy(replay ? s.point : ball.pos);
      helpers.spin.group.quaternion.setFromUnitVectors(Z, _d.copy(spinVec).divideScalar(w));
      helpers.spin.group.scale.setScalar(BALL_RADIUS * (1.5 + Math.min(w, 180) / 180));
      const st = replay ? spinType({ pos: s.point, vel: _v.set(0, 0, -1), spin: s.spinAfter }) : spinType(ball);
      helpers.spin.mat.color.set(SPIN_COLORS[st]);
    }

    // ---- Schwung-Pfeil (grün): wirksame Schlägergeschwindigkeit ----
    const liveVel = racketPointVel(racket, _zero, _live);
    const vel = replay ? s.racketVel : liveVel;
    const v = vel.length();
    const origin = replay ? s.racketPos : racket.pos;
    helpers.swing.group.visible = v > 0.15;
    if (v > 0.15) setArrow(helpers.swing, origin, vel, arrowLen(v));

    // ---- Ideal-Pfeil (weiß) ----
    const di = THREE.MathUtils.degToRad(ideal.dirDeg);
    _d.set(0, Math.sin(di), -Math.cos(di));
    _v.copy(origin);
    _v.y += 0.012;
    setArrow(helpers.ideal, _v, _d, arrowLen(ideal.speed), 0.003);

    // ---- Schläger-Geister (nur in der Wiederholung) ----
    if (userRacketRef.current) userRacketRef.current.visible = replay;
    if (idealRacketRef.current) idealRacketRef.current.visible = replay;
    if (replay && userRacketRef.current && idealRacketRef.current) {
      userRacketRef.current.position.copy(s.racketPos);
      userRacketRef.current.quaternion.copy(s.racketQuat);
      const o = THREE.MathUtils.degToRad(ideal.openDeg);
      idealRacketRef.current.position.copy(s.racketPos);
      // Blattnormale +X → Richtung Ball (−z, nach oben geöffnet)
      idealRacketRef.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(1, 0, 0),
        _v.set(0, Math.sin(o), -Math.cos(o)),
      );
    }

    // ---- Kontakt: Reibung (rot) + Spin vorher ----
    helpers.friction.group.visible = replay && s.friction.lengthSq() > 1e-6;
    helpers.ghost.group.visible = replay && s.spinBefore.lengthSq() > 25;
    if (helpers.friction.group.visible) {
      const f = s.friction.length();
      setArrow(helpers.friction, s.point, s.friction, THREE.MathUtils.clamp(f * 0.06, 0.03, 0.14), 0.003);
    }
    if (helpers.ghost.group.visible) {
      const wb = s.spinBefore.length();
      helpers.ghost.group.position.copy(s.point);
      helpers.ghost.group.quaternion.setFromUnitVectors(Z, _d.copy(s.spinBefore).divideScalar(wb));
      helpers.ghost.group.scale.setScalar(BALL_RADIUS * 3.2);
    }

    // ---- Countdown-Balken ----
    const bar = helpers.bar;
    bar.visible = replay;
    if (replay) {
      const rest = 1 - age / REPLAY_SECONDS;
      const full = 0.5;
      bar.scale.set(full * rest, 0.006, 1);
      bar.position.set(camTarget.x, camTarget.y + 0.225, camTarget.z - (full * (1 - rest)) / 2);
    }

    // ---- Texte (gedrosselt) ----
    if (labelsRef.current) labelsRef.current.position.copy(camTarget);
    if (++tick.current % 6 === 0) {
      let open: number;
      if (replay) open = s.openDeg;
      else {
        const toFar = _d.copy(racket.normal);
        if (toFar.z > 0) toFar.negate();
        open = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(toFar.y, -1, 1)));
      }
      const dir = replay ? s.dirDeg : THREE.MathUtils.radToDeg(Math.atan2(vel.y, Math.max(-vel.z, 1e-3)));
      const openTxt = `${Math.abs(Math.round(open))}° ${open >= 0 ? "offen" : "geschl."}`;
      const next: Texts = {
        title: replay ? "Wiederholung deines Schlags" : "",
        angle: `Blatt ${openTxt}  ·  ideal ${Math.round(ideal.openDeg)}°`,
        angleC: grade(Math.abs(open - ideal.openDeg), 8, 18),
        speed: `Tempo ${fmt(v)} m/s  ·  ideal ${fmt(ideal.speed)}  (${speedWord(v)})`,
        speedC: grade(Math.abs(v - ideal.speed), 0.5, 1.2),
        dir: `Richtung ${dir >= 0 ? "+" : ""}${Math.round(dir)}°  ·  ideal ${ideal.dirDeg >= 0 ? "+" : ""}${ideal.dirDeg}°${replay ? `  ·  Handgelenk ${fmt(s.wrist)} rad/s` : ""}`,
        dirC: v < 0.3 ? "#cfd8e3" : grade(Math.abs(dir - ideal.dirDeg), 12, 25),
        slow: `Zeitlupe ${fmt(replay ? s.scale : getScale(), 2)}×`,
        explain: replay ? s.explain : "",
        advice: replay ? `→ ${advice(s)}` : "",
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
      _v.set(halfW - wPanel / 2 - halfH * 0.08, halfH - hPanel / 2 - halfH * 0.22, -d);
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
      <primitive object={helpers.bar} />
      <group ref={userRacketRef} visible={false}>
        <RacketModel tint="#2ecc71" opacity={0.35} />
      </group>
      <group ref={idealRacketRef} visible={false}>
        <RacketModel tint="#ffffff" opacity={0.3} />
      </group>
      <group ref={labelsRef}>
        <Label text={texts.title} position={[0, 0.205, 0]} height={0.02} color="#ffe066" />
        <Label text={texts.angle} position={[0, 0.18, -0.08]} height={0.017} color={texts.angleC} />
        <Label text={texts.speed} position={[0, 0.158, -0.06]} height={0.017} color={texts.speedC} />
        <Label text={texts.dir} position={[0, 0.136, -0.06]} height={0.017} color={texts.dirC} />
        <Label text={texts.slow} position={[0, 0.18, 0.24]} height={0.017} color="#ffe066" />
        <Label text={texts.explain} position={[0, -0.16, 0]} height={0.017} />
        <Label text={texts.advice} position={[0, -0.185, 0]} height={0.019} color="#ffe066" />
        <Label text={"grün = dein Schwung · weiß = ideal · rot = Belag bürstet Ball"} position={[0, -0.207, 0]} height={0.013} color="#cfd8e3" />
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
