import { useState, useEffect, useCallback } from 'react';
import {
  Music2, Play, Users, BarChart2, Clock,
  RefreshCw, Copy, Check, UserPlus, Headphones, X,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { spotify, initiateAuth, isConnected, clearTokens } from '../lib/spotify';
import type { TimeRange } from '../lib/spotify';
import { supabase } from '../lib/supabase';
import { getItem, setItem } from '../utils/storage';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SpotifyTrack {
  id: string; name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
  external_urls: { spotify: string };
}

interface SpotifyArtist {
  id: string; name: string;
  genres: string[];
  images: { url: string }[];
  external_urls: { spotify: string };
}

interface SpotifyFriend {
  shareCode: string;
  displayName: string;
  topArtists: { name: string; image?: string }[];
  addedAt: string;
}

type Tab = 'playing' | 'top' | 'genres' | 'habits' | 'friends';
type TopSub = 'artists' | 'tracks';

// ── Constants ─────────────────────────────────────────────────────────────────

const SPOTIFY_GREEN = '#1DB954';
const DAYS          = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const GENRE_COLORS  = ['#1DB954','#6366f1','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#22c55e','#ec4899','#3b82f6','#84cc16','#14b8a6','#a855f7','#f43f5e','#0ea5e9'];
const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: 'short_term',  label: '4 semaines' },
  { key: 'medium_term', label: '6 mois'      },
  { key: 'long_term',   label: 'Tout le temps' },
];
const TOOLTIP_STYLE = { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6', fontSize: '12px' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function msToMinSec(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function getOrCreateShareCode(): string {
  const k = 'myne:spotify:shareCode';
  const existing = localStorage.getItem(k);
  if (existing) return existing;
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  localStorage.setItem(k, code);
  return code;
}

function computeCompatibility(mine: string[], theirs: string[]): number {
  if (!mine.length || !theirs.length) return 0;
  const a = new Set(mine.map(x => x.toLowerCase()));
  const b = new Set(theirs.map(x => x.toLowerCase()));
  const inter = [...a].filter(x => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return Math.round((inter / Math.max(union, 1)) * 100);
}

// ── Small reusable components ─────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-14">
      <div className="w-6 h-6 border-2 border-gray-700 border-t-green-400 rounded-full animate-spin" />
    </div>
  );
}

