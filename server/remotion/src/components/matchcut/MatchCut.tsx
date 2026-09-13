// import React, {useMemo} from 'react';
// import {
//   AbsoluteFill,
//   Audio,
//   Sequence,
//   staticFile,
//   useCurrentFrame,
//   useVideoConfig,
// } from 'remotion';
// import {measureText} from '@remotion/layout-utils';
// import {loadFont} from '@remotion/fonts';
// import {z} from 'zod';

// // Google Sans Flex istanziato all'ottico 120, gli stessi file dei template AE.
// // Sono tagli statici, non il font variabile: le forme sono fissate a quella
// // dimensione e non cambiano col corpo, quindi il render e' sempre identico.
// // loadFont attende da solo il caricamento prima di far partire il render.
// // Il nome non deve contenere pezzi che iniziano con una cifra:
// // in CSS "120pt" non e' un identificatore valido, e l'intera
// // dichiarazione font-family verrebbe scartata dal browser.
// export const fontFamily = 'GoogleSansFlex120';

// for (const weight of ['400', '500', '600']) {
//   loadFont({
//     family: fontFamily,
//     url: staticFile(`GoogleSansFlex-opsz120-${weight}.woff2`),
//     weight,
//   });
// }

// export const FPS = 30;

// /**
//  * Ogni scena e' un risultato di ricerca.
//  * La parola NON va scritta dentro titleBefore / titleAfter: la inserisce
//  * il componente, ed e' l'unico modo perche' resti ancorata al centro.
//  */
// const sceneSchema = z.object({
//   siteName: z.string(),
//   url: z.string(),
//   titleBefore: z.string(),
//   titleAfter: z.string(),
//   snippet: z.string(),
// });

// export const matchCutSchema = z.object({
//   // --- scelto dall'utente nel form ---
//   word: z.string().min(1).max(14),
//   durationInSeconds: z.number().min(1).max(10),
//   aspectRatio: z.enum(['9:16', '1:1', '16:9']),
//   resolution: z.enum(['1080p', '4k']),
//   // 100 = corsa piena da zoomFrom a zoomTo, 0 = inquadratura ferma
//   zoomIntensity: z.number().min(0).max(100),

//   // --- generato dal backend a partire dalla parola ---
//   scenes: z.array(sceneSchema),

//   // --- messa a punto del template, fuori dal form utente ---
//   holdStart: z.number().int().min(1).max(60),
//   holdEnd: z.number().int().min(1).max(60),
//   rampSeconds: z.number().min(0.1).max(5),
//   maxFontSize: z.number().min(40).max(400),
//   letterSpacingEm: z.number().min(0).max(0.3),
//   snippetWidthEm: z.number().min(4).max(24),
//   wordWeights: z.array(z.number().min(100).max(900)),
//   // File in public/ suonati a ogni stacco, dal piu' acuto al piu' grave.
//   // Si scorrono lungo la clip, quindi il click si abbassa via via.
//   // Array vuoto = nessun suono.
//   clickSounds: z.array(z.string()),
//   clickVolume: z.number().min(0).max(2),
//   zoomFrom: z.number().min(0.1).max(4),
//   zoomTo: z.number().min(0.1).max(6),
//   backgroundColor: z.string(),
//   linkColor: z.string(),
//   textColor: z.string(),
//   mutedColor: z.string(),
// });

// export type MatchCutProps = z.infer<typeof matchCutSchema>;
// type Scene = z.infer<typeof sceneSchema>;

// const EMPTY_SCENE: Scene = {
//   siteName: '',
//   url: '',
//   titleBefore: '',
//   titleAfter: '',
//   snippet: '',
// };

// /**
//  * Tela logica su cui e' disegnato il layout: lato corto 1080.
//  * Il 4K e' la stessa tela scalata, non un layout diverso, cosi' i due
//  * formati sono identici e cambia solo la nitidezza.
//  */
// export const getBaseSize = (aspectRatio: MatchCutProps['aspectRatio']) => {
//   if (aspectRatio === '16:9') {
//     return {width: 1920, height: 1080};
//   }
//   if (aspectRatio === '1:1') {
//     return {width: 1080, height: 1080};
//   }
//   return {width: 1080, height: 1920};
// };

