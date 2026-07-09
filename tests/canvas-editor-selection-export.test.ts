import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

// Mock the API module
const mockLsNotebooks = vi.fn()
const mockGetNotebookConf = vi.fn()
const mockRenderSprig = vi.fn()

vi.mock("@/api", () => ({
  lsNotebooks: () => mockLsNotebooks(),
  getNotebookConf: (notebookId: string) => mockGetNotebookConf(notebookId),
  renderSprig: (sprig: string) => mockRenderSprig(sprig),
  createDocWithMd: vi.fn(),
  putFile: vi.fn(),
  sql: vi.fn(),
}))

import { createCanvasEditorSelectionExport } from "@/canvas/use-canvas-editor-selection-export"
import type { CanvasPluginSettings } from "@/canvas/plugin-data"

describe("resolveNoteCreationDirectory", () => {
  it("returns null if there are no active notebooks", async () => {
    mockLsNotebooks.mockResolvedValue({
      notebooks: [
        { id: "nb-1", name: "Closed Notebook", closed: true },
      ],
    })

    const settings: CanvasPluginSettings = {
      noteCreationDirectory: "/MyNotebook/Daily",
    } as any

    const { resolveNoteCreationDirectory } = createCanvasEditorSelectionExport({
      state: {} as any,
      commitDocument: vi.fn(),
      refreshFileNodeMetadata: vi.fn(),
      getResolvedFileNode: vi.fn(),
      getPluginSettings: () => settings,
      fileSource: { value: "workspace" },
      t: (key: string) => key,
    })

    const result = await resolveNoteCreationDirectory()
    expect(result).toBeNull()
  })

  it("extracts notebook id and remaining path if first path segment matches an active notebook name", async () => {
    mockLsNotebooks.mockResolvedValue({
      notebooks: [
        { id: "nb-1", name: "剪藏笔记本", closed: false },
        { id: "nb-2", name: "学习笔记", closed: false },
      ],
    })

    const settings: CanvasPluginSettings = {
      noteCreationDirectory: "/剪藏笔记本/daily note/Top100大文件清单",
    } as any

    const { resolveNoteCreationDirectory } = createCanvasEditorSelectionExport({
      state: {} as any,
      commitDocument: vi.fn(),
      refreshFileNodeMetadata: vi.fn(),
      getResolvedFileNode: vi.fn(),
      getPluginSettings: () => settings,
      fileSource: { value: "workspace" },
      t: (key: string) => key,
    })

    const result = await resolveNoteCreationDirectory()
    expect(result).toEqual({
      notebook: "nb-1",
      parentPath: "/daily note/Top100大文件清单",
    })
  })

  it("falls back to default notebook and full path if first path segment does not match any active notebook", async () => {
    mockLsNotebooks.mockResolvedValue({
      notebooks: [
        { id: "nb-1", name: "剪藏笔记本", closed: false },
        { id: "nb-2", name: "学习笔记", closed: false },
      ],
    })

    const settings: CanvasPluginSettings = {
      noteCreationDirectory: "/daily note/Top100大文件清单",
    } as any

    const { resolveNoteCreationDirectory } = createCanvasEditorSelectionExport({
      state: {} as any,
      commitDocument: vi.fn(),
      refreshFileNodeMetadata: vi.fn(),
      getResolvedFileNode: vi.fn(),
      getPluginSettings: () => settings,
      fileSource: { value: "workspace" },
      t: (key: string) => key,
    })

    const result = await resolveNoteCreationDirectory()
    expect(result).toEqual({
      notebook: "nb-1",
      parentPath: "/daily note/Top100大文件清单",
    })
  })

  it("returns '/' as parentPath if noteCreationDirectory only specifies the notebook name", async () => {
    mockLsNotebooks.mockResolvedValue({
      notebooks: [
        { id: "nb-1", name: "剪藏笔记本", closed: false },
      ],
    })

    const settings: CanvasPluginSettings = {
      noteCreationDirectory: "/剪藏笔记本",
    } as any

    const { resolveNoteCreationDirectory } = createCanvasEditorSelectionExport({
      state: {} as any,
      commitDocument: vi.fn(),
      refreshFileNodeMetadata: vi.fn(),
      getResolvedFileNode: vi.fn(),
      getPluginSettings: () => settings,
      fileSource: { value: "workspace" },
      t: (key: string) => key,
    })

    const result = await resolveNoteCreationDirectory()
    expect(result).toEqual({
      notebook: "nb-1",
      parentPath: "/",
    })
  })

  it("falls back to daily note directory config of default notebook if noteCreationDirectory is empty", async () => {
    mockLsNotebooks.mockResolvedValue({
      notebooks: [
        { id: "nb-1", name: "剪藏笔记本", closed: false },
      ],
    })
    mockGetNotebookConf.mockResolvedValue({
      conf: {
        dailyNoteSavePath: "/daily note/{{date}}",
      },
    })
    mockRenderSprig.mockImplementation(async (path) => path) // Simulate simple rendering returning same value

    const settings: CanvasPluginSettings = {
      noteCreationDirectory: "",
    } as any

    const { resolveNoteCreationDirectory } = createCanvasEditorSelectionExport({
      state: {} as any,
      commitDocument: vi.fn(),
      refreshFileNodeMetadata: vi.fn(),
      getResolvedFileNode: vi.fn(),
      getPluginSettings: () => settings,
      fileSource: { value: "workspace" },
      t: (key: string) => key,
    })

    const result = await resolveNoteCreationDirectory()
    expect(result).toEqual({
      notebook: "nb-1",
      parentPath: "/daily note",
    })
  })
})
