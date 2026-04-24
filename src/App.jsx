import React, { useState } from 'react'

const SIZE = 9

function generateGrid() {
  return Array.from({ length: SIZE * SIZE }, () => ({
    value: Math.floor(Math.random() * 5 + 1),
    owner: 0
  }))
}

export default function App() {
  const [grid, setGrid] = useState(generateGrid())
  const [player, setPlayer] = useState(1)

  const handleClick = (i) => {
    const newGrid = [...grid]
    newGrid[i].owner = player
    setGrid(newGrid)
  }

  const endTurn = () => {
    const aiMove = Math.floor(Math.random() * grid.length)
    const newGrid = [...grid]
    newGrid[aiMove].owner = 2
    setGrid(newGrid)
    setPlayer(1)
  }

  return (
    <div>
      <h1>Market Domination Grid</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9,40px)' }}>
        {grid.map((tile, i) => (
          <div
            key={i}
            onClick={() => handleClick(i)}
            style={{
              width: 40,
              height: 40,
              background: tile.owner === 1 ? 'blue' : tile.owner === 2 ? 'red' : '#ccc',
              margin: 2,
              fontSize: 10
            }}
          >
            {tile.value}
          </div>
        ))}
      </div>
      <button onClick={endTurn}>End Turn</button>
    </div>
  )
}