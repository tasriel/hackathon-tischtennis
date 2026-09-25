import { useFrame, useThree } from "@react-three/fiber";
import { useXR, useXRInputSourceState } from "@react-three/xr";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ARM_REACH, BALL_RADIUS, CONTACT_Z, TABLE } from "@/lib/constants";
import {
  collideRacket,
  makeBall,
  lastContact,
  resetServe,
  slowmoBoost,
  spinType,
  stepBall,
  type RacketState,
} from "@/lib/physics";
import { timeScaleFor } from "@/lib/timescale";
import { predictReturn } from "@/lib/trajectory";
import { coach, describe, type ShotMetrics, type ShotResult } from "@/lib/coaching";
import { BallModel } from "./BallModel";
import { RacketModel } from "./RacketModel";
import { Table } from "./Table";
import { Label } from "./Label";
import { SpinOverlay, type ContactSnapshot } from "./SpinOverlay";

export type HudState = { result: ShotResult | null; hint: string; info: string; timeScale: number };

const PHYS_DT = 1 / 240;
const RESULT_COLORS = { success: "#2e9e4f", fail: "#c0392b" } as const;
const TABLE_BLUE = new THREE.Color("#1d4f8a");
const NET_WHITE = new THREE.Color("#eeeeee");

// Schläger relativ zum Controller: Blatt ~13 cm vor der Hand
const GRIP_OFFSET = new THREE.Vector3(0, 0.02, -0.13);
const GRIP_ROT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0));

