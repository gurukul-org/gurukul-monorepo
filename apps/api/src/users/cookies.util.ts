import type { ConfigService } from '@nestjs/config';

import type { CookieOptions, Response } from 'express';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function baseCookieOptions(config: ConfigService): CookieOptions {
  const isProd = config.get<string>('NODE_ENV') === 'production';
  const cookieDomain = config.get<string>('COOKIE_DOMAIN');
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    domain: cookieDomain || undefined,
  };
}

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
  config: ConfigService,
): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseCookieOptions(config),
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

export function clearRefreshTokenCookie(
  res: Response,
  config: ConfigService,
): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions(config));
}
