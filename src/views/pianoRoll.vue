<template>
  <div
    ref="pianoRollRef"
    class="piano-roll"
  >
    <div class="piano-roll-header">
      <div class="operation">
        <dropdown>
          <more-button></more-button>
          <template #menu>
            <div
              class="dropdown-menu-item"
              @click="importMIDI"
            >
              import MIDI
              <input
                ref="importMIDIRef"
                type="file"
                accept=".mid"
                style="display: none"
                @change="handleImportMIDI"
              />
            </div>
            <div
              class="dropdown-menu-item"
              @click="exportMIDI"
            >
              export MIDI
            </div>
          </template>
        </dropdown>
      </div>
      <div
        ref="timeScaleRef"
        class="time-scale"
        @mousedown="onTimeScaleMouseDown"
      >
        <div
          v-for="bar in barNumber"
          :key="`bar-${bar}`"
          :bar="bar"
          class="bar"
        >
          <div
            v-for="beat in 4"
            :key="`beat-${4 * (bar - 1) + beat}`"
            :beat="4 * (bar - 1) + beat"
            class="beat"
            :class="{ 'in-range': isInRange(4 * (bar - 1) + beat) }"
            :style="{ width: `${beatWidth}px` }"
          >
            <span
              v-if="beat === 1"
              class="bar-number"
            >
              {{ bar }}
            </span>
          </div>
        </div>

        <time-indicator-triangle
          class="time-indicator-triangle"
          :style="{ transform: `translateX(${currentTimeIndicator}px)` }"
        ></time-indicator-triangle>
      </div>
    </div>
    <div class="piano-roll-body">
      <simplebar ref="pianoRollSimplebarRef">
        <div class="keyboard">
          <template
            v-for="octave in ALL_OCTAVES"
            :key="octave"
          >
            <div
              v-for="pitch in ALL_PITCHES"
              :key="String(octave) + String(pitch)"
              class="pitch"
              :class="[isBlackKey(pitch) ? 'black-key' : 'white-key']"
              :style="{ height: `${pitchHeight}px` }"
              :pitch="pitch"
              :octave="octave"
              @click="playNote(`${pitch}${octave}`)"
            >
              {{ pitch }}{{ octave }}
            </div>
          </template>
        </div>
        <div
          ref="tracksRef"
          class="tracks"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
        >
          <simplebar ref="tracksSimplebarRef">
            <template
              v-for="octave in ALL_OCTAVES"
              :key="octave"
            >
              <div
                v-for="pitch in ALL_PITCHES"
                :key="String(octave) + String(pitch)"
                class="pitch"
                :class="[isBlackKey(pitch) ? 'black-key' : 'white-key']"
                :style="{ width: `${beatWidth * 4 * barNumber}px`, height: `${pitchHeight}px` }"
                :pitch="pitch"
                :octave="octave"
                @click="onAddNote"
              ></div>
            </template>

            <div class="beats">
              <div
                v-for="bar in barNumber"
                :key="`bar-${bar}`"
                :bar="bar"
                class="bar"
              >
                <div
                  v-for="beat in 4"
                  :key="`beat-${4 * (bar - 1) + beat}`"
                  :beat="4 * (bar - 1) + beat"
                  class="beat"
                  :class="{ 'in-range': isInRange(4 * (bar - 1) + beat) }"
                  :style="{ width: `${beatWidth}px` }"
                ></div>
              </div>
            </div>

            <div
              ref="timeIndicatorRef"
              class="time-indicator"
              :style="{ transform: `translateX(${currentTimeIndicator}px)` }"
            ></div>

            <note-component
              v-for="note in notes"
              :key="note.id"
              :note="note"
              :beat-width="beatWidth"
              :pitch-height="pitchHeight"
              @click="onClickNote"
              @delete="onDeleteNote"
              @width-change="onWidthChange"
            ></note-component>
          </simplebar>

          <div
            v-if="isDroping"
            class="midi-drop-zone"
          >
            Drop the MIDI file here!
          </div>
        </div>
      </simplebar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect, onBeforeUnmount, reactive, watch, nextTick } from 'vue'
