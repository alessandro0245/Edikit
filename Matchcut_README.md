# Match Cut template — integration notes

Remotion template. A word stays pinned dead centre of the frame at a fixed
position while the search-result screen around it changes on every cut, under a
continuous zoom. The illusion breaks the moment the word moves, so everything
below exists to keep it still.

## Files

| File | What it is |
|---|---|
| `src/MatchCut.tsx` | The component. Also exports `matchCutSchema`, `getOutputSize`, `buildCuts`, `FPS`. |
| `src/Root.tsx` | Composition registration + `calculateMetadata`. |
| `public/click.wav` | 20 ms click, played on every cut. |
| `public/GoogleSansFlex-opsz120-{400,500,600}.woff2` | Font, three static cuts. |

Two dependencies beyond the Remotion base install:

```
npm i @remotion/layout-utils @remotion/fonts
```

Font is Google Sans Flex, shipped as three static cuts in `public/` — regular,
medium and semibold, all instanced at optical size 120. These match the AE
templates, and being static rather than variable they render identically
everywhere with no dependence on how a browser resolves optical sizing.

Google Sans Flex has been on Google Fonts under the Open Font License since
November 2025, so bundling the files is fine — the licence permits commercial
use and requires no attribution.

`loadFont` from `@remotion/fonts` calls `delayRender` internally, so the render
waits for the fonts on its own. Do not add a second loading gate on top of it.

Audio is one `<Sequence>` per cut, each holding its own `<Audio>`, so closely
spaced cuts do not cut each other off — in the final burst they land roughly
100 ms apart, and a single shared track would clip each click with the next.

`clickSounds` is a list of filenames resolved with `staticFile`, stepped through
across the clip. It currently holds one file, so every cut sounds the same;
adding more files makes the click change character over the clip. An empty array
disables audio.

Note for any future pitch work: `toneFrequency` is not an option. It only takes
effect during server-side rendering and stays silent in the Studio and the
`<Player />`, so the user would hear something different from what they render.

## User form

Four inputs. `matchCutSchema` is the contract — please validate against it
rather than writing a second schema that can drift out of sync.

| Field | Type | Constraint |
|---|---|---|
| `word` | string | 1–14 characters |
| `durationInSeconds` | number | slider, 1–10 |
| `aspectRatio` | enum | `9:16`, `1:1`, `16:9` |
| `resolution` | enum | `1080p`, `4k` |
| `zoomIntensity` | number | slider, 0–100 |

The 14-character cap is a design limit, not a technical one. Font size adapts to
the word, so longer words still render — they just render smaller, and the word
stops dominating the frame, which is the whole point of the effect. A word made
of wide letters (M, W) uses up the budget faster than the character count
suggests. A soft warning past 12 characters reads better than a hard block.

`zoomIntensity` shortens the zoom travel rather than moving its endpoints: the
zoom always lands on `zoomTo`, and the starting scale slides toward it as the
value drops, until at 0 the frame is static. The interpolation is geometric, to
match the zoom ramp itself — with a linear one, the midpoint of the slider would
not halve the perceived movement.

Everything else in the schema is template tuning. Keep the values from
`defaultProps` and do not expose them in the UI for now.

## Output size and duration

Do not set `width`, `height` or `durationInFrames` on the composition. They are
derived from the props by `calculateMetadata` in `Root.tsx`, which is the
supported way to make a Remotion composition's dimensions depend on user input.

FPS is fixed at 30. Sizes:

| Aspect | 1080p | 4k |
|---|---|---|
| 9:16 | 1080×1920 | 2160×3840 |
| 1:1 | 1080×1080 | 2160×2160 |
| 16:9 | 1920×1080 | 3840×2160 |

The layout is drawn on a fixed logical canvas (short side 1080) and scaled to
the output size, so 4k is the same frame at higher fidelity, not a different
composition. Text is vector, so it stays sharp at any scale — this is the part
we cannot do with the After Effects templates.

## Generated content

`scenes` is an array of search results. It must be generated per render from the
user's word, because the fake results have to be about that word — a video for
"MONEY" surrounded by text about the ego is worthless.

Shape of one scene:

```json
{
  "siteName": "Britannica",
  "url": "https://www.britannica.com > topic",
  "titleBefore": "",
  "titleAfter": "| Definition, Freud, Examples & Facts",
  "snippet": "In psychoanalytic theory, the ego is the portion of the personality that..."
}
```

Three rules that the generation prompt must enforce, because breaking any of
them visibly breaks the video:

1. **The word must not appear in `titleBefore` or `titleAfter`.** The component
   inserts it between them. If the model writes it into the title, it will be
   rendered twice and the anchoring maths will centre the wrong one.
2. **Titles stay short.** Roughly 40 characters combined across the two halves.
   Longer titles run off both edges of the frame.
3. **`snippet` should mention the word once or twice.** It is rendered as plain
   text with no bolding, but the description still has to read as if it belongs
   to a page about that word.

Spacing around the word is handled in the component, so the generated
`titleBefore` / `titleAfter` do not need leading or trailing spaces. Quotes,
apostrophes and brackets stay tight against the word (`Alter Ego' review`);
everything else, dashes and pipes included, gets a space.

### How many scenes to request

Ask for exactly one scene per cut, otherwise screens repeat. The cut count is
`buildCuts(...).length`, exported from `MatchCut.tsx` so backend and render use
the same function:

```ts
import {buildCuts, FPS} from './MatchCut';

const durationInFrames = Math.round(durationInSeconds * FPS);
const rampFrames = Math.min(Math.round(1.2 * FPS), Math.floor(durationInFrames * 0.5));
const sceneCount = buildCuts(durationInFrames, 10, 3, rampFrames).length;
```

For a 6-second video this is roughly 45, for a 10-second one roughly 90. If fewer scenes are supplied the
component cycles them, which is a safe fallback but visibly repetitive.

### Validation

Parse the model's JSON with the same `sceneSchema` before rendering. On failure,
retry the generation rather than rendering — a malformed scene produces a broken
frame that still costs a full render and a user's credits.

## Rendering

Everything is passed as `inputProps`. Nothing in `defaultProps` is fixed
content; those values exist so the template opens in Remotion Studio.

```ts
inputProps: {
  word,
  durationInSeconds,
  aspectRatio,
  resolution,
  scenes,
  // plus the tuning values from defaultProps, unchanged
}
```

## Open question

Remotion's licence is free for teams of up to three people; beyond that a
company licence applies. Since Edikit is a paid product, please confirm how you
have this covered before we ship. https://www.remotion.pro/license
