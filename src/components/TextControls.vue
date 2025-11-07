<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCollageStore } from '@/stores/collage'
import { useI18n } from 'vue-i18n'

const collage = useCollageStore()
const { t } = useI18n()

// System fonts
const systemFonts = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS'
]

// Custom fonts
interface FontFamily {
  name: string
  variants: string[]
  hasItalic?: boolean
  hasVariable?: boolean
}

const customFonts = ref<Record<string, FontFamily>>({})
const selectedFontFamily = ref<string>('Arial')
const selectedFontVariant = ref<string>('Regular')

// Load custom fonts
onMounted(async () => {
  try {
    const basePath = import.meta.env.BASE_URL || '/'
    const response = await fetch(basePath + 'fonts.json')
    const data = await response.json()
    customFonts.value = data
  } catch (error) {
    console.error('Failed to load custom fonts:', error)
  }
})

// All font families (system + custom)
const allFontFamilies = computed(() => {
  return [...systemFonts, ...Object.keys(customFonts.value).sort()]
})

// Available variants for selected family
const availableVariants = computed(() => {
  const family = customFonts.value[selectedFontFamily.value]
  return family?.variants || []
})

// Parse current font into family and variant
function parseFontFamily(fontString: string) {
  // Check if it's a system font
  if (systemFonts.includes(fontString)) {
    return { family: fontString, variant: 'Regular' }
  }

  // Parse custom font (e.g., "Switzer" or "Clash Display")
  const families = Object.keys(customFonts.value)
  for (const family of families) {
    if (fontString === family) {
      return { family, variant: 'Regular' }
    }
  }

  // Default
  return { family: 'Arial', variant: 'Regular' }
}

// Watch for selected text changes
function syncFontSelection() {
  if (!collage.selectedText) return
  const parsed = parseFontFamily(collage.selectedText.fontFamily)
  selectedFontFamily.value = parsed.family
  selectedFontVariant.value = parsed.variant
}

// Update font family
function updateFontFamily(family: string) {
  selectedFontFamily.value = family

  // If custom font, set to Regular variant with weight 400
  if (customFonts.value[family]) {
    selectedFontVariant.value = 'Regular'
    applyFont(family, 'Regular')
  } else {
    // System font
    applyFont(family, 'Regular')
  }
}

// Update font variant
function updateFontVariant(variant: string) {
  selectedFontVariant.value = variant
  applyFont(selectedFontFamily.value, variant)
}

// Apply font to text
async function applyFont(family: string, variant: string) {
  if (!collage.selectedText) return

  const weight = variantToWeight(variant)

  // Für Custom Fonts: Explizit die spezifische Font-Variante laden
  if (customFonts.value[family]) {
    try {
      console.log(`⏳ Loading font: ${weight} 48px "${family}"`)

      // Font Loading API: Lade die spezifische Variante
      await document.fonts.load(`${weight} 48px "${family}"`)

      console.log(`✅ Font loaded: ${family} ${variant} (${weight})`)
    } catch (error) {
      console.warn(`⚠️ Could not preload font ${family} ${variant}:`, error)
    }
  }

  collage.updateText(collage.selectedText.id, {
    fontFamily: family,
    fontWeight: weight
  })
}

// Map variant to CSS font-weight (numeric values 100-900)
function variantToWeight(variant: string): number {
  const lowerVariant = variant.toLowerCase()

  if (lowerVariant.includes('thin')) return 100
  if (lowerVariant.includes('extralight')) return 200
  if (lowerVariant.includes('light')) return 300
  if (lowerVariant.includes('medium')) return 500
  if (lowerVariant.includes('semibold')) return 600
  if (lowerVariant.includes('bold') && lowerVariant.includes('extra')) return 800
  if (lowerVariant.includes('bold')) return 700
  if (lowerVariant.includes('black')) return 900

  // Default to Regular (400)
  return 400
}

function updateTextContent(value: string) {
  if (!collage.selectedText) return
  collage.updateText(collage.selectedText.id, { text: value })
}

