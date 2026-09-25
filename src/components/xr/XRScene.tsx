// Gemeinsame Szenen-Datei: setzt alles zusammen und führt die Simulation.
// Nur nach Absprache ändern (beide Entwickler hängen daran).
import { useFrame } from "@react-three/fiber";
import { useCallback, useRef, useState } from "react";
import * as THREE from "three";
import {
  AUTO_RESTART_S, HIT_ZONE_Z, NET_Z, SERVE_POS, SERVE_SPIN, SERVE_VEL, SUBSTEP,
} from "@/lib/constants";
import {
  racketDistance, racketHit, stepBall, type BallState, type RacketPose,
} from "@/lib/physics";
import { classifySpin, spinColor } from "@/lib/spin";
import { approach, targetTimeScale } from "@/lib/timescale";
import { coach, describeMovement, type HitMetrics, type Outcome } from "@/lib/coaching";
import { Table, type Glow } from "./Table";
import { Racket } from "./Racket";
import { Ball } from "./Ball";
import { Label } from "./Label";
import { TrajectoryPreview } from "./TrajectoryPreview";
import { ContactInspection, type ContactSnapshot } from "./ContactInspection";

type Phase = "incoming" | "outgoing" | "done";

const newServe = (): BallState => ({
  p: new THREE.Vector3(...SERVE_POS),
  v: new THREE.Vector3(...SERVE_VEL),
  w: new THREE.Vector3(...SERVE_SPIN),
});

export interface SceneStatus {
  coaching: string;
  metrics: string;
}

