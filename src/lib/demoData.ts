import { Player, Position, Tier } from '../types';

// Import all player images from the players directory
const playerImages = import.meta.glob('../players/*.png', { eager: true, query: '?url', import: 'default' });

// Map CSV position codes to our Position type
function normalizePosition(pos: string): Position {
  const p = pos.trim().toUpperCase();
  if (p === 'GK') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)) return 'DEF';
  if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(p)) return 'MID';
  if (['ST', 'CF', 'SS', 'LW', 'RW'].includes(p)) return 'ATT';
  return 'MID';
}

// Map tier letter to Tier type
function normalizeTier(tier: string): Tier {
  const t = tier.trim().toUpperCase();
  if (t === 'S' || t === 'A' || t === 'B' || t === 'C' || t === 'D') return t;
  return 'C';
}

// Base prices by tier
function getBasePrice(tier: Tier): number {
  switch (tier) {
    case 'S': return 12;
    case 'A': return 9;
    case 'B': return 6;
    case 'C': return 3;
    case 'D': return 1;
  }
}

// Retention prices by tier
function getRetentionPrice(tier: Tier): number {
  switch (tier) {
    case 'S': return 18;
    case 'A': return 13;
    case 'B': return 8;
    case 'C': return 4;
    case 'D': return 2;
  }
}

// Find the local image URL for a player name
function findPlayerImage(playerName: string): string {
  const normalized = playerName
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '_')
    .replace(/-/g, '-')
    .trim();

  for (const [path, url] of Object.entries(playerImages)) {
    const filename = path.split('/').pop()?.replace('.png', '') || '';
    const namePart = filename.replace(/^[A-Z]{2}\d{2}_/, '');
    if (namePart === normalized) {
      return url as string;
    }
  }
  return '';
}

import csvData from '../top_150_players.csv?raw';

export function loadDemoPlayers(): Player[] {
  const lines = csvData.trim().split('\n');
  const players: Player[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',');
    const name = values[0]?.trim() || '';
    const tier = normalizeTier(values[3] || 'C');
    const pos = values[4]?.trim() || 'MID';
    const nationality = values[5]?.trim() || 'Unknown';
    const rating = parseInt(values[6]) || 0;

    const image = findPlayerImage(name);

    players.push({
      id: crypto.randomUUID(),
      name,
      position: normalizePosition(pos),
      tier,
      country: nationality,
      rating,
      basePrice: getBasePrice(tier),
      retentionPrice: getRetentionPrice(tier),
      image,
      status: 'available',
    });
  }

  return players;
}
