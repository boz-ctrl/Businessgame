import React, { useMemo, useState } from 'react'
import './styles.css'

const SIZE = 9
const ACTIONS = ['invest', 'expand', 'innovate', 'spy', 'sabotage', 'protect']
const DR_BOZWARD_PROFILE = {
  name: 'Dr Bozward',
  title: 'The Strategic Professor',
  style: 'Innovation-led strategist with a sharp instinct for market control.',
  bias: {
    innovationHub: 35,
    playerThreat: 1.8,
    controlledCluster: 8,
    underProtectedSabotage: 18
  },
  maxActions: 3
}
const TYPES = [
  { id: 'emerging', name: 'Emerging', growth: 1.35, stability: 0.8 },
  { id: 'stable', name: 'Stable', growth: 1, stability: 1.15 },
  { id: 'volatile', name: 'Volatile', growth: 1.55, stability: 0.6 },
  { id: 'regulated', name: 'Regulated', growth: 0.85, stability: 1.35 },
  { id: 'innovation', name: 'Innovation Hub', growth: 1.25, stability: 1 }
]

const clone = (state) => structuredClone(state)
const playerName = (id) => (id === 'p1' ? 'Player Corporation' : DR_BOZWARD_PROFILE.name)
const opponent = (id) => (id === 'p1' ? 'ai' : 'p1')

function neighbours(id) {
  const row = Math.floor(id / SIZE)
  const col = id % SIZE
  return [
    row > 0 ? id - SIZE : null,
    row < SIZE - 1 ? id + SIZE : null,
    col > 0 ? id - 1 : null,
    col < SIZE - 1 ? id + 1 : null
  ].filter(v => v !== null)
}

function normalise(tile) {
  const total = tile.share.p1 + tile.share.ai
  if (total > 100) {
    tile.share.p1 = +(tile.share.p1 / total * 100).toFixed(1)
    tile.share.ai = +(tile.share.ai / total * 100).toFixed(1)
  }
}

function controller(tile) {
  if (tile.share.p1 >= 50 && tile.share.p1 > tile.share.ai) return 'p1'
  if (tile.share.ai >= 50 && tile.share.ai > tile.share.p1) return 'ai'
  return null
}

function createGame() {
  const tiles = Array.from({ length: SIZE * SIZE }, (_, id) => {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)]
    return {
      id,
      ...type,
      value: Math.floor(70 + Math.random() * 90),
      share: { p1: 0, ai: 0 },
      protection: { p1: 0, ai: 0 },
      upgrades: { p1: 0, ai: 0 },
      revealed: { p1: true, ai: true }
    }
  })
  tiles[0].share.p1 = 55
  tiles[80].share.ai = 55
  return {
    turn: 1,
    activePlayer: 'p1',
    actionsRemaining: 3,
    selectedAction: 'invest',
    selectedTile: 0,
    amount: 50,
    opponentProfile: DR_BOZWARD_PROFILE,
    players: {
      p1: { capital: 500, revenue: 0 },
      ai: { capital: 500, revenue: 0 }
    },
    tiles,
    log: ['Game started: Dr Bozward will favour innovation hubs, cluster control, and strategic disruption.'],
    winner: null
  }
}

function controlledValue(state, id) {
  return state.tiles.reduce((sum, t) => controller(t) === id ? sum + t.value : sum, 0)
}

function revenueFor(state, id) {
  return Math.floor(state.tiles.reduce((sum, t) => {
    const share = t.share[id] / 100
    const upgrade = 1 + t.upgrades[id] * 0.12
    const cluster = neighbours(t.id).filter(n => controller(state.tiles[n]) === id).length * 0.05
    return sum + t.value * share * t.growth * upgrade * (1 + cluster)
  }, 0))
}

function checkWinner(state) {
  const total = state.tiles.reduce((s, t) => s + t.value, 0)
  for (const id of ['p1', 'ai']) {
    if (controlledValue(state, id) / total >= 0.6) state.winner = id
  }
  if (state.turn > 40 && !state.winner) {
    state.winner = controlledValue(state, 'p1') >= controlledValue(state, 'ai') ? 'p1' : 'ai'
  }
}

