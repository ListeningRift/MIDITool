<template>
  <div class="midi-tool">
    <div class="midi-tool-header">
      <menubar :model="items" />
      <input
        ref="importMIDIRef"
        type="file"
        accept=".mid"
        style="display: none"
        @change="handleImportMIDI"
      />
    </div>
    <div class="midi-tool-body">
      <div class="midi-suggestion-list">
        <div class="no-suggestion">暂无数据</div>
      </div>
      <div class="midi-tool-editor">
        <midi-editor v-model:notes="notes"></midi-editor>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Menubar from 'primevue/menubar'
import { Midi } from '@tonejs/midi'
import { Time } from 'tone'
import type { Octave, Pitch } from '@/utils/constants'
import midiEditor from '@/components/midiEditor.vue'
import { fileToArrayBuffer } from '@/utils/utils'
import { Note } from '@/utils/note'
import { Position } from '@/utils/position'

const notes = ref<Note[]>([])

/**
 * Menu
 */

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

const items = ref([
  {
    label: 'Files',
    icon: 'pi pi-file',
    items: [
      {
        label: 'import MIDI',
        command: importMIDI
      },
      {
        label: 'export MIDI',
        command: exportMIDI
      }
    ]
  }
])
</script>

<style lang="less" scoped>
.midi-tool {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .midi-tool-body {
    display: flex;
    height: 0;
    flex-grow: 1;

    .midi-suggestion-list {
      width: 160px;
      height: 100%;
      border-right: 1px solid @borderMedium;

      .no-suggestion {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: @textDescriptive;
      }
    }

    .midi-tool-editor {
      width: 0;
      flex-grow: 1;
    }
  }
}
</style>