// /** Dimensioni reali del file in uscita. Usata da calculateMetadata. */
// export const getOutputSize = (
//   aspectRatio: MatchCutProps['aspectRatio'],
//   resolution: MatchCutProps['resolution'],
// ) => {
//   const base = getBaseSize(aspectRatio);
//   const factor = resolution === '4k' ? 2 : 1;
//   return {width: base.width * factor, height: base.height * factor};
// };

// /**
//  * Frame in cui avviene ogni stacco. La durata di una schermata scende da
//  * holdStart a holdEnd nell'arco della rampa, poi resta a holdEnd: i cambi
//  * partono lenti, accelerano, e da li' in avanti vanno a raffica costante.
//  *
//  * Stessa funzione lato backend per sapere quante scene servono: la lunghezza
//  * dell'array restituito e' il numero di schermate necessarie senza ripetizioni.
//  */
// export const buildCuts = (
//   total: number,
//   holdStart: number,
//   holdEnd: number,
//   rampFrames: number,
// ) => {
//   const cuts: number[] = [];
//   let f = 0;
//   let guard = 0;
//   while (f < total && guard < 2000) {
//     cuts.push(f);
//     const t = Math.min(1, f / Math.max(1, rampFrames));
//     const hold = Math.max(1, Math.round(holdStart * Math.pow(holdEnd / holdStart, t)));
//     f += hold;
//     guard++;
//   }
//   return cuts;
// };

// export const MatchCut: React.FC<MatchCutProps> = ({
//   word,
//   aspectRatio,
//   zoomIntensity,
//   scenes,
//   holdStart,
//   holdEnd,
//   rampSeconds,
//   maxFontSize,
//   letterSpacingEm,
//   snippetWidthEm,
//   wordWeights,
//   clickSounds,
//   clickVolume,
//   zoomFrom,
//   zoomTo,
//   backgroundColor,
//   linkColor,
//   textColor,
//   mutedColor,
// }) => {
//   const frame = useCurrentFrame();
//   const {durationInFrames, fps, width: outWidth} = useVideoConfig();

//   const base = getBaseSize(aspectRatio);
//   // Il layout e' disegnato sulla tela logica e poi scalato all'uscita reale.
//   const canvasScale = outWidth / base.width;

//   const rampFrames = Math.max(
//     1,
//     Math.min(Math.round(rampSeconds * fps), Math.floor(durationInFrames * 0.5)),
//   );

//   const cuts = useMemo(
//     () => buildCuts(durationInFrames, holdStart, holdEnd, rampFrames),
//     [durationInFrames, holdStart, holdEnd, rampFrames],
//   );

//   const cutIndex = useMemo(() => {
//     let i = 0;
//     while (i + 1 < cuts.length && cuts[i + 1] <= frame) {
//       i++;
//     }
//     return i;
//   }, [cuts, frame]);

//   const list = scenes && scenes.length > 0 ? scenes : [EMPTY_SCENE];
//   const scene = list[cutIndex % list.length];

//   // Il peso della sola parola avanza in sequenza a ogni stacco:
//   // regular, medium, semibold, e da capo.
//   const weights = wordWeights && wordWeights.length > 0 ? wordWeights : [400];
//   const wordWeight = weights[cutIndex % weights.length];

//   // Corpo del testo calcolato sulla parola: a 18 caratteri un corpo fisso
//   // uscirebbe dallo schermo. Si misura a 100px, si ricava la larghezza per
//   // pixel di corpo e si sceglie il corpo che tiene la parola dentro la tela
//   // nel momento di massimo zoom. Il caso peggiore e' il semibold, piu' largo.
//   const probeSize = 100;
//   const probeWidth = measureText({
//     text: word || ' ',
//     fontFamily,
//     fontSize: probeSize,
//     fontWeight: 600,
//     letterSpacing: `${probeSize * letterSpacingEm}px`,
//     validateFontIsLoaded: false,
//   }).width;
//   const widthPerPx = Math.max(0.0001, probeWidth / probeSize);
//   const fitted = (base.width * 0.82) / (widthPerPx * Math.max(zoomFrom, zoomTo));
//   const fontSize = Math.max(24, Math.min(maxFontSize, fitted));

