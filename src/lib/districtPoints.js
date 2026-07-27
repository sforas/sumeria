export const STAGE_THRESHOLDS = {
  fitness:  [0, 1, 10, 30, 80, 150],
  work:     [0, 1, 8,  20, 50, 100],
  reading:  [0, 1, 6,  15, 35, 70],
  learning: [0, 1, 6,  15, 35, 70],
  social:   [0, 1, 5,  12, 25, 50],
  health:   [0, 1, 8,  20, 45, 90],
  savings:  [0, 1, 4,  10, 20, 40],
  journal:  [0, 1, 6,  15, 30, 60],
}

export const STAGE_NAMES = {
  fitness: ['', 'Ruinas griegas', 'Gimnasio', 'Arena', 'Anfiteatro', 'Coliseo'],
  work: ['', 'Puesto de mercado', 'Tienda', 'Edificio de oficinas', 'Torre comercial', 'Rascacielos'],
  reading: ['', 'Piedra inscrita', 'Estante de pergaminos', 'Biblioteca pequeña', 'Biblioteca', 'Biblioteca de Alejandría'],
  learning: ['', 'Salón de clases', 'Salón exterior', 'Academia', 'Universidad', 'Gran universidad'],
  social: ['', 'Pozo del pueblo', 'Plaza', 'Ágora', 'Teatro griego', 'Gran teatro'],
  health: ['', 'Altar', 'Capilla', 'Templo pequeño', 'Templo', 'Partenón'],
  savings: ['', 'Ánfora', 'Silos', 'Banco pequeño', 'Banco', 'Tesoro real'],
  journal: ['', 'Tablilla de arcilla', 'Scriptorium', 'Biblioteca de crónicas', 'Sala de lectura', 'Gran archivo']
}

// Returns stage 0-5 and progress 0-1 within stage
export function getStageAndProgress(district, points) {
  const thresholds = STAGE_THRESHOLDS[district]
  let stage = 0
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i]) { stage = i; break }
  }
  if (stage === 5) return { stage: 5, progress: 1 }
  const stageMin = thresholds[stage]
  const stageMax = thresholds[stage + 1]
  const progress = (points - stageMin) / (stageMax - stageMin)
  return { stage, progress: Math.min(1, Math.max(0, progress)) }
}

// Add points to a district and update Supabase
export async function addPoints(supabase, district, pointsToAdd) {
  const { data } = await supabase
    .from('district_points')
    .select('points')
    .eq('district', district)
    .single()

  const currentPoints = data?.points || 0
  const newPoints = currentPoints + pointsToAdd

  const { stage: oldStage } = getStageAndProgress(district, currentPoints)
  const { stage: newStage } = getStageAndProgress(district, newPoints)

  await supabase.from('district_points')
    .update({ points: newPoints, last_updated: new Date().toISOString() })
    .eq('district', district)

  return {
    oldPoints: currentPoints,
    newPoints,
    oldStage,
    newStage,
    stageUp: newStage > oldStage
  }
}
