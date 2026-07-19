export default function CalendarIcon({ size = 28, color = 'var(--sand)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="52" height="50" rx="0" stroke={color} strokeWidth="1.5" />
      <rect x="4" y="8" width="52" height="12" fill={color} />
      <line x1="18" y1="4" x2="18" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="4" x2="42" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="28" x2="56" y2="28" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <line x1="4" y1="40" x2="56" y2="40" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <line x1="18" y1="20" x2="18" y2="58" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <line x1="31" y1="20" x2="31" y2="58" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <line x1="44" y1="20" x2="44" y2="58" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <circle cx="24" cy="34" r="3" fill="#C17F3A" />
    </svg>
  )
}