function updateFontSize(value: number) {
  if (!collage.selectedText) return
  collage.updateText(collage.selectedText.id, { fontSize: value })
}

function updateColor(value: string) {
  if (!collage.selectedText) return
  collage.updateText(collage.selectedText.id, { color: value })
}

function toggleFontWeight() {
  if (!collage.selectedText) return
  const currentWeight = typeof collage.selectedText.fontWeight === 'number'
    ? collage.selectedText.fontWeight
    : (collage.selectedText.fontWeight === 'bold' ? 700 : 400)
  const newWeight = currentWeight >= 700 ? 400 : 700
  collage.updateText(collage.selectedText.id, { fontWeight: newWeight })
}

function updateTextAlign(value: 'left' | 'center' | 'right') {
  if (!collage.selectedText) return
  collage.updateText(collage.selectedText.id, { textAlign: value })
}

function toggleShadow() {
  if (!collage.selectedText) return
  collage.updateText(collage.selectedText.id, {
    shadowEnabled: !collage.selectedText.shadowEnabled
  })
}

function updateShadowOffsetX(value: number) {
  if (!collage.selectedText) return
  collage.updateText(collage.selectedText.id, { shadowOffsetX: value })
}

function updateShadowOffsetY(value: number) {
  if (!collage.selectedText) return
  collage.updateText(collage.selectedText.id, { shadowOffsetY: value })
}

function updateShadowBlur(value: number) {
  if (!collage.selectedText) return
  collage.updateText(collage.selectedText.id, { shadowBlur: value })
}

function updateShadowColor(value: string) {
  if (!collage.selectedText) return
  collage.updateText(collage.selectedText.id, { shadowColor: value })
}

function deleteText() {
  if (!collage.selectedText) return
  collage.removeText(collage.selectedText.id)
}

// Sync font selection when text is selected
if (collage.selectedText) {
  syncFontSelection()
}
</script>

