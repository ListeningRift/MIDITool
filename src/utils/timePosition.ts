export interface Position {
  time: number
  beat: number
  bar: number
}

export type TimePositionion = Position['time']

export function getPositionByTime(time: number, bpm: number): Position {
  const beat = time / (60 / bpm)
  const bar = beat / 4
  return { time, beat, bar }
}

export function getPositionByBeat(beat: number, bpm: number): Position {
  const time = beat * (60 / bpm)
  const bar = beat / 4
  return { time, beat, bar }
}

export function getPositionByBar(bar: number, bpm: number): Position {
  const beat = bar * 4
  const time = beat * (60 / bpm)
  return { time, beat, bar }
}

export function getBeatStartPosition(time: TimePositionion, bpm: number): Position {
  const beat = Math.floor(getPositionByTime(time, bpm).beat)
  return getPositionByBeat(beat, bpm)
}
