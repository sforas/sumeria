import { PushIcon, PullIcon, LegIcon, FutbolIcon, PadelIcon, GolfIcon } from './WorkoutIcons'

export function getWorkoutIcon(type, size = 22, color = 'var(--fit)') {
  if (!type) return null
  if (type.includes('Push')) return <PushIcon size={size} color={color} />
  if (type.includes('Pull')) return <PullIcon size={size} color={color} />
  if (type.includes('Leg')) return <LegIcon size={size} color={color} />
  if (type.includes('Fútbol') || type.includes('Futbol')) return <FutbolIcon size={size} color={color} />
  if (type.includes('Pádel') || type.includes('Padel')) return <PadelIcon size={size} color={color} />
  if (type.includes('Golf')) return <GolfIcon size={size} color={color} />
  return null
}
