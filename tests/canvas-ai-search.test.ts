import { describe, expect, it, vi } from 'vitest'
import { collectUpstreamContext } from '@/canvas/ai-search-helper'
import type { CanvasNode, CanvasEdge } from '@/canvas/types'

// Mock Siyuan kernel API requests since we run unit tests in a Node environment without kernel active
vi.mock('@/canvas/siyuan-kernel-file-node-lookups', () => ({
  findSiyuanAssetByPath: vi.fn(),
  findSiyuanBlockById: vi.fn(),
  findSiyuanDocumentByBlockId: vi.fn(),
  findSiyuanDocumentByPath: vi.fn(),
  findSiyuanImageAssetByBlockId: vi.fn(),
  getSiyuanBlockMarkdown: vi.fn(() => Promise.resolve('Mock Block Content')),
  getSiyuanHeadingBlockMarkdown: vi.fn(() => Promise.resolve('Mock Heading Content')),
  getSiyuanDocumentMarkdown: vi.fn(() => Promise.resolve('Mock Document Content')),
}))

describe('collectUpstreamContext BFS Trace', () => {
  const mockNodes: CanvasNode[] = [
    { id: 'nodeA', type: 'text', x: 0, y: 0, width: 200, height: 100, text: 'Node A Content' },
    { id: 'nodeB', type: 'text', x: 0, y: 0, width: 200, height: 100, text: 'Node B Content' },
    { id: 'nodeC', type: 'text', x: 0, y: 0, width: 200, height: 100, text: 'Node C Content' },
    { id: 'nodeD', type: 'text', x: 0, y: 0, width: 200, height: 100, text: 'Node D Content' },
    { id: 'nodeE', type: 'text', x: 0, y: 0, width: 200, height: 100, text: 'Node E Content' },
  ]

  it('collects target node and immediate parent', async () => {
    // A -> B
    const edges: CanvasEdge[] = [
      { id: 'edge1', fromNode: 'nodeA', fromSide: 'right', toNode: 'nodeB', toSide: 'left' }
    ]

    const result = await collectUpstreamContext('nodeB', mockNodes, edges, 3, 10)
    expect(result.targetNode).not.toBeNull()
    expect(result.targetNode?.id).toBe('nodeB')
    expect(result.collected.length).toBe(1)
    expect(result.collected[0].id).toBe('nodeA')
    expect(result.collected[0].depth).toBe(1)
  })

  it('respects trace maxDepth limit', async () => {
    // A -> B -> C -> D
    const edges: CanvasEdge[] = [
      { id: 'e1', fromNode: 'nodeA', fromSide: 'right', toNode: 'nodeB', toSide: 'left' },
      { id: 'e2', fromNode: 'nodeB', fromSide: 'right', toNode: 'nodeC', toSide: 'left' },
      { id: 'e3', fromNode: 'nodeC', fromSide: 'right', toNode: 'nodeD', toSide: 'left' },
    ]

    // maxDepth = 2: should only trace D's parents up to 2 hops (C and B, but not A)
    const result = await collectUpstreamContext('nodeD', mockNodes, edges, 2, 10)
    expect(result.collected.map(n => n.id)).toEqual(['nodeC', 'nodeB'])
    expect(result.collected.find(n => n.id === 'nodeA')).toBeUndefined()
  })

  it('respects trace maxCards limit', async () => {
    // A -> B, C -> B, D -> B
    const edges: CanvasEdge[] = [
      { id: 'e1', fromNode: 'nodeA', fromSide: 'right', toNode: 'nodeB', toSide: 'left' },
      { id: 'e2', fromNode: 'nodeC', fromSide: 'right', toNode: 'nodeB', toSide: 'left' },
      { id: 'e3', fromNode: 'nodeD', fromSide: 'right', toNode: 'nodeB', toSide: 'left' },
    ]

    // maxCards = 2: should only collect 2 parent cards
    const result = await collectUpstreamContext('nodeB', mockNodes, edges, 3, 2)
    expect(result.collected.length).toBe(2)
  })

  it('avoids infinite loop in circular relationships', async () => {
    // A -> B -> A (Circular)
    const edges: CanvasEdge[] = [
      { id: 'e1', fromNode: 'nodeA', fromSide: 'right', toNode: 'nodeB', toSide: 'left' },
      { id: 'e2', fromNode: 'nodeB', fromSide: 'right', toNode: 'nodeA', toSide: 'left' },
    ]

    const result = await collectUpstreamContext('nodeB', mockNodes, edges, 5, 10)
    // Should not hang and A should be collected exactly once
    expect(result.collected.length).toBe(1)
    expect(result.collected[0].id).toBe('nodeA')
  })
})
