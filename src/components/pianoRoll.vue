<template>
  <div
    ref="pianoRollRef"
    class="piano-roll"
  >
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
            @click="props.playNote(`${pitch}${octave}`)"
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
                :class="{ 'in-range': props.isInRange(4 * (bar - 1) + beat) }"
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
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import simplebar from 'simplebar-vue'
import { Midi } from '@tonejs/midi'
import type { Pitch, PitchOctave, Octave } from '@/utils/constants'
import { fileToArrayBuffer } from '@/utils/utils'
import { Note } from '@/utils/note'
import { Position, getBeatByOffset } from '@/utils/position'
import { ALL_PITCHES, ALL_OCTAVES, isBlackKey } from '@/utils/constants'
import NoteComponent from '@/components/note.vue'
import config from '@/utils/config'
import { useVModel } from '@/utils/hooks'
import 'simplebar-vue/dist/simplebar.min.css'

const props = defineProps<{
  notes: Note[]
  horizontalZoomScale: number
  verticalZoomScale: number
  barNumber: number
  bpm: number
  playNote: (note: PitchOctave) => void
  loopRange: {
    start: Position
    end: Position
    isLocked: boolean
  }
  isInRange: (beat: number) => boolean
  currentTimeIndicator: number
}>()

const emits = defineEmits<{
  'update:notes': [notes: Note[]]
  'update:horizontalZoomScale': [scale: number]
  'update:verticalZoomScale': [scale: number]
  'update:barNumber': [number: number]
  'update:currentTimeIndicator': [time: number]
  horizontalScroll: [scrollLeft: number]
}>()

const notes = useVModel('notes', emits, props)
const horizontalZoomScale = useVModel('horizontalZoomScale', emits, props)
const verticalZoomScale = useVModel('verticalZoomScale', emits, props)
const barNumber = useVModel('barNumber', emits, props)
const currentTimeIndicator = useVModel('currentTimeIndicator', emits, props)

const pianoRollRef = ref<HTMLDivElement>()
const tracksRef = ref<HTMLDivElement>()

/**
 * Zoom
 */

const beatWidth = computed(() => config.beatWidth * horizontalZoomScale.value)
const pitchHeight = computed(() => config.pitchHeight * verticalZoomScale.value)

// zoom event listener
onMounted(() => {
  pianoRollRef.value?.addEventListener('wheel', e => {
    if (e.ctrlKey) {
      if (e.deltaY < 0) {
        horizontalZoomScale.value += config.zoomFactor
        horizontalZoomScale.value >= config.maxZoom && (horizontalZoomScale.value = config.maxZoom)
      } else if (e.deltaY > 0) {
        const tempScale = horizontalZoomScale.value - config.zoomFactor
        if (tempScale * config.beatWidth * barNumber.value * 4 >= tracksRef.value!.clientWidth) {
          horizontalZoomScale.value = tempScale
        }
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

const tracksSimplebarRef = ref()
const pianoRollSimplebarRef = ref()

onMounted(() => {
  tracksSimplebarRef.value?.scrollElement.addEventListener('scroll', () => {
    emits('horizontalScroll', tracksSimplebarRef.value?.scrollElement.scrollLeft)
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

/**
 * Notes
 */

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

watch(
  notes,
  () => {
    const lastNote = notes.value.sort((note1, note2) => note1.start.beat + note1.duration - (note2.start.beat + note2.duration))[notes.value.length - 1]
    if (lastNote) {
      const lastBar = Math.ceil((lastNote.start.beat + lastNote.duration) / 4)
      if (lastBar > barNumber.value) barNumber.value = lastBar
    }
  },
  {
    deep: true
  }
)

/**
 * Drop MIDI
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
</script>

<style lang="less" scoped>
@keyboardWidth: 88px;

.piano-roll {
  display: flex;
  overflow: auto;
  width: 100%;
  height: 100%;

  :deep(.simplebar-content) {
    display: flex;
  }

  [data-simplebar] {
    width: 100%;
    height: 100%;
  }

  .bar .beat {
    &.in-range {
      background: fade(@cardRed, 12%);
    }
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
