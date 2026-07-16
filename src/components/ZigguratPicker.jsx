const TERRACES = [
  { level: 5, width: 40 },
  { level: 4, width: 55 },
  { level: 3, width: 70 },
  { level: 2, width: 85 },
  { level: 1, width: 100 }
]

const VALUE_LABELS = { 1: 'Very low', 2: 'Low', 3: 'Moderate', 4: 'Good', 5: 'Excellent' }

export default function ZigguratPicker({ value, onChange, color = 'var(--acc)', label = '' }) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px', textAlign: 'center' }}>{label}</div>
      )}
      {TERRACES.map(t => {
        const selected = t.level <= value
        return (
          <div
            key={t.level}
            onClick={() => onChange(t.level)}
            style={{
              width: `${t.width}%`,
              height: '20px',
              margin: '0 auto 2px',
              background: selected ? `color-mix(in srgb, ${color} 80%, transparent)` : 'var(--surf3)',
              border: `0.5px solid color-mix(in srgb, ${color} 40%, transparent)`,
              borderRadius: 0,
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
          />
        )
      })}
      {value > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '6px' }}>
          {VALUE_LABELS[value]}
        </div>
      )}
    </div>
  )
}
