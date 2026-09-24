import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Der PayPal-Spendenbutton wurde bewusst entfernt und soll nicht zurückkehren.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'tests' ? [] : sourceFiles(path)
    return /\.(vue|ts|json|html)$/.test(name) ? [path] : []
  })
}

describe('Spendenbutton entfernt', () => {
  it('kein PayPal-/Spenden-Code in src und index.html', () => {
    const files = [...sourceFiles('src'), 'index.html']
    const hits = files.filter((f) => /paypal|hosted_button_id/i.test(readFileSync(f, 'utf8')))
    expect(hits).toEqual([])
  })
})
