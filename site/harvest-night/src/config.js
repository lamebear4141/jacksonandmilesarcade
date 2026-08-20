// ============================================================================
// HARVEST NIGHT — CONFIG
// Every tunable number in the game lives here. Change a value, save, refresh
// the page — you should never need to touch another file to adjust how the
// game feels.
//
// Some of these knobs aren't wired up to anything yet (the scarecrow doesn't
// exist until Phase 3, the jump scare until Phase 4, etc). They're listed
// from the start so the whole dial-board is in one place as features land.
// ============================================================================

export const CONFIG = {

  // --- How hard is it? (live from Phase 3 onward) ---
  scarecrowSpeed: {
    stalking: 3.4,   // after 1 key — only moves when unseen
    hunting:  4.6,   // after 2 keys — takes steps while you watch
    frenzy:   6.2,   // after 3 keys — never stops
  },
  catchDistance: 1.6,   // how close before it gets you
  hideTime:      4.0,   // seconds crouched before it loses you

  // --- You (movement is live now; stamina/flashlight land later) ---
  walkSpeed:         4.2,
  sprintSpeed:        7.5,
  crouchSpeed:         2.2,   // not in the original spec table, but every speed should be tunable
  staminaSeconds:      5.0,   // how long you can sprint before you're out of breath
  staminaRegenSeconds: 8.0,   // how long a full stamina bar takes to refill from empty
  flashlightSeconds:  90,     // battery life at full brightness (Phase 5)

  // --- Spookiness ---
  fogDensity:      0.035, // higher = can see less = scarier
  jumpScareVolume: 0.85,
  gateHoldSeconds: 3.0,

  // --- Chicken mode ---
  babyMode: false,  // scarecrow 40% slower, no frenzy phase

  // --- World (not in the spec's table, but just as worth tweaking) ---
  world: {
    size: 80,        // the farm is size x size units, fenced on all sides
    eyeHeight: 1.7,
  },

  // --- Look controls ---
  mouse: {
    sensitivity: 0.0022,
  },

  // --- Head bob / camera feel while moving ---
  headBob: {
    walkFrequency:   10,
    walkAmount:      0.045,
    sprintFrequency: 14,
    sprintAmount:    0.07,
    sprintRoll:      0.03,   // camera roll while sprinting, in radians
  },

  // --- Footstep cadence (seconds between steps) ---
  footsteps: {
    walkInterval:   0.42,
    sprintInterval: 0.27,
    crouchInterval: 0.55,
  },
};
