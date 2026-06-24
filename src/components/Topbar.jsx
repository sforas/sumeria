function Topbar() {
  return (
    <div style={{
      background: 'var(--surf)',
      borderBottom: '0.5px solid var(--border)',
      padding: '12px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '2.5px' }}>
        SUME<span style={{ color: 'var(--xp)' }}>RIA</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          background: 'var(--surf3)',
          border: '0.5px solid var(--border)',
          borderRadius: '6px',
          padding: '3px 9px',
          fontSize: '11px',
          color: 'var(--xp)',
          fontWeight: 500
        }}>Lvl 1</div>
        <div style={{ width: '80px', height: '3px', background: 'var(--surf3)', borderRadius: '2px' }}>
          <div style={{ width: '0%', height: '100%', background: 'var(--xp)', borderRadius: '2px' }} />
        </div>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>0 XP</span>
      </div>
    </div>
  )
}

export default Topbar