// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderMermaidBlocksDirectly, triggerNativeProtyleRender, unescapeHtmlEntities } from '@/canvas/protyle-native-render'

describe('protyle-native-render', () => {
  const envGlobal = (typeof globalThis !== 'undefined' ? globalThis : global) as any

  beforeEach(() => {
    if (!envGlobal.window) {
      envGlobal.window = envGlobal
    }
    delete envGlobal.window.Protyle
    delete envGlobal.window.siyuan
    delete envGlobal.window.mermaid
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should correctly unescape HTML entities in data-content', () => {
    const raw = 'graph TD&#10;    A[开始] --&gt; B{判断条件}&#10;    B --&gt;|是| C[操作A]&amp;'
    const expected = 'graph TD\n    A[开始] --> B{判断条件}\n    B -->|是| C[操作A]&'
    expect(unescapeHtmlEntities(raw)).toBe(expected)
  })

  it('should safely do nothing when container is null or undefined', () => {
    expect(() => triggerNativeProtyleRender(null)).not.toThrow()
    expect(() => triggerNativeProtyleRender(undefined)).not.toThrow()
  })

  it('should trigger Protyle.mermaidRender when mermaid block is present', () => {
    const mermaidRender = vi.fn()
    envGlobal.window.Protyle = {
      mermaidRender,
    }

    const container = document.createElement('div')
    container.innerHTML = '<div data-type="NodeCodeBlock" class="render-node" data-subtype="mermaid" data-content="graph TD\n  A --> B"><div spin="1"></div></div>'

    triggerNativeProtyleRender(container)

    expect(mermaidRender).toHaveBeenCalledTimes(1)
    expect(mermaidRender).toHaveBeenCalledWith(container, 'stage/protyle')
  })

  it('should directly render SVG when window.mermaid is present and unescape content', async () => {
    const renderFn = vi.fn().mockResolvedValue({ svg: '<svg class="mermaid-svg"><text>Rendered Flowchart</text></svg>' })
    envGlobal.window.mermaid = {
      render: renderFn,
    }

    const container = document.createElement('div')
    container.innerHTML = '<div data-type="NodeCodeBlock" class="render-node" data-subtype="mermaid" data-content="graph TD&#10;  A[Start] --&gt; B[End]"><div spin="1"></div></div>'

    await renderMermaidBlocksDirectly(container)

    expect(renderFn).toHaveBeenCalledTimes(1)
    expect(renderFn.mock.calls[0]![1]).toBe('graph TD\n  A[Start] --> B[End]')
    expect(container.innerHTML).toContain('mermaid-svg')
    expect(container.querySelector('[data-subtype="mermaid"]')?.getAttribute('data-mermaid-rendered')).toBe('true')
  })

  it('should trigger Protyle.mathRender and flowchartRender when respective nodes exist', () => {
    const mathRender = vi.fn()
    const flowchartRender = vi.fn()
    envGlobal.window.Protyle = {
      mathRender,
      flowchartRender,
    }

    const container = document.createElement('div')
    container.innerHTML = `
      <div data-subtype="math"></div>
      <div data-subtype="flowchart"></div>
    `

    triggerNativeProtyleRender(container)

    expect(mathRender).toHaveBeenCalledWith(container, 'stage/protyle')
    expect(flowchartRender).toHaveBeenCalledWith(container, 'stage/protyle')
  })
})
