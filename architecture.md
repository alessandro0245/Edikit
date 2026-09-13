# Architecture — UI Match Cut Feature

**Project:** Edikit
**Scope:** New "match cut" video generation pipeline, sitting alongside the existing AI Prompt-to-Video engine
**Revision:** v3 — client delivered a working Remotion implementation (`MatchCut.tsx`, `Root.tsx`, font/audio assets). That side is done. This document now describes the real, delivered mechanics and scopes the remaining work, which is backend-only.

---

## 1. Context — Existing Edikit Pipeline

```
Next.js Frontend → Upload assets (S3) → Submit prompt/colors/aspectRatio
   → NestJS VideoController → CreditsService (deduct credits)
   → PromptService (builds system prompt) → Claude returns JSON VideoConfig
   → RemotionLambdaService (local worker_threads OR AWS Lambda)
   → Remotion Composition Engine (Root.tsx → AIVideoComposition.tsx → KineticScene / ContentScene / MediaLayer)
   → Final MP4 → S3/local → polled & displayed on client
```

**Root cause of the current 3–4s cap:** `category-templates.ts` hard-instructs Claude to produce **exactly one scene** at 2.5–3.5s for single-scene categories. `prompt.service.ts`'s `buildFallbackConfig` hardcodes the same range as a fallback. Structural to the existing engine — hence a parallel pipeline for match cut.

## 2. What's Already Delivered (client-provided, do not rebuild)

- `src/MatchCut.tsx` — the composition component. Exports `matchCutSchema`, `getOutputSize`, `getBaseSize`, `buildCuts`, `FPS`.
- `src/Root.tsx` — composition registration + `calculateMetadata` (derives width/height/durationInFrames from props — never set directly on the `Composition`).
- `public/click.wav`, `public/GoogleSansFlex-opsz120-{400,500,600}.woff2`.
- Two extra deps: `@remotion/layout-utils`, `@remotion/fonts`.

**How it actually works, confirmed from the code:**

- **One continuous zoom for the whole video.** `zoom` is a single exponential ramp from `zoomFrom` to `zoomTo` computed from `frame` / `durationInFrames` — it never resets. Cuts only swap which `scene` is showing; the camera keeps climbing smoothly underneath.
- **Word-centering is exact, not measured at runtime.** `measureText` (from `@remotion/layout-utils`) gets the pixel width of the text before the word (`titleBefore` + a possible NBSP) and of the word itself at its current weight, then positions the whole title line so the word's center lands on canvas-center: `lineLeft = base.width/2 - beforeWidth - wordWidth/2`. No DOM refs, no `delayRender` gate beyond what `loadFont` already does internally.
- **Font size is chosen to survive maximum zoom.** It measures the word at a probe size (worst-case weight 600), derives width-per-pixel, and picks the largest font size such that the word stays within 82% of canvas width even at `max(zoomFrom, zoomTo)`. Clamped between 24 and `maxFontSize`.
- **The word's weight cycles per cut** through `wordWeights` (default `[400, 500, 600]`), independent of which scene is showing.
- **Scenes cycle if under-supplied.** `scene = list[cutIndex % list.length]` — if fewer scenes are passed than cuts require, they repeat. Production must supply exactly `buildCuts(...).length` scenes.
- **Visual style is a dark, minimal canvas** (`backgroundColor` default `#191919`, `linkColor` default `#1A73E8`), a plain muted-dot placeholder instead of a real favicon.
- **Backdrop rows:** two additional blurred, dimmed rows render above/below the focal result, reusing the previous/next entries from the same `scenes` array (no new content source). Fixed left margin/width, independent of the word-centering math. See `design.md` §3 for the visual rationale and exact values.
- **Audio:** one `<Sequence>` per cut (from `cuts`, each ~6 frames long) holding an `<Audio>` of a click sound stepped through `clickSounds` by position in the timeline — enables a per-file pitch progression if more than one file is supplied. Default is a single file, so every click sounds the same.

## 3. Data Model — `matchCutSchema` (from the delivered code)

