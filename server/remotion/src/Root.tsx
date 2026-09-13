import './index.css';
import React from 'react';
import { Composition, CalculateMetadataFunction } from 'remotion';
import { AIVideoComposition } from './compositions/AIVideoComposition';
import {
  DEFAULT_FPS,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  getTotalDurationInFrames,
} from './types';
import type { VideoConfig } from './types';
import {
  FPS,
  MatchCut,
  MatchCutProps,
  getOutputSize,
  matchCutSchema,
} from './components/matchcut/MatchCut';

const defaultProps: VideoConfig = {
  title: 'Edikit Demo — Option C',
  fps: DEFAULT_FPS,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  scenes: [
    {
      // ── KINETIC intro ──
      type: 'intro',
      text: 'AI VIDEO|CREATION',
      subtext: 'POWERED BY EDIKIT',
      backgroundColor: '#050505',
      textColor: '#7c3aed', // purple → block color
      animation: 'slide',
      duration: 2.5,
      fontSize: 92,
    },
    {
      // ── CLASSIC content ──
      type: 'content',
      text: 'Creating professional videos used to take weeks',
      subtext: 'Complex tools, expensive teams, endless revisions',
      backgroundColor: '#0d0520',
      textColor: '#ffffff',
      animation: 'slide-up',
      duration: 4,
      fontSize: 64,
    },
    {
      // ── CLASSIC content ──
      type: 'content',
      text: 'Just describe what you want in plain English',
      subtext: 'Our AI writes the script, designs every scene, picks the music',
      backgroundColor: '#1a0a35',
      textColor: '#ffffff',
      animation: 'typewriter',
      duration: 4.5,
      fontSize: 64,
    },
    {
      // ── CLASSIC content ──
      type: 'content',
      text: '20 premium color palettes, all contrast-verified',
      subtext: 'Energetic · Cinematic · Corporate · Chill',
      backgroundColor: '#0d0520',
      textColor: '#ffffff',
      animation: 'fade',
      duration: 3.5,
      fontSize: 64,
    },
    {
      // ── KINETIC CTA ──
      type: 'cta',
      text: 'START FREE|TODAY',
      subtext: 'EDIKIT.COM',
      backgroundColor: '#050505',
      textColor: '#ea580c', // orange → block color
      animation: 'scale',
      duration: 2.5,
      fontSize: 96,
    },
  ],
};

/**
 * Durata, formato e risoluzione arrivano dalle props, quindi non possono
 * essere valori fissi sulla composizione: li calcola Remotion prima del
 * render a partire da quello che l'utente ha scelto nel form.
 */
const calculateMetadata: CalculateMetadataFunction<MatchCutProps> = ({props}) => {
  const {width, height} = getOutputSize(props.aspectRatio, props.resolution);
  return {
    width,
    height,
    fps: FPS,
    durationInFrames: Math.max(1, Math.round(props.durationInSeconds * FPS)),
  };
};