function applyAction(state, id, action, tileId, amount = 50) {
  const s = clone(state)
  if (s.winner) return s
  const tile = s.tiles[tileId]
  const rival = opponent(id)
  const player = s.players[id]
  const isBozward = id === 'ai'
  const cost = action === 'innovate' ? (isBozward ? 95 : 120) : action === 'spy' ? 35 : action === 'protect' ? 60 : amount
  if (!tile || player.capital < cost) return state

  if (action === 'invest') {
    const personalityBoost = isBozward && tile.marketType === 'innovation' ? 1.18 : 1
    const gain = (amount * (1 + tile.upgrades[id] * 0.15) * personalityBoost) / tile.stability
    tile.share[id] += gain
    player.capital -= amount
    normalise(tile)
    s.log.unshift(`${playerName(id)} invested ${amount} in sector ${tileId}.`)
  }

  if (action === 'expand') {
    const hasAdjacentControl = neighbours(tileId).some(n => controller(s.tiles[n]) === id)
    if (!hasAdjacentControl && tile.share[id] < 20) return state
    tile.share[id] += isBozward ? 26 : 22
    player.capital -= cost
    normalise(tile)
    s.log.unshift(`${playerName(id)} expanded into sector ${tileId}.`)
  }

  if (action === 'innovate') {
    tile.upgrades[id] += 1
    tile.share[id] += isBozward ? 12 : 8
    player.capital -= cost
    normalise(tile)
    s.log.unshift(`${playerName(id)} applied an innovation-led strategy in sector ${tileId}.`)
  }

  if (action === 'spy') {
    player.capital -= cost
    tile.revealed[id] = true
    tile.share[id] += 5
    normalise(tile)
    s.log.unshift(`${playerName(id)} gathered intelligence on sector ${tileId}.`)
  }

  if (action === 'sabotage') {
    const personalityDamage = isBozward && tile.protection[rival] === 0 ? 6 : 0
    const damage = Math.max(4, 22 + personalityDamage - tile.protection[rival] * 6)
    tile.share[rival] = Math.max(0, tile.share[rival] - damage)
    player.capital -= cost
    s.log.unshift(`${playerName(id)} disrupted sector ${tileId}, reducing rival share by ${damage}.`)
  }

  if (action === 'protect') {
    tile.protection[id] += 1
    tile.share[id] += 4
    player.capital -= cost
    normalise(tile)
    s.log.unshift(`${playerName(id)} protected sector ${tileId}.`)
  }

  if (id === 'p1') s.actionsRemaining -= 1
  checkWinner(s)
  return s
}

function endHumanTurn(state) {
  const s = clone(state)
  s.players.p1.revenue = revenueFor(s, 'p1')
  s.players.p1.capital += s.players.p1.revenue
  s.log.unshift(`Player Corporation earned ${s.players.p1.revenue} capital.`)
  return runDrBozwardTurn(s)
}

function scoreForDrBozward(state, tile) {
  const profile = state.opponentProfile.bias
  const clusterScore = neighbours(tile.id).filter(n => controller(state.tiles[n]) === 'ai').length * profile.controlledCluster
  const innovationBonus = tile.marketType === 'innovation' ? profile.innovationHub : 0
  const threatScore = tile.share.p1 * profile.playerThreat
  const weakProtectionBonus = tile.share.p1 > 30 && tile.protection.p1 === 0 ? profile.underProtectedSabotage : 0
  return tile.value * tile.growth + threatScore + innovationBonus + clusterScore + weakProtectionBonus - tile.share.ai
}

function chooseDrBozwardAction(tile) {
  if (tile.share.p1 > 42 && tile.protection.p1 < 2) return 'sabotage'
  if (tile.marketType === 'innovation' && tile.upgrades.ai < 2) return 'innovate'
  if (tile.share.ai > 35 && tile.upgrades.ai < 2) return 'innovate'
  if (tile.share.ai < 18) return 'expand'
  return 'invest'
}

