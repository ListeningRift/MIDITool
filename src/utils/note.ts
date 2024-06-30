import type { Pitch, PitchOctave, Octave } from './constants'
import type { Position } from './position'

export interface NoteAttribute {
  start: Position
  duration: number
  pitch: Pitch
  octave: Octave
}

export class Note implements NoteAttribute {
  public start: Position
  public duration: number
  public pitch: Pitch
  public octave: Octave
  public readonly id: number

  constructor(params: NoteAttribute) {
    const { start, duration, pitch, octave } = params
    this.start = start
    this.duration = duration
    this.pitch = pitch
    this.octave = octave
    this.id = Date.now()
  }

  update(newNote: Partial<NoteAttribute>) {
    if (newNote.duration) {
      this.duration = newNote.duration
    }
    if (newNote.start) {
      this.start = newNote.start
    }
    if (newNote.pitch) {
      this.pitch = newNote.pitch
    }
    if (newNote.octave) {
      this.octave = newNote.octave
    }
  }

  getPitchOctave(): PitchOctave {
    return `${this.pitch}${this.octave}`
  }
}

export function getNotesByPitch(notes: Note[], pitch: Pitch, octave: Octave): Note[] {
  return notes.filter(note => {
    return note.pitch === pitch && note.octave === octave
  })
}
