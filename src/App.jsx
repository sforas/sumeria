import { useState } from 'react'
import './index.css'
import Topbar from './components/Topbar'
import Menu from './components/Menu'
import Home from './pages/Home'
import Fitness from './pages/Fitness'
import Work from './pages/Work'
import Reading from './pages/Reading'
import Learning from './pages/Learning'
import Social from './pages/Social'
import Healthcare from './pages/Healthcare'
import Savings from './pages/Savings'
import Journal from './pages/Journal'
import Overview from './pages/Overview'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{
      background: 'var(--bg)', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      maxWidth: '430px', margin: '0 auto'
    }}>
      <Topbar onMenuOpen={() => setMenuOpen(true)} activeTab={activeTab} onHome={() => setActiveTab('home')} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'home' && <Home />}
        {activeTab === 'fitness' && <Fitness />}
        {activeTab === 'work' && <Work />}
        {activeTab === 'reading' && <Reading />}
        {activeTab === 'learning' && <Learning />}
        {activeTab === 'social' && <Social />}
        {activeTab === 'health' && <Healthcare />}
        {activeTab === 'savings' && <Savings />}
        {activeTab === 'journal' && <Journal />}
        {activeTab === 'overview' && <Overview />}
      </div>
      {menuOpen && (
        <Menu
          onNavigate={tab => setActiveTab(tab)}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}