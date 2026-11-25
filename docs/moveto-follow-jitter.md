# moveTo / turnTo follow-mode jitter: analysis, options and design sketches

Status: design notes only. Nothing described here is implemented.
Related spec: `.kiro/specs/moveto-turnto` (Requirements 2, 6, 9, 12).

## 1. Problem

When `moveTo()` follows a `TransformNode` and that node keeps moving, the character
alternates between walking and idling, and the walk and idle animations switch
before either completes one loop.

### Cause

`_navUpdateMoveTo()` in `src/CharacterController.ts` uses one threshold, `arrivalDistance`,
for two decisions:

- Stop: `horizontalDistance <= arrivalDist` calls `idle()` (the controller stays active).
- Resume: the next frame with `horizontalDistance > arrivalDist` calls `walk(true)`.

A node that moves near the boundary crosses it repeatedly, so the avatar flips between
walk and idle almost every frame. `_moveAVandCamera()` switches animations whenever the
resolved action changes, so each flip restarts a different animation.

`_navUpdateTurnTo()` has the same shape: it stops at `angularTolerance` and resumes at
the same value, so node tracking can start and stop turning in the same way.

Requirement 2.4 ("resume when the Target_Node moves beyond the Arrival_Distance") allows
this behavior, so some fixes below need spec wording changes.

## 2. Options considered

### A. Hysteresis (separate stop and resume distances)

- Stop at `arrivalDistance`. After stopping, resume only when the distance exceeds
  `arrivalDistance + resumeMargin`.
- New optional `MoveToOptions.resumeDistance`. Suggested default: `arrivalDistance + max(0.5, arrivalDistance * 0.5)`, never below `arrivalDistance`.
- Needs one new state flag (`_moveToArrived`). Small and backward compatible apart from the new default margin.
- Limit: a node that oscillates across the whole band still causes stop/start.

#### What hysteresis means

Hysteresis means a system's output depends on its recent history as well as its current
input. In control logic, it means using two different thresholds for switching on and
switching off, so the state does not flip back and forth when the input hovers near a
single threshold.

A household thermostat is the standard example. If it turned the heater on at exactly
20 C and off at exactly 20 C, a room sitting near 20 C would make it click on and off
constantly. Instead it turns on at 19 C and off at 21 C. Between 19 and 21, it keeps
whatever state it was already in.

For `moveTo` follow mode:

- **Today (one threshold):** the avatar idles when the distance is 0.5 or less and walks
  when it is more than 0.5. A node moving around 0.5 units away flips the state every frame.
- **With hysteresis (two thresholds):**
  - Stop walking when the distance is 0.5 or less (`arrivalDistance`).
  - Start walking again only when the distance is more than about 1.0 (`resumeDistance`).
  - Between 0.5 and 1.0, the avatar keeps doing what it was already doing. If it is idle,
    it stays idle, and if it is walking, it keeps walking.

The gap between the two values (0.5 to 1.0 here) is the dead band. The node has to move
clearly out of range before the avatar reacts, so small movements near the boundary no
longer cause start/stop cycles.

### B. Minimum time in each state (debounce)

- After switching to walk or idle, hold the state for a minimum time, ideally one animation loop.
- Addresses the "animation never completes a loop" complaint directly.
- Limit: while locked, the avatar can overshoot (walk) or lag (idle). Adds timing state.

### C. Keep moving near the target (slow down instead of idling)

- Inside a follow zone, keep walking at reduced speed; idle only after the node has been settled for a while.
- Smoothest visually, but needs per-call speed scaling, which the walk/run API does not have. Most invasive.

### D. Idle only when the target has settled

- Enter idle only if the distance is within `arrivalDistance` and the node's smoothed per-frame speed is below an epsilon.
- Needs a node velocity estimate. A node moving slowly but steadily may never count as settled.

### E. Predictive follow gap

- Follow `nodePosition - followGap` along the approach direction so the avatar trails at a constant distance and keeps walking.
- Changes the meaning of arrival (and `onComplete` timing) for node targets.

### turnTo equivalents

Same ideas: a `resumeTolerance` larger than `angularTolerance` (hysteresis), a minimum hold
time, and optional low-pass smoothing of the target angle to absorb small jitter.

### Decision

Combine **A** (hysteresis) with **B** (loop-gated switching). Defer C, D and E.
The two ways of building B are described in sections 3 and 4.

Shared design for A + B:

