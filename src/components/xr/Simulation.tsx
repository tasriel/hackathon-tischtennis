import { useFrame, useThree } from "@react-three/fiber";
import { useXR, useXRInputSourceState } from "@react-three/xr";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ARM_REACH, CONTACT_Z, RUBBERS, TABLE, type ServeType } from "@/lib/constants";
import { applyOpponentHit, planOpponentFromFlight, type OpponentPlan } from "@/lib/opponent";
import {
  collideRacket,
  makeBall,
  lastContact,
  MAX_WRIST,
  resetServe,
  spinType,
  isSideDominant,
  stepBall,
  type RacketState,
} from "@/lib/physics";
import { timeScaleFor } from "@/lib/timescale";
import { predictReturn } from "@/lib/trajectory";
import { COUNTER_SHORT_IDEAL, defaultIdeal, findIdealShot, SHORT_BALL_Z, SHORT_PIPS_BACKSPIN_IDEAL } from "@/lib/idealShot";
import { setSetting, settings } from "@/lib/settings";
import { STROKES } from "@/lib/strokes";
import { Menus } from "./LeftMenu";
import { type ShotMetrics, type ShotResult } from "@/lib/coaching";
import { BallModel } from "./BallModel";
import { RacketModel } from "./RacketModel";
import { Table } from "./Table";
import { SpinOverlay, makeSnapshot, CLIP_BEFORE, CLIP_AFTER, type ContactSnapshot, type ClipFrame } from "./SpinOverlay";
import { Target, type TargetImpact } from "./Target";
import { GymRoom } from "./GymRoom";
import { Label } from "./Label";

const SPIN_DE: Record<string, { t: string; c: string }> = {
  BACKSPIN: { t: "Unterschnitt", c: "#70a5ff" },
  TOPSPIN: { t: "Oberschnitt", c: "#f3a14a" },
  SIDE: { t: "Seitschnitt", c: "#e879f9" },
  "OHNE SPIN": { t: "Ohne Spin", c: "#e5e7eb" },
};

/** Spin-Art als Text über dem Ball. */
function BallSpinLabel({ ball }: { ball: ReturnType<typeof makeBall> }) {
  const [k, setK] = useState("");
  useFrame(() => {
    const w = ball.spin.length();
    let next = "";
    if (w > 5) next = isSideDominant(ball.spin) ? "SIDE" : spinType(ball);
    if (next !== k) setK(next);
  });
  const d = SPIN_DE[k];
  return (
    <>
      <BallSpeedLabel ball={ball} />
      <Label text={d?.t ?? ""} color={d?.c ?? "#ffffff"} bg="rgba(10,10,14,0.7)" height={0.045} position={[0, 0.07, 0]} />
    </>
  );
}

/** Nur zu Testzwecken: Ballgeschwindigkeit in km/h über dem Spin-Text. */
function BallSpeedLabel({ ball }: { ball: ReturnType<typeof makeBall> }) {
  const [t, setT] = useState("");
  useFrame(() => {
    const next = `${(ball.vel.length() * 3.6).toFixed(1).replace(".", ",")} km/h`;
    if (next !== t) setT(next);
  });
  return <Label text={t} color="#fde68a" bg="rgba(10,10,14,0.7)" height={0.035} position={[0, 0.115, 0]} />;
}

const PHYS_DT = 1 / 240;
const _c2 = new THREE.Vector3();
const _Yup = new THREE.Vector3(0, 1, 0);
const RING = 180; // ~2 s bei 90 Hz
const RESULT_COLORS = { success: "#2e9e4f", fail: "#c0392b" } as const;
const TABLE_BLUE = new THREE.Color("#1d4f8a");

// Schläger relativ zum Controller: Blatt ~13 cm vor der Hand
const GRIP_OFFSET = new THREE.Vector3(0, 0.02, -0.13);
const GRIP_ROT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0));