export function XRScene({ onStatus }: { onStatus?: (s: SceneStatus) => void }) {
  const ball = useRef<BallState>(newServe());
  const orient = useRef(new THREE.Quaternion());
  const pose = useRef<RacketPose>({
    valid: false, center: new THREE.Vector3(), normal: new THREE.Vector3(1, 0, 0),
    quat: new THREE.Quaternion(), vel: new THREE.Vector3(),
  });
  const phase = useRef<Phase>("incoming");
  const previewActive = useRef(true);
  const scale = useRef(1);
  const prevD = useRef<number | null>(null);
  const doneTimer = useRef(0);
  const acc = useRef(0);
  const metrics = useRef<HitMetrics | null>(null);
  const bouncedOwn = useRef(0);

  const incoming = classifySpin(new THREE.Vector3(...SERVE_SPIN), new THREE.Vector3(...SERVE_VEL));
  const [label, setLabel] = useState({ text: incoming.type, color: spinColor(incoming.type) });
  const [glow, setGlow] = useState<Glow>("none");
  const [coachText, setCoachText] = useState("Unterschnitt kommt – öffne den Schläger und schwinge nach vorne-oben.");
  const [metricText, setMetricText] = useState("");
  const [snap, setSnap] = useState<ContactSnapshot | null>(null);

  const restart = useCallback(() => {
    ball.current = newServe();
    orient.current.identity();
    phase.current = "incoming";
    previewActive.current = true;
    prevD.current = null;
    doneTimer.current = 0;
    metrics.current = null;
    bouncedOwn.current = 0;
    setLabel({ text: incoming.type, color: spinColor(incoming.type) });
    setGlow("none");
    setSnap(null);
  }, [incoming.type]);

  const finish = useCallback((o: Outcome) => {
    if (phase.current === "done") return;
    phase.current = "done";
    previewActive.current = false;
    setGlow(o === "success" ? "success" : "fail");
    const m = metrics.current;
    const text = coach(o, m);
    const mt = m
      ? `Eingang: ${m.incomingSpin} · Winkel: ${Math.round(Math.abs(m.openAngleDeg))}° ${m.openAngleDeg >= 0 ? "offen" : "geschlossen"}\nBewegung: ${describeMovement(m)} · Timing: ${m.timing} · ${o === "success" ? "Treffer" : "Fehler"}`
      : "";
    setCoachText(text);
    setMetricText(mt);
    onStatus?.({ coaching: text, metrics: mt });
  }, [onStatus]);

  useFrame((_, rawDelta) => {
    const realDt = Math.min(rawDelta, 0.05);
    const b = ball.current;

    // Zeitlupe
    const ph = phase.current === "done" ? "idle" : phase.current;
    scale.current = approach(scale.current, targetTimeScale(b.p.z, ph, pose.current.valid ? pose.current.center.z : HIT_ZONE_Z), realDt);

    if (phase.current === "done") {
      doneTimer.current += realDt;
      if (doneTimer.current > AUTO_RESTART_S) restart();
    }

    // Physik mit festen Unterschritten
    acc.current += realDt * scale.current;
    while (acc.current >= SUBSTEP) {
      acc.current -= SUBSTEP;
      const ev = stepBall(b, SUBSTEP);
      if (!ev || phase.current === "done") continue;
      if (phase.current === "incoming") {
        if (ev.type === "table" && ev.side === "player") bouncedOwn.current++;
        if (ev.type === "floor" || bouncedOwn.current > 1) finish("miss");
      } else if (phase.current === "outgoing") {
        if (ev.type === "net") finish("net");
        else if (ev.type === "table") finish(ev.side === "opponent" ? "success" : "own");
        else if (ev.type === "floor") finish(b.p.z < NET_Z ? "long" : "net");
      }
    }

    // Ball-Drehung für die Darstellung
    const wm = b.w.length();
    if (wm > 1e-3) {
      const dq = new THREE.Quaternion().setFromAxisAngle(b.w.clone().divideScalar(wm), wm * realDt * scale.current);
      orient.current.premultiply(dq);
    }

    // Kollision Schläger–Ball
    if (phase.current === "incoming" && pose.current.valid) {
      const r = pose.current;
      const d = racketDistance(b, r);
      const before = { w: b.w.clone(), v: b.v.clone() };
      const rel = b.p.clone().sub(r.center);
      if (racketHit(b, r, prevD.current)) {
        phase.current = "outgoing";
        previewActive.current = false;
        const inSpin = classifySpin(before.w, before.v);
        const outSpin = classifySpin(b.w, b.v);
        // Öffnungswinkel: Normale Richtung Gegner, Anteil nach oben
        const n = r.normal.clone();
        if (n.z > 0) n.negate();
        const open = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)));
        const dz = r.center.z - HIT_ZONE_Z;
        metrics.current = {
          incomingSpin: inSpin.type,
          outgoingSpin: outSpin.type,
          openAngleDeg: open,
          forward: -r.vel.z,
          up: r.vel.y,
          timing: dz < -0.2 ? "früh" : dz > 0.15 ? "spät" : "optimal",
        };
        setLabel({ text: `${outSpin.type} ${outSpin.rps.toFixed(0)} U/s`, color: spinColor(outSpin.type) });
        setSnap({
          racketQuat: r.quat.clone(),
          ballOffset: rel.applyQuaternion(r.quat.clone().invert()).applyQuaternion(r.quat),
          wIn: before.w, wOut: b.w.clone(),
          inText: inSpin.type, outText: outSpin.type,
          inColor: spinColor(inSpin.type), outColor: spinColor(outSpin.type),
        });
        prevD.current = null;
      } else {
        prevD.current = d;
      }
      if (phase.current === "incoming" && b.p.z > r.center.z + 0.6) finish("miss");
    }
  });

  return (
    <>
      <color attach="background" args={["#20262e"]} />
      <hemisphereLight args={["#dfe8f2", "#3a3328", 1.1]} />
      <directionalLight position={[2, 4, 1]} intensity={1.4} />
      {/* Boden */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.5]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#5a3e2b" roughness={0.9} />
      </mesh>
      <Table glow={glow} />
      <Ball ballRef={ball} orientRef={orient} label={label.text} labelColor={label.color} />
      <Racket poseRef={pose} onTrigger={restart} />
      <TrajectoryPreview ballRef={ball} poseRef={pose} activeRef={previewActive} />
      {snap && <ContactInspection snap={snap} />}
      {/* Coaching-Tafel hinter dem Tisch */}
      <Label
        text={metricText ? `${coachText}\n${metricText}` : coachText}
        height={0.07}
        position={[0, 1.55, -3.6]}
        billboard={false}
      />
    </>
  );
}
