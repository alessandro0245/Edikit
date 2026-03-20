
import { PromptService } from './modules/video/prompt.service';
import { generateVisualSeed } from './modules/video/prompt-templates/category-templates';
import { MoodType, ColorPalette } from './modules/video/color.system';

console.log('Imports successful');

const mood: MoodType = 'energetic';
const palette: ColorPalette = {
    bg1: '#000', bg2: '#000', bg3: '#000', bgCta: '#000',
    textOnBg1: '#fff', textOnBg2: '#fff', textOnBg3: '#fff', textOnCta: '#fff',
    accent: '#f00', mood: 'energetic', name: 'test'
};

const seed = generateVisualSeed(mood, 123, palette);
console.log('Seed generated', seed);
