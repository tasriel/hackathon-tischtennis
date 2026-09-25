import { useFrame, useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BALL_RADIUS, RACKET_RADIUS, TABLE } from "@/lib/constants";
import { racketPointVel, slowmoBoost, spinType, type BallState, type RacketState } from "@/lib/physics";
import { DEFAULT_IDEAL, type IdealShot } from "@/lib/idealShot";
import { settings } from "@/lib/settings";
import { STROKES } from "@/lib/strokes";
import { Label } from "./Label";

/** Layer nur für die Nahaufnahme (Pfeile, Texte). Hauptkamera sieht ihn nicht. */
export const OVERLAY_LAYER = 5;
/** Layer der Anzeigetafel. Die Nahaufnahme-Kamera sieht ihn nicht (keine Rückkopplung). */
const PANEL_LAYER = 6;
/** Aufgezeichnete Zeit vor / nach dem Balltreffpunkt (Echtzeit, s). */
export const CLIP_BEFORE = 0.6;
export const CLIP_AFTER = 0.4;
/** Pause am Balltreffpunkt in der Wiederholung (s). */
const CONTACT_PAUSE = 1;

export type ClipFrame = { t: number; pos: THREE.Vector3; quat: THREE.Quaternion; ball: THREE.Vector3; spin: THREE.Vector3 };

export type ContactSnapshot = {
  active: boolean;
  /** Aufzeichnung fertig → Wiederholung läuft in Schleife bis zum nächsten Ball */
  ready: boolean;
  clip: ClipFrame[];
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
    ready: false,
    clip: [],
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

const SPIN_COLORS = { BACKSPIN: "#70a5ff", TOPSPIN: "#f3a14a", "OHNE SPIN": "#9aa3ad" } as const;
const USER = "#f8fafc";
const IDEAL = "#2ee66b";
const OK = "#9ff0b4";
const NEAR = "#e6d36a";
const FAR = "#ff9b93";
const PANEL_BG = "#050914";
const PANEL_INSET = "#0b1530";
const VIOLET = "#7c3aed";
const VIOLET_SOFT = "#c4b5fd";
const TEXT_MUTED = "#cbd5e1";
const Z = new THREE.Vector3(0, 0, 1);
const Y = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);

function setLayer(o: THREE.Object3D, l: number) {
  o.traverse((c) => c.layers.set(l));
}

function makeArc(color: string) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false });
  const arc = Math.PI * 1.4;
  const torus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 8, 40, arc), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 12), mat);
  head.position.set(Math.cos(arc), Math.sin(arc), 0);
  head.quaternion.setFromUnitVectors(Y, new THREE.Vector3(-Math.sin(arc), Math.cos(arc), 0));
  g.add(torus, head);
  torus.renderOrder = head.renderOrder = 10;
  return { group: g, mat };
}

function makeArrow(color: string) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, depthTest: false });
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

/** Scheibe als Schläger-Geist; Blattnormale = lokale +X (wie der echte Schläger). */
function makeGhost(color: string, opacity: number) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthTest: false, side: THREE.DoubleSide });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(RACKET_RADIUS, RACKET_RADIUS, 0.006, 32), mat);
  disc.rotation.z = -Math.PI / 2;
  disc.renderOrder = 9;
  g.add(disc);
  return g;
}

function makeTrail(color: string) {
  const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color, depthTest: false }));
  line.renderOrder = 8;
  line.frustumCulled = false;
  return line;
}

const arrowLen = (v: number) => Math.min(0.04 + v * 0.04, 0.22);
const fmt = (n: number, d = 1) => n.toFixed(d).replace(".", ",");
const grade = (diff: number, ok: number, near: number) => (diff <= ok ? OK : diff <= near ? NEAR : FAR);
const idealNormal = (openDeg: number, out: THREE.Vector3) => {
  const o = THREE.MathUtils.degToRad(openDeg);
  return out.set(0, Math.sin(o), -Math.cos(o));
};
const idealDir = (dirDeg: number, out: THREE.Vector3) => {
  const d = THREE.MathUtils.degToRad(dirDeg);
  return out.set(0, Math.sin(d), -Math.cos(d));
};

