// ─── ADD THIS to prompt.service.ts ───────────────────────────────────────────
// After `this.validateVideoConfig(config);`, insert:

import { detectMood } from '../../../src/modules/freesounds/audio-config';

// Inside processPrompt(), after validateVideoConfig(config):
config.audio = detectMood(prompt, config.scenes, categoryId);

// That's the only change needed in prompt.service.ts
// detectMood reads the prompt text + all scene text + categoryId
// and returns { mood, trackIndex, volume, sfxVolume }
// which gets passed into VideoConfig and down to AIVideoComposition
