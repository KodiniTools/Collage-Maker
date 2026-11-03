import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ControlSlider from '../ControlSlider.vue'

/**
 * Vertrag von ControlSlider (Props/Emits), unabhängig vom inneren Aufbau.
 * Die Aufrufer hängen ihre Undo-Logik an `input` (live) und `reset`.
 */
function mountSlider(props: Record<string, unknown> = {}) {
  return mount(ControlSlider, {
    props: {
      label: 'Helligkeit',
      displayValue: '100%',
      value: 100,
      min: 0,
      max: 200,
      step: 1,
      ...props,
    },
  })
}

function setInput(el: HTMLInputElement, value: string) {
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('ControlSlider', () => {
  it('zeigt Label und formatierten Wert in der Kopfzeile', () => {
    const w = mountSlider()
    expect(w.get('label').text()).toBe('Helligkeit: 100%')
  })

  it('meldet Reglerbewegungen live als Zahl über input', () => {
    const w = mountSlider()
    setInput(w.get<HTMLInputElement>('input[type="range"]').element, '120')
    setInput(w.get<HTMLInputElement>('input[type="range"]').element, '130')
    expect(w.emitted('input')).toEqual([[120], [130]])
  })

  it('Zahlenfeld: übernimmt Zahlen, begrenzt auf [min,max] und ignoriert Zwischenstände', () => {
    const w = mountSlider()
    const num = w.get<HTMLInputElement>('input[type="number"]').element
    setInput(num, '')
    setInput(num, '-')
    expect(w.emitted('input')).toBeUndefined()
    setInput(num, '45')
    setInput(num, '500')
    expect(w.emitted('input')).toEqual([[45], [200]])
  })

  it('Zahlenfeld zeigt den aktuellen Wert und folgt Prop-Änderungen', async () => {
    const w = mountSlider({ value: 0.5, step: 0.05, min: 0, max: 1 })
    const num = w.get<HTMLInputElement>('input[type="number"]').element
    expect(Number(num.value)).toBe(0.5)
    await w.setProps({ value: 0.75 })
    expect(Number(num.value)).toBe(0.75)
  })

  it('Zurücksetzen nur mit showReset; Klick meldet reset', async () => {
    const without = mountSlider()
    expect(without.find('button').exists()).toBe(false)

    const w = mountSlider({ showReset: true, resetTitle: 'Wert zurücksetzen' })
    const button = w.get('button[aria-label="Wert zurücksetzen"]')
    await button.trigger('click')
    expect(w.emitted('reset')).toHaveLength(1)
  })

  it('Regler und Zahlenfeld tragen das Label als zugänglichen Namen', () => {
    const w = mountSlider()
    expect(w.get('input[type="number"]').attributes('aria-label')).toContain('Helligkeit')
  })
})