//   const letterSpacing = `${fontSize * letterSpacingEm}px`;
//   const titleStyle = {
//     fontFamily,
//     fontSize,
//     fontWeight: 400,
//     letterSpacing,
//     validateFontIsLoaded: false,
//   };

//   // Lo spazio attorno alla parola non si puo' lasciare a chi compila il form:
//   // se manca, la parola si attacca a quella accanto. Si aggiunge qui, salvo
//   // quando accanto c'e' punteggiatura ("Alter Ego' review" deve restare unito).
//   // E' uno spazio unificatore: uno spazio normale in coda verrebbe collassato
//   // dal layout e la misura per il centraggio risulterebbe corta.
//   // L'eccezione vale solo per virgolette, apostrofi e parentesi, cioe' i soli
//   // caratteri che stanno davvero attaccati alla parola ("Alter Ego' review").
//   // Trattini, barre e simili sono parole a se' e lo spazio lo vogliono.
//   const NBSP = '\u00A0';
//   const before =
//     scene.titleBefore.length > 0 &&
//     !/[\s([{"'\u2018\u201C]$/.test(scene.titleBefore)
//       ? scene.titleBefore + NBSP
//       : scene.titleBefore;
//   const after =
//     scene.titleAfter.length > 0 &&
//     !/^[\s.,;:!?)\]}"'\u2019\u201D]/.test(scene.titleAfter)
//       ? NBSP + scene.titleAfter
//       : scene.titleAfter;

//   // Larghezza del testo che precede la parola, e della parola col suo peso.
//   // Da qui lo scostamento che porta la parola esattamente al centro: e'
//   // questo che tiene fermo l'occhio mentre tutto il resto cambia.
//   const safe = (n: number) => (Number.isFinite(n) ? n : 0);
//   const beforeWidth = safe(measureText({text: before, ...titleStyle}).width);
//   const wordWidth = safe(
//     measureText({...titleStyle, text: word, fontWeight: wordWeight}).width,
//   );

//   const lineLeft = base.width / 2 - beforeWidth - wordWidth / 2;
//   const lineHeight = fontSize * 1.25;
//   const lineTop = base.height / 2 - lineHeight / 2;

//   // L'intensita' accorcia la corsa invece di spostarne gli estremi: il punto
//   // di arrivo resta zoomTo, la partenza si avvicina fino a coincidere con
//   // esso a intensita' zero. L'accorciamento e' geometrico come la rampa,
//   // altrimenti a meta' slider il movimento non si dimezzerebbe davvero.
//   const zoomStart = zoomTo * Math.pow(zoomFrom / zoomTo, zoomIntensity / 100);

//   // Rampa esponenziale: la scala cresce in proporzione a se stessa, quindi
//   // il movimento si percepisce a velocita' costante dal primo frame.
//   const zoomProgress = Math.min(1, frame / Math.max(1, durationInFrames - 1));
//   const zoom = zoomStart * Math.pow(zoomTo / zoomStart, zoomProgress);

//   const metaSize = fontSize * 0.34;
//   const snippetSize = fontSize * 0.42;