- New state `_moveToArrived: boolean` (and `_turnToArrived` for turnTo). Reset in `moveTo()`, `moveToStop()` and `_cancelMoveTo()`.
- New options: `MoveToOptions.resumeDistance`, `TurnToOptions.resumeTolerance` (default about 2x `angularTolerance`).
- Gate **idle -> walk** on "current animation completed one loop". The cost is a short delay.
- Walk -> idle: hysteresis alone first. Gating this direction on a full loop lets the avatar overshoot by up to one loop length of travel (for example about 3 units at walk speed 3 and a 1 s loop). Add it later as an option, or use a shorter minimum such as half a loop.
- Obstruction detection runs only in the moving branch. Keep the existing reset on arrival so holding in either state cannot trigger a false obstruction stop.

Per-frame logic for a node target (replaces the current arrival step):

```ts
if (this._moveToNode != null) {
    if (!this._moveToArrived) {
        // MOVING -> ARRIVED
        if (dist <= arrivalDist /* && this._currentLoopDone() if walk->idle gating is enabled */) {
            this._moveToArrived = true;
            this.idle();
            this._moveToLastPos = null;
            this._moveToObstructionCount = 0;
            // fire onComplete once (existing _moveToCompleteFired logic)
            return;
        }
        // otherwise fall through and keep walking
    } else {
        // ARRIVED -> MOVING
        if (dist > resumeDist && this._currentLoopDone()) {
            this._moveToArrived = false;
            this._moveToCompleteFired = false;
            // fall through to orient and walk
        } else {
            return;   // stay idle; the idle animation finishes its loop
        }
    }
}
```

The Vector3 target path is unchanged: it still stops completely at `arrivalDist`.