/** Ein konkreter Verbesserungssatz aus Abweichung zum Ideal. */
function advice(s: ContactSnapshot): string {
  const i = s.ideal;
  const parts: string[] = [];
  const dOpen = i.openDeg - s.openDeg;
  if (Math.abs(dOpen) > 8) parts.push(`Blatt ${Math.abs(Math.round(dOpen))}° ${dOpen > 0 ? "öffnen" : "schließen"}`);
  const dv = i.speed - s.speed;
  if (Math.abs(dv) > 0.5) parts.push(dv > 0 ? "schneller" : "langsamer");
  const dDir = i.dirDeg - s.dirDeg;
  if (Math.abs(dDir) > 12) parts.push(dDir > 0 ? "mehr nach oben" : "mehr nach vorn");
  return parts.length ? parts.join(" · ") : "Fast perfekt – genau so wiederholen!";
}

type Texts = { title: string; angle: string; angleC: string; speed: string; speedC: string; dir: string; dirC: string; advice: string; state: string };

/** Frame der Aufzeichnung zur Zeit t interpolieren. */
function sampleClip(clip: ClipFrame[], t: number, pos: THREE.Vector3, quat: THREE.Quaternion, ball: THREE.Vector3) {
  let i = 0;
  while (i < clip.length - 2 && clip[i + 1]!.t < t) i++;
  const a = clip[i]!;
  const b = clip[i + 1] ?? a;
  const k = b.t > a.t ? THREE.MathUtils.clamp((t - a.t) / (b.t - a.t), 0, 1) : 0;
  pos.lerpVectors(a.pos, b.pos, k);
  quat.slerpQuaternions(a.quat, b.quat, k);
  ball.lerpVectors(a.ball, b.ball, k);
}

/**
 * Seitliche Nahaufnahme des Schlägers (von links, aus Spielersicht).
 * Live: eigene Bewegung (weiß) vs. perfekte Bewegung (grün).
 * Nach dem Treffer: Animation des Schlags in Schleife mit 1 s Pause am Treffpunkt,
 * parallel dazu die perfekte Bewegung in Grün – bis der nächste Ball kommt.
 */
