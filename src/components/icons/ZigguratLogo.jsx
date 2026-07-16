export default function ZigguratLogo({ size = 28, color = 'var(--sand)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 420" xmlns="http://www.w3.org/2000/svg">
      <path d="M 5 380 L 395 380 L 365.8 346.2 L 34.2 346.2 Z" fill={color} />
      <path d="M 49.2 337.1 L 350.8 337.1 L 328.2 303.3 L 71.8 303.3 Z" fill={color} />
      <path d="M 83 294.2 L 317 294.2 L 299.4 260.4 L 100.5 260.4 Z" fill={color} />
      <path d="M 111.6 251.3 L 288.4 251.3 L 275.1 217.5 L 124.9 217.5 Z" fill={color} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 135 208.4 L 265 208.4 L 265 156.4 L 135 156.4 Z M 171.4 208.4 L 228.6 208.4 L 215.7 176.2 L 184.3 176.2 Z"
        fill={color}
      />
    </svg>
  )
}