import { Time, getTransport, now } from 'tone'
import { Midi } from '@tonejs/midi'
import simplebar from 'simplebar-vue'
import type { Pitch, PitchOctave, Octave } from '@/utils/constants'
import NoteComponent from '@/components/note.vue'
import timeIndicatorTriangle from '@/components/timeIndicatorTriangle.vue'
import moreButton from '@/components/moreButton.vue'
import dropdown from '@/components/dropdown.vue'
import { ALL_PITCHES, ALL_OCTAVES, isBlackKey } from '@/utils/constants'
import { Note } from '@/utils/note'
import { Position, getBeatByOffset } from '@/utils/position'
import config from '@/utils/config'
import { Synth } from '@/utils/synth'
import { fileToArrayBuffer } from '@/utils/utils'
import 'simplebar-vue/dist/simplebar.min.css'

const pianoRollRef = ref<HTMLDivElement>()
const tracksRef = ref<HTMLDivElement>()

/**
 * Zoom
 */

const horizontalZoomScale = ref(1)
const verticalZoomScale = ref(1)

const beatWidth = computed(() => config.beatWidth * horizontalZoomScale.value)
const pitchHeight = computed(() => config.pitchHeight * verticalZoomScale.value)

onMounted(() => {
  // zoom event listener
  pianoRollRef.value?.addEventListener('wheel', e => {
    if (e.ctrlKey) {
      if (e.deltaY < 0) {
        horizontalZoomScale.value += config.zoomFactor
        horizontalZoomScale.value >= config.maxZoom && (horizontalZoomScale.value = config.maxZoom)
      } else if (e.deltaY > 0) {
        horizontalZoomScale.value -= config.zoomFactor
        horizontalZoomScale.value * config.beatWidth * barNumber.value * 4 < tracksRef.value!.clientWidth && (horizontalZoomScale.value += config.zoomFactor)
      }
      e.preventDefault()
    }
    if (e.altKey) {
      if (e.deltaY < 0) {
        verticalZoomScale.value += config.zoomFactor
        verticalZoomScale.value >= config.maxZoom && (verticalZoomScale.value = config.maxZoom)
      } else if (e.deltaY > 0) {
        verticalZoomScale.value -= config.zoomFactor
        verticalZoomScale.value <= config.minZoom && (verticalZoomScale.value = config.minZoom)
      }
      e.preventDefault()
    }
  })
})

/**
 * Note
 */

const notes = ref<Note[]>([])

const barNumber = ref(0)

const autoSetBarNumber = () => {
  const bars = Math.ceil(tracksRef.value!.clientWidth / beatWidth.value / 4)
  if (bars > barNumber.value) barNumber.value = bars
}

onMounted(() => {
  // get init bar number
  autoSetBarNumber()
  window.addEventListener('resize', autoSetBarNumber)

  // scroll to C3
  document.querySelector('.piano-roll .keyboard .pitch[pitch="C"][octave="4"]')?.scrollIntoView({ block: 'center' })
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', autoSetBarNumber)
})

let currentNoteLength = 4

// add note
const onAddNote = (e: MouseEvent) => {
  const pitch = (e.target as HTMLElement).getAttribute('pitch') as Pitch
  const octave = Number((e.target as HTMLElement).getAttribute('octave')) as Octave
  const startPosition = new Position(getBeatByOffset(e.offsetX, beatWidth.value))

  notes.value.push(
    new Note({
      start: startPosition,
      duration: currentNoteLength,
      pitch,
      octave
    })
  )
}

const onClickNote = (note: Note) => {
  currentNoteLength = note.duration
}

const onDeleteNote = (note: Note) => {
  notes.value = notes.value.filter(item => item.id !== note.id)
}

const onWidthChange = (noteWidth: number) => {
  currentNoteLength = noteWidth
}

/**
 * Time Scale
 */

