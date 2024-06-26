<template>
  <div
    ref="noteRef"
    class="note"
    :style="{ width: `${width}px`, height: `${props.pitchHeight}px`, top: `${top}px`, left: `${left}px`, 'z-index': props.note.start.beat }"
    :note="props.note.getPitchOctave()"
    @click.stop="onClick"
    @contextmenu.stop.prevent="onDelete"
  >
    {{ props.note.getPitchOctave() }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDraggable } from '@vueuse/core'
import type { Note } from '@/utils/note'
import type { Pitch, Octave } from '@/utils/constants'
import { ALL_PITCHES, ALL_OCTAVES } from '@/utils/constants'
import { Position, getBeatByOffset } from '@/utils/position'

const props = defineProps<{
  note: Note
  beatWidth: number
  pitchHeight: number
}>()

const emits = defineEmits<{
  (e: 'delete', note: Note): void
  (e: 'click', note: Note): void
  (e: 'widthChange', noteWidth: number): void
}>()

const width = computed(() => props.note.duration * props.beatWidth)
const left = computed(() => props.note.start.beat * props.beatWidth)
const top = computed(() => ((Math.max(...ALL_OCTAVES) - props.note.octave) * ALL_PITCHES.length + ALL_PITCHES.indexOf(props.note.pitch)) * props.pitchHeight)

const noteRef = ref<HTMLDivElement>()
onMounted(() => {
  const pitchEl = document.querySelector('.piano-roll .tracks .pitch')
  let resizeDirection: 'start' | 'end' | null = null
  let pointerOffset = 0
  useDraggable(noteRef, {
    onStart(position, event) {
      const noteRect = noteRef.value!.getBoundingClientRect()
      if (event.pageX - noteRect.x <= 4) {
        resizeDirection = 'start'
      } else if (noteRect.width + noteRect.x - event.pageX <= 4) {
        resizeDirection = 'end'
      } else {
        resizeDirection = null
      }
      pointerOffset = event.pageX - noteRect.x
    },
    onMove(position, event) {
      const targetEl = event.target as HTMLElement

      if (resizeDirection === 'start') {
        // resize start
        const startBeat = getBeatByOffset(event.pageX - pointerOffset - pitchEl!.getBoundingClientRect().x, props.beatWidth)
        const duration = props.note.start.beat + props.note.duration - startBeat
        props.note.duration > 0 &&
          props.note.update({
            start: new Position(startBeat),
            duration
          })
      } else if (resizeDirection === 'end') {
        // resize end
        const endBeat = getBeatByOffset(event.pageX - pitchEl!.getBoundingClientRect().x, props.beatWidth) + 1
        props.note.update({
          duration: endBeat - props.note.start.beat
        })
      } else {
        // drag
        const startBeat = getBeatByOffset(event.pageX - pointerOffset - pitchEl!.getBoundingClientRect().x, props.beatWidth)
        const pitch = targetEl.getAttribute('pitch') as Pitch
        const octave = Number(targetEl.getAttribute('octave')) as Octave
        props.note.update({
          start: new Position(startBeat),
          pitch,
          octave
        })
      }
    },
    onEnd() {
      resizeDirection = null
      pointerOffset = 0
    }
  })
})

watch(
  () => [props.note.start, props.note.duration],
  () => {
    emits('widthChange', props.note.duration)
  }
)

const onDelete = () => {
  emits('delete', props.note)
}

const onClick = () => {
  emits('click', props.note)
}
</script>

<style lang="less" scoped>
.note {
  position: absolute;
  display: flex;
  align-items: center;
  padding: 0 8px;
  color: @textWhite;
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  border-radius: 4px;
  border: 1px solid @cardBlue;
  background: @primary;
  box-shadow: 8px 2px 16px 4px rgba(0, 0, 0, 0.16), inset 8px 0px 12px 0px rgba(0, 0, 0, 0.16), inset -4px 0px 6px -3px rgba(0, 0, 0, 0.16);
  cursor: pointer;
  user-select: none;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    height: 100%;
    cursor: w-resize;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 4px;
    height: 100%;
    cursor: w-resize;
  }
}
</style>
