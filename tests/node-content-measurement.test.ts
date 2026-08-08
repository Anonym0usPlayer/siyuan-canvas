/* @vitest-environment jsdom */

import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MAX_NODE_HEIGHT,
  DEFAULT_MAX_NODE_WIDTH,
  DEFAULT_MIN_NODE_HEIGHT,
  DEFAULT_MIN_NODE_WIDTH,
  measureNodeContentSize,
} from '@/canvas/node-content-measurement'

describe('measureNodeContentSize', () => {
  it('returns current dimensions if node element is missing', () => {
    const result = measureNodeContentSize(null, 320, 180)
    expect(result).toEqual({ width: 320, height: 180 })
  })

  it('measures Mermaid SVG dimensions with viewBox', () => {
    const el = document.createElement('div')
    el.innerHTML = `
      <div class="file-card">
        <div class="file-card__document-preview">
          <div data-subtype="mermaid">
            <svg viewBox="0 0 500 250"></svg>
          </div>
        </div>
      </div>
    `
    const result = measureNodeContentSize(el, 320, 180)
    // svg width = 500 + paddingX (28) + safetyMargin (12) = 540
    // svg height = 250 + headerHeight (36) + paddingY (28) + safetyMargin (12) = 326
    expect(result.width).toBe(540)
    expect(result.height).toBe(326)
  })

  it('clamps Mermaid SVG dimensions within min and max boundaries', () => {
    const hugeEl = document.createElement('div')
    hugeEl.innerHTML = `
      <div class="file-card">
        <div class="file-card__document-preview">
          <div data-subtype="mermaid">
            <svg viewBox="0 0 2000 1500"></svg>
          </div>
        </div>
      </div>
    `
    const hugeResult = measureNodeContentSize(hugeEl, 320, 180)
    expect(hugeResult.width).toBe(DEFAULT_MAX_NODE_WIDTH)
    expect(hugeResult.height).toBe(DEFAULT_MAX_NODE_HEIGHT)

    const tinyEl = document.createElement('div')
    tinyEl.innerHTML = `
      <div class="file-card">
        <div class="file-card__document-preview">
          <div data-subtype="mermaid">
            <svg viewBox="0 0 50 30"></svg>
          </div>
        </div>
      </div>
    `
    const tinyResult = measureNodeContentSize(tinyEl, 320, 180)
    expect(tinyResult.width).toBe(DEFAULT_MIN_NODE_WIDTH)
    expect(tinyResult.height).toBe(DEFAULT_MIN_NODE_HEIGHT)
  })

  it('provides comfortable default dimensions for ECharts charts', () => {
    const el = document.createElement('div')
    el.innerHTML = `
      <div class="file-card">
        <div class="file-card__document-preview">
          <div data-subtype="echarts">
            <div style="height: 320px;"></div>
          </div>
        </div>
      </div>
    `
    const result = measureNodeContentSize(el, 320, 180)
    // echarts default width: max(320, 560) = 560
    // echarts default height: max(180, 360) + headerHeight(36) = 396
    expect(result.width).toBe(560)
    expect(result.height).toBe(396)
  })

  it('measures general markdown preview scroll dimensions', () => {
    const el = document.createElement('div')
    el.innerHTML = `
      <div class="file-card">
        <div class="file-card__document-preview" style="display: block;">
          <p>Sample paragraph</p>
        </div>
      </div>
    `
    const preview = el.querySelector('.file-card__document-preview') as HTMLElement
    Object.defineProperty(preview, 'scrollWidth', { value: 450, configurable: true })
    Object.defineProperty(preview, 'scrollHeight', { value: 220, configurable: true })

    const result = measureNodeContentSize(el, 320, 180)
    expect(result.width).toBe(450 + 28 + 12)
    expect(result.height).toBe(220 + 36 + 28 + 12)
  })
})
