import { COMPRESS_MAX_DIMENSION_PX, COMPRESS_JPEG_QUALITY } from '@/config/constants'

export async function compressImage(file: File): Promise<File> {
  // For small files (under 2MB), create an in-memory copy to avoid ERR_UPLOAD_FILE_CHANGED.
  // Blob URLs from disk-referenced File objects can break if the file changes on disk.
  if (file.size < 2 * 1024 * 1024) {
    const buffer = await file.arrayBuffer()
    return new File([buffer], file.name, { type: file.type, lastModified: file.lastModified })
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Check if resizing is needed
      const { width, height } = img
      if (width <= COMPRESS_MAX_DIMENSION_PX && height <= COMPRESS_MAX_DIMENSION_PX) {
        // Image is small enough, but still compress if file is large
        if (file.size < 5 * 1024 * 1024) {
          // Create in-memory copy to avoid ERR_UPLOAD_FILE_CHANGED
          file
            .arrayBuffer()
            .then((buffer) => {
              resolve(
                new File([buffer], file.name, { type: file.type, lastModified: file.lastModified })
              )
            })
            .catch(() => resolve(file))
          return
        }
      }

      // Calculate new dimensions
      let newWidth = width
      let newHeight = height

      if (width > height && width > COMPRESS_MAX_DIMENSION_PX) {
        newWidth = COMPRESS_MAX_DIMENSION_PX
        newHeight = Math.round((height / width) * COMPRESS_MAX_DIMENSION_PX)
      } else if (height > COMPRESS_MAX_DIMENSION_PX) {
        newHeight = COMPRESS_MAX_DIMENSION_PX
        newWidth = Math.round((width / height) * COMPRESS_MAX_DIMENSION_PX)
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas')
      canvas.width = newWidth
      canvas.height = newHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      // Use better image smoothing for quality
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      // Convert to blob
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const quality = file.type === 'image/png' ? undefined : COMPRESS_JPEG_QUALITY

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }

          // Create new file with same name
          const compressedFile = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now(),
          })

          // Only use compressed version if it's actually smaller
          if (compressedFile.size < file.size) {
            resolve(compressedFile)
          } else {
            // Create in-memory copy to avoid ERR_UPLOAD_FILE_CHANGED
            file
              .arrayBuffer()
              .then((buffer) => {
                resolve(
                  new File([buffer], file.name, {
                    type: file.type,
                    lastModified: file.lastModified,
                  })
                )
              })
              .catch(() => resolve(file))
          }
        },
        mimeType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

export async function compressImages(files: File[]): Promise<File[]> {
  const compressed = await Promise.all(files.map((file) => compressImage(file).catch(() => file)))
  return compressed
}

/**
 * Übernimmt die Dateien in Originalauflösung/-qualität (keine Skalierung, keine
 * Re-Kodierung). Es wird lediglich eine In-Memory-Kopie erstellt, um
 * ERR_UPLOAD_FILE_CHANGED zu vermeiden (Blob-URLs auf Disk-Dateien können brechen,
 * wenn sich die Datei ändert).
 */
export async function copyImagesInMemory(files: File[]): Promise<File[]> {
  return Promise.all(
    files.map(async (file) => {
      try {
        const buffer = await file.arrayBuffer()
        return new File([buffer], file.name, { type: file.type, lastModified: file.lastModified })
      } catch {
        return file
      }
    })
  )
}
