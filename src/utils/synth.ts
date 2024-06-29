import { Sampler, loaded, getTransport } from 'tone'
import { Note } from './note'
import type { PitchRange } from './constants'

const sampleMap = {
  A0: 'A0.mp3',
  C1: 'C1.mp3',
  'D#1': 'Ds1.mp3',
  'F#1': 'Fs1.mp3',
  A1: 'A1.mp3',
  C2: 'C2.mp3',
  'D#2': 'Ds2.mp3',
  'F#2': 'Fs2.mp3',
  A2: 'A2.mp3',
  C3: 'C3.mp3',
  'D#3': 'Ds3.mp3',
  'F#3': 'Fs3.mp3',
  A3: 'A3.mp3',
  C4: 'C4.mp3',
  'D#4': 'Ds4.mp3',
  'F#4': 'Fs4.mp3',
  A4: 'A4.mp3',
  C5: 'C5.mp3',
  'D#5': 'Ds5.mp3',
  'F#5': 'Fs5.mp3',
  A5: 'A5.mp3',
  C6: 'C6.mp3',
  'D#6': 'Ds6.mp3',
  'F#6': 'Fs6.mp3',
  A6: 'A6.mp3',
  C7: 'C7.mp3',
  'D#7': 'Ds7.mp3',
  'F#7': 'Fs7.mp3',
  A7: 'A7.mp3',
  C8: 'C8.mp3'
}

export class Synth {
  private synth: Sampler
  public isLoaded = false
  private bpm = 120

  constructor() {
    this.synth = new Sampler({
      urls: sampleMap,
      release: 1,
      baseUrl: 'https://tonejs.github.io/audio/salamander/'
    }).toDestination()
    loaded().then(() => {
      this.isLoaded = true
    })
  }

  play(pitch: PitchRange | PitchRange[], duration: string | number | Record<string, number>, startTime?: string | number | Record<string, number>) {
    this.synth.triggerAttackRelease(pitch, duration, startTime)
  }

  playBySeconds(pitch: PitchRange | PitchRange[], seconds: number, startTime?: number) {
    this.play(pitch, seconds, startTime)
  }

  playByBeats(pitch: PitchRange | PitchRange[], beats: number, startTime?: number) {
    this.play(
      pitch,
      {
        '4n': beats
      },
      startTime
    )
  }

  playNotesByBeats(notes: Note[], startBeat: number) {
    notes.forEach(note => {
      getTransport().scheduleOnce(
        time => {
          this.playByBeats(note.getPitchRange(), note.width, time)
        },
        {
          '4n': note.start.beat - startBeat
        }
      )
    })
    getTransport().start()
  }

  stop() {
    getTransport().stop()
  }

  setBPM(bpm: number) {
    if (getTransport().state === 'stopped') {
      getTransport().bpm.value = bpm
    } else if (getTransport().state === 'started') {
      getTransport().bpm.rampTo(bpm, 0.1)
    }
  }
}
