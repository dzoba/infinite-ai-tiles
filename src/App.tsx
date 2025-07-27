import GameCanvas from './GameCanvas'
import './App.css'

function App() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a'
    }}>
      <h1 style={{ color: '#ffffff', marginBottom: '20px' }}>
        Infinite Tiles with Phaser
      </h1>
      <GameCanvas width={800} height={600} />
    </div>
  )
}

export default App
