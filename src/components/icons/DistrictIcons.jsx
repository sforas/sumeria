export function FitnessIcon({ size = 24, width, height, color = 'currentColor' }) {
  return (
    <svg width={width ?? size} height={height ?? size} viewBox="26 2 170 35" xmlns="http://www.w3.org/2000/svg">
      <rect x="26.6" y="2.7" width="20.9" height="32.7" fill="none" stroke={color} strokeWidth="1.8" />
      <rect x="142.5" y="2.7" width="20.9" height="32.7" fill="none" stroke={color} strokeWidth="1.8" />
      <rect x="47.5" y="14.8" width="95" height="8.4" fill="none" stroke={color} strokeWidth="1.8" />
    </svg>
  )
}

export function WorkIcon({ size = 24, width, height, color = 'currentColor' }) {
  return (
    <svg width={width ?? size} height={height ?? size} viewBox="26 5 140 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M 76 13 L 76 5.3 L 114 5.3 L 114 13" fill="none" stroke={color} strokeWidth="1.8" />
      <rect x="26.6" y="12.9" width="136.8" height="19.8" fill="none" stroke={color} strokeWidth="1.8" />
      <line x1="26.6" y1="20.8" x2="163.4" y2="20.8" stroke={color} strokeWidth="1.8" />
    </svg>
  )
}

export function ReadingIcon({ size = 24, width, height, color = 'currentColor' }) {
  return (
    <svg width={width ?? size} height={height ?? size} viewBox="28 5 100 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M 30 33.6 C 30 33.6 33 7.6 73 6.6 L 73 33.6 Z" fill="none" stroke={color} strokeWidth="1.8" />
      <path d="M 120 33.6 C 120 33.6 117 7.6 77 6.6 L 77 33.6 Z" fill="none" stroke={color} strokeWidth="1.8" />
      <line x1="75" y1="6.6" x2="75" y2="33.6" stroke={color} strokeWidth="1.6" />
      <line x1="39" y1="17.6" x2="68" y2="17.6" stroke={color} strokeWidth="1.6" opacity="0.6" />
      <line x1="39" y1="22.6" x2="68" y2="22.6" stroke={color} strokeWidth="1.6" opacity="0.6" />
      <line x1="39" y1="27.6" x2="68" y2="27.6" stroke={color} strokeWidth="1.6" opacity="0.6" />
      <line x1="83" y1="16.6" x2="111" y2="16.6" stroke={color} strokeWidth="1.6" opacity="0.6" />
      <line x1="83" y1="21.6" x2="111" y2="21.6" stroke={color} strokeWidth="1.6" opacity="0.6" />
      <line x1="83" y1="26.6" x2="111" y2="26.6" stroke={color} strokeWidth="1.6" opacity="0.6" />
    </svg>
  )
}

export function LearningIcon({ size = 24, width, height, color = 'currentColor' }) {
  return (
    <svg width={width ?? size} height={height ?? size} viewBox="50 2 130 30" xmlns="http://www.w3.org/2000/svg">
      <polygon points="95,4.6 135,12.6 95,20.6 55,12.6" fill="none" stroke={color} strokeWidth="1.8" />
      <path d="M 73 12.6 C 73 12.6 73 24.6 95 27.6 C 117 24.6 117 12.6 117 12.6" fill="none" stroke={color} strokeWidth="1.8" />
      <line x1="135" y1="12.6" x2="135" y2="24.6" stroke={color} strokeWidth="1.6" />
      <circle cx="135" cy="26.6" r="3" fill={color} />
    </svg>
  )
}

export function SocialIcon({ size = 24, width, height, color = 'currentColor' }) {
  return (
    <svg width={width ?? size} height={height ?? size} viewBox="0 0 260 38" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="260" height="38" fill="none" stroke={color} strokeWidth="1.6" />
      <path d="M 41 32.7 L 41 24.3 A 8.4 8.4 0 0 1 57.8 24.3 L 57.8 32.7 Z" fill={color} stroke={color} strokeWidth="1.6" />
      <path d="M 86.6 32.7 L 86.6 24.3 A 8.4 8.4 0 0 1 103.4 24.3 L 103.4 32.7 Z" fill={color} stroke={color} strokeWidth="1.6" />
      <path d="M 132.2 32.7 L 132.2 24.3 A 8.4 8.4 0 0 1 149 24.3 L 149 32.7 Z" fill={color} stroke={color} strokeWidth="1.6" />
    </svg>
  )
}

export function HealthIcon({ size = 24, width, height, color = 'currentColor' }) {
  return (
    <svg width={width ?? size} height={height ?? size} viewBox="0 0 260 38" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="260" height="38" fill="none" stroke={color} strokeWidth="1.6" />
      <polyline
        points="26.6,19 57.4,19 73.1,8.4 88.2,28.1 100.5,12.2 115.5,19 163.4,19"
        fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

export function SavingsIcon({ size = 24, width, height, color = 'currentColor' }) {
  return (
    <svg width={width ?? size} height={height ?? size} viewBox="0 0 260 38" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="260" height="38" fill="none" stroke={color} strokeWidth="1.6" />
      <polygon points="20,12.6 130,3.6 240,12.6" fill="none" stroke={color} strokeWidth="1.8" />
      <rect x="22" y="12.6" width="216" height="5" fill={color} />
      <line x1="35" y1="17.6" x2="35" y2="33.6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="70" y1="17.6" x2="70" y2="33.6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="105" y1="17.6" x2="105" y2="33.6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="140" y1="17.6" x2="140" y2="33.6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="175" y1="17.6" x2="175" y2="33.6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="210" y1="17.6" x2="210" y2="33.6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="22" y="33.6" width="216" height="3" fill={color} />
    </svg>
  )
}

export function JournalIcon({ size = 24, width, height, color = 'currentColor' }) {
  return (
    <svg width={width ?? size} height={height ?? size} viewBox="0 0 260 38" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="260" height="38" fill="none" stroke={color} strokeWidth="1.6" />
      <line x1="52.6" y1="35.3" x2="81.5" y2="24.9" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 81.5 24.9 Q 117.8 19.8 142.9 2.7 Q 113.7 8.4 81.5 24.9 Z" fill="none" stroke={color} strokeWidth="1.6" />
      <line x1="81.5" y1="24.9" x2="142.9" y2="2.7" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function OverviewIcon({ size = 24, width, height, color = 'currentColor' }) {
  return (
    <svg width={width ?? size} height={height ?? size} viewBox="0 0 260 38" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="260" height="38" fill="none" stroke={color} strokeWidth="1.6" />
      <path d="M 38 19 Q 130 5.3 222 19 Q 130 32.7 38 19 Z" fill="none" stroke={color} strokeWidth="1.6" />
      <circle cx="130" cy="19" r="6.1" fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  )
}
