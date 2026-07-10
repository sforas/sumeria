import { useState, useEffect } from 'react'
import './index.css'
import { Notifs } from './lib/notifications'
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
import WeeklyReview from './pages/WeeklyReview'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showWeeklyReview, setShowWeeklyReview] = useState(false)

  useEffect(() => {
    Notifs.init()
  }, [])

  useEffect(() => {
    const now = new Date()
    const isSunday = now.getDay() === 0
    const isEvening = now.getHours() >= 20
    const reviewKey = `sumeria_weekly_review_${now.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })}`
    const alreadySeen = localStorage.getItem(reviewKey)
    if (isSunday && isEvening && !alreadySeen) {
      setShowWeeklyReview(true)
      localStorage.setItem(reviewKey, 'true')
    }
  }, [])

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
          onNavigate={tab => {
            if (tab === 'weekly-review') {
              setShowWeeklyReview(true)
              setMenuOpen(false)
            } else {
              setActiveTab(tab)
              setMenuOpen(false)
            }
          }}
          onClose={() => setMenuOpen(false)}
        />
      )}
      {showWeeklyReview && <WeeklyReview onClose={() => setShowWeeklyReview(false)} />}
    </div>
  )
}