const timeScaleRef = ref<HTMLDivElement>()
const tracksSimplebarRef = ref()
const pianoRollSimplebarRef = ref()

onMounted(() => {
  tracksSimplebarRef.value?.scrollElement.addEventListener('scroll', () => {
    timeScaleRef.value!.scrollLeft = tracksSimplebarRef.value?.scrollElement.scrollLeft
  })
})

watch([barNumber, beatWidth], () => {
  nextTick(() => {
    tracksSimplebarRef.value?.recalculate()
  })
})
watch(pitchHeight, () => {
  nextTick(() => {
    pianoRollSimplebarRef.value?.recalculate()
  })
})

const getClickBeatNumber = (clientX: number) => {
  const distance = clientX - timeScaleRef.value!.getBoundingClientRect().left + timeScaleRef.value!.scrollLeft
  return Math.floor(distance / beatWidth.value)
}

const onTimeScaleMouseMove = (e: MouseEvent) => {
  const beatNumber = getClickBeatNumber(e.clientX)
  if (beatNumber === loopRange.start.beat) {
    if (!loopRange.isLocked) loopRange.end = new Position(beatNumber + 1)
    loopRange.isLocked = true
  } else if (beatNumber > loopRange.start.beat) {
    loopRange.isLocked = true
    loopRange.end = new Position(beatNumber + 1)
  } else if (beatNumber < loopRange.start.beat) {
    if (!loopRange.isLocked) loopRange.end = new Position(loopRange.start.beat + 1)
    loopRange.isLocked = true
    loopRange.start = new Position(beatNumber)
    setTimeIndicatorByBeats(beatNumber)
  }
}

const onTimeScaleMouseUp = () => {
  timeScaleRef.value?.removeEventListener('mousemove', onTimeScaleMouseMove)
  timeScaleRef.value?.removeEventListener('mouseup', onTimeScaleMouseUp)
}

const onTimeScaleMouseDown = (e: MouseEvent) => {
  const beatNumber = getClickBeatNumber(e.clientX)
  loopRange.isLocked = false
  loopRange.start = new Position(beatNumber)
  setTimeIndicatorByBeats(beatNumber)
  timeScaleRef.value?.addEventListener('mousemove', onTimeScaleMouseMove)
  timeScaleRef.value?.addEventListener('mouseup', onTimeScaleMouseUp)
}

/**
 * Play
 */

const bpm = ref(120)
const synth = new Synth()

watchEffect(() => {
  synth.setBPM(bpm.value)
})

const playNote = (note: PitchOctave) => {
  synth.playByBeats(note, 1)
}

const loopRange = reactive({
  start: new Position(0),
  end: new Position(0),
  isLocked: false
})
watch(
  notes,
  () => {
    const lastNote = notes.value.sort((note1, note2) => note1.start.beat + note1.duration - (note2.start.beat + note2.duration))[notes.value.length - 1]
    const lastBar = Math.ceil((lastNote.start.beat + lastNote.duration) / 4)
    if (lastBar > barNumber.value) barNumber.value = lastBar
  },
  {
    deep: true
  }
)
watch(barNumber, () => {
  if (!loopRange.isLocked) {
    loopRange.end = new Position(barNumber.value * 4)
  }
})

const isInRange = (beat: number) => {
  return loopRange.start.beat < beat && beat <= loopRange.end.beat && loopRange.isLocked
}

const loopNotes = computed(() => {
  return notes.value.filter(note => note.start.beat >= loopRange.start.beat && note.start.beat <= loopRange.end.beat)
})

const isPlaying = ref(false)
const timeIndicatorRef = ref<HTMLDivElement>()

