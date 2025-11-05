<script setup lang="ts">
import { computed } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()

const selectedText = computed(() => collage.selectedText)

const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS',
  'Palatino'
]

function addText() {
  collage.addText()
}

function updateTextContent(value: string) {
  if (collage.selectedTextId) {
    collage.updateText(collage.selectedTextId, { text: value })
  }
}

function updateFontSize(value: number) {
  if (collage.selectedTextId) {
    collage.updateText(collage.selectedTextId, { fontSize: value })
  }
}

function updateFontFamily(value: string) {
  if (collage.selectedTextId) {
    collage.updateText(collage.selectedTextId, { fontFamily: value })
  }
}

function updateColor(value: string) {
  if (collage.selectedTextId) {
    collage.updateText(collage.selectedTextId, { color: value })
  }
}

function updateRotation(value: number) {
  if (collage.selectedTextId) {
    collage.updateText(collage.selectedTextId, { rotation: value })
  }
}

function deleteText() {
  if (collage.selectedTextId) {
    collage.removeText(collage.selectedTextId)
  }
}

function bringToFront() {
  if (collage.selectedTextId && selectedText.value) {
    const maxZ = Math.max(
      ...collage.images.map(img => img.zIndex),
      ...collage.texts.map(txt => txt.zIndex),
      0
    )
    collage.updateText(collage.selectedTextId, { zIndex: maxZ + 1 })
  }
}

function sendToBack() {
  if (collage.selectedTextId && selectedText.value) {
    const minZ = Math.min(
      ...collage.images.map(img => img.zIndex),
      ...collage.texts.map(txt => txt.zIndex),
      0
    )
    collage.updateText(collage.selectedTextId, { zIndex: minZ - 1 })
  }
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <h3 class="text-lg font-semibold mb-4">{{ t('textControls.title') }}</h3>

    <!-- Button zum Hinzufügen von Text -->
    <button
      @click="addText"
      class="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium mb-4"
    >
      {{ t('textControls.addText') }}
    </button>

    <!-- Text-Bearbeitungsoptionen -->
    <div v-if="selectedText" class="space-y-4">
      <!-- Text-Inhalt -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('textControls.content') }}</label>
        <textarea
          :value="selectedText.text"
          @input="updateTextContent(($event.target as HTMLTextAreaElement).value)"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 resize-none"
        />
      </div>

      <!-- Schriftart -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('textControls.fontFamily') }}</label>
        <select
          :value="selectedText.fontFamily"
          @change="updateFontFamily(($event.target as HTMLSelectElement).value)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
        >
          <option v-for="font in fontFamilies" :key="font" :value="font">
            {{ font }}
          </option>
        </select>
      </div>

      <!-- Schriftgröße -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('textControls.fontSize') }}: {{ selectedText.fontSize }}px
        </label>
        <input
          type="range"
          :value="selectedText.fontSize"
          @input="updateFontSize(Number(($event.target as HTMLInputElement).value))"
          min="12"
          max="200"
          class="w-full"
        />
      </div>

      <!-- Textfarbe -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('textControls.color') }}</label>
        <div class="flex gap-2">
          <input
            type="color"
            :value="selectedText.color"
            @input="updateColor(($event.target as HTMLInputElement).value)"
            class="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            :value="selectedText.color"
            @input="updateColor(($event.target as HTMLInputElement).value)"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
          />
        </div>
      </div>

      <!-- Rotation Control -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('controls.rotate') }}: {{ Math.round(selectedText.rotation) }}°
        </label>
        <input
          type="range"
          :value="selectedText.rotation"
          @input="updateRotation(Number(($event.target as HTMLInputElement).value))"
          min="0"
          max="360"
          class="w-full"
        />
      </div>

      <!-- Z-Index Controls -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('textControls.layer') }}</label>
        <div class="flex gap-2">
          <button
            @click="bringToFront"
            class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
          >
            {{ t('textControls.toFront') }}
          </button>
          <button
            @click="sendToBack"
            class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
          >
            {{ t('textControls.toBack') }}
          </button>
        </div>
      </div>

      <!-- Delete Button -->
      <button
        @click="deleteText"
        class="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium"
      >
        {{ t('textControls.delete') }}
      </button>
    </div>

    <div v-else class="text-center text-gray-500 dark:text-gray-400 py-8">
      {{ t('textControls.noSelection') }}
    </div>
  </div>
</template>
