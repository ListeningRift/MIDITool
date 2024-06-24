import type { Pitch, Range } from './constants'
import type { Position } from './position'

export class Note {
  public start: Position
  public end: Position
  public pitch: Pitch
  public range: Range
  public readonly id: number

  constructor(start: Position, end: Position, pitch: Pitch, range: Range) {
    this.start = start
    this.end = end
    this.pitch = pitch
    this.range = range
    this.id = Date.now()
  }

  getWidth() {
    return this.end.beat - this.start.beat
  }
}

export function getNotesByPitch(notes: Note[], pitch: Pitch, range: Range): Note[] {
  return notes.filter(note => {
    return note.pitch === pitch && note.range === range
  })
}