function runDrBozwardTurn(state) {
  let s = clone(state)
  const scored = s.tiles.map(t => ({ id: t.id, score: scoreForDrBozward(s, t) })).sort((a, b) => b.score - a.score)
  const choices = scored.slice(0, 8)
  for (let i = 0; i < s.opponentProfile.maxActions; i++) {
    const target = choices[i % choices.length].id
    const t = s.tiles[target]
    const action = chooseDrBozwardAction(t)
    s = applyAction(s, 'ai', action, target, action === 'invest' ? 70 : 50)
  }
  s.players.ai.revenue = revenueFor(s, 'ai')
  s.players.ai.capital += s.players.ai.revenue
  s.actionsRemaining = 3
  s.turn += 1
  s.log.unshift(`${s.opponentProfile.name} earned ${s.players.ai.revenue} capital.`)
  checkWinner(s)
  return s
}

export default function App() {
  const [state, setState] = useState(createGame)
  const selected = state.tiles[state.selectedTile]
  const totalValue = useMemo(() => state.tiles.reduce((s, t) => s + t.value, 0), [state.tiles])

  const act = () => setState(applyAction(state, 'p1', state.selectedAction, state.selectedTile, Number(state.amount)))

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Business strategy · deception · market control</p>
          <h1>Market Domination Grid</h1>
          <p>Compete against Dr Bozward, an innovation-led strategist who targets market clusters and weakly protected sectors.</p>
        </div>
        <button onClick={() => setState(createGame())}>New Game</button>
      </header>

      {state.winner && <section className="winner">Winner: {playerName(state.winner)}</section>}

      <section className="layout">
        <aside className="panel">
          <h2>Command Centre</h2>
          <p>Turn {state.turn} · Actions remaining: {state.actionsRemaining}</p>
          <p>Player capital: {Math.floor(state.players.p1.capital)} · Revenue: {state.players.p1.revenue}</p>
          <p>Dr Bozward capital: {Math.floor(state.players.ai.capital)} · Revenue: {state.players.ai.revenue}</p>
          <p>Player control: {Math.round(controlledValue(state, 'p1') / totalValue * 100)}%</p>
          <p>Dr Bozward control: {Math.round(controlledValue(state, 'ai') / totalValue * 100)}%</p>
          <div className="actions">
            {ACTIONS.map(a => <button key={a} className={state.selectedAction === a ? 'active' : ''} onClick={() => setState({ ...state, selectedAction: a })}>{a}</button>)}
          </div>
          <label>Investment amount
            <input type="number" min="10" max="250" step="10" value={state.amount} onChange={e => setState({ ...state, amount: e.target.value })} />
          </label>
          <button disabled={state.actionsRemaining < 1 || state.winner} onClick={act}>Apply Action</button>
          <button disabled={state.winner} onClick={() => setState(endHumanTurn(state))}>End Turn</button>
        </aside>

        <section className="grid">
          {state.tiles.map(tile => {
            const lead = controller(tile)
            return <button key={tile.id} className={`tile ${lead || ''} ${state.selectedTile === tile.id ? 'selected' : ''}`} onClick={() => setState({ ...state, selectedTile: tile.id })}>
              <span>{tile.id}</span>
              <strong>{tile.value}</strong>
              <small>{Math.round(tile.share.p1)} / {Math.round(tile.share.ai)}</small>
            </button>
          })}
        </section>

        <aside className="panel">
          <h2>Dr Bozward Profile</h2>
          <p><strong>{state.opponentProfile.title}</strong></p>
          <p>{state.opponentProfile.style}</p>
          <p>Bias: innovation hubs, clustered sectors, and unprotected rival positions.</p>
          <h2>Sector Intel</h2>
          <p>Sector {selected.id}: {selected.name}</p>
          <p>Value: {selected.value}</p>
          <p>Player share: {Math.round(selected.share.p1)}%</p>
          <p>Dr Bozward share: {Math.round(selected.share.ai)}%</p>
          <p>Protection: P{selected.protection.p1} / DrB{selected.protection.ai}</p>
          <p>Upgrades: P{selected.upgrades.p1} / DrB{selected.upgrades.ai}</p>
          <h2>Log</h2>
          <div className="log">{state.log.slice(0, 12).map((l, i) => <p key={i}>{l}</p>)}</div>
        </aside>
      </section>
    </main>
  )
}
