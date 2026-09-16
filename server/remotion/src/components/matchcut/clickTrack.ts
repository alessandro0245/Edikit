/**
 * Generates a continuous WAV audio track for MatchCut containing the client's
 * click sound placed at exact cut timestamps.
 *
 * Why this is necessary:
 * In Remotion Lambda, multi-chunk rendering with seamless AAC concatenation
 * (`forSeamlessAacConcatenation: true`) calculates a `trimLeftOffset` for each
 * chunk to align AAC packet boundaries (~21.3ms).
 * If individual sound effects with duration < `trimLeftOffset` are rendered via
 * `<Sequence><Audio src="click.wav" /></Sequence>`, Remotion treats them as
 * having expired before the chunk and silently drops them (`return null`),
 * causing entire 2-second chunks of audio to be completely silent.
 *
 * By generating a single continuous audio track that spans the entire composition,
 * `assetDuration` equals the video duration (e.g. 6s, 10s, 30s), so Remotion
 * never drops the asset, and FFmpeg seamlessly slices and concatenates the audio
 * across all Lambda workers with zero dropped cuts.
 */

// 16-bit PCM samples from client's original sfx/click.wav (48kHz, stereo, 768 frames = 1536 samples)
const CLICK_PCM_BASE64 =
  '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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

let cachedClickPcm: Int16Array | null = null;

function getClickPcm(): Int16Array {
  if (cachedClickPcm) {
    return cachedClickPcm;
  }
  let bytes: Uint8Array;
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(CLICK_PCM_BASE64, 'base64');
    bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } else {
    const binary = atob(CLICK_PCM_BASE64);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
  }
  cachedClickPcm = new Int16Array(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength / 2,
  );
  return cachedClickPcm;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    ).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

export function getClickTrackDataUri(
  cuts: number[],
  durationInFrames: number,
  fps: number,
  volume = 0.28,
): string {
  const clickPcm = getClickPcm();
  const sampleRate = 48000;
  const numChannels = 2; // stereo
  const totalDurationSec = durationInFrames / fps;
  const totalSamplesPerChannel = Math.ceil(totalDurationSec * sampleRate);
  const totalPcmSamples = totalSamplesPerChannel * numChannels;

  const pcm = new Int16Array(totalPcmSamples);

  // Place click PCM at each cut frame timestamp
  for (const cutFrame of cuts) {
    const startSamplePerChannel = Math.floor((cutFrame / fps) * sampleRate);
    const startSampleIndex = startSamplePerChannel * numChannels;

    for (
      let i = 0;
      i < clickPcm.length && startSampleIndex + i < totalPcmSamples;
      i++
    ) {
      const val = Math.round(clickPcm[i] * volume);
      pcm[startSampleIndex + i] = Math.max(-32768, Math.min(32767, val));
    }
  }

  // 44-byte standard PCM WAV header
  const dataSize = totalPcmSamples * 2;
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  // 'RIFF'
  header[0] = 0x52;
  header[1] = 0x49;
  header[2] = 0x46;
  header[3] = 0x46;
  view.setUint32(4, 36 + dataSize, true);
  // 'WAVE'
  header[8] = 0x57;
  header[9] = 0x41;
  header[10] = 0x56;
  header[11] = 0x45;
  // 'fmt '
  header[12] = 0x66;
  header[13] = 0x6d;
  header[14] = 0x74;
  header[15] = 0x20;
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  // 'data'
  header[36] = 0x64;
  header[37] = 0x61;
  header[38] = 0x74;
  header[39] = 0x61;
  view.setUint32(40, dataSize, true);

  const pcmBytes = new Uint8Array(
    pcm.buffer,
    pcm.byteOffset,
    pcm.byteLength,
  );
  const fullWav = new Uint8Array(44 + dataSize);
  fullWav.set(header, 0);
  fullWav.set(pcmBytes, 44);

  return 'data:audio/wav;base64,' + uint8ArrayToBase64(fullWav);
}
