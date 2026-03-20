
import { PromptService } from './modules/video/prompt.service';
import * as ColorSystem from './modules/video/color.system';

console.log('Compiling test3.ts');
// Force usage to ensure import is not elided
const p: ColorSystem.MoodType = 'energetic';
console.log('Mood:', p);