//   return (
//     <AbsoluteFill style={{backgroundColor, overflow: 'hidden'}}>
//       {/* Un click su ogni stacco. Ogni Sequence e' indipendente, quindi due
//           stacchi ravvicinati non si tagliano l'uno con l'altro. */}
//       {clickSounds && clickSounds.length > 0
//         ? cuts.map((cutFrame, i) => {
//             // Il click scende di tono lungo la clip scorrendo i file gia'
//             // intonati. Si fa cosi' e non con toneFrequency perche' quello
//             // vale solo in rendering: in anteprima non si sentirebbe nulla.
//             const t = cutFrame / Math.max(1, durationInFrames - 1);
//             const pick = Math.min(
//               clickSounds.length - 1,
//               Math.floor(t * clickSounds.length),
//             );
//             return (
//               <Sequence
//                 key={i}
//                 from={cutFrame}
//                 durationInFrames={Math.max(1, Math.round(fps * 0.2))}
//                 layout="none"
//               >
//                 <Audio src={staticFile(clickSounds[pick])} volume={clickVolume} />
//               </Sequence>
//             );
//           })
//         : null}
//       <div
//         style={{
//           position: 'absolute',
//           width: base.width,
//           height: base.height,
//           transform: `scale(${canvasScale})`,
//           transformOrigin: 'top left',
//         }}
//       >
//         <AbsoluteFill
//           style={{
//             transform: `scale(${zoom})`,
//             transformOrigin: 'center center',
//           }}
//         >
//           {/* riga del sito, sopra al titolo */}
//           <div
//             style={{
//               position: 'absolute',
//               left: lineLeft,
//               top: lineTop - fontSize * 1.15,
//               display: 'flex',
//               alignItems: 'center',
//               gap: fontSize * 0.22,
//               whiteSpace: 'nowrap',
//             }}
//           >
//             <div
//               style={{
//                 width: fontSize * 0.62,
//                 height: fontSize * 0.62,
//                 borderRadius: '50%',
//                 backgroundColor: mutedColor,
//                 opacity: 0.35,
//                 flexShrink: 0,
//               }}
//             />
//             <div style={{fontFamily}}>
//               <div style={{fontSize: metaSize, color: textColor, lineHeight: 1.35}}>
//                 {scene.siteName}
//               </div>
//               <div style={{fontSize: metaSize, color: mutedColor, lineHeight: 1.35}}>
//                 {scene.url}
//               </div>
//             </div>
//           </div>

//           {/* il titolo: la riga che contiene la parola ancorata */}
//           <div
//             style={{
//               position: 'absolute',
//               left: lineLeft,
//               top: lineTop,
//               height: lineHeight,
//               display: 'flex',
//               alignItems: 'center',
//               whiteSpace: 'nowrap',
//               color: linkColor,
//               fontFamily,
//               fontSize,
//               fontWeight: 400,
//               letterSpacing,
//             }}
//           >
//             {before}
//             <span style={{fontWeight: wordWeight}}>{word}</span>
//             {after}
//           </div>

//           {/* descrizione, va a capo su piu' righe */}
//           <div
//             style={{
//               position: 'absolute',
//               left: lineLeft,
//               top: lineTop + lineHeight + fontSize * 0.18,
//               width: fontSize * snippetWidthEm,
//               fontFamily,
//               fontSize: snippetSize,
//               color: mutedColor,
//               lineHeight: 1.45,
//             }}
//           >
//             {scene.snippet}
//           </div>
//         </AbsoluteFill>
//       </div>
//     </AbsoluteFill>
//   );
// };


import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {measureText} from '@remotion/layout-utils';
import {loadFont} from '@remotion/fonts';
import {z} from 'zod';

// Google Sans Flex istanziato all'ottico 120, gli stessi file dei template AE.
// Sono tagli statici, non il font variabile: le forme sono fissate a quella
// dimensione e non cambiano col corpo, quindi il render e' sempre identico.
// loadFont attende da solo il caricamento prima di far partire il render.
// Il nome non deve contenere pezzi che iniziano con una cifra:
// in CSS "120pt" non e' un identificatore valido, e l'intera
// dichiarazione font-family verrebbe scartata dal browser.
export const fontFamily = 'GoogleSansFlex120';

for (const weight of ['400', '500', '600']) {
  loadFont({
    family: fontFamily,
    url: staticFile(`fonts/GoogleSansFlex-opsz120-${weight}.woff2`),
    weight,
    format: 'woff2',
  });
}

export const FPS = 30;

/**
 * Ogni scena e' un risultato di ricerca.
 * La parola NON va scritta dentro titleBefore / titleAfter: la inserisce
 * il componente, ed e' l'unico modo perche' resti ancorata al centro.
 */
