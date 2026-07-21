import ZigguratLogo from './icons/ZigguratLogo'
import CalendarIcon from './icons/CalendarIcon'
import HomeIcon from './icons/HomeIcon'

export default function Topbar({ onMenuOpen, activeTab, onHome, onCalendar }) {
  const sectionColors = {
    home: 'var(--acc)', fitness: 'var(--fit)', work: 'var(--work)',
    reading: 'var(--read)', learning: 'var(--learn)', social: 'var(--social)',
    health: 'var(--health)', savings: 'var(--savings)', journal: 'var(--journal)', overview: 'var(--acc)'
  }

  const sectionNames = {
    home: 'Home', fitness: 'Fitness', work: 'Work', reading: 'Reading',
    learning: 'Learning', social: 'Social', health: 'Healthcare',
    savings: 'Savings', journal: 'Journal', overview: 'Overview'
  }

  const accentColor = sectionColors[activeTab] || 'var(--acc)'

  return (
    <div style={{
      background: 'var(--surf)',
      borderBottom: activeTab === 'home' ? '0.5px solid var(--border)' : `2px solid ${accentColor}`,
      padding: '11px 18px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
      transition: 'border-color .15s'
    }}>
      <button onClick={onMenuOpen} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '10px', padding: 0
      }}>
        <ZigguratLogo size={28} color="var(--sand)" />
        {activeTab === 'home' ? (
          <div style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '2px' }}>
            <span style={{ color: 'var(--sand)' }}>SUMERIA</span>
          </div>
        ) : (
          <div style={{ fontSize: '14px', fontWeight: 500, color: accentColor }}>
            {sectionNames[activeTab]}
          </div>
        )}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {activeTab !== 'home' && (
          <button onClick={onHome} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            opacity: 0.8
          }}>
            <HomeIcon size={24} color="var(--sand)" />
          </button>
        )}

        <button
          onClick={onCalendar}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '4px',
            opacity: activeTab === 'calendar' ? 1 : 0.6
          }}>
          <CalendarIcon size={22} color="var(--sand)" />
        </button>
      </div>
    </div>
  )
}