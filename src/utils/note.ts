import { ALLPITCHES } from './constants'
import { TimePositionion } from './timePosition'

export interface Note {
  start: TimePositionion
  end: TimePositionion
  pitch: (typeof ALLPITCHES)[number]
  range: number
}
