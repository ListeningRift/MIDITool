<template>
  <div class="midi-scroll">
    <div class="keyboard">
      <template
        v-for="range in ALLRANGES"
        :key="range"
      >
        <div
          v-for="pitch in ALLPITCHES"
          :key="String(range) + String(pitch)"
          class="pitch"
          :class="[isBlackKey(pitch) ? 'black-key' : 'white-key']"
          :pitch="pitch"
          :range="range"
        >
          {{ pitch }}{{ range }}
        </div>
      </template>
    </div>
    <div
      ref="tracks"
      class="tracks"
    >
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
      <template
        v-for="range in ALLRANGES"
        :key="range"
      >
        <div
          v-for="pitch in ALLPITCHES"
          :key="String(range) + String(pitch)"
          class="pitch"
          :class="[isBlackKey(pitch) ? 'black-key' : 'white-key']"
          :style="{ width: `${beatWidth * 4 * barNumber}px` }"
          :pitch="pitch"
          :range="range"
          @click="onAddNote"
        >
          <note-component
            v-for="note in getNotesByPitch(notes, pitch, range)"
            :key="note.id"
            :note="note"
            :beat-width="beatWidth"
          ></note-component>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Pitch, Range } from '@/utils/constants'
import NoteComponent from '@/components/note.vue'
import { ALLPITCHES, ALLRANGES, isBlackKey } from '@/utils/constants'
import { Note, getNotesByPitch } from '@/utils/note'
import { Position } from '@/utils/position'

const notes = ref<Note[]>([])

const barNumber = ref(0)
const beatWidth = ref(24)

const tracks = ref<HTMLDivElement>()

// get init bar number
onMounted(() => {
  barNumber.value = Math.round(tracks.value!.clientWidth / beatWidth.value / 4)
})

const currentNoteLength = 4

// add note
const onAddNote = (e: MouseEvent) => {
  const pitch = (e.target as HTMLElement).getAttribute('pitch') as Pitch
  const range = Number((e.target as HTMLElement).getAttribute('range')) as Range
  const startPosition = new Position(Math.floor(e.offsetX / beatWidth.value))
  const endPosition = startPosition.getPositionAfterBeats(currentNoteLength)

  notes.value.push(new Note(startPosition, endPosition, pitch, range))
}

// TODO: zoom

// TODO: play

// TODO: auto complete
</script>

<style lang="less" scoped>
.midi-scroll {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: auto;

  .pitch {
    height: 24px;
    line-height: 24px;
    text-align: right;
    border: 1px solid @borderMedium;
    cursor: pointer;
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