export const RemotionRoot: React.FC = () => {
  const calcMetadata = async ({ props }: { props: VideoConfig }) => ({
    durationInFrames: getTotalDurationInFrames(props.scenes, props.fps),
    fps: props.fps,
    width: props.width,
    height: props.height,
  });

  return (
    <>
      <Composition
        id="AIVideoComposition"
        component={AIVideoComposition}
        durationInFrames={getTotalDurationInFrames(
          defaultProps.scenes,
          defaultProps.fps,
        )}
        fps={defaultProps.fps}
        width={defaultProps.width}
        height={defaultProps.height}
        defaultProps={defaultProps}
        calculateMetadata={calcMetadata as any}
      />
      <Composition
        id="MatchCut"
        component={MatchCut}
        schema={matchCutSchema}
        calculateMetadata={calculateMetadata}
        // Valori di partenza: in produzione arrivano tutti via inputProps.
        defaultProps={{
          word: 'EGO',
          durationInSeconds: 6,
          aspectRatio: '9:16' as const,
          resolution: '1080p' as const,
          zoomIntensity: 100,
          holdStart: 10,
          holdEnd: 3,
          rampSeconds: 1.2,
          maxFontSize: 120,
          letterSpacingEm: 0.04,
          snippetWidthEm: 13,
          wordWeights: [400, 500, 600],
          clickSounds: ['sfx/click.wav'],
          clickVolume: 0.28,
          zoomFrom: 0.5,
          zoomTo: 1,
          backgroundColor: '#191919',
          linkColor: '#1A73E8',
          textColor: '#e8eaed',
          mutedColor: '#9aa0a6',
          scenes: [
            {
              siteName: 'Ego Barbers',
              url: 'https://www.egobarbers.co.uk > book-online',
              titleBefore: 'Barbershop |',
              titleAfter: 'Barbers | United Kingdom',
              snippet:
                'Ego Barbers in Cockfosters, North London. Walk-ins welcome six days a week, late opening on Thursdays until nine. Book your next cut at Ego online in under a minute.',
            },
            {
              siteName: 'Britannica',
              url: 'https://www.britannica.com > topic > ego-philosophy',
              titleBefore: '',
              titleAfter: '| Definition, Freud, Examples & Facts',
              snippet:
                'In psychoanalytic theory, the ego is the portion of the personality that mediates between the drives, the conscience and the outside world. The ego develops in early childhood.',
            },
            {
              siteName: 'Verywell Mind',
              url: 'https://www.verywellmind.com > ego-strength-2795169',
              titleBefore: 'Characteristics of',
              titleAfter: 'Strength and Why It Matters',
              snippet:
                'High ego strength, low ego strength: what the difference looks like day to day, why ego strength collapses first under stress, and what tends to rebuild it.',
            },
            {
              siteName: 'NME',
              url: 'https://www.nme.com > Reviews > Album Reviews',
              titleBefore: 'Alter',
              titleAfter: "' review: a flash of something new",
              snippet:
                "One day ago - 'Alter Ego' trades the noise of the last record for something quieter and considerably stranger. The ego on display here is a much more nervous one.",
            },
            {
              siteName: 'YouTube',
              url: 'https://www.youtube.com > watch',
              titleBefore: 'Halsey -',
              titleAfter: '| Vevo Official Live Performance',
              snippet:
                '1.7M views - 4 months ago. Halsey performs Ego live across two nights with a string section, no overdubs, and a room small enough to hear the audience breathing.',
            },
            {
              siteName: 'Reddit',
              url: 'https://www.reddit.com > r/philosophy > comments',
              titleBefore: 'Is the',
              titleAfter: 'just a story we keep telling ourselves?',
              snippet:
                '412 comments - posted by u/hyperreal_ 2 days ago. Top comment: asking whether the ego is a story assumes there is someone doing the telling, which is the part I get stuck on.',
            },
            {
              siteName: 'Oxford Reference',
              url: 'https://www.oxfordreference.com > view > leadership',
              titleBefore: 'From',
              titleAfter: 'to Eco: Leadership in Practice',
              snippet:
                'Green Templeton College, Said Business School. What changes when leaders move from ego to system: a short course on the questions that stop being about the leader.',
            },
            {
              siteName: 'Steam',
              url: 'https://store.steampowered.com > app > bundle',
              titleBefore: 'Ctrl Alt',
              titleAfter: '+ Tin Can Bundle',
              snippet:
                'Ctrl Alt Ego is a unique hybrid of immersive sim and stealth: leave your body behind, possess the machines, and solve every room in at least three different ways.',
            },
            {
              siteName: 'Ego Hair',
              url: 'https://www.hairatego.co.uk > about',
              titleBefore: 'Welcome to',
              titleAfter: 'Hair - Best Hairdressing in Town',
              snippet:
                'Hair at Ego is not just our expertise, it is our passion. Established in 2009 and still run by the two people who opened it, as most of our regulars will tell you.',
            },
            {
              siteName: 'Indeed',
              url: 'https://uk.indeed.com > Companies > Restaurants',
              titleBefore: 'Working at',
              titleAfter: 'Restaurants: Employee Reviews',
              snippet:
                'Reviews of Ego Restaurants on work-life balance, management and job security from 45 current and former employees. Overall rating 3.4 out of 5.',
            },
            {
              siteName: 'Psychology Today',
              url: 'https://www.psychologytoday.com > intl > basics',
              titleBefore: 'Why the',
              titleAfter: 'Resists Being Wrong',
              snippet:
                'The ego protects itself long before it protects the truth. Research on motivated reasoning suggests the defence engages within milliseconds, well before argument.',
            },
            {
              siteName: 'Genius',
              url: 'https://genius.com > albums > tracklist',
              titleBefore: 'Track 4:',
              titleAfter: 'Death - annotated lyrics',
              snippet:
                'Contributed by 38 people. Ego Death was written in a single afternoon after the tour collapsed, demoed on a phone in a car park, and left unedited on the record.',
            },
            {
              siteName: 'Wikipedia',
              url: 'https://en.wikipedia.org > wiki > Ego_death',
              titleBefore: '',
              titleAfter: 'death - Wikipedia',
              snippet:
                'Ego death is a complete loss of subjective self-identity. The term appears in psychology, in accounts of meditation, and in the literature on psychedelic experience.',
            },
            {
              siteName: 'Merriam-Webster',
              url: 'https://www.merriam-webster.com > dictionary',
              titleBefore: '',
              titleAfter: 'Definition & Meaning',
              snippet:
                'The meaning of ego is the self, especially as contrasted with another self or the world. How to use ego in a sentence, with examples from recent publications.',
            },
            {
              siteName: 'The Guardian',
              url: 'https://www.theguardian.com > commentisfree',
              titleBefore: 'The trouble with the modern',
              titleAfter: '',
              snippet:
                'We built an economy that rewards the loudest ego in the room and then act surprised at what walks through the door. Opinion, 6 min read.',
            },
            {
              siteName: 'Goodreads',
              url: 'https://www.goodreads.com > book > show',
              titleBefore: '',
              titleAfter: 'Is the Enemy by Ryan Holiday',
              snippet:
                'Ego Is the Enemy argues that our biggest obstacle is the one we carry with us. 4.19 average rating, 128,940 ratings, 9,102 reviews.',
            },
            {
              siteName: 'IMDb',
              url: 'https://www.imdb.com > title',
              titleBefore: 'Alter',
              titleAfter: '(2021) - Full Cast & Crew',
              snippet:
                'Alter Ego. Directed by an unknown first-timer, this thriller about a stolen identity was shot in 19 days on a budget the ego of any studio would refuse.',
            },
            {
              siteName: 'Nature',
              url: 'https://www.nature.com > articles',
              titleBefore: 'Neural correlates of',
              titleAfter: 'dissolution',
              snippet:
                'A study of 42 participants reports that ego dissolution correlates with reduced connectivity in the default mode network. Published 14 March.',
            },
            {
              siteName: 'Ego Power+',
              url: 'https://egopowerplus.co.uk > products',
              titleBefore: '',
              titleAfter: 'Power+ 56V Cordless Mower',
              snippet:
                'The Ego Power+ range runs on a single 56V battery across every tool. Free next day delivery on orders over sixty pounds.',
            },
            {
              siteName: 'Quora',
              url: 'https://www.quora.com > What-is-the-difference',
              titleBefore: 'What is the difference between',
              titleAfter: 'and confidence?',
              snippet:
                'Answered by a clinical psychologist: confidence survives being contradicted, ego does not. That is more or less the whole distinction, and it takes years to learn.',
            },
          ],
        }}
      />
    </>
  );
};
