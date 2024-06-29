<template>
  <div
    ref="pianoRollRef"
    class="piano-roll"
  >
    <div class="piano-roll-header">
      <div class="keyboard"></div>
      <div
        ref="timeScaleRef"
        class="time-scale"
        @click="onTimeScaleClick"
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
            v-for="range in ALL_RANGES"
            :key="range"
          >
            <div
              v-for="pitch in ALL_PITCHES"
              :key="String(range) + String(pitch)"
              class="pitch"
              :class="[isBlackKey(pitch) ? 'black-key' : 'white-key']"
              :style="{ height: `${pitchHeight}px` }"
              :pitch="pitch"
              :range="range"
              @click="playNote(`${pitch}${range}`)"
            >
              {{ pitch }}{{ range }}
            </div>
          </template>
        </div>
        <div
          ref="tracksRef"
          class="tracks"
        >
          <simplebar ref="tracksSimplebarRef">
            <template
              v-for="range in ALL_RANGES"
              :key="range"
            >
              <div
                v-for="pitch in ALL_PITCHES"
                :key="String(range) + String(pitch)"
                class="pitch"
                :class="[isBlackKey(pitch) ? 'black-key' : 'white-key']"
                :style="{ width: `${beatWidth * 4 * barNumber}px`, height: `${pitchHeight}px` }"
                :pitch="pitch"
                :range="range"
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
        </div>
      </simplebar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect, onBeforeUnmount, reactive, watch, nextTick } from 'vue'
import { Time, getTransport, now } from 'tone'
import simplebar from 'simplebar-vue'
import type { Pitch, PitchRange, Range } from '@/utils/constants'
import NoteComponent from '@/components/note.vue'
import timeIndicatorTriangle from '@/components/timeIndicatorTriangle.vue'
import { ALL_PITCHES, ALL_RANGES, isBlackKey } from '@/utils/constants'
import { Note } from '@/utils/note'
import { Position, getBeatByOffset } from '@/utils/position'
import config from '@/utils/config'
import { Synth } from '@/utils/synth'
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

onMounted(() => {
  // get init bar number
  barNumber.value = Math.ceil(tracksRef.value!.clientWidth / beatWidth.value / 4)

  // scroll to C3
  document.querySelector('.piano-roll .keyboard .pitch[pitch="C"][range="4"]')?.scrollIntoView({ block: 'center' })
})

let currentNoteLength = 4

// add note
const onAddNote = (e: MouseEvent) => {
  const pitch = (e.target as HTMLElement).getAttribute('pitch') as Pitch
  const range = Number((e.target as HTMLElement).getAttribute('range')) as Range
  const startPosition = new Position(getBeatByOffset(e.offsetX, beatWidth.value))

  notes.value.push(
    new Note({
      start: startPosition,
      width: currentNoteLength,
      pitch,
      range
    })
  )
}

const onClickNote = (note: Note) => {
  currentNoteLength = note.width
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

const onTimeScaleClick = (e: MouseEvent) => {
  const distance = e.clientX - timeScaleRef.value!.getBoundingClientRect().left + timeScaleRef.value!.scrollLeft
  const beatNumber = Math.floor(distance / beatWidth.value)
  setTimeIndicatorByBeats(beatNumber)
  loopRange.start = new Position(beatNumber)
}

/**
 * Play
 */

const bpm = ref(120)
const synth = new Synth()

watchEffect(() => {
  synth.setBPM(bpm.value)
})

const playNote = (note: PitchRange) => {
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
    if (!loopRange.isLocked) {
      const lastNote = notes.value.sort((note1, note2) => note1.start.beat + note1.width - (note2.start.beat + note2.width))[notes.value.length - 1]
      const endBeatNumber = lastNote ? lastNote.start.beat + lastNote.width : 0
      loopRange.end = new Position(Math.ceil(endBeatNumber / 4) * 4)
    }
  },
  {
    deep: true
  }
)

const loopNotes = computed(() => {
  return notes.value.filter(note => note.start.beat >= loopRange.start.beat && note.start.beat + note.width <= loopRange.end.beat)
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

  const targetElement = document.querySelector(`.piano-roll .tracks .beats .bar .beat[beat="${loopRange.end.beat + 1}"]`) as HTMLElement
  const targetX = targetElement.offsetLeft

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

// TODO: import and export

// TODO: chord auto complete

// TODO: melody auto complete
</script>

<style lang="less" scoped>
@timeScaleHeight: 36px;

.piano-roll {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .piano-roll-header {
    display: flex;
    height: @timeScaleHeight;

    .keyboard {
      height: 100%;
      flex-shrink: 0;
      border-right: 1px solid @borderMedium;
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

      .bar {
        display: flex;
        align-items: flex-end;
        height: 24px;
        pointer-events: none;

        .beat {
          box-sizing: border-box;

          &:last-child {
            height: 18px;
            border-right: 1px solid @borderMedium;
          }

          .bar-number {
            position: relative;
            left: 4px;
            bottom: 12px;
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
    width: 88px;
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
    width: calc(100% - 88px);
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
  }
}
</style>
