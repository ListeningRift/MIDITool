<template>
  <div
    ref="pianoRollRef"
    class="piano-roll"
  >
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
        >
          {{ pitch }}{{ range }}
        </div>
      </template>
    </div>
    <div
      ref="tracksRef"
      class="tracks"
    >
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
            :beat="4 * bar + beat"
            class="beat"
            :style="{ width: `${beatWidth}px` }"
          ></div>
        </div>
      </div>

      <note-component
        v-for="note in notes"
        :key="note.id"
        :note="note"
        :beat-width="beatWidth"
        :pitch-height="pitchHeight"
        @delete="onDeleteNote"
        @width-change="onWidthChange"
      ></note-component>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Pitch, Range } from '@/utils/constants'
import NoteComponent from '@/components/note.vue'
import { ALL_PITCHES, ALL_RANGES, isBlackKey } from '@/utils/constants'
import { Note } from '@/utils/note'
import { Position, getBeatByOffset } from '@/utils/position'
import config from '@/utils/config'

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
  barNumber.value = Math.round(tracksRef.value!.clientWidth / beatWidth.value / 4) + 1

  // scroll to C3
  document.querySelector('.piano-roll .keyboard .pitch[pitch="C"][range="3"]')?.scrollIntoView({ block: 'center' })
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

const onDeleteNote = (note: Note) => {
  notes.value = notes.value.filter(item => item.id !== note.id)
}

const onWidthChange = (noteWidth: number) => {
  currentNoteLength = noteWidth
}

// TODO: play

// TODO: keyboard play

// TODO: import and export

// TODO: chord auto complete

// TODO: melody auto complete
</script>

<style lang="less" scoped>
.piano-roll {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: auto;

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

    .pitch {
      padding-right: 4px;
      font-size: 12px;
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
          border-right: 1px solid @borderLight;
          box-sizing: border-box;

          &:last-child {
            border-right: 1px solid @borderMedium;
          }
        }
      }
    }
  }
}
</style>
