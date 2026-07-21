export default function HomeIcon({ size = 24, color = 'var(--sand)' }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M 0 30 L 40 30 L 40 0 L 0 0 Z M 13 30 L 13 14 A 7 7 0 0 1 27 14 L 27 30 Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  )
}
