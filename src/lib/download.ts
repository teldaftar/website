/**
 * Save a blob the API returned as a file download. Uses a throwaway object URL
 * + anchor click — the one pattern that works across desktop and mobile
 * browsers without opening a blank tab.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoking immediately cancels the download in Safari — give it a moment.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