```typescript
// User-facing (the form)
word: string;                       // 1-14 chars
durationInSeconds: number;          // 1-10, slider
aspectRatio: '9:16' | '1:1' | '16:9';
resolution: '1080p' | '4k';
zoomIntensity: number;              // 0-100, slider

// Backend-generated per render
scenes: {
  siteName: string;
  url: string;
  titleBefore: string;              // word must NOT appear here
  titleAfter: string;                // word must NOT appear here
  snippet: string;
}[];

// Fixed template tuning — NOT in the user form, pass through unchanged
// from Root.tsx's defaultProps unless there's a specific reason to vary them:
holdStart: number;          // int 1-60, default 10 (frames — first hold, slow)
holdEnd: number;             // int 1-60, default 3 (frames — steady-state hold, fast)
rampSeconds: number;         // default 1.2 — time to ramp from holdStart to holdEnd
maxFontSize: number;         // default 120
letterSpacingEm: number;     // default 0.04
snippetWidthEm: number;      // default 13
wordWeights: number[];       // default [400, 500, 600]
clickSounds: string[];       // default ['click.wav']
clickVolume: number;         // default 0.28
zoomFrom: number;            // default 0.5
zoomTo: number;              // default 1
backgroundColor: string;     // default '#191919'
linkColor: string;           // default '#1A73E8'
textColor: string;           // default '#e8eaed'
mutedColor: string;          // default '#9aa0a6'
```

**No `caption` field exists in this schema.** This conflicts with the caption decision made earlier (based on the client's reference video) — needs an explicit answer from the client before building anything caption-related. Not assumed either way below.

## 4. Remaining Pipeline — Backend Only

```
Frontend: word + durationInSeconds + aspectRatio + resolution + zoomIntensity
        ↓
POST /video/generate-matchcut
        ↓
VideoController → MatchCutService (new, or added to existing VideoService)
        ↓
CreditsService.deduct(...)                     [reused, unchanged]
        ↓
RenderJob created (status: PENDING, type: 'matchcut')
        ↓
durationInFrames = round(durationInSeconds * FPS)
rampFrames = min(round(rampSeconds * FPS), floor(durationInFrames * 0.5))
sceneCount = buildCuts(durationInFrames, holdStart, holdEnd, rampFrames).length
   — MUST import buildCuts from the actual MatchCut.tsx and use the SAME
     holdStart/holdEnd/rampSeconds defaults as Root.tsx, or the generated
     scene count won't match what the render needs.
        ↓
AI generation call → sceneCount scenes about `word`, enforcing:
   1. word must NOT appear in titleBefore or titleAfter
   2. titleBefore + titleAfter combined ≈ 40 chars
   3. snippet mentions word once or twice, plain text
        ↓
Validate response against sceneSchema. On failure: retry generation,
do NOT render a malformed scene — costs a full render + user credits.
        ↓
inputProps = { word, durationInSeconds, aspectRatio, resolution,
               zoomIntensity, scenes, ...fixedTuningDefaults }
        ↓
RemotionLambdaService.render(...)              [reused, unchanged]
        ↓
Final MP4 → S3/local → polled via GET /video/job/:id
```

## 5. Open Decisions

- **Caption:** not in the delivered schema. Confirm with the client whether it's dropped or still wanted as an addition on top of this template.
- **Real vs. fictional brand names in generated content:** the delivered `defaultProps` sample scenes attach fabricated reviews/quotes/stats to real, identifiable brands (Wikipedia, The Guardian, Reddit, Indeed, Nature, IMDb, Goodreads, Quora, YouTube). That's presumably the intended style, but it's worth an explicit decision before the generation prompt is written for production, since it determines the entire content-attribution posture of the feature.
- Which LLM/call generates `scenes` (existing Claude Haiku integration is the natural fit, reusing what's already in the stack) — no architectural blocker either way, just needs picking.
- Whether `RenderJob` needs a schema/migration change to store this feature's `inputProps` shape, or a separate table.
- Whether to build a dedicated `MatchCutModule`/`MatchCutService` or extend the existing `VideoModule`/`VideoService`.
- Remotion licensing: free under 3 people, Company License at 4+ (Edikit's use case maps to the "Automators" tier — $0.01/render, $100/mo minimum). Confirm actual team headcount against this before shipping.

## 6. Frontend Integration (Next.js)

Locate the existing AI-video creation form and mirror its pattern. New form fields, matching the real schema exactly: word (text, enforce 1-14 chars, soft warning past 12), duration (slider 1-10s), aspect ratio (`9:16` / `1:1` / `16:9`), resolution (`1080p` / `4k`), zoom intensity (slider 0-100). No caption field until §5 is resolved. Submit calls `POST /video/generate-matchcut`; reuse existing job-polling and result/download UI unchanged.
