/* @vitest-environment jsdom */

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const appendBlockMock = vi.fn()
const insertBlockMock = vi.fn()
const setBlockAttrsMock = vi.fn()
const uploadMock = vi.fn()

vi.mock("@/api", () => ({
  appendBlock: (...args: unknown[]) => appendBlockMock(...args),
  insertBlock: (...args: unknown[]) => insertBlockMock(...args),
  setBlockAttrs: (...args: unknown[]) => setBlockAttrsMock(...args),
  upload: (...args: unknown[]) => uploadMock(...args),
  updateBlock: vi.fn(),
}))

import {
  buildCanvasEmbedMarkdown,
  buildCanvasLinkMarkdown,
  insertCanvasEmbed,
  insertCanvasLink,
} from "@/canvas/canvas-embed-insert"

describe("canvas-embed-insert", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("buildCanvasLinkMarkdown", () => {
    it("creates markdown link from path and file name", () => {
      const md = buildCanvasLinkMarkdown("/data/storage/petal/siyuan-canvas/demo.canvas")
      expect(md).toBe("[demo.canvas](/data/storage/petal/siyuan-canvas/demo.canvas)")
    })

    it("uses provided title over path file name", () => {
      const md = buildCanvasLinkMarkdown("/data/storage/petal/siyuan-canvas/demo.canvas", "Custom Title.canvas")
      expect(md).toBe("[Custom Title.canvas](/data/storage/petal/siyuan-canvas/demo.canvas)")
    })

    it("escapes special markdown characters in title", () => {
      const md = buildCanvasLinkMarkdown("/data/demo.canvas", "Test [Bracket].canvas")
      expect(md).toBe("[Test \\[Bracket\\].canvas](/data/demo.canvas)")
    })
  })

  describe("insertCanvasLink", () => {
    it("inserts block after previousBlockId if provided", async () => {
      insertBlockMock.mockResolvedValueOnce([
        {
          doOperations: [{ id: "new-link-block-1" }],
        },
      ])

      const blockId = await insertCanvasLink({
        canvasPath: "/data/storage/petal/siyuan-canvas/my-canvas.canvas",
        parentBlockId: "doc-123",
        previousBlockId: "cursor-block-456",
      })

      expect(blockId).toBe("new-link-block-1")
      expect(insertBlockMock).toHaveBeenCalledWith(
        "markdown",
        "[my-canvas.canvas](/data/storage/petal/siyuan-canvas/my-canvas.canvas)",
        undefined,
        "cursor-block-456",
        "doc-123",
      )
      expect(setBlockAttrsMock).toHaveBeenCalledWith("new-link-block-1", {
        "custom-canvas-path": "/data/storage/petal/siyuan-canvas/my-canvas.canvas",
      })
    })

    it("falls back to appendBlock when previousBlockId is not provided", async () => {
      appendBlockMock.mockResolvedValueOnce([
        {
          doOperations: [{ id: "new-link-block-2" }],
        },
      ])

      const blockId = await insertCanvasLink({
        canvasPath: "/data/storage/petal/siyuan-canvas/my-canvas.canvas",
        parentBlockId: "doc-123",
      })

      expect(blockId).toBe("new-link-block-2")
      expect(insertBlockMock).not.toHaveBeenCalled()
      expect(appendBlockMock).toHaveBeenCalledWith(
        "markdown",
        "[my-canvas.canvas](/data/storage/petal/siyuan-canvas/my-canvas.canvas)",
        "doc-123",
      )
    })
  })

  describe("insertCanvasEmbed", () => {
    it("inserts embed preview after previousBlockId if provided", async () => {
      uploadMock.mockResolvedValueOnce({
        succMap: { "test.svg": "assets/test-123.svg" },
      })
      insertBlockMock.mockResolvedValueOnce([
        {
          doOperations: [{ id: "new-embed-block-1" }],
        },
      ])

      const raw = JSON.stringify({
        nodes: [{ id: "n1", type: "text", x: 0, y: 0, width: 100, height: 100, text: "hi" }],
        edges: [],
      })

      const blockId = await insertCanvasEmbed({
        canvasPath: "/data/storage/petal/siyuan-canvas/test.canvas",
        canvasRaw: raw,
        parentBlockId: "doc-123",
        previousBlockId: "cursor-block-789",
      })

      expect(blockId).toBe("new-embed-block-1")
      expect(insertBlockMock).toHaveBeenCalledWith(
        "markdown",
        expect.stringContaining("![test](assets/test-123.svg \"test\")"),
        undefined,
        "cursor-block-789",
        "doc-123",
      )
      expect(setBlockAttrsMock).toHaveBeenCalledWith("new-embed-block-1", {
        "custom-canvas-path": "/data/storage/petal/siyuan-canvas/test.canvas",
      })
    })
  })
})
