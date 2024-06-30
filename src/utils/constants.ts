export const ALL_PITCHES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'] as const

export type Pitch = (typeof ALL_PITCHES)[number]

export function isBlackKey(pitch: (typeof ALL_PITCHES)[number]): boolean {
  return pitch.includes('#') || pitch.includes('b')
}

export const ALL_OCTAVES = [7, 6, 5, 4, 3, 2, 1] as const

export type Octave = (typeof ALL_OCTAVES)[number]

export type PitchOctave = `${Pitch}${Octave}`
