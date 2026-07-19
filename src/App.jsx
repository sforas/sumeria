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
import Calendar from './pages/Calendar'
import WeeklyReview from './pages/WeeklyReview'
import MonthlyReview from './pages/MonthlyReview'
import YearlyReview from './pages/YearlyReview'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showWeeklyReview, setShowWeeklyReview] = useState(false)
  const [showMonthlyReview, setShowMonthlyReview] = useState(false)
  const [showYearlyReview, setShowYearlyReview] = useState(false)

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

  useEffect(() => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isLastDay = tomorrow.getMonth() !== now.getMonth()
  const isEvening = now.getHours() >= 20
  const reviewKey = `sumeria_monthly_review_${now.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }).slice(0, 7)}`
  const alreadySeen = localStorage.getItem(reviewKey)
  if (isLastDay && isEvening && !alreadySeen) {
    setShowMonthlyReview(true)
    localStorage.setItem(reviewKey, 'true')
  }
}, [])

useEffect(() => {
  const now = new Date()
  const isLastDay = now.getMonth() === 11 && now.getDate() === 31
  const isEvening = now.getHours() >= 20
  const reviewKey = `sumeria_yearly_review_${currentYear()}`
  const alreadySeen = localStorage.getItem(reviewKey)
  if (isLastDay && isEvening && !alreadySeen) {
    setShowYearlyReview(true)
    localStorage.setItem(reviewKey, 'true')
  }
}, [])

function currentYear() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }).slice(0, 4)
}

  return (
    <div style={{
      background: 'var(--bg)', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      maxWidth: '430px', margin: '0 auto'
    }}>
      <Topbar onMenuOpen={() => setMenuOpen(true)} activeTab={activeTab} onHome={() => setActiveTab('home')} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'home' && <Home onNavigate={tab => setActiveTab(tab)} />}
        {activeTab === 'fitness' && <Fitness />}
        {activeTab === 'work' && <Work />}
        {activeTab === 'reading' && <Reading />}
        {activeTab === 'learning' && <Learning />}
        {activeTab === 'social' && <Social />}
        {activeTab === 'health' && <Healthcare />}
        {activeTab === 'savings' && <Savings />}
        {activeTab === 'journal' && <Journal />}
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'calendar' && <Calendar />}
      </div>
      {menuOpen && (
        <Menu
          onNavigate={tab => {
            if (tab === 'weekly-review') {
              setShowWeeklyReview(true)
              setMenuOpen(false)
            }
            if (tab === 'monthly-review') {
              setShowMonthlyReview(true)
              setMenuOpen(false)
            }
            if (tab === 'yearly-review') {
              setShowYearlyReview(true)
              setMenuOpen(false)
            }
            else {
              setActiveTab(tab)
              setMenuOpen(false)
            }
          }}
          onClose={() => setMenuOpen(false)}
        />
      )}
      {showWeeklyReview && <WeeklyReview onClose={() => setShowWeeklyReview(false)} />}
      {showMonthlyReview && <MonthlyReview onClose={() => setShowMonthlyReview(false)} />}
      {showYearlyReview && <YearlyReview onClose={() => setShowYearlyReview(false)} />}
    </div>
  )
}