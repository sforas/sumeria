export function PushIcon({ size = 28, color = 'var(--fit)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <g stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="28" x2="44" y2="28" />
        <line x1="14" y1="28" x2="10" y2="38" />
        <line x1="38" y1="28" x2="34" y2="38" />
        <line x1="10" y1="38" x2="6" y2="38" />
        <line x1="34" y1="38" x2="30" y2="38" />
        <line x1="44" y1="28" x2="44" y2="25" />
        <circle cx="48" cy="24" r="5" stroke={color} fill="none" />
      </g>
    </svg>
  )
}

export function PullIcon({ size = 28, color = 'var(--fit)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <g stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="0" y1="8" x2="56" y2="8" />
        <line x1="16" y1="8" x2="22" y2="22" />
        <line x1="40" y1="8" x2="34" y2="22" />
        <line x1="22" y1="22" x2="34" y2="22" />
        <line x1="28" y1="22" x2="28" y2="42" />
        <line x1="28" y1="42" x2="20" y2="52" />
        <line x1="28" y1="42" x2="36" y2="52" />
        <circle cx="28" cy="4" r="4" stroke={color} fill="none" />
      </g>
    </svg>
  )
}

export function LegIcon({ size = 28, color = 'var(--fit)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <g stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="28" y1="4" x2="16" y2="28" />
        <line x1="16" y1="28" x2="28" y2="52" />
        <line x1="28" y1="52" x2="36" y2="52" />
        <circle cx="16" cy="28" r="3" fill={color} stroke={color} />
      </g>
    </svg>
  )
}

export function FutbolIcon({ size = 28, color = 'var(--fit)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <g stroke={color} strokeWidth="1.5" fill="none">
        <circle cx="28" cy="28" r="22" />
        <polygon points="28,10 38,18 34,30 22,30 18,18" strokeWidth="1.2" />
        <line x1="28" y1="10" x2="28" y2="6" />
        <line x1="38" y1="18" x2="44" y2="14" />
        <line x1="34" y1="30" x2="40" y2="36" />
        <line x1="22" y1="30" x2="16" y2="36" />
        <line x1="18" y1="18" x2="12" y2="14" />
      </g>
    </svg>
  )
}

export function PadelIcon({ size = 28, color = 'var(--fit)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <g stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round">
        <line x1="12" y1="52" x2="26" y2="38" />
        <line x1="14" y1="50" x2="18" y2="46" />
        <line x1="18" y1="54" x2="22" y2="50" />
        <rect x="20" y="4" width="30" height="32" rx="12" />
        <circle cx="29" cy="12" r="2" strokeWidth="1.2" />
        <circle cx="38" cy="12" r="2" strokeWidth="1.2" />
        <circle cx="29" cy="22" r="2" strokeWidth="1.2" />
        <circle cx="38" cy="22" r="2" strokeWidth="1.2" />
        <circle cx="33" cy="17" r="2" strokeWidth="1.2" />
        <line x1="28" y1="36" x2="26" y2="38" />
      </g>
    </svg>
  )
}

export function GolfIcon({ size = 28, color = 'var(--fit)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <g stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round">
        <line x1="46" y1="4" x2="10" y2="48" />
        <line x1="10" y1="48" x2="28" y2="54" />
        <line x1="28" y1="54" x2="32" y2="46" />
        <line x1="32" y1="46" x2="14" y2="40" />
        <line x1="14" y1="40" x2="10" y2="48" />
        <rect x="42" y="0" width="8" height="12" rx="3" strokeWidth="1.2" />
        <circle cx="22" cy="54" r="4" />
      </g>
    </svg>
  )
}
