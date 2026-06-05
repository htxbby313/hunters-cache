import React from 'react'
import './App.css'

function App() {
  const items = [
    { id: 1, title: 'Wood Duck Decoys', price: '$120', category: 'Decoys', img: '🦆' },
    { id: 2, title: 'Buck Grunt Call', price: '$25', category: 'Calls', img: '🦌' },
    { id: 3, title: 'Camo Hunting Jacket', price: '$85', category: 'Clothing', img: '🧥' },
    { id: 4, title: 'Rifle Scope 4x32', price: '$150', category: 'Optics', img: '🔭' },
  ]

  return (
    <div style={{ paddingTop: '80px', width: '100%' }}>
      <nav className="navbar">
        <h2 style={{ margin: 0 }}>Hunter's Cache</h2>
        <div>
          <button style={{ marginRight: '10px' }}>Buy</button>
          <button>Sell</button>
        </div>
      </nav>

      <header style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Gear for the Modern Hunter</h1>
        <p>Peer-to-peer marketplace for hunting enthusiasts.</p>
      </header>

      <div className="marketplace-grid">
        {items.map(item => (
          <div key={item.id} className="item-card">
            <div style={{ fontSize: '3em' }}>{item.img}</div>
            <h3>{item.title}</h3>
            <p>{item.category}</p>
            <div className="item-price">{item.price}</div>
            <button style={{ marginTop: '10px', width: '100%' }}>View Details</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
