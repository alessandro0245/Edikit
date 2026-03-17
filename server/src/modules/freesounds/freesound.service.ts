import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MoodType, MOOD_SEARCH_CONFIG } from './music-mood.config';

interface FreesoundTrack {
  id: number;
  name: string;
  duration: number;
  previews: {
    'preview-hq-mp3': string;
    'preview-lq-mp3': string;
  };
  license: string;
  username: string;
}

interface FreesoundSearchResponse {
  count: number;
  results: FreesoundTrack[];
}

interface CachedEntry {
  tracks: FreesoundTrack[];
  fetchedAt: number; // timestamp ms
}

@Injectable()
export class FreesoundService {
  private readonly logger = new Logger(FreesoundService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://freesound.org/apiv2';

  // In-memory cache: mood → { tracks, fetchedAt }
  // Lives for the duration of the server session
  private readonly cache = new Map<MoodType, CachedEntry>();

  // How many tracks to fetch per mood query (pick randomly from these)
  private readonly poolSize = 15;

  // Cache TTL: 1 hour in ms (refresh after restart or 1hr)
  private readonly cacheTtlMs = 60 * 60 * 1000;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('FREESOUND_API_KEY');
  }

  /**
   * Returns a random preview MP3 URL for the given mood.
   * Uses in-memory cache — fetches from Freesound only on first call per mood
   * or after TTL expires.
   */
  async getTrackUrl(mood: MoodType): Promise<string> {
    const cached = this.cache.get(mood);
    const now = Date.now();

    // Return from cache if still fresh
    if (cached && now - cached.fetchedAt < this.cacheTtlMs && cached.tracks.length > 0) {
      this.logger.debug(`Cache hit for mood: ${mood} (${cached.tracks.length} tracks)`);
      return this.pickRandom(cached.tracks);
    }

    // Fetch fresh pool from Freesound
    this.logger.log(`Fetching fresh track pool from Freesound for mood: ${mood}`);
    const tracks = await this.fetchTrackPool(mood);

    if (tracks.length === 0) {
      this.logger.warn(`No tracks found for mood: ${mood}, using fallback`);
      return this.getFallbackUrl(mood);
    }

    // Store in cache
    this.cache.set(mood, { tracks, fetchedAt: now });
    this.logger.log(`Cached ${tracks.length} tracks for mood: ${mood}`);

    return this.pickRandom(tracks);
  }

  /**
   * Fetches a pool of tracks from Freesound for a given mood.
   * Rotates through the mood's query list for variety.
   */
  private async fetchTrackPool(mood: MoodType): Promise<FreesoundTrack[]> {
    const config = MOOD_SEARCH_CONFIG[mood];

    // Pick a random query from the mood's query list
    const query = config.queries[Math.floor(Math.random() * config.queries.length)];

    const params = new URLSearchParams({
      query,
      token: this.apiKey,
      fields: 'id,name,duration,previews,license,username',
      filter: [
        `duration:[${config.minDuration} TO ${config.maxDuration}]`,
        `license:(${config.license.map((l) => `"${l}"`).join(' OR ')})`,
      ].join(' '),
      sort: 'rating_desc',
      page_size: String(this.poolSize),
      format: 'json',
    });

    const url = `${this.baseUrl}/search/text/?${params.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Freesound API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as FreesoundSearchResponse;

      // Filter out tracks without HQ preview
      return data.results.filter(
        (t) => t.previews?.['preview-hq-mp3'],
      );
    } catch (error) {
      this.logger.error(`Freesound fetch failed for mood ${mood}:`, error);
      return [];
    }
  }

  /**
   * Picks a random track from the pool and returns its HQ preview URL.
   */
  private pickRandom(tracks: FreesoundTrack[]): string {
    const track = tracks[Math.floor(Math.random() * tracks.length)];
    this.logger.debug(`Selected track: "${track.name}" by ${track.username}`);
    return track.previews['preview-hq-mp3'];
  }

  /**
   * Fallback URLs — silent/minimal tracks if Freesound is unreachable.
   */
  private getFallbackUrl(mood: MoodType): string {
    // Instead of missing S3 bucket files, we fallback to our localized public SFX
    // ensuring the Remotion player doesn't crash on [MediaError]
    const fallbacks: Record<MoodType, string> = {
      energetic: 'sfx/rise.mp3',
      cinematic: 'sfx/rise-2.mp3',
      corporate: 'sfx/impact-2.mp3',
      chill:     'sfx/swoosh-4.mp3',
    };
    return fallbacks[mood] || 'sfx/rise.mp3';
  }

  /**
   * Pre-warm the cache for all moods on app startup.
   * Call this from your AppModule or a startup hook.
   */
  async prewarmCache(): Promise<void> {
    const moods: MoodType[] = ['energetic', 'cinematic', 'corporate', 'chill'];
    this.logger.log('Pre-warming Freesound track cache...');
    await Promise.all(moods.map((mood) => this.getTrackUrl(mood)));
    this.logger.log('Freesound cache pre-warmed for all moods.');
  }
}