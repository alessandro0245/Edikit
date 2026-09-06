# Design — UI Match Cut Feature

**Project:** Edikit
**Scope:** Visual and motion design for the match-cut video type
**Revision:** v3 — describes the actual delivered template (`MatchCut.tsx`), not a proposal. This supersedes earlier guesses, including a backdrop-blur recommendation that doesn't match what was actually built.

---

## 1. Concept

A word stays pinned dead-center of the frame while a search-result-style card behind it changes on every cut — one continuous zoom runs for the entire video, and the content underneath swaps abruptly at each cut without the camera ever pausing or resetting. A click sound marks each cut. No caption exists in the current template (open question, see §6).

## 2. Motion Design (as built)

- The zoom is **one exponential ramp spanning the full video**, from `zoomFrom` to `zoomTo` — not per-scene. `zoomIntensity` shortens how much of that ramp plays (100 = full travel, 0 = a static frame at `zoomTo`), it does not add per-scene resets.
- Cuts follow `buildCuts`: each screen holds for `holdStart` frames initially, decreasing geometrically toward `holdEnd` frames over `rampSeconds`, then stays at that fast, constant rate for the rest of the clip. With the shipped defaults (`holdStart=10, holdEnd=3, rampSeconds=1.2` at 30fps), that means cuts start roughly a third of a second apart and settle into a steady ~100ms apart — a genuine rapid-fire burst, not a deliberate slow zoom-and-cut.
- The word's font weight advances through `wordWeights` (default regular → medium → semibold, repeating) once per cut — a subtle rhythm independent of the scene content.
- A click plays on every cut (`clickSounds`, stepped through by position in the timeline if more than one file is supplied — currently just one, so uniform).

## 3. Visual Style (as built)

- Dark, minimal canvas — default background `#191919`, link-style text in `#1A73E8`, body/meta text in light gray tones (`textColor`/`mutedColor`). Not a white, Google-mimicking page.
- Site row: a plain muted circle (opacity 0.35) standing in for a favicon — deliberately generic, not per-site distinct, and not a real logo.
- Title line: `titleBefore` + the word (own weight/color) + `titleAfter`, laid out via exact text-measurement so the word's center lands on true canvas-center regardless of surrounding text length.
- Snippet: wraps across multiple lines below the title, width capped by `snippetWidthEm`.
- **Backdrop rows (reintroduced):** after seeing the actual rendered output, the empty space above/below the focal result read as unfinished, especially at the zoomed-out start of the clip. Two additional rows are now rendered above and below the focal result — reusing the previous/next entries already in the same `scenes` array, not a new content source — at a fixed left margin and width (not tied to the word-centering math, so they can't inherit its overflow issue), blurred (~4px) and dimmed (~35% opacity). They sit inside the same continuously-zooming layer as the focal content, so they fill the most space early on and recede out of frame as the zoom deepens.

## 4. Word Handling (as built)

- Hard length limit: 1–14 characters (schema-enforced). Soft warning past 12 recommended in the UI, per the README, since font size shrinks to compensate rather than truncating.
- Font size is chosen so the word cannot overflow even at the template's maximum configured zoom — computed from the word's measured width at worst-case (semibold) weight.
- Spacing around the word is handled by the component (NBSP insertion), with an exception for punctuation that should sit tight against it (quotes, apostrophes, brackets). Generated `titleBefore`/`titleAfter` should not include their own leading/trailing spaces.
- **The word must never appear inside the generated `titleBefore`/`titleAfter` text.** The component inserts it as a separate element; if a generation model writes it into the surrounding text too, it renders twice and the centering math anchors the wrong occurrence.

## 5. Content Design (generation-facing — see `architecture.md` §4-5)

Each scene needs: a plausible `siteName` and `url`, a short combined title (~40 characters across `titleBefore` + `titleAfter`), and a `snippet` that mentions the word once or twice in plain, specific, slightly mundane language — the shipped sample scenes (Britannica-style definitions, review-site snippets with counts and dates, forum threads with comment counts) are the calibration for tone. Avoid generic marketing filler ("is the future of digital transformation" reads as fake immediately).

**Open question, not decided here:** the shipped sample scenes attribute fabricated content to real, identifiable brands (Wikipedia, The Guardian, Reddit, Indeed, Nature, IMDb, Goodreads, Quora, YouTube). Whether the production generation prompt should keep doing this or switch to invented site names is a real content-attribution decision — see `architecture.md` §5.

## 6. Caption — Not in the Current Template

No caption field exists in `matchCutSchema`, and the component renders nothing of the kind. This conflicts with an earlier decision (made after reviewing the client's reference video, which did show a persistent caption). Needs a direct answer from the client: dropped, or an addition to build on top of this template. Not speculating on styling/position here until that's resolved.

## 7. Aspect Ratio / Resolution (as built)

- Three ratios: `9:16` (1080×1920 base), `1:1` (1080×1080 base), `16:9` (1920×1080 base) — a square option that wasn't in earlier versions of this spec.
- Layout is drawn on a fixed logical canvas (short side 1080) and scaled up for `4k` output (×2) — the same composition at higher fidelity, not a separate layout. Text is vector, so it's sharp at any scale.

## 8. Out of Scope

- Any change to the delivered Remotion mechanics (zoom curve, centering math, font-fit logic) without a specific reason — this is working, tested code.
- Per-site favicon distinctness, real logos, or page chrome beyond what's described in §3.
- User-adjustable colors/fonts/tuning values beyond the five user-facing form fields.
