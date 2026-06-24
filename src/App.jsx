import { useState } from 'react'
import './index.css'
import Topbar from './components/Topbar'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'

function App() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div style={{
      background: 'var(--bg)',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '430px',
      margin: '0 auto'
    }}>
      <Topbar />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'home' && <Home />}
        {activeTab !== 'home' && (
          <div style={{ padding: '20px', color: 'var(--muted)' }}>
            Sección en construcción...
          </div>
        )}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

export default App