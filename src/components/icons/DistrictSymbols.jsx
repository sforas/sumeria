export function FitnessSymbol({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="11" width="4" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="22" y="11" width="4" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="6" y1="14" x2="22" y2="14" stroke="currentColor" strokeWidth="2" />
      <rect x="8" y="12" width="12" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export function WorkSymbol({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="12" width="20" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 12V10a1 1 0 011-1h6a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="4" y1="17" x2="24" y2="17" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export function ReadingSymbol({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8 C14 8 9 7 5 9 L5 21 C9 19 14 20 14 20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 8 C14 8 19 7 23 9 L23 21 C19 19 14 20 14 20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="14" y1="8" x2="14" y2="20" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export function LearningSymbol({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="14,7 26,12 14,17 2,12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 14.5 C8 14.5 8 19 14 20 C20 19 20 14.5 20 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="26" y1="12" x2="26" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="26" cy="19" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function SocialSymbol({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20 L4 14 A4 4 0 0 1 12 14 L12 20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 20 L10 14 A4 4 0 0 1 18 14 L18 20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 20 L16 14 A4 4 0 0 1 24 14 L24 20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="3" y1="20" x2="25" y2="20" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function HealthSymbol({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="2,14 7,14 10,8 13,20 16,11 19,14 26,14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SavingsSymbol({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="14,5 26,10 2,10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="2" y="10" width="24" height="2" fill="currentColor" opacity="0.6" />
      <line x1="6" y1="12" x2="6" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="12" x2="11" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="12" x2="17" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="12" x2="22" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="2" y="21" width="24" height="2" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

export function JournalSymbol({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4 C24 4 12 8 8 20 L10 22 C14 10 24 4 24 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="8" y1="20" x2="5" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 22 C10 22 14 14 20 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

export function OverviewSymbol({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 14 C2 14 8 6 14 6 C20 6 26 14 26 14 C26 14 20 22 14 22 C8 22 2 14 2 14Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="1.5" fill="currentColor" />
    </svg>
  )
}