export function SpinOverlay({
  ball,
  racket,
  snap,
}: {
  ball: BallState;
  racket: RacketState;
  snap: React.MutableRefObject<ContactSnapshot>;
  getScale?: () => number;
}) {
  const { gl, scene, camera } = useThree();
  const isXR = useXR((s) => s.session != null);

  const fbo = useMemo(() => {
    const t = new THREE.WebGLRenderTarget(1120, 630, { samples: 4 });
    t.texture.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => fbo.dispose(), [fbo]);

  const cam = useMemo(() => {
    const c = new THREE.PerspectiveCamera(30, 16 / 9, 0.2, 6);
    c.layers.enable(OVERLAY_LAYER);
    return c;
  }, []);

  useEffect(() => {
    camera.layers.enable(PANEL_LAYER);
    camera.layers.disable(OVERLAY_LAYER);
  }, [camera]);

  const helpers = useMemo(() => {
    const spin = makeArc(SPIN_COLORS.BACKSPIN);
    const user = makeArrow(USER);
    const ideal = makeArrow(IDEAL);
    const userRacket = makeGhost(USER, 0.55);
    const idealRacket = makeGhost(IDEAL, 0.45);
    const ghostBall = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 16, 12),
      new THREE.MeshBasicMaterial({ color: "#ffb347", depthTest: false }),
    );
    ghostBall.renderOrder = 12;
    const userTrail = makeTrail(USER);
    const idealTrail = makeTrail(IDEAL);
    const tableLine = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 3), new THREE.MeshBasicMaterial({ color: "#1b3a68" }));
    const sidePanel = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.5), new THREE.MeshBasicMaterial({ color: PANEL_INSET, transparent: true, opacity: 0.92, depthTest: false }));
    sidePanel.rotation.y = -Math.PI / 2;
    sidePanel.renderOrder = 7;
    const divider = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.5, 0.004), new THREE.MeshBasicMaterial({ color: VIOLET_SOFT, transparent: true, opacity: 0.55, depthTest: false }));
    divider.renderOrder = 7;
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: VIOLET_SOFT, depthTest: false }));
    const marker = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: "#ffffff", depthTest: false }));
    bar.renderOrder = marker.renderOrder = 12;
    bar.rotation.y = marker.rotation.y = -Math.PI / 2;
    const root = new THREE.Group();
    root.add(spin.group, user.group, ideal.group, userRacket, idealRacket, ghostBall, userTrail, idealTrail, tableLine, sidePanel, divider, bar, marker);
    setLayer(root, OVERLAY_LAYER);
    return { root, spin, user, ideal, userRacket, idealRacket, ghostBall, userTrail, idealTrail, tableLine, sidePanel, divider, bar, marker };
  }, []);

  const labelsRef = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (labelsRef.current) setLayer(labelsRef.current, OVERLAY_LAYER);
  });

  const panel = useRef<THREE.Mesh>(null);
  const frame = useRef<THREE.Mesh>(null);
  const [texts, setTexts] = useState<Texts>({ title: "", angle: "", angleC: USER, speed: "", speedC: USER, dir: "", dirC: USER, advice: "", state: "" });
  const tick = useRef(0);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const _v = useMemo(() => new THREE.Vector3(), []);
  const _d = useMemo(() => new THREE.Vector3(), []);
  const _live = useMemo(() => new THREE.Vector3(), []);
  const _zero = useMemo(() => new THREE.Vector3(), []);
  const _p = useMemo(() => new THREE.Vector3(), []);
  const _q = useMemo(() => new THREE.Quaternion(), []);
  const _b = useMemo(() => new THREE.Vector3(), []);
  const replayState = useRef<{ clip: ClipFrame[] | null; start: number }>({ clip: null, start: 0 });

  useFrame(() => {
    const s = snap.current;
    const replay = s.ready && s.clip.length > 2;
    const ideal = s.ideal;
    const now = performance.now();

    // Neue Aufzeichnung → Schleife neu starten, Spuren aufbauen
    if (replay && replayState.current.clip !== s.clip) {
      replayState.current = { clip: s.clip, start: now };
      helpers.userTrail.geometry.dispose();
      helpers.userTrail.geometry = new THREE.BufferGeometry().setFromPoints(s.clip.map((f) => f.pos));
      const boost = slowmoBoost(s.scale);
      const realSpeed = ideal.speed / boost;
      idealDir(ideal.dirDeg, _d);
      const pts: THREE.Vector3[] = [];
      for (let t = -CLIP_BEFORE; t <= CLIP_AFTER + 1e-6; t += 0.05) pts.push(idealPos(s.racketPos, _d, realSpeed, t, new THREE.Vector3()));
      helpers.idealTrail.geometry.dispose();
      helpers.idealTrail.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    }

    // Kamera: live am Schläger, in der Wiederholung fest am Treffpunkt
    const focus = replay ? s.racketPos : racket.pos;
    camTarget.lerp(_v.set(focus.x, focus.y, focus.z - 0.06), 0.25);
    cam.position.set(camTarget.x - 0.98, camTarget.y + 0.04, camTarget.z);
    cam.lookAt(camTarget);
    // In der Wiederholung nur die Overlay-Elemente zeigen (keine Live-Szene)
    if (replay) cam.layers.disable(0);
    else cam.layers.enable(0);

    let tClip = 0;
    let paused = false;
    if (replay) {
      const total = CLIP_BEFORE + CONTACT_PAUSE + CLIP_AFTER + 0.3;
      const ph = ((now - replayState.current.start) / 1000) % total;
      if (ph < CLIP_BEFORE) tClip = ph - CLIP_BEFORE;
      else if (ph < CLIP_BEFORE + CONTACT_PAUSE) {
        tClip = 0;
        paused = true;
      } else tClip = Math.min(ph - CLIP_BEFORE - CONTACT_PAUSE, CLIP_AFTER);

      sampleClip(s.clip, tClip, _p, _q, _b);
      helpers.userRacket.position.copy(_p);
      helpers.userRacket.quaternion.copy(_q);
      helpers.ghostBall.position.copy(_b);
      const boost = slowmoBoost(s.scale);
      idealDir(ideal.dirDeg, _d);
      idealPos(s.racketPos, _d, ideal.speed / boost, tClip, helpers.idealRacket.position);
      helpers.idealRacket.quaternion.setFromUnitVectors(X, idealNormal(ideal.openDeg, _v));
      helpers.tableLine.position.set(s.racketPos.x, TABLE.height - 0.005, 0);
    }
    helpers.userRacket.visible = replay;
    helpers.idealRacket.visible = replay;
    helpers.ghostBall.visible = replay;
    helpers.userTrail.visible = replay;
    helpers.idealTrail.visible = replay;
    helpers.tableLine.visible = replay;

    // Spin-Pfeil (klein am Ball)
    const spinVec = replay ? (tClip >= 0 ? s.spinAfter : s.spinBefore) : ball.spin;
    const w = spinVec.length();
    helpers.spin.group.visible = w > 5;
    if (w > 5) {
      helpers.spin.group.position.copy(replay ? helpers.ghostBall.position : ball.pos);
      helpers.spin.group.quaternion.setFromUnitVectors(Z, _d.copy(spinVec).divideScalar(w));
      helpers.spin.group.scale.setScalar(BALL_RADIUS * 1.8);
      const st = replay
        ? spinType({ pos: s.point, vel: _v.set(0, 0, tClip >= 0 ? -1 : 1), spin: spinVec })
        : spinType(ball);
      helpers.spin.mat.color.set(SPIN_COLORS[st]);
    }

    // Zwei Pfeile: deine Bewegung (weiß) und perfekte Bewegung (grün)
    const liveVel = racketPointVel(racket, _zero, _live);
    const vel = replay ? s.racketVel : liveVel;
    const v = vel.length();
    const uOrigin = replay ? helpers.userRacket.position : racket.pos;
    helpers.user.group.visible = v > 0.15;
    if (v > 0.15) setArrow(helpers.user, uOrigin, vel, arrowLen(v));
    idealDir(ideal.dirDeg, _d);
    _v.copy(replay ? helpers.idealRacket.position : racket.pos);
    if (!replay) _v.y += 0.015;
    setArrow(helpers.ideal, _v, _d, arrowLen(ideal.speed), 0.0035);

    // Fortschrittsbalken mit Markierung am Treffpunkt
    const bar = helpers.bar;
    bar.visible = helpers.marker.visible = replay;
    if (replay) {
      const full = 0.62;
      const f = (tClip + CLIP_BEFORE) / (CLIP_BEFORE + CLIP_AFTER);
      const y = camTarget.y - 0.245;
      const zStart = camTarget.z - 0.18 + full / 2;
      bar.scale.set(Math.max(full * f, 0.001), 0.006, 1);
      bar.position.set(camTarget.x, y, zStart - (full * f) / 2);
      helpers.marker.scale.set(0.004, 0.018, 1);
      helpers.marker.position.set(camTarget.x, y, zStart - full * (CLIP_BEFORE / (CLIP_BEFORE + CLIP_AFTER)));
      (bar.material as THREE.MeshBasicMaterial).color.set(paused ? USER : VIOLET_SOFT);
    }

    // Texte (gedrosselt)
    if (labelsRef.current) labelsRef.current.position.copy(_v.set(camTarget.x, camTarget.y + 0.02, camTarget.z - 0.38));
    helpers.sidePanel.position.copy(_v.set(camTarget.x + 0.002, camTarget.y, camTarget.z - 0.38));
    helpers.divider.position.copy(_v.set(camTarget.x, camTarget.y, camTarget.z - 0.135));
    if (++tick.current % 6 === 0) {
      let open: number;
      if (replay) open = s.openDeg;
      else {
        const toFar = _d.copy(racket.normal);
        if (toFar.z > 0) toFar.negate();
        open = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(toFar.y, -1, 1)));
      }
      const dir = replay ? s.dirDeg : THREE.MathUtils.radToDeg(Math.atan2(vel.y, Math.max(-vel.z, 1e-3)));
      const spec = STROKES[settings.serve];
      const deg = (d: number) => `${Math.abs(Math.round(d))}° ${d >= 0 ? "offen" : "geschl."}`;
      const next: Texts = {
        title: replay
          ? paused
            ? "Balltreffpunkt"
            : `Wiederholung: ${spec.stroke}`
          : `${spec.serveLabel} → ${spec.stroke}`,
        angle: `Winkel  du ${deg(open)}  ·  ideal ${deg(ideal.openDeg)}`,
        angleC: grade(Math.abs(open - ideal.openDeg), 8, 18),
        speed: `Tempo  du ${fmt(v)}  ·  ideal ${fmt(ideal.speed)} m/s`,
        speedC: grade(Math.abs(v - ideal.speed), 0.5, 1.2),
        dir: `Richtung  du ${dir >= 0 ? "+" : ""}${Math.round(dir)}°  ·  ideal ${ideal.dirDeg >= 0 ? "+" : ""}${ideal.dirDeg}°`,
        dirC: v < 0.3 ? "#cfd8e3" : grade(Math.abs(dir - ideal.dirDeg), 12, 25),
        advice: replay ? advice(s) : spec.tip,
        state: replay ? (paused ? "Treffpunkt hält 1 s" : "Bewegung läuft in Schleife") : "Live-Vorschau",
      };
      if (JSON.stringify(next) !== JSON.stringify(texts)) setTexts(next);
    }

    // Nahaufnahme rendern
    const xrOn = gl.xr.enabled;
    gl.xr.enabled = false;
    const prev = gl.getRenderTarget();
    gl.setRenderTarget(fbo);
    gl.setClearColor(PANEL_BG, 1);
    gl.clear();
    gl.render(scene, cam);
    gl.setRenderTarget(prev);
    gl.xr.enabled = xrOn;

    // Tafel platzieren
    const p = panel.current;
    if (!p) return;
    if (isXR) {
      p.position.set(-0.58, 1.34, 1.18);
      p.rotation.set(0, 0.55, 0);
      p.scale.set(0.62, 0.35, 1);
    } else {
      const pc = camera as THREE.PerspectiveCamera;
      const d = 0.5;
      const halfH = Math.tan(THREE.MathUtils.degToRad(pc.fov / 2)) * d;
      const halfW = halfH * pc.aspect;
      const h = halfH * 0.85;
      const wPanel = Math.min(h * (4 / 3), halfW * 0.9);
      const hPanel = wPanel * 0.5625;
      _v.set(halfW - wPanel / 2 - halfH * 0.08, halfH - hPanel / 2 - halfH * 0.22, -d);
      p.position.copy(_v.applyQuaternion(pc.quaternion).add(pc.position));
      p.quaternion.copy(pc.quaternion);
      p.scale.set(wPanel, hPanel, 1);
    }
    const f = frame.current;
    if (f) {
      f.position.copy(p.position);
      f.quaternion.copy(p.quaternion);
      const pulse = snap.current.ready ? 1 + Math.sin(performance.now() * 0.006) * 0.025 : 1;
      f.scale.set(p.scale.x * 1.035 * pulse, p.scale.y * 1.055 * pulse, 1);
      const fm = f.material as THREE.MeshBasicMaterial;
      fm.color.set(snap.current.ready ? VIOLET : "#111827");
    }
  });

  return (
    <>
      <primitive object={helpers.root} />
      <group ref={labelsRef}>
        <Label text={texts.title} position={[0, 0.19, 0]} height={0.03} color={VIOLET_SOFT} bg="rgba(0,0,0,0)" />
        <Label text={texts.state} position={[0, 0.145, 0]} height={0.018} color={TEXT_MUTED} bg="rgba(0,0,0,0)" />
        <Label text={"DU"} position={[0, 0.085, 0.13]} height={0.02} color={USER} bg="rgba(0,0,0,0)" />
        <Label text={"PERFEKT"} position={[0, 0.085, -0.07]} height={0.02} color={IDEAL} bg="rgba(0,0,0,0)" />
        <Label text={texts.angle} position={[0, 0.025, 0]} height={0.024} color={texts.angleC} bg="rgba(0,0,0,0)" />
        <Label text={texts.speed} position={[0, -0.035, 0]} height={0.024} color={texts.speedC} bg="rgba(0,0,0,0)" />
        <Label text={texts.dir} position={[0, -0.095, 0]} height={0.024} color={texts.dirC} bg="rgba(0,0,0,0)" />
        <Label text={texts.advice} position={[0, -0.18, 0]} height={0.026} color="#e6d36a" bg="rgba(0,0,0,0)" />
      </group>
      <mesh ref={frame} renderOrder={19} onUpdate={(m) => m.layers.set(PANEL_LAYER)}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#111827" depthTest={false} />
      </mesh>
      <mesh ref={panel} renderOrder={20} onUpdate={(m) => m.layers.set(PANEL_LAYER)}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={fbo.texture} toneMapped={false} depthTest={false} />
      </mesh>
    </>
  );
}

/** Ideale Schlägerbahn: gerade durch den Treffpunkt, in Echtzeit, auf sinnvolle Länge begrenzt. */
function idealPos(contact: THREE.Vector3, dir: THREE.Vector3, speed: number, t: number, out: THREE.Vector3) {
  const tc = THREE.MathUtils.clamp(t, -0.3, 0.2);
  return out.copy(contact).addScaledVector(dir, speed * tc);
}
