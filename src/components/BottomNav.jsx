const tabs = [
  { id: 'home', label: 'Home', icon: '⊞' },
  { id: 'earnit', label: 'Earn It', icon: '🔓' },
  { id: 'fitness', label: 'Fitness', icon: '◎' },
  { id: 'work', label: 'Work', icon: '◈' },
  { id: 'diet', label: 'Diet', icon: '◇' },
  { id: 'reading', label: 'Read', icon: '◻' },
  { id: 'learning', label: 'Learn', icon: '◆' },
  { id: 'social', label: 'Social', icon: '○' },
  { id: 'health', label: 'Health', icon: '♡' },
  { id: 'savings', label: 'Savings', icon: '◑' },
  { id: 'overview', label: 'Overview', icon: '◉' },
]

function BottomNav({ active, onChange }) {
  return (
    <div style={{
      background: 'var(--surf)',
      borderTop: '0.5px solid var(--border)',
      display: 'flex',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      position: 'sticky',
      bottom: 0,
      zIndex: 50
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            background: 'none',
            border: 'none',
            borderTop: active === tab.id ? '2px solid var(--acc)' : '2px solid transparent',
            color: active === tab.id ? 'var(--text)' : 'var(--muted)',
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'color .15s'
          }}
        >
          <span style={{ fontSize: '16px' }}>{tab.icon}</span>
          <span style={{ fontSize: '9px', letterSpacing: '.3px' }}>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export default BottomNav