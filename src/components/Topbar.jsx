export default function Topbar({ onMenuOpen, activeTab, onHome }) {
  const sectionColors = {
    home: 'var(--acc)', fitness: 'var(--fit)', work: 'var(--work)',
    reading: 'var(--read)', learning: 'var(--learn)', social: 'var(--social)',
    health: 'var(--health)', savings: 'var(--savings)', journal: '#A78BFA', overview: 'var(--acc)'
  }

  const sectionNames = {
    home: 'Home', fitness: 'Fitness', work: 'Work', reading: 'Reading',
    learning: 'Learning', social: 'Social', health: 'Healthcare',
    savings: 'Savings', journal: 'Journal', overview: 'Overview'
  }

  const accentColor = sectionColors[activeTab] || 'var(--acc)'

  return (
    <div style={{
      background: 'var(--surf)', borderBottom: '0.5px solid var(--border)',
      padding: '11px 18px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50
    }}>
      <button onClick={onMenuOpen} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '10px', padding: 0
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px',
          background: 'linear-gradient(135deg, #7F77DD, #EF9F27)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: 700, color: '#fff'
        }}>S</div>
        {activeTab === 'home' ? (
          <div style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '2px', color: 'var(--text)' }}>
            SUME<span style={{ color: 'var(--xp)' }}>RIA</span>
          </div>
        ) : (
          <div style={{ fontSize: '14px', fontWeight: 500, color: accentColor }}>
            {sectionNames[activeTab]}
          </div>
        )}
      </button>

      {activeTab !== 'home' && (
        <button onClick={onHome} style={{
          background: 'var(--surf3)', border: '0.5px solid var(--border)',
          borderRadius: '6px', color: 'var(--muted)', fontSize: '11px',
          padding: '5px 12px', cursor: 'pointer'
        }}>← Home</button>
      )}
    </div>
  )
}