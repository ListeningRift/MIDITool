export class Position {
  public beat: number

  constructor(beat: number) {
    this.beat = beat
  }

  getBarInt() {
    return Math.floor(this.beat / 4)
  }

  getBar() {
    return this.beat / 4
  }

  getTime(bpm: number) {
    return this.beat * (60 / bpm)
  }

  getPositionAfterBeats(beat: number) {
    return new Position(this.beat + beat)
  }
}
