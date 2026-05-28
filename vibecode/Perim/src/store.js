import { supabase } from './supabase.js';

// ── Helpers date ──────────────────────────────────────────────────────────────

export function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export function addDaysStr(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr + 'T12:00:00');
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
}

export function expiryStatus(dateStr) {
  const d = daysUntil(dateStr);
  if (d < 0) return 'expired';
  if (d === 0) return 'urgent';
  if (d <= 3) return 'soon';
  return 'ok';
}

export function formatDays(days) {
  if (days < 0) return 'EXPIRÉ';
  if (days === 0) return 'AUJ.';
  if (days === 1) return 'DEMAIN';
  return `${days} J`;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function productEmoji(type) {
  const map = { FRAIS: '🥛', SEC: '🍝', SURGELÉ: '❄️', CONSERVE: '🥫' };
  return map[type] || '📦';
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Mock barcodes ─────────────────────────────────────────────────────────────

export const MOCK_BARCODES = {
  '3017620422003': { name: 'Nutella', brand: 'Ferrero', type: 'SEC' },
  '3033490004743': { name: 'Yaourt nature', brand: 'Danone', type: 'FRAIS' },
  '3228857000166': { name: 'Lait demi-écrémé', brand: 'Lactel', type: 'FRAIS' },
  '3256222099073': { name: 'Emmental râpé', brand: 'Président', type: 'FRAIS' },
  '3017760707599': { name: 'Prince chocolat', brand: 'LU', type: 'SEC' },
  '3270190011901': { name: 'Beurre doux', brand: 'Président', type: 'FRAIS' },
};

// ── Default locations ─────────────────────────────────────────────────────────

export const DEFAULT_LOCATIONS = [
  { id: 'frigo', name: 'Frigo', enabled: true },
  { id: 'congelo', name: 'Congélateur', enabled: true },
  { id: 'placard', name: 'Placard', enabled: true },
  { id: 'cave', name: 'Cave', enabled: false },
  { id: 'corbeille', name: 'Corbeille à fruits', enabled: false },
];

// ── row ↔ object mappers ──────────────────────────────────────────────────────

function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? '',
    quantity: row.quantity,
    unit: row.unit,
    expiryDate: row.expiry_date,
    location: row.location,
    type: row.type,
    addedDate: row.added_date,
    status: row.status,
    price: row.price ?? 0,
  };
}

function productToRow(p, userId) {
  return {
    id: p.id,
    user_id: userId,
    name: p.name,
    brand: p.brand ?? '',
    quantity: p.quantity,
    unit: p.unit,
    expiry_date: p.expiryDate,
    location: p.location,
    type: p.type,
    added_date: p.addedDate,
    status: p.status,
    price: p.price ?? 0,
  };
}

function rowToLocation(row) {
  return { id: row.id, name: row.name, enabled: row.enabled };
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function fetchProducts(userId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('expiry_date', { ascending: true });

  if (error) throw error;
  return data.map(rowToProduct);
}

export async function addProduct(product, userId) {
  const { error } = await supabase
    .from('products')
    .insert(productToRow(product, userId));
  if (error) throw error;
}

export async function updateProduct(id, updates, userId) {
  const row = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.quantity !== undefined) row.quantity = updates.quantity;
  if (updates.expiryDate !== undefined) row.expiry_date = updates.expiryDate;

  const { error } = await supabase
    .from('products')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Locations ─────────────────────────────────────────────────────────────────

export async function fetchLocations(userId) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  if (data.length === 0) {
    await seedLocations(userId);
    return DEFAULT_LOCATIONS;
  }
  return data.map(rowToLocation);
}

async function seedLocations(userId) {
  const rows = DEFAULT_LOCATIONS.map(l => ({ ...l, user_id: userId }));
  await supabase.from('locations').insert(rows);
}

export async function saveLocation(location, userId) {
  const { error } = await supabase
    .from('locations')
    .upsert({ ...location, user_id: userId });
  if (error) throw error;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function computeStats(products) {
  const eaten = products.filter(p => p.status === 'eaten');
  const thrown = products.filter(p => p.status === 'thrown');
  const total = eaten.length + thrown.length;

  const savedValue = eaten.reduce((s, p) => s + (p.price || 0), 0);
  const lostValue = thrown.reduce((s, p) => s + (p.price || 0), 0);
  const savedPct = total > 0 ? Math.round((eaten.length / total) * 100) : 0;
  const thrownPct = total > 0 ? Math.round((thrown.length / total) * 100) : 0;

  const now = new Date();
  const weeks = Array.from({ length: 7 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (6 - i) * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const count = eaten.filter(p => {
      const d = new Date(p.addedDate + 'T12:00:00');
      return d >= weekStart && d < weekEnd;
    }).length;
    return { label: `S${i + 1}`, count, current: i === 6 };
  });

  return { savedValue, lostValue, savedPct, thrownPct, total, weeks };
}

// ── Onboarding flag ───────────────────────────────────────────────────────────

export function isOnboarded() {
  return localStorage.getItem('perim_onboarded') === 'true';
}

export function setOnboarded() {
  localStorage.setItem('perim_onboarded', 'true');
}
