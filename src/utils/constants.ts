export const ALLPITCHES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'] as const

export type Pitch = (typeof ALLPITCHES)[number]

export function isBlackKey(pitch: (typeof ALLPITCHES)[number]): boolean {
  return pitch.includes('#') || pitch.includes('b')
}

export const ALLRANGES = [6, 5, 4, 3, 2, 1, 0] as const

export type Range = (typeof ALLRANGES)[number]