export function Simulation() {
  const ball = useMemo(() => makeBall(), []);
  const handVel = useMemo(() => new THREE.Vector3(), []);
  const previewHand = useMemo(() => new THREE.Vector3(), []);
  const racket = useMemo<RacketState>(
    () => ({
      pos: new THREE.Vector3(0.25, 0.95, CONTACT_Z),
      normal: new THREE.Vector3(0, 0, -1),
      vel: new THREE.Vector3(),
      angVel: new THREE.Vector3(),
      handVel,
      quat: new THREE.Quaternion(),
      timeScale: 1,
    }),
    [handVel],
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
    phase: "p1" as "p1" | "opp" | "p2",
    plan: null as OpponentPlan | null,
    oppClock: 0,
    /** bisherige Rückschläge des Gegners in diesem Ballwechsel */
    returns: 0,
    /** Der ankommende Ball ist auf der Spielerseite genau einmal aufgesprungen. */
    bouncedNear: false,
    nearBounceZ: Infinity,
    /** Aufsprünge auf der Gegnerseite seit dem Spielerkontakt. */
    opponentBounces: 0,
    /** wartet auf rechten Trigger / Leertaste statt automatisch einzuspielen */
    waitingForServe: true,
    idleSince: performance.now(),
    slowHintAttempts: 0,
    slowHintDone: false,
    currentShotLegal: false,
    invalidReturnStreak: 0,
  });
  const [serveHint, setServeHint] = useState(true);
  const [slowHint, setSlowHint] = useState(false);
  const [reviewHint, setReviewHint] = useState(false);

  const ballGroup = useRef<THREE.Group>(null);
  const racketGroup = useRef<THREE.Group>(null);
  const shots = useMemo(() => [makeSnapshot(), makeSnapshot(), makeSnapshot(), makeSnapshot()], []);
  const snap = useRef<ContactSnapshot>(shots[0]!);
  const recording = useRef<ContactSnapshot>(shots[0]!);
  const oppGroup = useRef<THREE.Group>(null);
  const oppRest = useMemo(() => ({ pos: new THREE.Vector3(-0.15, 1.0, -1.75), normal: new THREE.Vector3(0, 0, 1) }), []);
  const targetImpact = useRef<TargetImpact>({ x: 0, z: 0, sequence: 0 });
  // Für die Vorschau: stärker geglättete Schlägerbewegung, damit die Kurve nicht zappelt
  const previewRacket = useMemo<RacketState>(
    () => ({ ...racket, vel: new THREE.Vector3(), angVel: new THREE.Vector3(), handVel: previewHand }),
    [racket, previewHand],
  );
  const tableMats = useRef<{ far: THREE.MeshStandardMaterial | null }>({
    far: null,
  });
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

  const restart = (launch = true) => {
    resetServe(ball, settings.serve);
    if (ballGroup.current) ballGroup.current.position.copy(ball.pos);
    s0.clipPending = false;
    for (const sh of shots) {
      sh.active = false;
      sh.ready = false;
      sh.clip = [];
    }
    prepareShot(0, settings.serve, "");
    setSetting("reviewCount", 1);
    setSetting("reviewIndex", 0);
    _prevPos.copy(ball.pos);
    const s = sim.current;
    s.hit = false;
    s.done = false;
    s.acc = 0;
    s.metrics = null;
    s.flashTarget = "none";
    s.lastSpin = "";
    s.phase = "p1";
    s.plan = null;
    s.oppClock = 0;
    s.returns = 0;
    s.bouncedNear = false;
    s.nearBounceZ = Infinity;
    s.opponentBounces = 0;
    s.waitingForServe = !launch;
    s.idleSince = performance.now();
    s.currentShotLegal = false;
    if (!launch) ball.vel.set(0, 0, 0);
    setServeHint(!launch);
    setSlowHint(false);
  };

  const prepareShot = (i: number, kind: ServeType, heading: string) => {
    const sh = shots[i]!;
    sh.active = false;
    sh.ready = false;
    sh.clip = [];
    sh.kind = kind;
    sh.ideal = defaultIdeal(kind);
    sh.label = `Schlag ${i + 1}/${settings.returns + 1}`;
    sh.heading = heading;
    delete sh.strokeLabel;
    delete sh.tip;
    snap.current = sh;
    recording.current = sh;
  };

  /** Gegner hat getroffen → Ball fliegt zum Spieler, zweiter Spielerschlag wird erwartet. */
  const opponentHit = () => {
    const s = sim.current;
    const plan = s.plan!;
    applyOpponentHit(ball, plan);
    _prevPos.copy(ball.pos);
    lastTest.pos.copy(racket.pos);
    lastTest.normal.copy(racket.normal);
    s.phase = "p2";
    s.returns++;
    s.hit = false;
    s.bouncedNear = false;
    s.nearBounceZ = Infinity;
    s.opponentBounces = 0;
    s.currentShotLegal = false;
    s.flashTarget = "none";
    s.metrics = null;
    const side = isSideDominant(ball.spin);
    const st = spinType(ball);
    s.incoming = st;
    const kind: ServeType = side ? "sidespin" : st === "BACKSPIN" ? "backspin" : "topspin";
    const rb = RUBBERS[plan.rubber];
    prepareShot(s.returns, kind, `Gegner ${rb.label} → ${STROKES[kind].stroke}`);
    const nextShot = shots[s.returns];
    if (nextShot && plan.rubber === "shortPips" && kind === "backspin") {
      nextShot.strokeLabel = "Schupf (frontal)";
      nextShot.tip = "Frontaler treffen, steiler von oben nach unten schupfen.";
    }
    setSetting("reviewCount", s.returns + 1);
    setSetting("reviewIndex", s.returns);
  };

  useEffect(() => {
    restart(false);
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
    if (!s.currentShotLegal) {
      s.invalidReturnStreak++;
      if (s.invalidReturnStreak >= 3) {
        s.invalidReturnStreak = 0;
        setReviewHint(true);
        window.setTimeout(() => setReviewHint(false), 4500);
      }
    }
    if (!s.hit && !s.slowHintDone && s.slowHintAttempts < 3) s.slowHintAttempts++;
    s.idleSince = performance.now();
  };

  const _prevPos = useMemo(() => new THREE.Vector3(), []);
  const _tmp = useMemo(() => new THREE.Vector3(), []);
  const _q = useMemo(() => new THREE.Quaternion(), []);
  const _lastRacket = useMemo(() => new THREE.Vector3(), []);
  const _lastNormal = useMemo(() => new THREE.Vector3(0, 0, -1), []);
  const _lastQuat = useMemo(() => new THREE.Quaternion(), []);
  const _hand = useMemo(() => new THREE.Vector3(), []);
  const _lastHand = useMemo(() => new THREE.Vector3(), []);
  const _shoulder = useMemo(() => new THREE.Vector3(), []);
  const _ray = useMemo(() => new THREE.Raycaster(), []);
  const _plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -CONTACT_Z), []);
  const trigWasPressed = useRef(false);
  const oppFace = useRef<THREE.MeshStandardMaterial>(null);
  const _oppN = useMemo(() => new THREE.Vector3(), []);
  const _oppP = useMemo(() => new THREE.Vector3(), []);
  const _oppA = useMemo(() => new THREE.Vector3(), []);
  const _wristN = useMemo(() => new THREE.Vector3(), []);
  const s0 = useMemo(() => ({ clipPending: false }), []);
  const ring = useMemo<ClipFrame[]>(
    () => Array.from({ length: RING }, () => ({ t: 0, pos: new THREE.Vector3(), quat: new THREE.Quaternion(), ball: new THREE.Vector3(), spin: new THREE.Vector3() })),
    [],
  );
  const ringIdx = useRef(0);
  // Schlägerpose pro Physikschritt (zwischen letztem und aktuellem Bild interpoliert)
  const stepR = useMemo<RacketState>(
    () => ({ ...racket, pos: new THREE.Vector3(), normal: new THREE.Vector3() }),
    [racket],
  );
  const lastTest = useMemo(() => ({ pos: racket.pos.clone(), normal: racket.normal.clone() }), [racket]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const s = sim.current;

    const shouldShowServeHint = s.waitingForServe || (s.done && performance.now() - s.idleSince >= 7000);
    if (shouldShowServeHint !== serveHint) setServeHint(shouldShowServeHint);

    // ---------- Schlägerpose ----------
    _lastRacket.copy(racket.pos);
    _lastNormal.copy(racket.normal);
    _lastQuat.copy(racket.quat);
    _lastHand.copy(_hand);
    const obj = controller?.object;
    if (isXR && obj) {
      obj.getWorldPosition(racket.pos);
      _hand.copy(racket.pos);
      obj.getWorldQuaternion(racket.quat);
      racket.quat.multiply(GRIP_ROT);
      racket.pos.add(_tmp.copy(GRIP_OFFSET).applyQuaternion(racket.quat));
      // Armlänge begrenzen
      camera.getWorldPosition(_shoulder).add(_tmp.set(0.18, -0.3, 0));
      _tmp.subVectors(racket.pos, _shoulder);
      if (_tmp.length() > ARM_REACH) {
        const shift = _tmp.length() - ARM_REACH;
        racket.pos.copy(_shoulder).add(_tmp.setLength(ARM_REACH));
        _hand.addScaledVector(_tmp.normalize(), -shift);
      }
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
      racket.quat.setFromEuler(new THREE.Euler(0, Math.PI / 2, s.desktopTilt, "YXZ"));
      _hand.copy(racket.pos);
    }
    racket.normal.set(1, 0, 0).applyQuaternion(racket.quat);
    const idt = 1 / Math.max(dt, 1e-3);
    // geglättete Geschwindigkeiten (Echtzeit), ~3–4 Frames Mittelung gegen Tracking-Rauschen
    const k30 = 1 - Math.exp(-30 * dt);
    _tmp.subVectors(racket.pos, _lastRacket).multiplyScalar(idt);
    racket.vel.lerp(_tmp, k30);
    _tmp.subVectors(_hand, _lastHand).multiplyScalar(idt);
    handVel.lerp(_tmp, k30);
    // Winkelgeschwindigkeit aus Orientierungsänderung (stärker geglättet, begrenzt)
    _q.copy(racket.quat).multiply(_lastQuat.invert());
    if (_q.w < 0) _q.set(-_q.x, -_q.y, -_q.z, -_q.w);
    const ang = 2 * Math.acos(Math.min(1, _q.w));
    const sinH = Math.sqrt(Math.max(0, 1 - _q.w * _q.w));
    if (sinH > 1e-5) _tmp.set(_q.x, _q.y, _q.z).divideScalar(sinH).multiplyScalar(ang * idt);
    else _tmp.set(0, 0, 0);
    if (_tmp.length() > MAX_WRIST) _tmp.setLength(MAX_WRIST);
    racket.angVel.lerp(_tmp, 1 - Math.exp(-15 * dt));
    previewRacket.vel.lerp(racket.vel, 1 - Math.exp(-6 * dt));
    previewRacket.angVel.lerp(racket.angVel, 1 - Math.exp(-6 * dt));
    previewHand.lerp(handVel, 1 - Math.exp(-6 * dt));
    if (racketGroup.current) {
      racketGroup.current.position.copy(racket.pos);
      racketGroup.current.quaternion.copy(racket.quat);
    }

    // ---------- Simulation ----------
    const sinceHit = (performance.now() - s.hitAt) / 1000;
    const scale = s.done && !s.hit ? 1 : timeScaleFor(settings.slowMotion, s.bouncedNear, ball.vel.y, s.hit, sinceHit, ball.pos.z, ball.vel.z);
    s.scale = scale;
    racket.timeScale = scale;
    stepR.timeScale = scale;
    const shouldShowSlowHint = !s.waitingForServe && !s.done && !s.hit && settings.slowMotion && scale < 0.85 && !s.slowHintDone && s.slowHintAttempts < 3;
    if (shouldShowSlowHint !== slowHint) setSlowHint(shouldShowSlowHint);
    if (s.waitingForServe) return;
    s.acc += dt * scale;
    const planned = Math.min(40, Math.floor(s.acc / PHYS_DT));
    let steps = 0;
    while (s.acc >= PHYS_DT && steps < 40) {
      s.acc -= PHYS_DT;
      steps++;
      _prevPos.copy(ball.pos);
      const ev = stepBall(ball, PHYS_DT);
      if (!s.hit) {
        if (ev === "table-near") {
          if (s.bouncedNear) finish("own");
          else {
            s.bouncedNear = true;
            s.nearBounceZ = ball.pos.z;
          }
        }
        const a = steps / Math.max(planned, 1);
        stepR.pos.lerpVectors(_lastRacket, racket.pos, a);
        stepR.normal.lerpVectors(_lastNormal, racket.normal, a).normalize();
        const hitNow = !s.done && collideRacket(ball, _prevPos, stepR, lastTest);
        lastTest.pos.copy(stepR.pos);
        lastTest.normal.copy(stepR.normal);
        if (hitNow) {
          _prevPos.copy(ball.pos);
          s.hit = true;
          s.slowHintDone = true;
          setSlowHint(false);
          s.hitAt = performance.now();
          const toFar = _tmp.copy(racket.normal);
          if (toFar.z > 0) toFar.negate();
          const rv = lastContact.racketVel;
          s.metrics = {
            incomingSpin: s.incoming,
            outgoingSpin: spinType(ball),
            openDeg: THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(toFar.y, -1, 1))),
            upSpeed: rv.y,
            forwardSpeed: -rv.z,
            result: "miss",
          };
          const sn = recording.current;
          snap.current = sn;
          setSetting("reviewIndex", s.returns);
          sn.active = true;
          sn.t0 = performance.now();
          sn.point.copy(lastContact.point);
          sn.friction.copy(lastContact.friction);
          sn.spinBefore.copy(lastContact.spinBefore);
          sn.spinAfter.copy(lastContact.spinAfter);
          sn.racketPos.copy(stepR.pos);
          sn.racketQuat.copy(racket.quat);
          sn.racketVel.copy(rv);
          sn.openDeg = s.metrics.openDeg;
          sn.speed = rv.length();
          sn.dirDeg = THREE.MathUtils.radToDeg(Math.atan2(rv.y, Math.max(-rv.z, 1e-3)));
          sn.wrist = racket.angVel.length();
          sn.scale = scale;
          if (s.phase === "p2") {
            // Ideal-Schlag nach dem tatsächlichen Spin direkt vor dem Treffer
            const sb = lastContact.spinBefore;
            const vb = _tmp.copy(lastContact.velBefore).setY(0).normalize();
            const top = _c2.crossVectors(sb, _Yup).dot(vb);
            const side = isSideDominant(sb);
            sn.kind = side ? "sidespin" : top < -8 ? "backspin" : "topspin";
          }
          const shortPipsPush = sn.kind === "backspin" && s.returns > 0 && s.plan?.rubber === "shortPips";
          const shortBall = sn.kind !== "backspin" && s.nearBounceZ < SHORT_BALL_Z;
          if (shortBall) {
            sn.strokeLabel = "Konter / Schuss";
            sn.tip = "Früh hoch ansetzen, frontal durchschlagen, kleiner Handgelenkschwung.";
          }
          sn.ideal = findIdealShot(
            lastContact.point,
            lastContact.velBefore,
            lastContact.spinBefore,
            sn.kind,
            shortBall ? COUNTER_SHORT_IDEAL : shortPipsPush ? SHORT_PIPS_BACKSPIN_IDEAL : undefined,
          );
          s0.clipPending = true;
          sn.explain = explainContact(s.metrics);
          const nextPlan = s.returns < settings.returns ? planOpponentFromFlight(ball, settings.rubber) : null;
          if (nextPlan) {
            s.phase = "opp";
            s.plan = nextPlan;
            s.oppClock = 0;
            s.opponentBounces = 0;
          }
        } else if (!s.done && (ball.pos.z > CONTACT_Z + 0.6 || ev === "floor")) finish("miss");
      } else if (!s.done && s.phase === "opp") {
        s.oppClock += PHYS_DT;
        if (ev === "table-far") {
          s.currentShotLegal = true;
          s.invalidReturnStreak = 0;
          setReviewHint(false);
          if (++s.opponentBounces > 1) finish("success");
        }
        else if (s.plan && s.oppClock >= s.plan.steps * PHYS_DT - 1e-6) opponentHit();
        else if (ev && ev !== "table-far") finish("success");
      } else if (!s.done) {
        if (ev === "net") finish("net");
        else if (ev === "table-far") {
          s.currentShotLegal = true;
          s.invalidReturnStreak = 0;
          setReviewHint(false);
          targetImpact.current.x = ball.pos.x;
          targetImpact.current.z = ball.pos.z;
          targetImpact.current.sequence++;
          if (s.phase === "opp" && s.plan) s.flashTarget = "success";
          else finish("success");
        }
        else if (ev === "table-near") finish("own");
        else if (ev === "floor" || ball.pos.z < -TABLE.length / 2 - 0.3 || ball.pos.z > 3) finish("out");
      }
    }

    // Weiche Darstellung zwischen zwei Physikschritten
    if (ballGroup.current) {
      ballGroup.current.position.lerpVectors(_prevPos, ball.pos, Math.min(1, s.acc / PHYS_DT));
      const w = ball.spin.length();
      if (w > 0) {
        _q.setFromAxisAngle(_tmp.copy(ball.spin).divideScalar(w), w * dt * scale);
        ballGroup.current.children[0]!.quaternion.premultiply(_q);
      }
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

    // ---------- Review-Auswahl ----------
    const pick = shots[Math.min(settings.reviewIndex, shots.length - 1)]!;
    if (settings.reviewCount > 1 && snap.current !== pick) snap.current = pick;

    // ---------- Gegner-Schläger ----------
    const og = oppGroup.current;
    if (og) {
      const plan = s.plan;
      const tc = plan ? s.oppClock - plan.steps * PHYS_DT : -10;
      _oppN.copy(oppRest.normal);
      _oppP.copy(oppRest.pos);
      if (plan && (s.phase === "opp" || tc < 1.2)) {
        // Ganzheitliche Bewegung: Ruhe → Ausholen → Treffer → Ausschwung → Ruhe.
        // Handgelenk: Blatt dreht sich um die Querachse mit (Ausholen +, Ausschwung −).
        const sp = plan.vel.length();
        _tmp.copy(plan.vel).normalize();
        const isTopspin = plan.stroke.includes("Topspin");
        const isPush = plan.stroke.includes("Schupf");
        const passive = plan.rubber === "longPips" || plan.rubber === "anti";
        const back = passive ? 0.11 : Math.min(0.32, 0.12 + sp * 0.05);
        const follow = passive ? 0.1 : Math.min(0.3, 0.1 + sp * 0.06);
        const axis = _oppA.crossVectors(_tmp, _Yup).normalize();
        // Zeit bis zum Treffer ab Aufsprung: erst Anfahrt + Blatt eindrehen, dann gerader Schwung
        const T = Math.max(0.32, plan.steps * PHYS_DT);
        const swing = Math.min(0.3, T * 0.4);
        let off: number, wrist: number, w: number;
        if (tc < -swing) {
          // Anfahrt zur Ausholposition, Blattwinkel dreht dabei schon ein
          w = THREE.MathUtils.smootherstep(tc, -T, -swing);
          off = -back;
          wrist = 0;
        } else if (tc < 0) {
          // Schwung von hinten nach vorne mit festem Blattwinkel
          const k = (tc + swing) / swing;
          w = 1;
          off = -back * (1 - k);
          wrist = 0;
        } else if (tc < 0.2) {
          const k = THREE.MathUtils.smoothstep(tc, 0, 0.2);
          w = 1;
          off = follow * k;
          wrist = -0.3 * k;
        } else {
          w = 1 - THREE.MathUtils.smootherstep(tc, 0.3, 1.1);
          off = follow;
          wrist = -0.3;
        }
        const at = _c2.copy(plan.point).addScaledVector(_tmp, off);
        if (isTopspin) at.y += off < 0 ? -0.1 * Math.abs(off) / Math.max(back, 0.01) : 0.14 * off / Math.max(follow, 0.01);
        else if (isPush) at.y += off < 0 ? 0.08 * Math.abs(off) / Math.max(back, 0.01) : -0.08 * off / Math.max(follow, 0.01);
        _oppP.lerp(at, w);
        _wristN.copy(plan.normal).applyAxisAngle(axis, wrist);
        _oppN.lerp(_wristN, w).normalize();
      }
      // leichte Glättung nur gegen Sprünge beim Neustart, Bahn selbst ist stetig
      og.position.lerp(_oppP, 1 - Math.exp(-25 * dt));
      _q.setFromUnitVectors(_X, _oppN);
      og.quaternion.slerp(_q, 1 - Math.exp(-25 * dt));
      oppFace.current?.color.set(RUBBERS[settings.rubber].color);
    }

    // ---------- Aufzeichnung für die Overlay-Animation ----------
    const now = performance.now();
    const fr = ring[ringIdx.current % RING]!;
    ringIdx.current++;
    fr.t = now;
    fr.pos.copy(racket.pos);
    fr.quat.copy(racket.quat);
    if (ballGroup.current) fr.ball.copy(ballGroup.current.position);
    fr.spin.copy(ball.spin);
    const sn = recording.current;
    if (s0.clipPending && now - sn.t0 > CLIP_AFTER * 1000) {
      s0.clipPending = false;
      const frames: ClipFrame[] = [];
      for (let i = Math.max(0, ringIdx.current - RING); i < ringIdx.current; i++) {
        const f = ring[i % RING]!;
        if (f.t >= sn.t0 - CLIP_BEFORE * 1000) {
          frames.push({ t: (f.t - sn.t0) / 1000, pos: f.pos.clone(), quat: f.quat.clone(), ball: f.ball.clone(), spin: f.spin.clone() });
        }
      }
      sn.clip = frames;
      sn.ready = frames.length > 2;
    }

  });

  return (
    <>
      <GymRoom />
      <Table ref={tableMats} />
      <group ref={racketGroup}>
        <RacketModel />
      </group>
      <group ref={ballGroup}>
        <group>
          <BallModel getTimeScale={() => sim.current.scale} />
        </group>
        <BallSpinLabel ball={ball} />
        <Label
          text={serveHint ? (isXR ? "Rechter Trigger: Ball einspielen" : "Leertaste: Ball einspielen") : ""}
          color="#f8fafc"
          bg="rgba(5,9,20,0.92)"
          height={0.055}
          position={[0, 0.2, 0]}
        />
        <Label
          text={slowHint ? "Ball in Zeitlupe – du schlägst normal schnell" : ""}
          color="#fde68a"
          bg="rgba(5,9,20,0.92)"
          height={0.048}
          position={[0, 0.18, 0]}
        />
      </group>
      <primitive object={previewMesh} />
      <Target impact={targetImpact} />
      <group ref={oppGroup} position={oppRest.pos}>
        <RacketModel />
        {/* Platzhalter-Belagfarbe bis zu den echten Texturen */}
        <mesh position={[0.014, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.078, 32]} />
          <meshStandardMaterial ref={oppFace} color={RUBBERS.smooth.color} roughness={0.7} />
        </mesh>
      </group>
      <Menus />
      <SpinOverlay ball={ball} racket={racket} snap={snap} ballObj={ballGroup} racketObj={racketGroup} getScale={() => sim.current.scale} attention={reviewHint} />
    </>
  );
}

const _c = new THREE.Color();
const _X = new THREE.Vector3(1, 0, 0);

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
