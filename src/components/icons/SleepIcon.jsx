export default function SleepIcon({ size = 28, color = 'var(--health)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 36 10 A 22 22 0 1 1 36 62 A 15 15 0 1 0 36 10 Z"
        stroke={color} strokeWidth="1.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      <line x1="18" y1="36" x2="24" y2="36" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="20" y1="24" x2="25" y2="27" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="20" y1="48" x2="25" y2="45" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="30" y1="18" x2="30" y2="24" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="30" y1="48" x2="30" y2="54" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
