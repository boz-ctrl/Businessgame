export function invest(state, playerId, tileId, amount = 50) {
  const tile = state.tiles[tileId];
  const player = state.players.find(p => p.id === playerId);

  if (!tile || !player) return state;
  if (player.capital < amount) return state;

  const efficiency = 1 + tile.upgrades[playerId] * 0.15;
  const gain = (amount * efficiency) / tile.stability;

  tile.share[playerId] += gain;
  player.capital -= amount;

  normaliseShares(tile);

  state.log.unshift(`${player.name} invested ${amount} in sector ${tileId}`);

  return state;
}

function normaliseShares(tile) {
  const total = tile.share.p1 + tile.share.ai;
  if (total > 100) {
    tile.share.p1 = (tile.share.p1 / total) * 100;
    tile.share.ai = (tile.share.ai / total) * 100;
  }
}
