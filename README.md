# A little garden

A procedural pixel garden built with TypeScript, Canvas 2D, Vite, and Bun. Branches follow simplex noise, split probabilistically, and sprout leaves and six geometric flower shapes.

## Run locally

Use Bun 1.3.6 or later.

```sh
bun install
bun run dev
```

Open the local URL printed by Vite. Bun runs the development tools and tests; the garden runs entirely in the browser, with no backend or runtime dependencies. `bun.lock` records dependency versions. Use `bun install --frozen-lockfile` for a reproducible install.

```sh
bun test            # Compare growth and drawing against the reference
bun run typecheck   # Strict TypeScript checks
bun run build       # Typecheck and build into dist/
bun run preview     # Serve the production build locally
```

## In the garden

- The page is a plain canvas with growing plants and ground. Click or tap to plant at a horizontal position along the soil.
- Focus the canvas, move with the arrow keys, and press Enter or Space to plant using the keyboard.
- Reload for another garden. Plant generation uses `Math.random()`.
- Gardens start with nine plants and hold up to 24 plants.
- Reduced-motion preferences show fully grown plants without animation. Hidden tabs do not accumulate growth to replay when restored.

## Project structure

```text
src/
  main.ts                 Canvas interaction and 60 Hz animation loop
  styles.css              Plain canvas layout
  simulation/
    config.ts             Garden dimensions and reference plant constants
    random.ts             Deterministic input for tests and ground texture
    noise.ts              Two-dimensional simplex noise
    types.ts              Entity interface and points
    branch.ts             Branch growth, splitting, and drawing
    leaf.ts               Leaf growth and drawing
    flower.ts             Six flower types, cluster growth, and drawing
    plant.ts              Entity collection and update schedule
    garden.ts             Plant placement and planting limits
  rendering/
    color.ts              RGBA color values
    sketch.ts             Drawing primitives, color conversion, and noise
    renderer.ts           Viewport composition and ground
tests/
  reference.test.ts        Differential tests against reference/plants.js
reference/
  original.js              Source bundle excerpt
  plants.js                Annotated source implementation
```

## Reference fidelity

The application uses TypeScript ports of the reference's branch, leaf, flower, color, noise, and drawing routines. The JavaScript files in `reference/` are preserved byte-for-byte and are not imported by the application.

Each plant runs in the reference's 160 by 240 coordinate space, starts at `(120, 240)` pointing upward, and is translated to its garden position. This preserves the boundary rules and canvas clipping without adding steering or interactions between neighbors. The renderer scales uniformly to fit short viewports and keeps the ground at the bottom of the full-screen canvas. Resizing changes presentation, not growth state.

Plants use the 160-step length limit, original flower palette reduction, spawn probabilities, cluster rules, and drawing passes. The entity list is extended during iteration, so newly created entities update in the same pass. Each plant has a 60 Hz frame counter; the update interval increases every 75 frames, up to six frames. Leaves and flowers retain the reference's interpolation without snapping to full size.

Garden-specific behavior consists of multiple translated plants, planting input, the ground, full-screen layout, and a 24-plant limit. Reduced-motion preferences advance the simulation to a mature still image, and hidden tabs suspend animation. An empty branch can be drawn safely before its first update.

Tests execute the untouched JavaScript reference with controlled random inputs and compare entity state, update timing, noise values, and drawing commands with the TypeScript implementation. All six flower drawing paths are exercised separately.

## Source

The plant algorithm is adapted from [tesseractc.at](https://tesseractc.at/) and its [source bundle](https://tesseractc.at/bundle.js?v=1770327483). The supplied JavaScript files are retained in `reference/` for inspection and are not loaded by the app.
