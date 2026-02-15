/**
 * Compresses an image file by resizing it to a maximum dimension
 * while maintaining aspect ratio and quality.
 */

const MAX_DIMENSION = 2000 // Maximum width or height in pixels
const QUALITY = 0.85 // JPEG/WebP quality (0-1)

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
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        // Image is small enough, but still compress if file is large
        if (file.size < 5 * 1024 * 1024) {
          // Create in-memory copy to avoid ERR_UPLOAD_FILE_CHANGED
          file.arrayBuffer().then(buffer => {
            resolve(new File([buffer], file.name, { type: file.type, lastModified: file.lastModified }))
          }).catch(() => resolve(file))
          return
        }
      }

      // Calculate new dimensions
      let newWidth = width
      let newHeight = height

      if (width > height && width > MAX_DIMENSION) {
        newWidth = MAX_DIMENSION
        newHeight = Math.round((height / width) * MAX_DIMENSION)
      } else if (height > MAX_DIMENSION) {
        newHeight = MAX_DIMENSION
        newWidth = Math.round((width / height) * MAX_DIMENSION)
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
      const quality = file.type === 'image/png' ? undefined : QUALITY

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }

          // Create new file with same name
          const compressedFile = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now()
          })

          // Only use compressed version if it's actually smaller
          if (compressedFile.size < file.size) {
            resolve(compressedFile)
          } else {
            // Create in-memory copy to avoid ERR_UPLOAD_FILE_CHANGED
            file.arrayBuffer().then(buffer => {
              resolve(new File([buffer], file.name, { type: file.type, lastModified: file.lastModified }))
            }).catch(() => resolve(file))
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
  const compressed = await Promise.all(
    files.map(file => compressImage(file).catch(() => file))
  )
  return compressed
}
