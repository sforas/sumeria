const SECTIONS = [
  { id: 'fitness', label: 'Fitness', emoji: '💪', color: 'var(--fit)', bg: '#061410' },
  { id: 'work', label: 'Work', emoji: '💼', color: 'var(--work)', bg: '#0e0d1c' },
  { id: 'reading', label: 'Reading', emoji: '📚', color: 'var(--read)', bg: '#141008' },
  { id: 'learning', label: 'Learning', emoji: '🧠', color: 'var(--learn)', bg: '#070e18' },
  { id: 'social', label: 'Social', emoji: '👥', color: 'var(--social)', bg: '#140a10' },
  { id: 'health', label: 'Healthcare', emoji: '❤️', color: 'var(--health)', bg: '#160610' },
  { id: 'savings', label: 'Savings', emoji: '💰', color: 'var(--savings)', bg: '#061208' },
  { id: 'journal', label: 'Journal', emoji: '📓', color: '#A78BFA', bg: '#0e0a1c' },
  { id: 'overview', label: 'Overview', emoji: '🌐', color: 'var(--acc)', bg: '#0d0b1a' },
]

export default function Menu({ onNavigate, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)',
        zIndex: 300, display: 'flex', flexDirection: 'column',
        padding: '20px 16px 40px'
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ flex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7F77DD, #EF9F27)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 700, color: '#fff'
            }}>S</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '2px' }}>SUMERIA</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Your daily cockpit</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surf3)', border: '0.5px solid var(--border)', borderRadius: '8px', color: 'var(--muted)', fontSize: '18px', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => { onNavigate(s.id); onClose() }}
              style={{
                background: s.bg, border: `0.5px solid ${s.color}22`,
                borderRadius: '12px', padding: '16px 8px',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '8px', transition: 'all .15s'
              }}
            >
              <div style={{ fontSize: '28px' }}>{s.emoji}</div>
              <div style={{ fontSize: '11px', color: s.color, fontWeight: 500 }}>{s.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}