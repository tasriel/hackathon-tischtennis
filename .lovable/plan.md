# AI × XR Table Tennis — One Learning Moment (Quest 3)

Target: Quest 3, controller-only, WebXR in the Meta Browser. Deadline Sep 26, 10:30.
Goal: one learning loop — incoming backspin, time slows, you tilt the racket, you see spin and trajectory change, you get feedback, you retry.

## 1. Stack decision

- React Three Fiber + `@react-three/xr` inside this Lovable project. It fits the existing React setup and is the fastest reliable path to WebXR on Quest 3.
- No backend. Everything runs in the browser: physics, spin model, feedback, coaching. No database, no accounts, no scores.
- Coaching is rule-based (a small table of measured values → one short sentence). An LLM is not needed and would add latency and risk; the structure stays swappable later.
- Meshy assets are optional polish. Racket, ball, table and net start as primitives so the prototype never depends on an import working.
- Physics is hand-written and simple (gravity + drag + Magnus). No physics engine — a full engine is heavier than this needs and harder to keep stable at 72–90 fps.

## 2. Getting it onto the headset

The Lovable preview URL is already HTTPS, which is all WebXR requires. On the Quest 3: open the Meta Browser, type the preview URL, press "Enter VR". No cable, no local server, no sideloading — as long as the headset has normal internet Wi-Fi.
First task of milestone 1 is to confirm this on the actual headset before anything else is built. If the headset is on a network without internet, the fallback is publishing the app and using a phone hotspot.

## 3. Scene and interaction

- Table, net, floor, and a fixed standing position on one side. No walking.
- Right controller holds the racket: a flat rounded blade plus handle, following controller position and rotation 1:1.
- Ball is served from the far side with visible backspin, marked with a coloured stripe and a rotation-axis arrow so the spin direction is readable.
- Time scale ramps from 1.0× at the net down to about 0.1× just before contact, then back up to 1.0×. Smooth, distance-driven, no jumps.
- On contact, outgoing velocity and spin come from racket angle, racket speed, and incoming spin. Magnus curves the flight so spin is visibly consequential.
- Lands on the far half → green table glow. Net or out → red glow. Trigger button restarts the same serve instantly.

## 4. Build order (milestones, each a commit)

1. `init: WebXR scene` — table, net, floor, Enter-VR button. Verified on the headset.
2. `feat: controller racket` — racket tracked by the right controller.
3. `feat: ball + serve` — ball flies toward the player with backspin, spin markings visible.
4. `feat: collision + outgoing shot` — racket hits ball, plausible result.
5. `feat: slow motion` — automatic ramp before and after contact.
6. `feat: feedback` — green/hit, red/miss, quick restart. **MVP is done here.**
7. `feat: trajectory preview` — faint predicted arc that updates as the racket tilts.
8. `feat: coaching` — one-line hint plus a racket-angle indicator arrow.
9. `chore: demo stabilization` — tuning, then freeze.

## 5. Two developers, one project

Both of you do milestones 1–2 together; neither has VR experience and this is where everything can go wrong.

After that:
- **Dev A (XR/interaction):** racket component, controller input, time-scale controller, contact inspection.
- **Dev B (learning/simulation):** ball physics + spin model, trajectory prediction, feedback state, coaching rules.

Files are split so you rarely touch the same one. The one shared file is the scene root that composes everything — agree before editing it. In Lovable, avoid running prompts at the same moment; alternate turns, and pull after the other person's change lands.

Git: one branch, `main`. Commit after each milestone above. No feature branches, no PR review — there is no time and the risk of a bad merge outweighs the benefit.

## 6. Top risks

| Risk | Likelihood | Impact | Early sign | Fallback |
|---|---|---|---|---|
| WebXR won't start on the headset | Medium | Fatal | "Enter VR" missing or greyed out at milestone 1 | Check HTTPS + Meta Browser; fall back to published URL; last resort demo on desktop with mouse-controlled racket |
| Frame rate drops in VR | Medium | High | Stutter once ball and effects are in | Cut shadows, lower ball trail/arc resolution, simplify materials |
| Fast ball passes through the racket | High | High | Ball ignores clear hits | Enlarge collision radius, use swept sphere-vs-plane, slow time earlier |
| Physics feels wrong or unstable | Medium | Medium | Ball flies absurdly | Clamp speeds and spin; tuned-for-teaching constants over realism |
| Time runs out on polish features | High | Medium | Milestone 6 not done by 02:00 | Ship at milestone 6; 7–9 are optional |

## 7. Timebox (from now, ~13:00 Sep 25)

- 13:00–15:00 Milestone 1, verified in the headset. **If this isn't working by 15:00, stop and escalate — everything depends on it.**
- 15:00–16:30 Milestone 2.
- 16:30–19:00 Milestones 3–4 (split work).
- 19:00–21:00 Milestone 5, integrate and test in headset.
- 21:00–23:00 Milestone 6 → **MVP complete and committed.**
- 23:00–02:00 Milestones 7–8 if stable.
- 02:00–04:00 Stabilization, freeze the code.
- Sleep.
- 07:00–09:00 Record the demo video in-headset, build slides.
- 09:00–10:00 Rehearse the 3-minute talk.
- 10:00–10:30 Buffer and submit.

## 8. Recommended simplifications

- Contact Inspection Mode: instead of moving the camera, freeze the moment and float an enlarged ball+racket model in front of the player. Same insight, no motion sickness, far less code.
- One serve, always the same backspin. Variety adds nothing to the learning moment.
- No sound, no menus, no settings. Trigger = restart is the entire UI.
- Trajectory preview as a thin dotted line of ~20 points, recomputed a few times a second, not every frame.

## Technical notes

- Packages: `three`, `@react-three/fiber@^9`, `@react-three/drei@^10`, `@react-three/xr`, `@types/three`.
- Route `src/routes/index.tsx` with `ssr: false` — the canvas must not server-render.
- Files: `src/components/xr/XRScene.tsx` (shared root), `Racket.tsx`, `Table.tsx`, `Ball.tsx` (Dev A owns racket + XR, Dev B owns ball); `src/lib/physics.ts`, `src/lib/spin.ts`, `src/lib/coaching.ts`, `src/lib/timescale.ts`.
- Simulation state lives in refs updated inside `useFrame`, not React state — per-frame `setState` will tank VR framerate. Only discrete events (hit/miss, hint text) go through React state.
- Fixed physics substep (e.g. 1/240 s accumulator) scaled by the current time factor, so slow motion doesn't change physics behaviour.
