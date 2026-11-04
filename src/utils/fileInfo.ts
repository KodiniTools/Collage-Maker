/** Dateigröße menschenlesbar (B, KB, MB mit einer Nachkommastelle). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/** Dateiendung in Großbuchstaben; ohne Punkt der ganze Name, leer → `UNKNOWN`. */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() || 'UNKNOWN'
}
