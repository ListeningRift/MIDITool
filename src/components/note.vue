<template>
  <div
    class="note"
    :style="{ width: `${width}px`, left: `${left}px` }"
  >
    {{ props.note.pitch }}{{ props.note.range }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Note } from '@/utils/note'

const props = defineProps<{
  note: Note
  beatWidth: number
}>()

const width = computed(() => props.note.getWidth() * props.beatWidth)
const left = computed(() => props.note.start.beat * props.beatWidth)
</script>

<style lang="less" scoped>
.note {
  position: absolute;
  display: flex;
  align-items: center;
  padding: 0 4px;
  height: 100%;
  color: @textWhite;
  font-size: 12px;
  border-radius: 4px;
  background: @cardBlue;
  box-shadow: 2.8px 2.8px 2.2px rgba(0, 0, 0, -0.033), 6.7px 6.7px 5.3px rgba(0, 0, 0, -0.038), 12.5px 12.5px 10px rgba(0, 0, 0, -0.035),
    22.3px 22.3px 17.9px rgba(0, 0, 0, -0.026), 41.8px 41.8px 33.4px rgba(0, 0, 0, -0.005), 100px 100px 80px rgba(0, 0, 0, 0.07);
  cursor: move;
  user-select: none;
}
</style>