Testable pure helper (matches the project's pure-function test pattern):

```ts
function nextFollowState(arrived: boolean, dist: number, arrivalDist: number,
                         resumeDist: number, loopDone: boolean): boolean
```

Properties to test: no state flip while `arrivalDist < dist <= resumeDist`; no resume while
`loopDone` is false; identical to current behavior when `resumeDist == arrivalDist` and
`loopDone` is true.

## 3. Solution 1: elapsed time

Treat "one loop" as the animation's duration and compare it with a timestamp.

The animation start block in `_moveAVandCamera()` (around line 1157) already computes
`fps` and `c` (frame count) for the step sound. Store the loop duration there:

```ts
private _animStartMs = 0;
private _animLoopMs = 0;   // 0 when there is no animation

// when an animation starts (after fps and c are computed)
this._animStartMs = performance.now();
this._animLoopMs = (c * 1000) / (fps * Math.abs(actData.rate));

// when the action has no animation
this._animLoopMs = 0;

private _currentLoopDone(): boolean {
    return performance.now() - this._animStartMs >= this._animLoopMs;
}
```

- No animation, or animations stopped: `_animLoopMs` is 0, so the gate is open.
- Pros: two fields, no registration, no cleanup.
- Cons: approximate. Drifts with frame hitches. `performance.now()` keeps counting while the scene is paused (use accumulated `engine.getDeltaTime()` if that matters). Does not use the animation's real playback position.

## 4. Solution 2: animation events

Replace the timestamp pair with a flag set by an `AnimationEvent` near the end of the loop.
The gating logic is the same; only the source of "loop done" changes.

```ts
private _loopPending = false;                       // true until the first loop of the current animation completes
private _currentLoopDone(): boolean { return !this._loopPending; }
```

Arming, in the animation start block:

```ts
if (actData.exist) {
    this._loopPending = actData.loop && actData._loopEvt;   // only wait if an event will arrive
    // ... existing start / beginAnimation code ...
} else {
    this._loopPending = false;
}
```

Also set `_loopPending = false` in `stopAnim()`, `resumeAnim()` and wherever `_prevActData = null` is forced, so the gate is open when no animation is driving it.

Registration (once per action, not per `start()`):

```ts
private _addLoopEvent(actData: ActionData): void {
    if (!actData.exist || !actData.loop || actData._loopEvt) return;   // idempotent
    const cb = () => { if (this._prevActData === actData) this._loopPending = false; };
    if (this._isAG) {
        const ag = actData.ag;
        ag.targetedAnimations[0].animation.addEvent(new AnimationEvent(ag.to - 1, cb, false));
    } else {
        const range = this._skeleton.getAnimationRange(actData.name);
        const boneAnim = this._skeleton.bones.find(b => b.animations.length)?.animations[0];
        boneAnim?.addEvent(new AnimationEvent(range.to - 1, cb, false));
    }
    actData._loopEvt = true;
}
```

Notes:

- `AnimationEvent` is a new BabylonJS import. Add it to `webpack.es-externals.js` and `src/_babylonjs-esm-bridge.js` (the `esm-import-map-completeness` test checks this).
- Place the event slightly inside the range (`to - 1`), not on the last frame. On a loop wrap the current frame jumps back to `from` and an event exactly on `to` may be skipped. Verify on real assets.
- Skeleton ranges: the event is stored on a bone `Animation` shared by all ranges. Babylon should only fire events whose frame lies within the range currently playing. The callback's `_prevActData === actData` check is a second guard. Verify with a `.babylon` avatar.
- Cleanup: events live on the model's `Animation` objects. When `setActionMap()` runs again, remove old events (`animation.removeEvents(frame)`) or rely on the `_loopEvt` flag to avoid duplicates.
- Pros: exact, tied to real playback, handles `rate` changes and hitches.
- Cons: registration and cleanup code, import-map additions, edge behavior to verify.

### Comparison

| | Elapsed time | Animation event |
|---|---|---|
| Accuracy | Approximate, drifts with hitches or pause | Exact, tied to playback |
| `rate` changes | Needs recalculation | Handled |
| Setup | Two fields | Registration, cleanup, import map |
| Risk | Low | Loop-wrap edge and shared bone animations need checking |
| Fits sound roadmap | No | Yes |

### Recommendation

Since footstep sound is planned to move to animation events, build the event
infrastructure (section 5) and let the loop gate use it. Solution 1 is a valid interim
if the events are not ready.

## 5. Event infrastructure sketch

Goal: one place that registers, tracks and removes per-action animation events, used by
the loop gate now and by footstep sound later. It replaces the `setInterval` in the
animation start block (around line 1170) that plays the step sound twice per loop.

### 5.1 Concepts

- **Per-action events**: each `ActionData` (walk, run, idle, jump, ...) owns a list of events described in frame terms, not time.
- **Normalized positions**: events are described as a fraction `0..1` of the clip's range, or an absolute frame, then converted to frames once the range is known.
- **Single registry**: the controller records every `AnimationEvent` it added, with its target `Animation`, so they can be removed on `setActionMap()`, `setCharacter()` and `dispose`.
- **Callbacks check current action**: a callback ignores events from an action that is no longer playing.

### 5.2 Types

```ts
type ActionEventKind = "loop" | "footstep" | "custom";

interface ActionEventSpec {
    kind: ActionEventKind;
    /** 0..1 fraction of the clip range. Converted to a frame at registration. */
    at: number;
}

interface _RegisteredEvent {
    animation: Animation;     // the Animation the event was added to
    frame: number;            // absolute frame used
    action: ActionData;
    kind: ActionEventKind;
}
```

`ActionData` gains private bookkeeping fields (kept out of the public docs):

```ts
_eventsRegistered?: boolean;   // idempotency flag, replaces the _loopEvt flag above
```

### 5.3 Controller members

```ts
private _events: _RegisteredEvent[] = [];
private _loopPending = false;
private _onLoopObservers: Array<() => void> = [];    // optional extension point

// default event layout, applied to actions that do not specify their own
private static readonly _DEFAULT_EVENTS: { [kind: string]: ActionEventSpec[] } = {
    loop:     [{ kind: "loop", at: 0.98 }],
    footstep: [{ kind: "footstep", at: 0.25 }, { kind: "footstep", at: 0.75 }],
};
```

Footstep positions are placeholders. The current code plays the sound twice per loop at
evenly spaced intervals, so `0.25` and `0.75` (or `0.0` and `0.5`) match that behavior.
Real contact frames can be provided per action later.

### 5.4 Registration

```ts
private _registerActionEvents(actData: ActionData): void {
    if (!actData.exist || actData._eventsRegistered) return;

    const range = this._getClipRange(actData);      // { from, to, anim: Animation }
    if (!range) return;
    const len = range.to - range.from;

    const add = (spec: ActionEventSpec) => {
        const frame = range.from + len * spec.at;
        const cb = () => this._onActionEvent(actData, spec.kind);
        range.anim.addEvent(new AnimationEvent(frame, cb, false));
        this._events.push({ animation: range.anim, frame, action: actData, kind: spec.kind });
    };

    if (actData.loop) add(_DEFAULT_EVENTS.loop[0]);
    if (actData.sound) _DEFAULT_EVENTS.footstep.forEach(add);   // phase 2

    actData._eventsRegistered = true;
}

private _getClipRange(actData: ActionData): { from: number; to: number; anim: Animation } | null {
    if (this._isAG) {
        const ag = actData.ag;
        return { from: ag.from, to: ag.to, anim: ag.targetedAnimations[0].animation };
    }
    const r = this._skeleton.getAnimationRange(actData.name);
    const anim = this._skeleton.bones.find(b => b.animations.length)?.animations[0];
    return r && anim ? { from: r.from, to: r.to, anim } : null;
}
```

### 5.5 Dispatch

```ts
private _onActionEvent(actData: ActionData, kind: ActionEventKind): void {
    if (this._prevActData !== actData) return;      // stale: this action is not the one playing
    switch (kind) {
        case "loop":     this._loopPending = false; break;
        case "footstep": actData.sound?.play(); break;     // phase 2: replaces setInterval
    }
}
```

### 5.6 Lifecycle

| When | What |
|---|---|
| `setActionMap()` | `_clearActionEvents()`, then `_registerActionEvents()` for each action (after `_checkFastAnims()`) |
| `setCharacter()` / `setCharacterSkeleton()` | same as above (the animations may have changed) |
| Animation start block | `_loopPending = actData.loop && actData._eventsRegistered` |
| `stopAnim()` / `resumeAnim()` / `_prevActData = null` | `_loopPending = false` |
| Controller dispose | `_clearActionEvents()` |

```ts
private _clearActionEvents(): void {
    for (const e of this._events) {
        e.animation.removeEvents(e.frame);   // removes by frame; see note below
        e.action._eventsRegistered = false;
    }
    this._events.length = 0;
}
```

Note: `Animation.removeEvents(frame)` removes all events at that frame, including ones
the application added. Using distinct fractional frames, or storing the `AnimationEvent`
instance and splicing it from `anim.events` directly, avoids touching foreign events.

### 5.7 Phases

1. **Phase 1 (this feature)**: only the `loop` event, `_loopPending` gate, `_registerActionEvents`, `_clearActionEvents`. Verify wrap behavior on both asset types.
2. **Phase 2 (footstep sound)**: add `footstep` events, remove the `setInterval` / `_sndId` code, keep `actData.sound.stop()` on action change.
3. **Phase 3 (optional)**: per-action custom event specs on `ActionData`, and a public observable for consumers.

### 5.8 Risks to verify before building

- Loop wrap: does an event at `to - 1` (or `at: 0.98`) fire exactly once per loop for both an AnimationGroup (`.glb`) and a skeleton AnimationRange (`.babylon`)? Check with `tst/test.html` and `tst/testArAg.html`.
- Shared bone `Animation`: confirm events from other ranges do not fire while a different range plays.
- `rate` and `Math.abs(rate)`: a negative rate plays frames in reverse, so the loop event position must be mirrored (`1 - at`) for reverse playback.
- Fast variants (`_checkFastAnims()`) reuse clips at a different rate. Make sure event registration happens on the final animation objects and does not double-register.
- Event callbacks run inside the animation update. Keep them to flag changes and sound calls only.
- Multiple controllers sharing one model or animation groups would share the events. Callbacks already check `_prevActData`, but cleanup should remove only this controller's events.

## 6. Spec and documentation updates when implemented

- Requirements 2.3, 2.4, 6.4: describe `resumeDistance`, `resumeTolerance` and the loop gate.
- Requirement 9: add defaults for `resumeDistance` and `resumeTolerance`.
- Requirement 12.4 and 12.6: `onComplete` fires once per arrival cycle, which is now less frequent.
- `changelog.md`: new options and behavior.
- `README.md`: document the new options.
- `dist/CharacterController.d.ts`: regenerates through `MoveToOptions` / `TurnToOptions`.
- Tests: pure `nextFollowState()` property tests; mock-based test for event registration and cleanup; the `esm-import-map-completeness` test after adding `AnimationEvent`.

## 7. Open questions

- Expose `resumeDistance` / `resumeTolerance` publicly, or keep a fixed internal default?
- Gate walk -> idle on a loop (overshoot risk), or only idle -> walk?
- `onComplete` for node follow: first arrival only, or every re-arrival (Requirement 12.4 currently says every)?
- Interim: ship Solution 1 (elapsed time) first, or wait for the event infrastructure?