const sceneSchema = z.object({
  siteName: z.string(),
  url: z.string(),
  titleBefore: z.string(),
  titleAfter: z.string(),
  snippet: z.string(),
});

export const matchCutSchema = z.object({
  // --- scelto dall'utente nel form ---
  word: z.string().min(1).max(14),
  durationInSeconds: z.number().min(1).max(10),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
  resolution: z.enum(['1080p', '4k']),
  // 100 = corsa piena da zoomFrom a zoomTo, 0 = inquadratura ferma
  zoomIntensity: z.number().min(0).max(100),

  // --- generato dal backend a partire dalla parola ---
  scenes: z.array(sceneSchema),

  // --- messa a punto del template, fuori dal form utente ---
  holdStart: z.number().int().min(1).max(60),
  holdEnd: z.number().int().min(1).max(60),
  rampSeconds: z.number().min(0.1).max(5),
  maxFontSize: z.number().min(40).max(400),
  letterSpacingEm: z.number().min(0).max(0.3),
  snippetWidthEm: z.number().min(4).max(24),
  wordWeights: z.array(z.number().min(100).max(900)),
  // File in public/ suonati a ogni stacco, dal piu' acuto al piu' grave.
  // Si scorrono lungo la clip, quindi il click si abbassa via via.
  // Array vuoto = nessun suono.
  clickSounds: z.array(z.string()),
  clickVolume: z.number().min(0).max(2),
  zoomFrom: z.number().min(0.1).max(4),
  zoomTo: z.number().min(0.1).max(6),
  backgroundColor: z.string(),
  linkColor: z.string(),
  textColor: z.string(),
  mutedColor: z.string(),
});

export type MatchCutProps = z.infer<typeof matchCutSchema>;
type Scene = z.infer<typeof sceneSchema>;

const EMPTY_SCENE: Scene = {
  siteName: '',
  url: '',
  titleBefore: '',
  titleAfter: '',
  snippet: '',
};

/**
 * Tela logica su cui e' disegnato il layout: lato corto 1080.
 * Il 4K e' la stessa tela scalata, non un layout diverso, cosi' i due
 * formati sono identici e cambia solo la nitidezza.
 */
export const getBaseSize = (aspectRatio: MatchCutProps['aspectRatio']) => {
  if (aspectRatio === '16:9') {
    return {width: 1920, height: 1080};
  }
  if (aspectRatio === '1:1') {
    return {width: 1080, height: 1080};
  }
  return {width: 1080, height: 1920};
};

/** Dimensioni reali del file in uscita. Usata da calculateMetadata. */
export const getOutputSize = (
  aspectRatio: MatchCutProps['aspectRatio'],
  resolution: MatchCutProps['resolution'],
) => {
  const base = getBaseSize(aspectRatio);
  const factor = resolution === '4k' ? 2 : 1;
  return {width: base.width * factor, height: base.height * factor};
};

/**
 * Frame in cui avviene ogni stacco. La durata di una schermata scende da
 * holdStart a holdEnd nell'arco della rampa, poi resta a holdEnd: i cambi
 * partono lenti, accelerano, e da li' in avanti vanno a raffica costante.
 *
 * Stessa funzione lato backend per sapere quante scene servono: la lunghezza
 * dell'array restituito e' il numero di schermate necessarie senza ripetizioni.
 */
export const buildCuts = (
  total: number,
  holdStart: number,
  holdEnd: number,
  rampFrames: number,
) => {
  const cuts: number[] = [];
  let f = 0;
  let guard = 0;
  while (f < total && guard < 2000) {
    cuts.push(f);
    const t = Math.min(1, f / Math.max(1, rampFrames));
    const hold = Math.max(1, Math.round(holdStart * Math.pow(holdEnd / holdStart, t)));
    f += hold;
    guard++;
  }
  return cuts;
};

