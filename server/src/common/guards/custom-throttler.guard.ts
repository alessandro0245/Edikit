import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ExecutionContext } from '@nestjs/common';

/**
 * Custom ThrottlerGuard that correctly extracts the real client IP
 * behind reverse proxies (Render.com, Cloudflare, etc.)
 *
 * Priority order for IP extraction:
 * 1. CF-Connecting-IP  (Cloudflare real client IP — most reliable)
 * 2. X-Forwarded-For   (first IP in the chain = original client)
 * 3. req.ip            (Express fallback when trust proxy is set)
 * 4. req.socket.remoteAddress (last resort)
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Cloudflare sets this header to the real visitor IP
    const cfIp = req.headers?.['cf-connecting-ip'];
    if (cfIp && typeof cfIp === 'string') {
      return cfIp.trim();
    }

    // Standard proxy header — take the first (leftmost) IP
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
      const firstIp = (
        typeof forwarded === 'string' ? forwarded : forwarded[0]
      )
        .split(',')[0]
        .trim();
      if (firstIp) return firstIp;
    }

    // Express sets req.ip correctly when trust proxy is enabled
    if (req.ip) return req.ip;

    return req.socket?.remoteAddress ?? '0.0.0.0';
  }
}
