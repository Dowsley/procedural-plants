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
bun test            # Growth, replay, variety, and capacity checks
bun run typecheck   # Strict TypeScript checks
bun run build       # Typecheck and build into dist/
bun run preview     # Serve the production build locally
```

## In the garden

- The page is a plain canvas with growing plants and ground. Click or tap to plant at a horizontal position along the soil.
- Focus the canvas, move with the arrow keys, and press Enter or Space to plant using the keyboard.
- Reload for another garden. An optional `?seed=` URL parameter reproduces the nine starting plants.
- A seed reproduces the starting garden, not the history of manually added plants. Repeating the same additions in the same order reproduces those plants too.
- Gardens hold up to 24 plants. Growth is finite, and a settled garden redraws only when something changes.
- Reduced-motion preferences show fully grown plants without animation. Hidden tabs do not accumulate growth to replay when restored.

## Project structure

```text
src/
  main.ts                 Canvas interaction and fixed-step animation loop
  styles.css              Plain canvas layout
  simulation/
    config.ts             Dimensions, growth limits, seed varieties
    random.ts             Seed hashing and random streams
    noise.ts              Two-dimensional simplex noise
    types.ts              Branch, leaf, and flower data
    plant.ts              Branching, foliage, flowers, and growth easing
    garden.ts             Plant collection, layout, and planting limits
  rendering/
    renderer.ts           Pixel drawing and cached background scenery
tests/
  garden.test.ts           Simulation regression tests using bun:test
reference/
  original.js              Source bundle excerpt
  plants.js                Annotated source implementation
```

Simulation code has no DOM dependencies. Rendering does not consume simulation randomness. Each plant owns independent growth and noise streams, so adding a plant cannot alter its neighbors. Growth runs at 30 fixed steps per simulated second, independent of display refresh rate.

To tune the garden, start with `src/simulation/config.ts`. Plant height and the upward steering bias live in `src/simulation/plant.ts`; colors and flower choices live in `VARIETIES`.

## Source

The plant algorithm is adapted from [tesseractc.at](https://tesseractc.at/) and its [source bundle](https://tesseractc.at/bundle.js?v=1770327483). The supplied JavaScript files are retained in `reference/` for inspection and are not loaded by the app.
