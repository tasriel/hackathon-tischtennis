import { describe, expect, test } from "bun:test";
import * as THREE from "three";
import { BALL_RADIUS, TABLE } from "./constants";
import { cloneBall, collideRacket, makeBall, stepBall, type BallState, type RacketState } from "./physics";

const DT = 1 / 240;

type Flight = {
  startSpeed: number;
  netY: number | null;
  bounceZ: number | null;
  speedBeforeBounce: number | null;
  spinX: number;
};

function simulateFlight(initial: BallState, wallScale = 1): Flight {
  const ball = cloneBall(initial);
  const startSpeed = ball.vel.length();
  let netY: number | null = null;
  let bounceZ: number | null = null;
  let speedBeforeBounce: number | null = null;
  let previousZ = ball.pos.z;

  for (let elapsed = 0; elapsed < 2.5; elapsed += DT * wallScale) {
    const steps = Math.max(1, Math.round(wallScale));
    for (let i = 0; i < steps; i++) {
      const speed = ball.vel.length();
      const event = stepBall(ball, DT);
      if (netY === null && previousZ >= 0 && ball.pos.z < 0) netY = ball.pos.y;
      previousZ = ball.pos.z;
      if (event === "table-far") {
        bounceZ = ball.pos.z;
        speedBeforeBounce = speed;
        return { startSpeed, netY, bounceZ, speedBeforeBounce, spinX: ball.spin.x };
      }
      if (event === "net" || event === "floor") return { startSpeed, netY, bounceZ, speedBeforeBounce, spinX: ball.spin.x };
    }
  }
  return { startSpeed, netY, bounceZ, speedBeforeBounce, spinX: ball.spin.x };
}

function strike(incomingVelocity: THREE.Vector3, incomingSpin: THREE.Vector3, racketVelocity: THREE.Vector3, openDeg: number) {
  const ball = makeBall();
  ball.pos.set(0.25, 1.02, 1.44);
  ball.vel.copy(incomingVelocity);
  ball.spin.copy(incomingSpin);
  const previous = ball.pos.clone().addScaledVector(ball.vel, -DT);
  const open = THREE.MathUtils.degToRad(openDeg);
  const normal = new THREE.Vector3(0, Math.sin(open), 1).normalize();
  const racket: RacketState = {
    pos: ball.pos.clone(),
    normal,
    vel: racketVelocity.clone(),
    angVel: new THREE.Vector3(),
    handVel: racketVelocity.clone(),
    quat: new THREE.Quaternion(),
    timeScale: 1,
  };
  expect(collideRacket(ball, previous, racket)).toBe(true);
  return ball;
}

describe("deterministische Ballphysik", () => {
  const cases = [
    {
      name: "Unterschnitt-Schupf",
      ball: () => strike(new THREE.Vector3(0, -0.4, 4.2), new THREE.Vector3(-95, 0, 0), new THREE.Vector3(0, -0.35, -2.4), 38),
      spin: "back",
    },
    {
      name: "frontaler Block",
      ball: () => strike(new THREE.Vector3(0, -0.25, 5.0), new THREE.Vector3(45, 0, 0), new THREE.Vector3(0, 0.2, -3.0), -5),
      spin: "controlled",
    },
    {
      name: "Topspin-Konter",
      ball: () => strike(new THREE.Vector3(0, -0.3, 5.2), new THREE.Vector3(80, 0, 0), new THREE.Vector3(0, 0.6, -3.0), -5),
      spin: "controlled",
    },
  ] as const;

  for (const scenario of cases) {
    test(`${scenario.name}: Echtzeit und Zeitlupe ergeben dieselbe Flugbahn`, () => {
      const struck = scenario.ball();
      const real = simulateFlight(struck, 1);
      const slow = simulateFlight(struck, 4);
      expect(real.bounceZ).not.toBeNull();
      expect(slow.bounceZ).toBeCloseTo(real.bounceZ ?? 0, 8);
      expect(slow.netY).toBeCloseTo(real.netY ?? 0, 8);
      expect(real.startSpeed).toBeGreaterThan(3.5);
      expect(real.startSpeed).toBeLessThanOrEqual(7.5);
      expect(real.speedBeforeBounce).not.toBeNull();
      expect(real.speedBeforeBounce ?? Infinity).toBeLessThan(real.startSpeed);
      expect(real.netY ?? 0).toBeGreaterThan(TABLE.height + TABLE.netHeight + BALL_RADIUS);
      expect(real.bounceZ ?? -Infinity).toBeGreaterThanOrEqual(-TABLE.length / 2);
      expect(real.bounceZ ?? Infinity).toBeLessThan(0);
      if (scenario.spin === "back") expect(real.spinX).toBeLessThan(0);
      if (scenario.spin === "top") expect(real.spinX).toBeGreaterThan(0);
      expect(Math.abs(real.spinX)).toBeLessThan(180);
    });
  }
});