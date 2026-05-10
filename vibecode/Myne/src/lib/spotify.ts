const CLIENT_ID    = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-top-read',
  'user-read-recently-played',
].join(' ');

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function base64URLEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generateCodeVerifier(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return base64URLEncode(arr);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

// ── Token storage ─────────────────────────────────────────────────────────────

interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const TOKEN_KEY    = 'myne:spotify:tokens';
const VERIFIER_KEY = 'myne:spotify:cv';

export function getTokens(): SpotifyTokens | null {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) ?? 'null'); } catch { return null; }
}

function saveTokens(t: SpotifyTokens): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERIFIER_KEY);
}

export function isConnected(): boolean {
  return getTokens() !== null;
}

// ── Auth flow ─────────────────────────────────────────────────────────────────

export async function initiateAuth(): Promise<void> {
  const verifier   = generateCodeVerifier();
  const challenge  = await generateCodeChallenge(verifier);
  localStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    response_type:         'code',
    redirect_uri:          REDIRECT_URI,
    scope:                 SCOPES,
    code_challenge_method: 'S256',
    code_challenge:        challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function handleCallback(code: string): Promise<void> {
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error('No code verifier');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  REDIRECT_URI,
      client_id:     CLIENT_ID,
      code_verifier: verifier,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? 'Token exchange failed');

  saveTokens({
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    Date.now() + data.expires_in * 1000,
  });
  localStorage.removeItem(VERIFIER_KEY);
}

// ── Token refresh ─────────────────────────────────────────────────────────────

async function refreshTokens(): Promise<string> {
  const tokens = getTokens();
  if (!tokens?.refreshToken) throw new Error('No refresh token');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: tokens.refreshToken,
      client_id:     CLIENT_ID,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error('Token refresh failed');

  const updated: SpotifyTokens = {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token ?? tokens.refreshToken,
    expiresAt:    Date.now() + data.expires_in * 1000,
  };
  saveTokens(updated);
  return updated.accessToken;
}

async function getValidToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens) return null;
  if (Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken;
  try { return await refreshTokens(); }
  catch { clearTokens(); return null; }
}

// ── API fetch ─────────────────────────────────────────────────────────────────

async function sget(path: string): Promise<any> {
  const token = await getValidToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Spotify ${res.status}`);
  return res.json();
}

// ── Public API ────────────────────────────────────────────────────────────────

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export const spotify = {
  me:              ()                               => sget('/me'),
  currentlyPlaying: ()                              => sget('/me/player/currently-playing'),
  topArtists:      (range: TimeRange, limit = 20)  => sget(`/me/top/artists?time_range=${range}&limit=${limit}`),
  topTracks:       (range: TimeRange, limit = 20)  => sget(`/me/top/tracks?time_range=${range}&limit=${limit}`),
  recentlyPlayed:  (limit = 50)                    => sget(`/me/player/recently-played?limit=${limit}`),
};
