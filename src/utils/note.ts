import type { Pitch, Range } from './constants'
import type { Position } from './position'

export interface NoteAttribute {
  start: Position
  width: number
  pitch: Pitch
  range: Range
}

export class Note implements NoteAttribute {
  public start: Position
  public width: number
  public pitch: Pitch
  public range: Range
  public readonly id: number

  constructor(params: NoteAttribute) {
    const { start, width, pitch, range } = params
    this.start = start
    this.width = width
    this.pitch = pitch
    this.range = range
    this.id = Date.now()
  }

  update(newNote: Partial<NoteAttribute>) {
    if (newNote.width) {
      this.width = newNote.width
    }
    if (newNote.start) {
      this.start = newNote.start
    }
    if (newNote.pitch) {
      this.pitch = newNote.pitch
    }
    if (newNote.range) {
      this.range = newNote.range
    }
  }
}

export function getNotesByPitch(notes: Note[], pitch: Pitch, range: Range): Note[] {
  return notes.filter(note => {
    return note.pitch === pitch && note.range === range
  })
}
