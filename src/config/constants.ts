// Canvas interaction
export const SNAP_THRESHOLD = 8 // px — smart guide snap distance

// History
export const MAX_HISTORY_SIZE = 50 // max undo/redo snapshots
export const UNDO_DEBOUNCE_MS = 800 // ms — min interval between snapshots

// Auto-save
export const AUTOSAVE_DEBOUNCE_MS = 2000 // ms — delay before writing to localStorage
export const AUTOSAVE_MAX_IMAGE_PX = 400 // px — max thumbnail dimension for auto-save
export const AUTOSAVE_JPEG_QUALITY = 0.6 // 0–1

// Image compression (upload)
export const COMPRESS_MAX_DIMENSION_PX = 2000 // px — max width/height after compression
export const COMPRESS_JPEG_QUALITY = 0.85 // 0–1
