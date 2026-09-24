import type { CollageContext } from './context'

// Ungültige Zielgrößen ignorieren (z. B. leeres/„0"-Eingabefeld),
// sonst würden Inhalte auf 0 kollabieren.
function isValidCanvasSize(width: number, height: number): boolean {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
}

/** Leinwandgröße ändern – mit proportionaler oder zentrierter Anpassung der Inhalte. */
export function useCanvasResize(ctx: CollageContext) {
  const { images, texts, settings } = ctx

  // Canvasgröße ändern und dabei die platzierten Bilder UND Texte proportional
  // mitskalieren (Option "Inhalte mitskalieren"). Galerie-Templates bleiben
  // unberührt (sie liegen nicht auf dem Canvas).
  function resizeCanvas(newWidth: number, newHeight: number) {
    if (!isValidCanvasSize(newWidth, newHeight)) return

    const oldWidth = settings.value.width
    const oldHeight = settings.value.height

    if (oldWidth > 0 && oldHeight > 0) {
      const ratioX = newWidth / oldWidth
      const ratioY = newHeight / oldHeight

      if (ratioX !== 1 || ratioY !== 1) {
        images.value.forEach((img) => {
          if (img.isGalleryTemplate === true) return
          img.x *= ratioX
          img.y *= ratioY
          img.width *= ratioX
          img.height *= ratioY
        })

        // Schriftgröße über das geometrische Mittel skalieren: identisch zur
        // Breiten-/Höhenskalierung bei gleichmäßigem Resize und exakt
        // teleskopierend über Zwischenschritte (fontSize bleibt Float).
        const fontRatio = Math.sqrt(ratioX * ratioY)
        texts.value.forEach((txt) => {
          txt.x *= ratioX
          txt.y *= ratioY
          txt.fontSize *= fontRatio
        })
      }
    }

    settings.value.width = newWidth
    settings.value.height = newHeight
  }

  // Canvasgröße ändern und dabei die gesamte Komposition (alle Canvas-Bilder
  // UND Texte) als EINEN Block behandeln: Sie wird mit EINEM einheitlichen
  // Faktor skaliert (Seitenverhältnisse bleiben erhalten → keine Verzerrung)
  // und anschließend im Canvas zentriert. Verwendet, wenn "Inhalte
  // mitskalieren" AUS ist.
  //
  // Dadurch bleiben beim Verkleinern (v. a. der Höhe) alle Bilder im Sichtfeld,
  // die Ränder wirken auf allen vier Seiten ausgewogen (oben=unten, links=
  // rechts) und schrumpfen mit. Galerie-Templates bleiben unberührt.
  //
  // Skalierungsfaktor = Änderung der tatsächlich geänderten Achse (bei reiner
  // Höhenänderung ratioY, bei reiner Breitenänderung ratioX). So passt der
  // Inhalt exakt auf die geänderte Achse und die Operation ist umkehrbar
  // (Slider runter + rauf ⇒ wieder Ausgangszustand). Ändern sich beide Achsen
  // gleichzeitig ungleichmäßig, dient das geometrische Mittel als Kompromiss.
  function repositionContent(newWidth: number, newHeight: number) {
    if (!isValidCanvasSize(newWidth, newHeight)) return

    const oldWidth = settings.value.width
    const oldHeight = settings.value.height

    if (oldWidth > 0 && oldHeight > 0) {
      const ratioX = newWidth / oldWidth
      const ratioY = newHeight / oldHeight

      if (ratioX !== 1 || ratioY !== 1) {
        // Einheitlicher Skalierungsfaktor (verzerrungsfrei).
        let scale: number
        if (ratioX === 1) scale = ratioY
        else if (ratioY === 1) scale = ratioX
        else scale = Math.sqrt(ratioX * ratioY)

        // Bounding-Box der Komposition bestimmen (Bilder mit ihrer Fläche,
        // Texte als Punkt – sie haben im Modell keine Ausdehnung). Galerie-
        // Templates zählen nicht zur Canvas-Komposition.
        const contentImages = images.value.filter((img) => img.isGalleryTemplate !== true)

        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        contentImages.forEach((img) => {
          minX = Math.min(minX, img.x)
          minY = Math.min(minY, img.y)
          maxX = Math.max(maxX, img.x + img.width)
          maxY = Math.max(maxY, img.y + img.height)
        })
        texts.value.forEach((txt) => {
          minX = Math.min(minX, txt.x)
          minY = Math.min(minY, txt.y)
          maxX = Math.max(maxX, txt.x)
          maxY = Math.max(maxY, txt.y)
        })

        // Nur transformieren, wenn es überhaupt Inhalt gibt.
        if (Number.isFinite(minX) && Number.isFinite(minY)) {
          const bboxCenterX = (minX + maxX) / 2
          const bboxCenterY = (minY + maxY) / 2
          const targetCenterX = newWidth / 2
          const targetCenterY = newHeight / 2

          // Jeden Punkt um das Bounding-Box-Zentrum skalieren und das Zentrum
          // auf die Canvas-Mitte legen (zentrieren).
          contentImages.forEach((img) => {
            const cx = img.x + img.width / 2
            const cy = img.y + img.height / 2
            const newCx = targetCenterX + (cx - bboxCenterX) * scale
            const newCy = targetCenterY + (cy - bboxCenterY) * scale
            img.width *= scale
            img.height *= scale
            img.x = newCx - img.width / 2
            img.y = newCy - img.height / 2
          })

          texts.value.forEach((txt) => {
            txt.x = targetCenterX + (txt.x - bboxCenterX) * scale
            txt.y = targetCenterY + (txt.y - bboxCenterY) * scale
            txt.fontSize *= scale
          })
        }
      }
    }

    settings.value.width = newWidth
    settings.value.height = newHeight
  }

  return { resizeCanvas, repositionContent }
}