<template>
  <div class="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <h2 class="text-lg font-semibold mb-4">{{ t('text.title') }}</h2>

    <div v-if="!collage.selectedText" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
      {{ t('text.noSelection') }}
    </div>

    <div v-else class="space-y-4">
      <!-- Text Content -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('text.content') }}</label>
        <textarea
          :value="collage.selectedText.text"
          @input="updateTextContent(($event.target as HTMLTextAreaElement).value)"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 resize-none"
        />
      </div>

      <!-- Font Family -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('text.fontFamily') }}</label>
        <select
          v-model="selectedFontFamily"
          @change="updateFontFamily(selectedFontFamily)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
        >
          <optgroup label="System Fonts">
            <option v-for="font in systemFonts" :key="font" :value="font">
              {{ font }}
            </option>
          </optgroup>
          <optgroup label="Custom Fonts" v-if="Object.keys(customFonts).length > 0">
            <option v-for="family in Object.keys(customFonts).sort()" :key="family" :value="family">
              {{ family }}
            </option>
          </optgroup>
        </select>
      </div>

      <!-- Font Variant (only for custom fonts) -->
      <div v-if="customFonts[selectedFontFamily] && availableVariants.length > 0">
        <label class="block text-sm font-medium mb-2">{{ t('text.fontVariant') }}</label>
        <select
          v-model="selectedFontVariant"
          @change="updateFontVariant(selectedFontVariant)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
        >
          <option v-for="variant in availableVariants" :key="variant" :value="variant">
            {{ variant }}
          </option>
        </select>
      </div>

      <!-- Font Size -->
      <div>
        <label class="block text-sm font-medium mb-2">
          {{ t('text.fontSize') }}: {{ collage.selectedText.fontSize }}px
        </label>
        <input
          type="range"
          :value="collage.selectedText.fontSize"
          @input="updateFontSize(Number(($event.target as HTMLInputElement).value))"
          min="12"
          max="120"
          step="2"
          class="w-full"
        />
      </div>

      <!-- Font Weight & Align -->
      <div class="flex gap-2">
        <button
          @click="toggleFontWeight"
          :class="[
            'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            (typeof collage.selectedText.fontWeight === 'number'
              ? collage.selectedText.fontWeight >= 700
              : collage.selectedText.fontWeight === 'bold')
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700'
          ]"
        >
          <strong>B</strong>
        </button>

        <button
          @click="updateTextAlign('left')"
          :class="[
            'flex-1 px-3 py-2 rounded-md text-sm transition-colors',
            collage.selectedText.textAlign === 'left'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700'
          ]"
        >
          ←
        </button>

        <button
          @click="updateTextAlign('center')"
          :class="[
            'flex-1 px-3 py-2 rounded-md text-sm transition-colors',
            collage.selectedText.textAlign === 'center'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700'
          ]"
        >
          ↔
        </button>

        <button
          @click="updateTextAlign('right')"
          :class="[
            'flex-1 px-3 py-2 rounded-md text-sm transition-colors',
            collage.selectedText.textAlign === 'right'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700'
          ]"
        >
          →
        </button>
      </div>

      <!-- Text Color -->
      <div>
        <label class="block text-sm font-medium mb-2">{{ t('text.color') }}</label>
        <div class="flex gap-2">
          <input
            type="color"
            :value="collage.selectedText.color"
            @input="updateColor(($event.target as HTMLInputElement).value)"
            class="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
          <input
            type="text"
            :value="collage.selectedText.color"
            @input="updateColor(($event.target as HTMLInputElement).value)"
            placeholder="#000000"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm font-mono"
          />
        </div>
      </div>

      <!-- Shadow Controls -->
      <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium">{{ t('text.shadow') }}</label>
          <button
            @click="toggleShadow"
            :class="[
              'px-3 py-1 text-xs rounded-md font-medium transition-colors',
              collage.selectedText.shadowEnabled
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
            ]"
          >
            {{ collage.selectedText.shadowEnabled ? t('text.shadowOn') : t('text.shadowOff') }}
          </button>
        </div>

        <div v-if="collage.selectedText.shadowEnabled" class="space-y-3">
          <!-- Shadow X Offset -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('text.shadowOffsetX') }}: {{ collage.selectedText.shadowOffsetX }}px
            </label>
            <input
              type="range"
              :value="collage.selectedText.shadowOffsetX"
              @input="updateShadowOffsetX(Number(($event.target as HTMLInputElement).value))"
              min="-20"
              max="20"
              step="1"
              class="w-full"
            />
          </div>

          <!-- Shadow Y Offset -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('text.shadowOffsetY') }}: {{ collage.selectedText.shadowOffsetY }}px
            </label>
            <input
              type="range"
              :value="collage.selectedText.shadowOffsetY"
              @input="updateShadowOffsetY(Number(($event.target as HTMLInputElement).value))"
              min="-20"
              max="20"
              step="1"
              class="w-full"
            />
          </div>

          <!-- Shadow Blur -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('text.shadowBlur') }}: {{ collage.selectedText.shadowBlur }}px
            </label>
            <input
              type="range"
              :value="collage.selectedText.shadowBlur"
              @input="updateShadowBlur(Number(($event.target as HTMLInputElement).value))"
              min="0"
              max="30"
              step="1"
              class="w-full"
            />
          </div>

          <!-- Shadow Color -->
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {{ t('text.shadowColor') }}
            </label>
            <div class="flex gap-2">
              <input
                type="color"
                :value="collage.selectedText.shadowColor"
                @input="updateShadowColor(($event.target as HTMLInputElement).value)"
                class="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                :value="collage.selectedText.shadowColor"
                @input="updateShadowColor(($event.target as HTMLInputElement).value)"
                placeholder="#000000"
                class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Button -->
      <button
        @click="deleteText"
        class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
      >
        {{ t('text.delete') }}
      </button>
    </div>
  </div>
</template>
