/* @vitest-environment jsdom */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { createCanvasEditorNodeActivationActions } from '@/canvas/use-canvas-editor-node-activation'

describe('canvas editor node activation', () => {
  const originalRequire = (window as any).require

  beforeEach(() => {
    delete (window as any).require
    window.open = vi.fn()
  })

  afterEach(() => {
    (window as any).require = originalRequire
  })

  it('opens external file when resolved.kind is file', async () => {
    const mockOpenPath = vi.fn(async () => '')
    ;(window as any).require = vi.fn((mod: string) => {
      if (mod === 'electron') {
        return { shell: { openPath: mockOpenPath } }
      }
      return null
    })

    const actions = createCanvasEditorNodeActivationActions({
      ensureCanvasPath: (p: string) => p,
      getResolvedFileNode: (node: any) => ({
        detail: node.file,
        kind: 'file',
        path: node.file,
        title: 'Report PDF',
      }),
      openDocumentByBlockId: vi.fn(async () => {}),
      plugin: {} as any,
      t: (k: string) => k,
    })

    const fileNode = {
      height: 160,
      id: 'file-123',
      type: 'file' as const,
      width: 320,
      x: 100,
      y: 100,
      file: 'C:\\Users\\Admin\\Desktop\\report.pdf',
    }

    actions.activateNode(fileNode)

    // Wait a tick for async openExternalFile
    await new Promise((r) => setTimeout(r, 10))

    expect(mockOpenPath).toHaveBeenCalledWith('C:\\Users\\Admin\\Desktop\\report.pdf')
  })

  it('opens canvas tab when resolved.kind is canvas', () => {
    const openCanvasTab = vi.fn(async () => {})
    const actions = createCanvasEditorNodeActivationActions({
      ensureCanvasPath: (p: string) => `data/plugins/siyuan-canvas/${p}`,
      getResolvedFileNode: (node: any) => ({
        detail: node.file,
        kind: 'canvas',
        path: node.file,
        title: 'Nested Canvas',
      }),
      openDocumentByBlockId: vi.fn(async () => {}),
      plugin: { openCanvasTab } as any,
      t: (k: string) => k,
    })

    const canvasNode = {
      height: 240,
      id: 'file-456',
      type: 'file' as const,
      width: 360,
      x: 100,
      y: 100,
      file: 'nested.canvas',
    }

    actions.activateNode(canvasNode)

    expect(openCanvasTab).toHaveBeenCalledWith({ path: 'data/plugins/siyuan-canvas/nested.canvas' })
  })
})
