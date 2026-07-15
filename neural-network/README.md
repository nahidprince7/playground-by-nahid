# Fish Brain

A neural network you can grow, one node at a time, and watch the consequences
swim around underneath it.

Open `index.html` in a browser. No build, no install, no server.

```
┌──────────────────────────────────────────────┐
│  the brain    senses → hidden → muscle       │   live activations
├──────────────────────────────────────────────┤
│  the tank     30 small fish, 1 big one       │   the consequences
└──────────────────────────────────────────────┘
```

## The idea

The small fish are steered by a real neural network — inputs, a tanh hidden
layer, two outputs (`steer x`, `steer y`). Nothing else moves them. The
diagram on top is not a decoration: it is that network, showing the exact
activations of the one fish wearing a ring in the tank below.

You start with **zero input nodes**. The fish are blind and the big fish eats
freely. Click a ghost node to give them a sense — where the predator is, how
close it has come, whether it is actually charging — and the network grows a
node, wires itself in, and the fish behave differently. The **deaths/min**
counter tells you whether the new node was worth anything.

## The part worth understanding

The network always needs a number in every input slot. So a sensor you have
*not* switched on still gets a value: a worst-case **prior**.

| sensor | prior when missing | what the fish therefore believes |
|---|---|---|
| Proximity | `1.0` | "the predator is always touching me" |
| Approaching | `1.0` | "it is always coming for me" |
| everything else | `0.0` | "no information" |

That is why a missing node *costs* something instead of being merely absent.
Give a fish `Predator X/Y` and nothing else and it knows exactly which way to
run — but it must assume the threat is permanently on top of it, so it runs
flat out, forever, straight into the glass, where it pins itself and dies.

**Two nodes make it measurably worse than blind.** That is the most useful
thing in the demo, and it is real, not staged. Add `Proximity` and the panic
switches off.

## The ladder

Measured, not asserted. `node tools/tune.mjs` runs the same simulation
headless across seeded trials and reports fish eaten per minute:

```
brain                  nodes   eaten/min          (120s × 16 seeds)
blind (no inputs)          0        57.4
+ predator x/y             2        83.4   ← worse than blind. panic.
+ proximity                3        56.3   ← panic off — but only back to square one
+ approaching              4        19.5   ← ignores a predator that is leaving. biggest win.
+ walls                    6        14.8   ← stops cornering itself
+ dodge                    8        12.4   ← sidesteps the charge line
                                    ────
                          full brain kills 4.6× less often than blind
```

Worth noticing that `Proximity` on its own buys you almost nothing — it lands
you right back where the blind fish started. All it does is undo the panic its
own neighbours caused. It pays for itself in what it *lets you add next*:
`Approaching` is only useful once the fish is no longer fleeing everything all
the time.

Run it yourself; the numbers move with the seed, and this simulation is noisier
than it looks — six trials was not enough to tell a real effect from luck, which
is why the tool runs sixteen. It fails loudly if a node stops paying for itself.
That is how the sensor set ended up as it is: schooling was in an early draft
and got cut, because clumping the fish into a ball turned out to be a buffet.

## How the gating works

A hidden unit like `flee →` has to fire only when the predator is on my left
**and** close **and** actually chasing. A single `tanh` unit can do that: give
it a bias steep enough that no one input can push it positive on its own.

```js
fleeR = tanh(6.0*pdx + 5.0*prox + 1.2*appr − 8.75)
```

Each signed direction gets a mirrored pair (`flee →` / `flee ←`) so the output
layer can subtract them — that is what lets a gate work on a signed value,
which one unit cannot do alone.

The weights are hand-wired, not trained. The forward pass is genuine.

## Files

- `index.html` — the page: canvas rendering, the diagram, the controls.
- `sim.js` — the brain and the world. No DOM, so it also runs in node.
- `tools/tune.mjs` — headless benchmark. The reason the weights are what they are.

## Controls

- Click a **ghost node** in the diagram, or a card on the right, to add a sense.
- Click **any fish** to watch its brain. Click empty water to go back to
  following whichever fish is in the most trouble.
- **Space** pauses.
- `?nodes=all` or `?nodes=pdx,pdy,prox` in the URL to start with a given brain.
