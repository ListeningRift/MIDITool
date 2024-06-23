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
    <div class="notes">
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
        ></div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { ref } from 'vue'
import { ALLPITCHES, ALLRANGES, isBlackKey } from '@/utils/constants'

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
    border: 1px solid @borderBase;

    &:not(:first-child) {
      border-top: none;
    }
  }

  .keyboard {
    width: 88px;

    .pitch {
      padding-right: 4px;
      font-size: 12px;
    }

    .pitch.white-key {
      color: @textBase;
      background: linear-gradient(to right, #bcc0c7, #e9edf4);
    }

    .pitch.black-key {
      color: #d5d6d7;
      background: linear-gradient(to right, #313234, #404142);
    }
  }

  .notes {
    width: 0;
    flex-grow: 1;
  }
}
</style>