const currentTimeIndicator = ref<number>(0)
const timeIndicatorPlay = () => {
  const start = now()
  const durationTime = Time({
    '4n': loopRange.end.beat - loopRange.start.beat
  }).toSeconds()
  const startElement = document.querySelector(`.piano-roll .tracks .beats .bar .beat[beat="${loopRange.start.beat + 1}"]`) as HTMLElement
  const startX = startElement.offsetLeft

  const targetElement = document.querySelector(`.piano-roll .tracks .beats .bar .beat[beat="${loopRange.end.beat}"]`) as HTMLElement
  const targetX = targetElement.offsetLeft + beatWidth.value

  function animate() {
    const timeElapsed = now() - start
    const progress = Math.min(timeElapsed / durationTime, 1)

    currentTimeIndicator.value = startX + (targetX - startX) * progress

    if (timeElapsed < durationTime && isPlaying.value) {
      requestAnimationFrame(animate)
    } else {
      setTimeIndicatorByBeats(loopRange.start.beat)
    }
  }

  // 启动动画
  requestAnimationFrame(animate)
}

const setTimeIndicatorByBeats = (beats: number) => {
  currentTimeIndicator.value = beats * beatWidth.value
}

const play = () => {
  if (!isPlaying.value) {
    isPlaying.value = true
    getTransport().scheduleOnce(
      () => {
        isPlaying.value = false
        synth.stop()
        setTimeIndicatorByBeats(loopRange.start.beat)
      },
      {
        '4n': loopRange.end.beat - loopRange.start.beat
      }
    )
    timeIndicatorPlay()
    synth.playNotesByBeats(loopNotes.value, loopRange.start.beat)
  } else {
    isPlaying.value = false
    synth.stop()
    setTimeIndicatorByBeats(loopRange.start.beat)
  }
}

const handleSpacePress = (e: KeyboardEvent) => {
  if (e.key === ' ') {
    play()
    e.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener('keypress', handleSpacePress)
})
onBeforeUnmount(() => {
  document.removeEventListener('keypress', handleSpacePress)
})

/**
 * import and export MIDI
 */

const isDroping = ref(false)

const onDrop = (e: DragEvent) => {
  isDroping.value = false
  const midiFile = e.dataTransfer?.files?.[0]
  if (midiFile) {
    fileToArrayBuffer(midiFile).then(buffer => {
      if (buffer) {
        const midiData = new Midi(buffer)
        notes.value = []
        midiData.tracks.forEach((track, index) => {
          const bpm = parseFloat(midiData.header.tempos[index].bpm.toFixed(3))
          const timePerBeat = 60 / bpm
          track.notes.forEach(note => {
            notes.value.push(
              new Note({
                pitch: note.pitch as Pitch,
                octave: note.octave as Octave,
                start: new Position(Math.round(note.time / timePerBeat)),
                duration: Math.round(note.duration / timePerBeat)
              })
            )
          })
        })
      }
    })
  }
  e.preventDefault()
}

const onDragOver = (e: DragEvent) => {
  isDroping.value = true
  e.preventDefault()
}

const onDragLeave = (e: DragEvent) => {
  isDroping.value = false
  e.preventDefault()
}

const handleImportMIDI = (event: Event) => {
  const files = (event.target as HTMLInputElement)?.files
  if (files && files.length > 0) {
    const midiFile = files[0]
    fileToArrayBuffer(midiFile).then(buffer => {
      if (buffer) {
        const midiData = new Midi(buffer)
        notes.value = []
        midiData.tracks.forEach((track, index) => {
          const bpm = parseFloat(midiData.header.tempos[index].bpm.toFixed(3))
          const timePerBeat = 60 / bpm
          track.notes.forEach(note => {
            notes.value.push(
              new Note({
                pitch: note.pitch as Pitch,
                octave: note.octave as Octave,
                start: new Position(Math.round(note.time / timePerBeat)),
                duration: Math.round(note.duration / timePerBeat)
              })
            )
          })
        })
      }
    })
  }
}

const importMIDIRef = ref<HTMLInputElement>()
const importMIDI = () => {
  importMIDIRef.value?.click()
}