export function Simulation({ onHud }: { onHud: (h: HudState) => void }) {
  const ball = useMemo(() => makeBall(), []);
  const racket = useMemo<RacketState>(
    () => ({
      pos: new THREE.Vector3(0.25, 0.95, CONTACT_Z),
      normal: new THREE.Vector3(0, 0, -1),
      vel: new THREE.Vector3(),
      angVel: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      timeScale: 1,
    }),
    [],
  );
  const sim = useRef({
    hit: false,
    hitAt: 0,
    scale: 1,
    done: false,
    doneAt: 0,
    acc: 0,
    incoming: "BACKSPIN",
    metrics: null as ShotMetrics | null,
    lastSpin: "",
    predictTick: 0,
    flash: 0,
    flashTarget: "none" as "none" | "success" | "fail",
    desktopTilt: 0.35,
    mouse: new THREE.Vector2(0, 0),
  });

  const ballGroup = useRef<THREE.Group>(null);
  const axisRef = useRef<THREE.Mesh>(null);
  const racketGroup = useRef<THREE.Group>(null);
  const snap = useRef<ContactSnapshot>({
    active: false,
    point: new THREE.Vector3(),
    friction: new THREE.Vector3(),
    spinBefore: new THREE.Vector3(),
    spinAfter: new THREE.Vector3(),
    explain: "",
  });
  // Für die Vorschau: stärker geglättete Schlägerbewegung, damit die Kurve nicht zappelt
  const previewRacket = useMemo<RacketState>(
    () => ({ ...racket, vel: new THREE.Vector3(), angVel: new THREE.Vector3() }),
    [racket],
  );
  const tableMats = useRef<{ far: THREE.MeshStandardMaterial | null; net: THREE.MeshStandardMaterial | null }>({
    far: null,
    net: null,
  });
  const [spinLabel, setSpinLabel] = useState("↺ BACKSPIN");
  const [hint, setHint] = useState("");
  const [info, setInfo] = useState("");

  const isXR = useXR((s) => s.session != null);
  const controller = useXRInputSourceState("controller", "right");
  const { camera, gl } = useThree();

  // Vorschau-Kurve (Röhre aus geglätteter Spline)
  const previewPts = useMemo(() => Array.from({ length: 120 }, () => new THREE.Vector3()), []);
  const previewMesh = useMemo(() => {
    const m = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({ color: "#ffe066", transparent: true, opacity: 0.6 }),
    );
    m.frustumCulled = false;
    return m;
  }, []);
  const previewAlpha = useRef(0);

  const restart = () => {
    resetServe(ball);
    const s = sim.current;
    s.hit = false;
    s.done = false;
    snap.current.active = false;
    s.metrics = null;
    s.flashTarget = "none";
    s.lastSpin = "";
    setHint("");
    setInfo("");
    onHud({ result: null, hint: "", info: "", timeScale: 1 });
  };

  useEffect(() => {
    restart();
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") restart();
      if (e.code === "KeyW") sim.current.desktopTilt += 0.08;
      if (e.code === "KeyS") sim.current.desktopTilt -= 0.08;
    };
    const onMove = (e: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      sim.current.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    const onWheel = (e: WheelEvent) => {
      sim.current.desktopTilt += e.deltaY > 0 ? -0.05 : 0.05;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("wheel", onWheel);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = (result: ShotResult) => {
    const s = sim.current;
    if (s.done) return;
    s.done = true;
    s.doneAt = performance.now();
    s.flashTarget = result === "success" ? "success" : "fail";
    const m: ShotMetrics = s.metrics ?? {
      incomingSpin: s.incoming,
      outgoingSpin: "–",
      openDeg: 0,
      upSpeed: 0,
      forwardSpeed: 0,
      result,
    };
    m.result = result;
    const h = coach(m);
    const i = s.metrics ? describe(m) : "";
    setHint(h);
    setInfo(i);
    onHud({ result, hint: h, info: i, timeScale: 1 });
  };

  const _prevPos = useMemo(() => new THREE.Vector3(), []);
  const _tmp = useMemo(() => new THREE.Vector3(), []);
  const _q = useMemo(() => new THREE.Quaternion(), []);
  const _lastRacket = useMemo(() => new THREE.Vector3(), []);
  const _lastQuat = useMemo(() => new THREE.Quaternion(), []);
  const _shoulder = useMemo(() => new THREE.Vector3(), []);
  const _ray = useMemo(() => new THREE.Raycaster(), []);
  const _plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -CONTACT_Z), []);
  const _up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const trigWasPressed = useRef(false);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const s = sim.current;

    // ---------- Schlägerpose ----------
    _lastRacket.copy(racket.pos);
    _lastQuat.copy(racket.quat);
    const obj = controller?.object;
    if (isXR && obj) {
      obj.getWorldPosition(racket.pos);
      obj.getWorldQuaternion(racket.quat);
      racket.quat.multiply(GRIP_ROT);
      racket.pos.add(_tmp.copy(GRIP_OFFSET).applyQuaternion(racket.quat));
      // Armlänge begrenzen
      camera.getWorldPosition(_shoulder).add(_tmp.set(0.18, -0.3, 0));
      _tmp.subVectors(racket.pos, _shoulder);
      if (_tmp.length() > ARM_REACH) racket.pos.copy(_shoulder).add(_tmp.setLength(ARM_REACH));
      // Neustart per Trigger
      const pressed = controller.gamepad?.["xr-standard-trigger"]?.state === "pressed";
      if (pressed && !trigWasPressed.current) restart();
      trigWasPressed.current = pressed;
    } else {
      // Desktop: Maus bewegt den Schläger in der Trefferebene, W/S/Mausrad = Neigung
      _ray.setFromCamera(s.mouse, camera);
      if (_ray.ray.intersectPlane(_plane, _tmp)) {
        _tmp.x = THREE.MathUtils.clamp(_tmp.x, -0.6, 0.8);
        _tmp.y = THREE.MathUtils.clamp(_tmp.y, TABLE.height + 0.05, 1.5);
        racket.pos.lerp(_tmp, 1 - Math.exp(-25 * dt));
      }
      // Blattnormale zeigt Richtung Gegner (-z), gekippt um desktopTilt nach oben
      racket.quat.setFromEuler(new THREE.Euler(0, Math.PI / 2, s.desktopTilt, "YXZ"));
    }
    racket.normal.set(1, 0, 0).applyQuaternion(racket.quat);
    // geglättete Schlägergeschwindigkeit (Echtzeit)
    _tmp.subVectors(racket.pos, _lastRacket).divideScalar(Math.max(dt, 1e-3));
    // ~3–4 Frames Mittelung (Quest-Tracking bei 72–90 Hz ist pro Frame verrauscht)
    racket.vel.lerp(_tmp, 1 - Math.exp(-30 * dt));
    // Winkelgeschwindigkeit aus Orientierungsänderung
    _q.copy(racket.quat).multiply(_lastQuat.invert());
    if (_q.w < 0) _q.set(-_q.x, -_q.y, -_q.z, -_q.w);
    const ang = 2 * Math.acos(Math.min(1, _q.w));
    const sinH = Math.sqrt(Math.max(0, 1 - _q.w * _q.w));
    if (sinH > 1e-5) _tmp.set(_q.x, _q.y, _q.z).divideScalar(sinH).multiplyScalar(ang / Math.max(dt, 1e-3));
    else _tmp.set(0, 0, 0);
    racket.angVel.lerp(_tmp, 1 - Math.exp(-30 * dt));
    previewRacket.vel.lerp(racket.vel, 1 - Math.exp(-6 * dt));
    previewRacket.angVel.lerp(racket.angVel, 1 - Math.exp(-6 * dt));
    if (racketGroup.current) {
      racketGroup.current.position.copy(racket.pos);
      racketGroup.current.quaternion.copy(racket.quat);
    }

    // ---------- Simulation ----------
    const sinceHit = (performance.now() - s.hitAt) / 1000;
    const scale = s.done && !s.hit ? 1 : timeScaleFor(ball.pos.z, s.hit, sinceHit);
    s.scale = scale;
    racket.timeScale = scale;
    s.acc += dt * scale;
    let steps = 0;
    while (s.acc >= PHYS_DT && steps < 40) {
      s.acc -= PHYS_DT;
      steps++;
      _prevPos.copy(ball.pos);
      const ev = stepBall(ball, PHYS_DT);
      if (!s.hit) {
        if (!s.done && collideRacket(ball, _prevPos, racket)) {
          s.hit = true;
          s.hitAt = performance.now();
          const toFar = _tmp.copy(racket.normal);
          if (toFar.z > 0) toFar.negate();
          const boost = slowmoBoost(scale);
          s.metrics = {
            incomingSpin: s.incoming,
            outgoingSpin: spinType(ball),
            openDeg: THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(toFar.y, -1, 1))),
            upSpeed: racket.vel.y * boost,
            forwardSpeed: -racket.vel.z * boost,
            result: "miss",
          };
          const sn = snap.current;
          sn.active = true;
          sn.point.copy(lastContact.point);
          sn.friction.copy(lastContact.friction);
          sn.spinBefore.copy(lastContact.spinBefore);
          sn.spinAfter.copy(lastContact.spinAfter);
          sn.explain = explainContact(s.metrics);
        } else if (!s.done && (ball.pos.z > CONTACT_Z + 0.6 || ev === "floor")) finish("miss");
      } else if (!s.done) {
        if (ev === "net") finish("net");
        else if (ev === "table-far") finish("success");
        else if (ev === "table-near") finish("own");
        else if (ev === "floor" || ball.pos.z < -TABLE.length / 2 - 0.3 || ball.pos.z > 3) finish("out");
      }
      // sichtbare Rotation (Simulationszeit)
      if (ballGroup.current) {
        const w = ball.spin.length();
        if (w > 0) {
          _q.setFromAxisAngle(_tmp.copy(ball.spin).divideScalar(w), w * PHYS_DT);
          ballGroup.current.children[0]!.quaternion.premultiply(_q);
        }
      }
    }

    if (ballGroup.current) ballGroup.current.position.copy(ball.pos);
    if (axisRef.current) {
      const w = ball.spin.length();
      axisRef.current.visible = w > 5;
      if (w > 5) axisRef.current.quaternion.setFromUnitVectors(_up, _tmp.copy(ball.spin).divideScalar(w));
    }

    const st = spinType(ball);
    if (st !== s.lastSpin && !(s.done && s.hit === false)) {
      s.lastSpin = st;
      setSpinLabel(st === "TOPSPIN" ? "↻ TOPSPIN" : st === "BACKSPIN" ? "↺ BACKSPIN" : "OHNE SPIN");
    }

    // ---------- Vorschau ----------
    const showPreview = !s.hit && !s.done && scale < 0.85;
    if (showPreview && ++s.predictTick % 3 === 0) {
      previewRacket.pos.copy(racket.pos);
      previewRacket.normal.copy(racket.normal);
      previewRacket.timeScale = scale;
      const n = predictReturn(ball, previewRacket, previewPts);
      previewMesh.userData["n"] = n;
      if (n > 3) {
        const curve = new THREE.CatmullRomCurve3(previewPts.slice(0, n), false, "centripetal");
        previewMesh.geometry.dispose();
        previewMesh.geometry = new THREE.TubeGeometry(curve, Math.min(n * 2, 160), 0.004, 6, false);
      }
    }
    const want = showPreview && (previewMesh.userData["n"] ?? 0) > 3 ? 1 : 0;
    previewAlpha.current += (want - previewAlpha.current) * (1 - Math.exp(-10 * dt));
    (previewMesh.material as THREE.MeshBasicMaterial).opacity = 0.6 * previewAlpha.current;
    previewMesh.visible = previewAlpha.current > 0.02;

    // ---------- Feedback ----------
    const target = s.flashTarget;
    s.flash += ((target === "none" ? 0 : 1) - s.flash) * (1 - Math.exp(-8 * dt));
    const col = target === "success" ? RESULT_COLORS.success : RESULT_COLORS.fail;
    if (tableMats.current.far) {
      tableMats.current.far.color.copy(TABLE_BLUE).lerp(_c.set(col), target === "success" ? s.flash * 0.7 : 0);
      tableMats.current.far.emissive.set(target === "success" ? col : "#000000").multiplyScalar(s.flash * 0.4);
    }
    if (tableMats.current.net) {
      tableMats.current.net.color.copy(NET_WHITE).lerp(_c.set(col), target === "fail" ? s.flash : 0);
    }

    // Automatischer Neustart nach 4 s
    if (s.done && performance.now() - s.doneAt > 4000) restart();

  });

  return (
    <>
      <Table ref={tableMats} />
      <group ref={racketGroup}>
        <RacketModel />
      </group>
      <group ref={ballGroup}>
        <group>
          <BallModel />
        </group>
        <mesh ref={axisRef}>
          <cylinderGeometry args={[0.0015, 0.0015, BALL_RADIUS * 4, 6]} />
          <meshBasicMaterial color="#ffd400" />
        </mesh>
        <Label text={spinLabel} position={[0, 0.06, 0]} height={0.035} />
      </group>
      <primitive object={previewMesh} />
      <SpinOverlay ball={ball} racket={racket} snap={snap} getScale={() => sim.current.scale} />
      <Label text={hint} position={[0, TABLE.height + 0.55, -0.4]} height={0.08} />
      <Label text={info} position={[0, TABLE.height + 0.44, -0.4]} height={0.05} color="#cfd8e3" />
    </>
  );
}

const _c = new THREE.Color();

/** Kurze Erklärung, warum der Ball so zurückkommt (Kontakt-Moment im Overlay). */
function explainContact(m: ShotMetrics): string {
  const blade = m.openDeg > 25 ? "Blatt offen" : m.openDeg < 0 ? "Blatt geschlossen" : "Blatt fast senkrecht";
  const move =
    m.upSpeed > 1 ? "Bewegung nach oben" : m.forwardSpeed > 0.8 ? "Bewegung nach vorn" : "kaum Bewegung";
  const res =
    m.outgoingSpin === "BACKSPIN"
      ? "Belag reibt unten am Ball → Unterschnitt"
      : m.outgoingSpin === "TOPSPIN"
        ? "Belag reibt oben am Ball → Topspin"
        : "Reibung hebt den Spin auf";
  return `${blade} · ${move} → ${res}`;
}
