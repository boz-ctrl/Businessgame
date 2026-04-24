export const GRID_SIZE = 9;

export const MARKET_TYPES = [
  { id: 'emerging', label: 'Emerging', growth: 1.35, stability: 0.75 },
  { id: 'stable', label: 'Stable', growth: 1.0, stability: 1.15 },
  { id: 'volatile', label: 'Volatile', growth: 1.55, stability: 0.55 },
  { id: 'regulated', label: 'Regulated', growth: 0.85, stability: 1.35 },
  { id: 'innovation', label: 'Innovation Hub', growth: 1.25, stability: 0.95 }
];

const players = [
  { id: 'p1', name: 'Player Corporation', capital: 500, revenue: 0, colour: 'blue' },
  { id: 'ai', name: 'AI Rival Corp', capital: 500, revenue: 0, colour: 'red' }
];

function randomMarketType(index) {
  return MARKET_TYPES[index % MARKET_TYPES.length];
}

export function createGameState() {
  const tiles = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
    const market = randomMarketType(Math.floor(Math.random() * MARKET_TYPES.length));
    return {
      id: index,
      marketType: market.id,
      marketLabel: market.label,
      growth: market.growth,
      stability: market.stability,
      baseValue: Math.floor(70 + Math.random() * 90),
      protection: { p1: 0, ai: 0 },
      upgrades: { p1: 0, ai: 0 },
      share: { p1: 0, ai: 0 },
      revealed: { p1: true, ai: true }
    };
  });

  tiles[0].share.p1 = 55;
  tiles[80].share.ai = 55;

  return {
    turn: 1,
    activePlayer: 'p1',
    actionsRemaining: 3,
    selectedAction: 'invest',
    selectedTileId: null,
    players,
    tiles,
    log: ['Game started. Build market share, revenue, and strategic control.'],
    winner: null,
    maxTurns: 40
  };
}
