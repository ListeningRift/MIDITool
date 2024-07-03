<template>
  <div class="midi-editor">
    <div class="midi-editor-header">
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
    <div class="midi-editor-body">
      <piano-roll
        v-model:notes="notes"
        v-model:bar-number="barNumber"
        v-model:current-time-indicator="currentTimeIndicator"
        v-model:horizontal-zoom-scale="horizontalZoomScale"
        v-model:vertical-zoom-scale="verticalZoomScale"
        :loop-range="loopRange"
        :play-note="playNote"
        :bpm="bpm"
        :is-in-range="isInRange"
        @horizontal-scroll="onHorizontalScroll"
      ></piano-roll>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect, onBeforeUnmount, reactive, watch } from 'vue'
import { Time, getTransport, now } from 'tone'
import { Midi } from '@tonejs/midi'
import type { Pitch, PitchOctave, Octave } from '@/utils/constants'
import timeIndicatorTriangle from '@/components/timeIndicatorTriangle.vue'
import moreButton from '@/components/moreButton.vue'
import dropdown from '@/components/dropdown.vue'
import pianoRoll from '@/components/pianoRoll.vue'
import { Note } from '@/utils/note'
import { Position } from '@/utils/position'
import config from '@/utils/config'
import { Synth } from '@/utils/synth'
import { fileToArrayBuffer } from '@/utils/utils'

/**
 * Zoom
 */

const horizontalZoomScale = ref(1)
const verticalZoomScale = ref(1)

const beatWidth = computed(() => config.beatWidth * horizontalZoomScale.value)

/**
 * Note
 */

const notes = ref<Note[]>([])

const barNumber = ref(0)

/**
 * Time Scale
 */

const timeScaleRef = ref<HTMLDivElement>()

const onHorizontalScroll = (scrollLeft: number) => {
  timeScaleRef.value!.scrollLeft = scrollLeft
}

const getClickBeatNumber = (clientX: number) => {
  const distance = clientX - timeScaleRef.value!.getBoundingClientRect().left + timeScaleRef.value!.scrollLeft
  return Math.round(distance / beatWidth.value)
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

    loopNotes.value.forEach(note => {
      getTransport().scheduleOnce(
        () => {
          synth.playByBeats(note.getPitchOctave(), note.duration)
        },
        {
          '4n': note.start.beat - loopRange.start.beat
        }
      )
    })
    synth.start()
    timeIndicatorPlay()
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

.midi-editor {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .midi-editor-header {
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

  .midi-editor-body {
    height: calc(100% - @timeScaleHeight);
  }

  .bar .beat {
    &.in-range {
      background: fade(@cardRed, 12%);
    }
  }
}
</style>
