const fs = require('fs');
let c = fs.readFileSync('remotion/src/components/BgImageLayer.tsx', 'utf8');

c = c.replace(
  /import \{ AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig \} from 'remotion';/,
  import { AbsoluteFill, Img, Video, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
);

c = c.replace(
  /const frame = useCurrentFrame\(\);/,
  const frame = useCurrentFrame();\n  const isVideo = imageUrl?.match(/\\\\.(mp4|webm|mov)(\\\\?.*)?$/i);
);

c = c.replace(
  /<Img src=\{imageUrl\} style=\{\{ width: '100%', height: '100%', objectFit: 'cover' \}\} \/>/,
  {isVideo ? <Video src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
);

c = c.replace(
  /<Img\s+src=\{imageUrl\}\s+style=\{\{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' \}\}\s+\/>/,
  {isVideo ? <Video src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} /> : <Img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />}
);

fs.writeFileSync('remotion/src/components/BgImageLayer.tsx', c);