function TabBtn({ label, active, onClick, Icon }: { label: string; active: boolean; onClick: () => void; Icon: React.ElementType }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        active ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function ArtistCard({ artist, rank }: { artist: SpotifyArtist; rank: number }) {
  const img = artist.images[1]?.url ?? artist.images[0]?.url;
  return (
    <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 transition-all group">
      <span className="text-xs font-bold text-gray-600 w-5 shrink-0 text-right">{rank}</span>
      {img
        ? <img src={img} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        : <div className="w-10 h-10 rounded-full bg-gray-700 shrink-0" />
      }
      <div className="min-w-0">
        <p className="text-sm text-white font-medium truncate group-hover:text-green-400 transition-colors">{artist.name}</p>
        <p className="text-xs text-gray-500 truncate">{artist.genres.slice(0, 2).join(', ') || 'Artiste'}</p>
      </div>
    </a>
  );
}

function TrackCard({ track, rank }: { track: SpotifyTrack; rank: number }) {
  const img = track.album.images[2]?.url ?? track.album.images[0]?.url;
  return (
    <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 transition-all group">
      <span className="text-xs font-bold text-gray-600 w-5 shrink-0 text-right">{rank}</span>
      {img
        ? <img src={img} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
        : <div className="w-10 h-10 rounded-lg bg-gray-700 shrink-0" />
      }
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white font-medium truncate group-hover:text-green-400 transition-colors">{track.name}</p>
        <p className="text-xs text-gray-500 truncate">{track.artists.map(a => a.name).join(', ')}</p>
      </div>
      <span className="text-xs text-gray-600 shrink-0">{msToMinSec(track.duration_ms)}</span>
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SoundLog() {
  const [connected, setConnected] = useState(isConnected);
  const [tab,       setTab]       = useState<Tab>('playing');
  const [topSub,    setTopSub]    = useState<TopSub>('artists');
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');

  // Now Playing
  const [nowPlaying, setNP]    = useState<any>(null);
  const [npLoading,  setNpL]   = useState(false);

  // Top
  const [topArtists, setTA]    = useState<SpotifyArtist[]>([]);
  const [topTracks,  setTT]    = useState<SpotifyTrack[]>([]);
  const [topLoading, setTL]    = useState(false);
  const [topError,   setTE]    = useState<string | null>(null);

  // Genres
  const [genres,       setG]   = useState<{ genre: string; count: number }[]>([]);
  const [genresLoading, setGL] = useState(false);

  // Habits
  const [hourData,     setHD]  = useState<{ hour: string; count: number }[]>([]);
  const [dayData,      setDD]  = useState<{ day: string;  count: number }[]>([]);
  const [habitsLoading, setHL] = useState(false);

  // Friends
  const [shareCode]            = useState(getOrCreateShareCode);
  const [friends, setFriends]  = useState<SpotifyFriend[]>(() => getItem('myne:spotify:friends', []));
  const [friendCode, setFC]    = useState('');
  const [friendLoading, setFL] = useState(false);
  const [friendError,   setFE] = useState<string | null>(null);
  const [copied, setCopied]    = useState(false);
  const [myTopNames, setMTN]   = useState<string[]>([]);

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchNowPlaying = useCallback(async () => {
    if (!isConnected()) return;
    setNpL(true);
    try { const d = await spotify.currentlyPlaying(); setNP(d?.item ?? null); }
    catch { setNP(null); }
    finally { setNpL(false); }
  }, []);

  const fetchTop = useCallback(async () => {
    setTL(true); setTE(null);
    try {
      const [a, t] = await Promise.all([
        spotify.topArtists(timeRange, 20),
        spotify.topTracks(timeRange, 20),
      ]);
      setTA(a?.items ?? []);
      setTT(t?.items ?? []);
    } catch (e: any) {
      setTE(e?.message ?? 'Erreur lors du chargement');
      if (e?.message === 'Not authenticated') { clearTokens(); setConnected(false); }
    } finally { setTL(false); }
  }, [timeRange]);

  const fetchGenres = useCallback(async () => {
    setGL(true);
    try {
      const d = await spotify.topArtists('long_term', 50);
      const counts: Record<string, number> = {};
      for (const artist of (d?.items ?? []) as SpotifyArtist[]) {
        for (const g of artist.genres) counts[g] = (counts[g] ?? 0) + 1;
      }
      setG(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([genre, count]) => ({ genre, count })));
    } catch { } finally { setGL(false); }
  }, []);

  const fetchHabits = useCallback(async () => {
    setHL(true);
    try {
      const d = await spotify.recentlyPlayed(50);
      const hc = new Array(24).fill(0);
      const dc = new Array(7).fill(0);
      for (const item of d?.items ?? []) {
        const dt = new Date(item.played_at);
        hc[dt.getHours()]++;
        dc[dt.getDay()]++;
      }
      setHD(hc.map((count, i) => ({ hour: String(i).padStart(2, '0') + 'h', count })));
      setDD(dc.map((count, i) => ({ day: DAYS[i], count })));
    } catch { } finally { setHL(false); }
  }, []);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!connected) return;
    if (tab === 'playing') fetchNowPlaying();
    if (tab === 'top')     fetchTop();
    if (tab === 'genres')  fetchGenres();
    if (tab === 'habits')  fetchHabits();
    if (tab === 'friends') {
      spotify.topArtists('long_term', 50).then(d => setMTN((d?.items ?? []).map((a: SpotifyArtist) => a.name))).catch(() => {});
      uploadShareData();
    }
  }, [tab, connected, fetchNowPlaying, fetchTop, fetchGenres, fetchHabits]);

  useEffect(() => { if (connected && tab === 'top') fetchTop(); }, [timeRange]);

  // Poll Now Playing every 10 s
  useEffect(() => {
    if (!connected || tab !== 'playing') return;
    const id = setInterval(fetchNowPlaying, 10_000);
    return () => clearInterval(id);
  }, [connected, tab, fetchNowPlaying]);

  // ── Friends helpers ─────────────────────────────────────────────────────────

  async function uploadShareData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [me, artistsData] = await Promise.all([spotify.me(), spotify.topArtists('long_term', 20)]);
      await supabase.from('spotify_shares').upsert({
        user_id:      user.id,
        share_code:   shareCode,
        display_name: me?.display_name ?? me?.id ?? 'Unknown',
        top_artists:  (artistsData?.items ?? []).map((a: SpotifyArtist) => ({ name: a.name, image: a.images[1]?.url ?? a.images[0]?.url })),
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch { }
  }

  async function addFriend() {
    const code = friendCode.trim().toUpperCase();
    if (!code) return;
    setFL(true); setFE(null);
    try {
      if (friends.some(f => f.shareCode === code)) { setFE('Cet ami est déjà ajouté.'); return; }
      if (code === shareCode) { setFE('Tu ne peux pas t\'ajouter toi-même.'); return; }
      const { data, error } = await supabase.from('spotify_shares').select('share_code, display_name, top_artists').eq('share_code', code).single();
      if (error || !data) { setFE('Code introuvable. L\'ami doit d\'abord visiter l\'onglet Amis.'); return; }
      const updated = [...friends, { shareCode: data.share_code, displayName: data.display_name, topArtists: data.top_artists ?? [], addedAt: new Date().toISOString() }];
      setFriends(updated);
      setItem('myne:spotify:friends', updated);
      setFC('');
    } catch { setFE('Erreur réseau.'); }
    finally { setFL(false); }
  }

  function removeFriend(code: string) {
    const updated = friends.filter(f => f.shareCode !== code);
    setFriends(updated);
    setItem('myne:spotify:friends', updated);
  }

  // ── Connect screen ───────────────────────────────────────────────────────────

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: SPOTIFY_GREEN + '20' }}>
            <Music2 size={36} style={{ color: SPOTIFY_GREEN }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">SoundLog</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Connecte Spotify pour voir tes stats, genres favoris, habitudes d'écoute et la compatibilité musicale avec tes amis.</p>
          </div>
          <button
            onClick={() => initiateAuth()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-black font-semibold text-sm transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: SPOTIFY_GREEN }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Connecter Spotify
          </button>
          <p className="text-xs text-gray-700 break-all">
            Redirect URI: {import.meta.env.VITE_SPOTIFY_REDIRECT_URI ?? '⚠️ non défini'}
          </p>
        </div>
      </div>
    );
  }

  // ── Tab: Now Playing ─────────────────────────────────────────────────────────

  const renderNowPlaying = () => {
    if (npLoading && !nowPlaying) return <Spinner />;
    if (!nowPlaying) return (
      <div className="text-center py-16 space-y-3">
        <Headphones size={40} className="mx-auto text-gray-700" />
        <p className="text-gray-500 text-sm">Rien en cours de lecture</p>
        <button onClick={fetchNowPlaying} className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors">
          <RefreshCw size={11} /> Actualiser
        </button>
      </div>
    );

    const track     = nowPlaying as SpotifyTrack & { duration_ms: number };
    const progress  = (nowPlaying as any).progress_ms ?? 0;
    const img       = track.album.images[0]?.url;

    return (
      <div className="max-w-sm mx-auto py-4 space-y-6">
        <div className="flex flex-col items-center gap-5">
          {img && <img src={img} alt="" className="w-56 h-56 rounded-2xl shadow-2xl object-cover" />}
          <div className="text-center">
            <p className="text-xl font-bold text-white">{track.name}</p>
            <p className="text-gray-400 mt-1">{track.artists.map(a => a.name).join(', ')}</p>
            <p className="text-gray-600 text-sm mt-0.5">{track.album.name}</p>
          </div>
          <div className="w-full flex items-center gap-2 text-xs text-gray-500">
            <span className="w-8 text-right">{msToMinSec(progress)}</span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(progress / track.duration_ms) * 100}%`, backgroundColor: SPOTIFY_GREEN }} />
            </div>
            <span className="w-8">{msToMinSec(track.duration_ms)}</span>
          </div>
          <p className="text-xs flex items-center gap-1.5" style={{ color: SPOTIFY_GREEN }}>
            <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ backgroundColor: SPOTIFY_GREEN }} />
            En cours · actualise dans 10s
          </p>
        </div>
      </div>
    );
  };

  // ── Tab: Top Stats ───────────────────────────────────────────────────────────

  const renderTop = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {(['artists', 'tracks'] as TopSub[]).map(s => (
          <button key={s} onClick={() => setTopSub(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${topSub === s ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            {s === 'artists' ? 'Artistes' : 'Titres'}
          </button>
        ))}
        <div className="ml-auto flex rounded-lg overflow-hidden border border-gray-800">
          {TIME_RANGES.map(r => (
            <button key={r.key} onClick={() => setTimeRange(r.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${timeRange === r.key ? 'font-semibold' : 'bg-gray-900 text-gray-500 hover:text-gray-300'}`}
              style={timeRange === r.key ? { backgroundColor: SPOTIFY_GREEN, color: '#000' } : {}}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      {topLoading ? <Spinner /> : topError ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-red-400 text-sm">{topError}</p>
          <button onClick={fetchTop} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw size={11} /> Réessayer
          </button>
        </div>
      ) : (topSub === 'artists' ? topArtists : topTracks).length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
          <button onClick={fetchTop} className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors">
            <RefreshCw size={11} /> Actualiser
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {topSub === 'artists'
            ? topArtists.map((a, i) => <ArtistCard key={a.id} artist={a} rank={i + 1} />)
            : topTracks.map((t, i)  => <TrackCard  key={t.id} track={t}   rank={i + 1} />)
          }
        </div>
      )}
    </div>
  );

  // ── Tab: Genres ──────────────────────────────────────────────────────────────

  const renderGenres = () => (
    <div className="space-y-6">
      {genresLoading ? <Spinner /> : genres.length === 0
        ? <p className="text-gray-500 text-center py-12">Aucun genre trouvé</p>
        : <>
            <div className="flex flex-wrap gap-2">
              {genres.map((g, i) => (
                <span key={g.genre} className="px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: GENRE_COLORS[i % GENRE_COLORS.length] + 'cc' }}>
                  {g.genre} · {g.count}
                </span>
              ))}
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genres} layout="vertical" margin={{ left: 110, right: 20 }}>
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="genre" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {genres.map((_, i) => <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
      }
    </div>
  );

  // ── Tab: Habits ──────────────────────────────────────────────────────────────

  const renderHabits = () => (
    <div className="space-y-8">
      {habitsLoading ? <Spinner /> : <>
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2"><Clock size={14} /> Par heure de la journée</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData} barSize={9}>
                <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" fill={SPOTIFY_GREEN} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2"><BarChart2 size={14} /> Par jour de la semaine</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData} barSize={28}>
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>}
    </div>
  );

  // ── Tab: Friends ─────────────────────────────────────────────────────────────

  const renderFriends = () => (
    <div className="space-y-5">
      {/* Share code */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-2">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Ton code de partage</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-widest font-mono" style={{ color: SPOTIFY_GREEN }}>{shareCode}</span>
          <button onClick={() => { navigator.clipboard.writeText(shareCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700">
            {copied ? <><Check size={11} /> Copié</> : <><Copy size={11} /> Copier</>}
          </button>
        </div>
        <p className="text-xs text-gray-600">Partage ce code avec tes amis pour voir votre compatibilité musicale</p>
      </div>

      {/* Add friend */}
      <div className="flex gap-2">
        <input
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors font-mono tracking-widest uppercase"
          placeholder="CODE AMI"
          value={friendCode}
          onChange={e => setFC(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && addFriend()}
          maxLength={8}
        />
        <button onClick={addFriend} disabled={friendLoading || !friendCode.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-black disabled:opacity-40 transition-colors"
          style={{ backgroundColor: SPOTIFY_GREEN }}>
          <UserPlus size={14} /> Ajouter
        </button>
      </div>
      {friendError && <p className="text-xs text-red-400">{friendError}</p>}

      {/* Friends list */}
      {friends.length === 0
        ? <p className="text-gray-600 text-sm text-center py-8">Aucun ami ajouté · partage ton code !</p>
        : friends.map(friend => {
            const compat       = computeCompatibility(myTopNames, friend.topArtists.map(a => a.name));
            const shared       = friend.topArtists.filter(a => myTopNames.map(n => n.toLowerCase()).includes(a.name.toLowerCase()));
            const discover     = friend.topArtists.filter(a => !myTopNames.map(n => n.toLowerCase()).includes(a.name.toLowerCase())).slice(0, 5);
            const compatColor  = compat >= 50 ? SPOTIFY_GREEN : compat >= 25 ? '#f59e0b' : '#6b7280';
            return (
              <div key={friend.shareCode} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">{friend.displayName}</p>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">{friend.shareCode}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: compatColor }}>{compat}%</p>
                      <p className="text-xs text-gray-500">compatible</p>
                    </div>
                    <button onClick={() => removeFriend(friend.shareCode)} className="text-gray-700 hover:text-red-400 transition-colors mt-1"><X size={14} /></button>
                  </div>
                </div>
                {shared.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1.5">En commun</p>
                    <div className="flex flex-wrap gap-1.5">
                      {shared.map(a => (
                        <span key={a.name} className="flex items-center gap-1.5 text-xs bg-gray-800 px-2 py-1 rounded-lg text-gray-300">
                          {a.image && <img src={a.image} alt="" className="w-4 h-4 rounded-full object-cover" />}
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {discover.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1.5">À découvrir grâce à {friend.displayName}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {discover.map(a => (
                        <span key={a.name} className="flex items-center gap-1.5 text-xs border border-dashed border-gray-700 px-2 py-1 rounded-lg text-gray-500">
                          {a.image && <img src={a.image} alt="" className="w-4 h-4 rounded-full object-cover" />}
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
      }
    </div>
  );

  // ── Layout ───────────────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
    { key: 'playing', label: 'En cours',   Icon: Play      },
    { key: 'top',     label: 'Top',         Icon: BarChart2 },
    { key: 'genres',  label: 'Genres',      Icon: Music2    },
    { key: 'habits',  label: 'Habitudes',   Icon: Clock     },
    { key: 'friends', label: 'Amis',        Icon: Users     },
  ];

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: SPOTIFY_GREEN + '20' }}>
            <Music2 size={18} style={{ color: SPOTIFY_GREEN }} />
          </div>
          <h1 className="text-xl font-bold text-white">SoundLog</h1>
        </div>
        <button
          onClick={() => { clearTokens(); setConnected(false); }}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          Déconnecter Spotify
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-gray-800">
        {TABS.map(t => <TabBtn key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} Icon={t.Icon} />)}
      </div>

      <div>
        {tab === 'playing' && renderNowPlaying()}
        {tab === 'top'     && renderTop()}
        {tab === 'genres'  && renderGenres()}
        {tab === 'habits'  && renderHabits()}
        {tab === 'friends' && renderFriends()}
      </div>
    </div>
  );
}