export const MatchCut: React.FC<MatchCutProps> = ({
  word,
  aspectRatio,
  zoomIntensity,
  scenes,
  holdStart,
  holdEnd,
  rampSeconds,
  maxFontSize,
  letterSpacingEm,
  snippetWidthEm,
  wordWeights,
  clickSounds,
  clickVolume,
  zoomFrom,
  zoomTo,
  backgroundColor,
  linkColor,
  textColor,
  mutedColor,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps, width: outWidth} = useVideoConfig();

  const base = getBaseSize(aspectRatio);
  // Il layout e' disegnato sulla tela logica e poi scalato all'uscita reale.
  const canvasScale = outWidth / base.width;

  const rampFrames = Math.max(
    1,
    Math.min(Math.round(rampSeconds * fps), Math.floor(durationInFrames * 0.5)),
  );

  const cuts = useMemo(
    () => buildCuts(durationInFrames, holdStart, holdEnd, rampFrames),
    [durationInFrames, holdStart, holdEnd, rampFrames],
  );

  const cutIndex = useMemo(() => {
    let i = 0;
    while (i + 1 < cuts.length && cuts[i + 1] <= frame) {
      i++;
    }
    return i;
  }, [cuts, frame]);

  const list = scenes && scenes.length > 0 ? scenes : [EMPTY_SCENE];
  const scene = list[cutIndex % list.length];

  // Il peso della sola parola avanza in sequenza a ogni stacco:
  // regular, medium, semibold, e da capo.
  const weights = wordWeights && wordWeights.length > 0 ? wordWeights : [400];
  const wordWeight = weights[cutIndex % weights.length];

  // Corpo del testo calcolato sulla parola: a 18 caratteri un corpo fisso
  // uscirebbe dallo schermo. Si misura a 100px, si ricava la larghezza per
  // pixel di corpo e si sceglie il corpo che tiene la parola dentro la tela
  // nel momento di massimo zoom. Il caso peggiore e' il semibold, piu' largo.
  const probeSize = 100;
  const probeWidth = measureText({
    text: word || ' ',
    fontFamily,
    fontSize: probeSize,
    fontWeight: 600,
    letterSpacing: `${probeSize * letterSpacingEm}px`,
    validateFontIsLoaded: false,
  }).width;
  const widthPerPx = Math.max(0.0001, probeWidth / probeSize);
  const fitted = (base.width * 0.82) / (widthPerPx * Math.max(zoomFrom, zoomTo));
  const fontSize = Math.max(24, Math.min(maxFontSize, fitted));

  const letterSpacing = `${fontSize * letterSpacingEm}px`;
  const titleStyle = {
    fontFamily,
    fontSize,
    fontWeight: 400,
    letterSpacing,
    validateFontIsLoaded: false,
  };

  // Lo spazio attorno alla parola non si puo' lasciare a chi compila il form:
  // se manca, la parola si attacca a quella accanto. Si aggiunge qui, salvo
  // quando accanto c'e' punteggiatura ("Alter Ego' review" deve restare unito).
  // E' uno spazio unificatore: uno spazio normale in coda verrebbe collassato
  // dal layout e la misura per il centraggio risulterebbe corta.
  // L'eccezione vale solo per virgolette, apostrofi e parentesi, cioe' i soli
  // caratteri che stanno davvero attaccati alla parola ("Alter Ego' review").
  // Trattini, barre e simili sono parole a se' e lo spazio lo vogliono.
  const NBSP = '\u00A0';
  const before =
    scene.titleBefore.length > 0 &&
    !/[\s([{"'\u2018\u201C]$/.test(scene.titleBefore)
      ? scene.titleBefore + NBSP
      : scene.titleBefore;
  const after =
    scene.titleAfter.length > 0 &&
    !/^[\s.,;:!?)\]}"'\u2019\u201D]/.test(scene.titleAfter)
      ? NBSP + scene.titleAfter
      : scene.titleAfter;

  // Larghezza del testo che precede la parola, e della parola col suo peso.
  // Da qui lo scostamento che porta la parola esattamente al centro: e'
  // questo che tiene fermo l'occhio mentre tutto il resto cambia.
  const safe = (n: number) => (Number.isFinite(n) ? n : 0);
  const beforeWidth = safe(measureText({text: before, ...titleStyle}).width);
  const wordWidth = safe(
    measureText({...titleStyle, text: word, fontWeight: wordWeight}).width,
  );

  const lineLeft = base.width / 2 - beforeWidth - wordWidth / 2;
  const lineHeight = fontSize * 1.25;
  const lineTop = base.height / 2 - lineHeight / 2;

  // L'intensita' accorcia la corsa invece di spostarne gli estremi: il punto
  // di arrivo resta zoomTo, la partenza si avvicina fino a coincidere con
  // esso a intensita' zero. L'accorciamento e' geometrico come la rampa,
  // altrimenti a meta' slider il movimento non si dimezzerebbe davvero.
  const zoomStart = zoomTo * Math.pow(zoomFrom / zoomTo, zoomIntensity / 100);

  // Rampa esponenziale: la scala cresce in proporzione a se stessa, quindi
  // il movimento si percepisce a velocita' costante dal primo frame.
  const zoomProgress = Math.min(1, frame / Math.max(1, durationInFrames - 1));
  const zoom = zoomStart * Math.pow(zoomTo / zoomStart, zoomProgress);

  const metaSize = fontSize * 0.34;
  const snippetSize = fontSize * 0.42;

  return (
    <AbsoluteFill style={{backgroundColor, overflow: 'hidden'}}>
      {/* Un click su ogni stacco. Ogni Sequence e' indipendente, quindi due
          stacchi ravvicinati non si tagliano l'uno con l'altro. */}
      {clickSounds && clickSounds.length > 0
        ? cuts.map((cutFrame, i) => {
            // Il click scende di tono lungo la clip scorrendo i file gia'
            // intonati. Si fa cosi' e non con toneFrequency perche' quello
            // vale solo in rendering: in anteprima non si sentirebbe nulla.
            const t = cutFrame / Math.max(1, durationInFrames - 1);
            const pick = Math.min(
              clickSounds.length - 1,
              Math.floor(t * clickSounds.length),
            );
            return (
              <Sequence
                key={i}
                from={cutFrame}
                durationInFrames={Math.max(1, Math.round(fps * 0.2))}
                layout="none"
              >
                <Audio src={staticFile(clickSounds[pick])} volume={clickVolume} />
              </Sequence>
            );
          })
        : null}
      <div
        style={{
          position: 'absolute',
          width: base.width,
          height: base.height,
          transform: `scale(${canvasScale})`,
          transformOrigin: 'top left',
        }}
      >
        <AbsoluteFill
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* riga del sito, sopra al titolo */}
          <div
            style={{
              position: 'absolute',
              left: lineLeft,
              top: lineTop - fontSize * 1.15,
              display: 'flex',
              alignItems: 'center',
              gap: fontSize * 0.22,
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                width: fontSize * 0.62,
                height: fontSize * 0.62,
                borderRadius: '50%',
                backgroundColor: mutedColor,
                opacity: 0.35,
                flexShrink: 0,
              }}
            />
            <div style={{fontFamily}}>
              <div style={{fontSize: metaSize, color: textColor, lineHeight: 1.35}}>
                {scene.siteName}
              </div>
              <div style={{fontSize: metaSize, color: mutedColor, lineHeight: 1.35}}>
                {scene.url}
              </div>
            </div>
          </div>

          {/* il titolo: la riga che contiene la parola ancorata */}
          <div
            style={{
              position: 'absolute',
              left: lineLeft,
              top: lineTop,
              height: lineHeight,
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              color: linkColor,
              fontFamily,
              fontSize,
              fontWeight: 400,
              letterSpacing,
            }}
          >
            {before}
            <span style={{fontWeight: wordWeight}}>{word}</span>
            {after}
          </div>

          {/* descrizione, va a capo su piu' righe */}
          <div
            style={{
              position: 'absolute',
              left: lineLeft,
              top: lineTop + lineHeight + fontSize * 0.18,
              width: fontSize * snippetWidthEm,
              fontFamily,
              fontSize: snippetSize,
              color: mutedColor,
              lineHeight: 1.45,
            }}
          >
            {scene.snippet}
          </div>
        </AbsoluteFill>
      </div>
    </AbsoluteFill>
  );
};
