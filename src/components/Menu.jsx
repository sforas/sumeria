import ZigguratLogo from './icons/ZigguratLogo'
import {
  FitnessSymbol, WorkSymbol, ReadingSymbol, LearningSymbol, SocialSymbol,
  HealthSymbol, SavingsSymbol, JournalSymbol, OverviewSymbol
} from './icons/DistrictSymbols'

const FLOORS = [
  { id: 'overview', label: 'Overview', Icon: OverviewSymbol, color: 'var(--acc)', width: 47 },
  { id: 'fitness', label: 'Fitness', Icon: FitnessSymbol, color: 'var(--fit)', width: 56 },
  { id: 'work', label: 'Work', Icon: WorkSymbol, color: 'var(--work)', width: 64 },
  { id: 'reading', label: 'Reading', Icon: ReadingSymbol, color: 'var(--read)', width: 72 },
  { id: 'learning', label: 'Learning', Icon: LearningSymbol, color: 'var(--learn)', width: 79 },
  { id: 'social', label: 'Social', Icon: SocialSymbol, color: 'var(--social)', width: 86 },
  { id: 'health', label: 'Healthcare', Icon: HealthSymbol, color: 'var(--health)', width: 92 },
  { id: 'savings', label: 'Savings', Icon: SavingsSymbol, color: 'var(--savings)', width: 96 },
  { id: 'journal', label: 'Journal', Icon: JournalSymbol, color: 'var(--journal)', width: 100 }
]

export default function Menu({ onNavigate, onClose }) {
  function go(id) {
    onNavigate(id)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 300 }}>
      <div style={{
        maxWidth: '430px', margin: '0 auto', height: '100%', position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        background: '#050505'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', color: 'var(--muted)',
          fontSize: '22px', cursor: 'pointer'
        }}>×</button>

        {/* Summit — Home */}
        <button
          onClick={() => go('home')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            height: '52px', width: '38%', margin: '0 auto',
            background: '#0a0a0a', border: '0.5px solid var(--border)', borderRadius: 0,
            cursor: 'pointer'
          }}
        >
          <ZigguratLogo size={18} color="var(--sand)" />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '11px', letterSpacing: '3px', color: 'var(--sand)' }}>HOME</span>
        </button>

        {/* Floors — narrowest at top, widest at base */}
        {FLOORS.map(f => (
          <button
            key={f.id}
            onClick={() => go(f.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              height: '48px', width: `${f.width}%`, margin: '0 auto',
              background: 'var(--surf)',
              borderLeft: `2px solid ${f.color}`, borderRight: `2px solid ${f.color}`,
              borderTop: 'none',
              borderBottom: '0.5px solid var(--border)', borderRadius: 0,
              padding: '0 14px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ color: f.color, display: 'flex', alignItems: 'center' }}>
                <f.Icon size={28} />
              </div>
              <span style={{
                marginLeft: '10px', fontSize: '11px',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase',
                color: f.color
              }}>{f.label}</span>
            </div>
            <span style={{ fontSize: '14px', color: 'var(--muted)' }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}
