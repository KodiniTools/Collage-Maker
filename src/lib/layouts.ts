import type { CollageImage, LayoutType } from '@/types'

export function fitImage(
  img: { x: number; y: number; width: number; height: number; rotation: number },
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  padding = 5
): void {
  const aspectRatio = img.width / img.height
  const availableWidth = cellWidth - padding * 2
  const availableHeight = cellHeight - padding * 2

  let newWidth: number
  let newHeight: number

  if (availableWidth / availableHeight > aspectRatio) {
    // Zelle ist breiter als Bild - Höhe bestimmt
    newHeight = availableHeight
    newWidth = availableHeight * aspectRatio
  } else {
    // Zelle ist höher als Bild - Breite bestimmt
    newWidth = availableWidth
    newHeight = availableWidth / aspectRatio
  }

  // Bild in der Zelle zentrieren
  const offsetX = (cellWidth - newWidth) / 2
  const offsetY = (cellHeight - newHeight) / 2

  img.x = cellX + offsetX
  img.y = cellY + offsetY
  img.width = newWidth
  img.height = newHeight
  img.rotation = 0
}

export function computeLayout(
  layout: LayoutType,
  images: CollageImage[],
  canvasWidth: number,
  canvasHeight: number
): void {
  const w = canvasWidth
  const h = canvasHeight

  // Grid-basierte Layouts (bestehend)
  if (layout === 'grid-2x2' || layout === 'grid-3x3' || layout === 'grid-2x3') {
    const cols = layout === 'grid-2x2' ? 2 : layout === 'grid-3x3' ? 3 : 2
    const rows = layout === 'grid-2x2' ? 2 : layout === 'grid-3x3' ? 3 : 3

    const cellWidth = w / cols
    const cellHeight = h / rows

    images.forEach((img, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      fitImage(img, col * cellWidth, row * cellHeight, cellWidth, cellHeight)
    })
  }
  // Magazin-Layout: Großes Bild links, kleinere rechts gestapelt
  else if (layout === 'magazine') {
    const rightImages = images.length - 1
    const rightRows = Math.max(rightImages, 1)

    images.forEach((img, index) => {
      if (index === 0) {
        // Großes Hauptbild links (2/3 Breite, volle Höhe)
        fitImage(img, 0, 0, w * 0.65, h)
      } else {
        // Bilder rechts gleichmäßig vertikal verteilen
        const rightIndex = index - 1
        const rowHeight = h / rightRows
        fitImage(img, w * 0.65, rightIndex * rowHeight, w * 0.35, rowHeight)
      }
    })
  }
  // Spotlight-Layout: Ein großes Bild oben, 3 kleinere unten
  else if (layout === 'spotlight') {
    images.forEach((img, index) => {
      if (index === 0) {
        // Großes Spotlight-Bild oben (70% Höhe)
        fitImage(img, 0, 0, w, h * 0.7)
      } else if (index >= 1 && index <= 3) {
        // 3 kleinere Bilder unten nebeneinander
        const col = index - 1
        fitImage(img, (w / 3) * col, h * 0.7, w / 3, h * 0.3)
      } else {
        // Weitere Bilder in zweiter Reihe unten
        const col = (index - 4) % 3
        fitImage(img, (w / 3) * col, h * 0.85, w / 3, h * 0.15)
      }
    })
  }
  // Hero-Layout: Großes Bild oben, kleinere unten in einer Reihe
  else if (layout === 'hero') {
    images.forEach((img, index) => {
      if (index === 0) {
        // Hero-Bild oben (60% Höhe)
        fitImage(img, 0, 0, w, h * 0.6)
      } else {
        // Kleinere Bilder unten nebeneinander
        const cols = Math.max(images.length - 1, 1)
        const col = index - 1
        fitImage(img, (w / cols) * col, h * 0.6, w / cols, h * 0.4)
      }
    })
  }
  // Sidebar-Layout: Schmale Sidebar links, großer Bereich rechts
  else if (layout === 'sidebar') {
    const sidebarWidth = w * 0.25
    const mainWidth = w * 0.75
    const sidebarCount = Math.min(images.length, 3)
    const mainCount = Math.max(images.length - 3, 0)

    images.forEach((img, index) => {
      if (index < sidebarCount) {
        // Sidebar-Bilder links (gleichmäßig verteilt)
        const sidebarRows = sidebarCount
        fitImage(img, 0, (h / sidebarRows) * index, sidebarWidth, h / sidebarRows)
      } else if (mainCount === 1) {
        // Ein großes Bild rechts
        fitImage(img, sidebarWidth, 0, mainWidth, h)
      } else {
        // Mehrere Bilder rechts in einem Grid
        const rightIndex = index - sidebarCount
        const cols = mainCount <= 2 ? 1 : 2
        const rows = Math.ceil(mainCount / cols)
        const col = rightIndex % cols
        const row = Math.floor(rightIndex / cols)
        fitImage(
          img,
          sidebarWidth + (mainWidth / cols) * col,
          (h / rows) * row,
          mainWidth / cols,
          h / rows
        )
      }
    })
  }
  // Mosaic-Layout: Verschiedene Größen in Mosaic-Anordnung
  else if (layout === 'mosaic') {
    const positions = [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.25, h: 0.33 },
      { x: 0.75, y: 0, w: 0.25, h: 0.33 },
      { x: 0.5, y: 0.33, w: 0.5, h: 0.34 },
      { x: 0, y: 0.5, w: 0.33, h: 0.5 },
      { x: 0.33, y: 0.5, w: 0.34, h: 0.5 },
      { x: 0.67, y: 0.67, w: 0.33, h: 0.33 },
    ]

    images.forEach((img, index) => {
      const pos = positions[index % positions.length]
      fitImage(img, w * pos.x, h * pos.y, w * pos.w, h * pos.h)
    })
  }
  // Diagonal-Layout: Bilder diagonal angeordnet
  else if (layout === 'diagonal') {
    const imgSize = Math.min(w, h) * 0.4

    images.forEach((img, index) => {
      if (index < 4) {
        const offsetX = (w - imgSize) * (index / 3)
        const offsetY = (h - imgSize) * (index / 3)
        fitImage(img, offsetX, offsetY, imgSize, imgSize)
      } else {
        // Weitere Bilder in Ecken
        const corner = (index - 4) % 4
        const x = corner % 2 === 0 ? 0 : w - imgSize / 2
        const y = corner < 2 ? 0 : h - imgSize / 2
        fitImage(img, x, y, imgSize / 2, imgSize / 2)
      }
    })
  }
  // Panorama-Layout: Breites Bild oben, kleinere Bilder darunter in einer Reihe
  else if (layout === 'panorama') {
    const topHeight = h * 0.55
    const bottomHeight = h * 0.45
    const bottomCount = Math.max(images.length - 1, 1)

    images.forEach((img, index) => {
      if (index === 0) {
        // Großes Panoramabild oben
        fitImage(img, 0, 0, w, topHeight)
      } else {
        // Bilder unten in einer Reihe
        const col = index - 1
        const colWidth = w / bottomCount
        fitImage(img, colWidth * col, topHeight, colWidth, bottomHeight)
      }
    })
  }
  // Focus-Layout: Großes zentrales Bild, kleinere drumherum
  else if (layout === 'focus') {
    const centerSize = Math.min(w, h) * 0.55
    const centerX = (w - centerSize) / 2
    const centerY = (h - centerSize) / 2
    const cornerSize = Math.min(w, h) * 0.25

    images.forEach((img, index) => {
      if (index === 0) {
        // Großes zentriertes Hauptbild
        fitImage(img, centerX, centerY, centerSize, centerSize)
      } else {
        // Kleinere Bilder in den Ecken und an den Seiten
        const positions = [
          { x: 0, y: 0 }, // Oben links
          { x: w - cornerSize, y: 0 }, // Oben rechts
          { x: 0, y: h - cornerSize }, // Unten links
          { x: w - cornerSize, y: h - cornerSize }, // Unten rechts
          { x: (w - cornerSize) / 2, y: 0 }, // Oben mitte
          { x: (w - cornerSize) / 2, y: h - cornerSize }, // Unten mitte
          { x: 0, y: (h - cornerSize) / 2 }, // Links mitte
          { x: w - cornerSize, y: (h - cornerSize) / 2 }, // Rechts mitte
        ]
        const pos = positions[(index - 1) % positions.length]
        fitImage(img, pos.x, pos.y, cornerSize, cornerSize)
      }
    })
  }
  // Triptych-Layout: Drei Spalten, mittlere ist größer
  else if (layout === 'triptych') {
    const sideWidth = w * 0.25
    const centerWidth = w * 0.5

    images.forEach((img, index) => {
      if (index === 0) {
        // Großes mittleres Bild
        fitImage(img, sideWidth, 0, centerWidth, h)
      } else if (index === 1) {
        // Linkes Bild
        fitImage(img, 0, 0, sideWidth, h)
      } else if (index === 2) {
        // Rechtes Bild
        fitImage(img, sideWidth + centerWidth, 0, sideWidth, h)
      } else {
        // Weitere Bilder: verteile auf linke und rechte Spalte
        const sideIndex = index - 3
        const isLeft = sideIndex % 2 === 0
        const rowIndex = Math.floor(sideIndex / 2)
        const rowsPerSide = Math.ceil((images.length - 3) / 2)
        const rowHeight = h / Math.max(rowsPerSide, 1)

        if (isLeft) {
          fitImage(img, 0, rowHeight * rowIndex, sideWidth, rowHeight)
        } else {
          fitImage(img, sideWidth + centerWidth, rowHeight * rowIndex, sideWidth, rowHeight)
        }
      }
    })
  }
  // Masonry-Layout: Pinterest-ähnlich mit variablen Höhen
  else if (layout === 'masonry') {
    const cols = 3
    const colWidth = w / cols
    const colHeights = [0, 0, 0] // Track der Höhe jeder Spalte

    // Vordefinierte Höhenvariationen für visuelles Interesse
    const heightVariations = [0.35, 0.45, 0.4, 0.5, 0.35, 0.45, 0.4, 0.3, 0.45]

    images.forEach((img, index) => {
      // Finde die kürzeste Spalte
      const minHeight = Math.min(...colHeights)
      const col = colHeights.indexOf(minHeight)

      // Berechne die Höhe für dieses Bild
      const cellHeight = h * heightVariations[index % heightVariations.length]

      fitImage(img, col * colWidth, colHeights[col], colWidth, cellHeight)

      // Update Spalten-Höhe
      colHeights[col] += cellHeight
    })
  }
}