const exportMIDI = () => {
  const midi = new Midi()
  const track = midi.addTrack()
  notes.value.forEach(note => {
    track.addNote({
      name: note.getPitchOctave(),
      pitch: note.pitch,
      octave: note.octave,
      time: Time({
        '4n': note.start.beat
      }).toSeconds(),
      duration: Time({
        '4n': note.duration
      }).toSeconds()
    })
  })

  const blob = new Blob([midi.toArray()], { type: 'mid' })
  const url = URL.createObjectURL(blob)
  const downloadLink = document.createElement('a')
  downloadLink.setAttribute('href', url)
  downloadLink.setAttribute('download', 'Track.mid')
  downloadLink.click()
  URL.revokeObjectURL(url)
}

// TODO: chord auto complete

// TODO: melody auto complete
</script>

<style lang="less" scoped>
@timeScaleHeight: 36px;
@keyboardWidth: 88px;

.piano-roll {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .piano-roll-header {
    display: flex;
    height: @timeScaleHeight;

    .operation {
      display: flex;
      align-items: center;
      padding: 0 8px;
      width: @keyboardWidth;
      height: 100%;
      flex-shrink: 0;
      border-right: 1px solid @borderMedium;
      overflow: visible;
    }

    .time-scale {
      position: relative;
      display: flex;
      align-items: flex-end;
      width: 100%;
      height: @timeScaleHeight;
      background: @bgBase;
      border-bottom: 1px solid @borderMedium;
      overflow: hidden;
      user-select: none;

      .bar {
        display: flex;
        align-items: flex-end;
        height: 24px;
        pointer-events: none;

        .beat {
          position: relative;
          height: @timeScaleHeight;
          box-sizing: border-box;

          &:last-child::after {
            content: '';
            position: absolute;
            right: 0;
            bottom: 0;
            width: 1px;
            height: 18px;
            background: @borderMedium;
          }

          .bar-number {
            position: relative;
            left: 4px;
            top: 6px;
            color: @textDescriptive;
          }
        }
      }

      .time-indicator-triangle {
        position: absolute;
        left: -12px;
        bottom: 0;
      }
    }
  }

  .bar .beat {
    &.in-range {
      background: fade(@cardRed, 12%);
    }
  }

  .piano-roll-body {
    display: flex;
    overflow: auto;
  }

  :deep(.simplebar-content) {
    display: flex;
  }

  [data-simplebar] {
    width: 100%;
    height: 100%;
  }

  .pitch {
    height: 24px;
    line-height: 24px;
    text-align: right;
    border: 1px solid @borderMedium;
    user-select: none;

    &:not(:first-child) {
      border-top: none;
    }
  }

  .keyboard {
    width: @keyboardWidth;
    height: max-content;
    border-right: 1px solid @borderMedium;

    .pitch {
      padding-right: 4px;
      font-size: 12px;
      cursor: pointer;
    }

    .pitch.white-key {
      color: @textBase;
      background: linear-gradient(to right, #bcc0c7, #e9edf4);
    }

    .pitch.black-key {
      color: @textGrey;
      background: linear-gradient(to right, #313234, #404142);
    }
  }

  .tracks {
    position: relative;
    width: calc(100% - @keyboardWidth);
    height: max-content;
    flex-grow: 1;
    overflow-x: auto;

    :deep(.simplebar-content) {
      display: block;
    }

    .pitch {
      position: relative;
      border-left: none;
      border-right: none;

      &.white-key {
        background: @bgWhite;
      }
      &.black-key {
        background: @bgGray;
      }
    }

    .beats {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      width: max-content;
      height: 100%;
      pointer-events: none;

      .bar {
        display: flex;
        height: 100%;

        .beat {
          height: 100%;
          border-right: 1px solid @borderBase;
          box-sizing: border-box;

          &:last-child {
            border-right: 1px solid @borderMedium;
          }
        }
      }
    }

    .time-indicator {
      position: absolute;
      top: 0;
      left: 0;
      width: 1px;
      height: 100%;
      background: @bgHeavy;
    }

    .midi-drop-zone {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      height: 100%;
      font-size: @fontSizeLarge;
      font-weight: @fontWeightMedium;
      background: fade(@bgBase, 60%);
      z-index: 99;
      pointer-events: none;
    }
  }
}
</style>
