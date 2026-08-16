import type { IProtyle } from "siyuan"

export interface CanvasEmbedCommandMessages {
  insertCanvasEmbedFailed: string
  insertCanvasEmbedNoDocument: string
  insertCanvasEmbedSuccess: string
  insertCanvasLinkFailed: string
  insertCanvasLinkSuccess: string
  messageUnableOpenCanvasFile: string
}

export interface CanvasEmbedTargetOptions {
  commandProtyle?: IProtyle | null
  getAllEditor?: () => Array<{ protyle?: IProtyle | null }>
  lastActiveProtyle?: IProtyle | null
  targetBlockId?: string | null
  targetNodeElement?: HTMLElement | null
}

export interface CanvasEmbedTargetLocation {
  docId: string
  previousBlockId?: string
}

export interface RunCanvasEmbedCommandOptions extends CanvasEmbedTargetOptions {
  canvasPath?: string | null
  mode?: "preview" | "link"
  debugLog: (message: string, payload: Record<string, unknown>) => void
  getFileText: (path: string) => Promise<string>
  getWorkspaceDir: () => Promise<string | undefined>
  insertCanvasEmbed: (options: {
    canvasPath: string
    canvasRaw: string
    parentBlockId: string
    previousBlockId?: string
  }) => Promise<string | undefined | null>
  insertCanvasLink?: (options: {
    canvasPath: string
    parentBlockId: string
    previousBlockId?: string
  }) => Promise<string | undefined | null>
  messages: CanvasEmbedCommandMessages
  showMessage: (message: string, timeout?: number, type?: string) => void
}

export async function normalizeCanvasEmbedPath(
  path?: string | null,
  getWorkspaceDir?: () => Promise<string | undefined>,
): Promise<string> {
  if (!path || typeof path !== "string") {
    return ""
  }
  let canvasPath = path.trim().replace(/^["']|["']$/g, '')
  if (!canvasPath) {
    return ""
  }

  if (!/^[a-zA-Z]:[/\\]/.test(canvasPath)) {
    return canvasPath
  }

  try {
    const workspaceDir = await getWorkspaceDir?.()
    if (!workspaceDir) {
      return canvasPath
    }

    const normalizedWorkspace = workspaceDir.replace(/\\/g, '/').replace(/\/+$/, '')
    const normalizedPath = canvasPath.replace(/\\/g, '/')
    if (normalizedPath.toLowerCase().startsWith(normalizedWorkspace.toLowerCase())) {
      canvasPath = normalizedPath.slice(normalizedWorkspace.length)
      if (!canvasPath.startsWith('/')) {
        canvasPath = `/${canvasPath}`
      }
    }
  } catch {
    return canvasPath
  }

  return canvasPath
}

export function getProtyleRootId(protyle?: IProtyle | null): string {
  return protyle?.block?.rootID
    || protyle?.block?.id
    || protyle?.element?.querySelector<HTMLElement>(".protyle-wysiwyg[data-node-id]")?.getAttribute("data-node-id")
    || ""
}

export function resolveCanvasEmbedTargetDocumentId(options: CanvasEmbedTargetOptions): string {
  const fromCommand = getProtyleRootId(options.commandProtyle)
  if (fromCommand) {
    return fromCommand
  }

  if (options.targetNodeElement) {
    const wysiwygDoc = options.targetNodeElement.closest<HTMLElement>(".protyle-wysiwyg[data-node-id]")
    const rootId = wysiwygDoc?.getAttribute("data-node-id")
    if (rootId) {
      return rootId
    }
  }

  const fromLastActive = getProtyleRootId(options.lastActiveProtyle)
  if (fromLastActive) {
    return fromLastActive
  }

  const fromEditorList = options.getAllEditor?.()
    ?.map(editor => getProtyleRootId(editor.protyle))
    .find(Boolean)
  if (fromEditorList) {
    return fromEditorList
  }

  const wysiwyg = document.querySelector<HTMLElement>(".protyle-wysiwyg[data-node-id]")
  const fromWysiwyg = wysiwyg?.getAttribute("data-node-id")
  if (fromWysiwyg) {
    return fromWysiwyg
  }

  const docRoot = document.querySelector<HTMLElement>(".protyle-wysiwyg [data-node-id][data-type='NodeDocument']")
  return docRoot?.getAttribute("data-node-id") || ""
}

export function resolveCanvasEmbedTargetLocation(options: CanvasEmbedTargetOptions): CanvasEmbedTargetLocation {
  let previousBlockId: string | undefined = options.targetBlockId || undefined

  if (!previousBlockId && options.targetNodeElement) {
    const blockId = options.targetNodeElement.getAttribute("data-node-id")
    if (blockId && options.targetNodeElement.getAttribute("data-type") !== "NodeDocument") {
      previousBlockId = blockId
    }
  }

  if (!previousBlockId && typeof window !== "undefined" && typeof document !== "undefined") {
    const selection = window.getSelection?.()
    if (selection && selection.rangeCount > 0) {
      const anchorNode = selection.anchorNode
      const element = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement
      const block = element?.closest<HTMLElement>(".protyle-wysiwyg [data-node-id]")
      if (block && block.getAttribute("data-type") !== "NodeDocument") {
        previousBlockId = block.getAttribute("data-node-id") || undefined
      }
    }

    if (!previousBlockId) {
      const activeBlock = document.activeElement?.closest<HTMLElement>(".protyle-wysiwyg [data-node-id]")
      if (activeBlock && activeBlock.getAttribute("data-type") !== "NodeDocument") {
        previousBlockId = activeBlock.getAttribute("data-node-id") || undefined
      }
    }

    if (!previousBlockId) {
      const selectedBlock = document.querySelector<HTMLElement>(".protyle-wysiwyg .protyle-wysiwyg--select[data-node-id]")
      if (selectedBlock && selectedBlock.getAttribute("data-type") !== "NodeDocument") {
        previousBlockId = selectedBlock.getAttribute("data-node-id") || undefined
      }
    }
  }

  if (!previousBlockId) {
    const cmdBlockId = options.commandProtyle?.block?.id
    const cmdRootId = options.commandProtyle?.block?.rootID
    if (cmdBlockId && cmdBlockId !== cmdRootId) {
      previousBlockId = cmdBlockId
    } else {
      const lastBlockId = options.lastActiveProtyle?.block?.id
      const lastRootId = options.lastActiveProtyle?.block?.rootID
      if (lastBlockId && lastBlockId !== lastRootId) {
        previousBlockId = lastBlockId
      }
    }
  }

  const docId = resolveCanvasEmbedTargetDocumentId(options)
  return { docId, previousBlockId }
}

export async function runCanvasEmbedCommand(options: RunCanvasEmbedCommandOptions): Promise<string | undefined> {
  const canvasPath = await normalizeCanvasEmbedPath(options.canvasPath, options.getWorkspaceDir)
  if (!canvasPath) {
    return undefined
  }

  const mode = options.mode ?? "preview"

  try {
    const { docId, previousBlockId } = resolveCanvasEmbedTargetLocation(options)
    if (!docId) {
      options.debugLog("no target document found", {
        activeElement: document.activeElement?.className,
        canvasPath,
        editorCount: options.getAllEditor?.()?.length ?? 0,
        hasCommandProtyle: Boolean(options.commandProtyle),
        hasLastActiveProtyle: Boolean(options.lastActiveProtyle),
        protyleCount: document.querySelectorAll(".protyle").length,
        wysiwygCount: document.querySelectorAll(".protyle-wysiwyg").length,
      })
      options.showMessage(options.messages.insertCanvasEmbedNoDocument, 4000, "warning")
      return undefined
    }

    if (mode === "link") {
      if (options.insertCanvasLink) {
        const blockId = await options.insertCanvasLink({
          canvasPath,
          parentBlockId: docId,
          previousBlockId,
        })
        if (blockId) {
          options.showMessage(options.messages.insertCanvasLinkSuccess, 3000)
          return blockId
        }
      }
      options.showMessage(options.messages.insertCanvasLinkFailed, 4000, "error")
      return undefined
    }

    const rawStr = await options.getFileText(canvasPath)
    if (!rawStr) {
      options.debugLog("unable to read canvas file", { canvasPath })
      options.showMessage(options.messages.messageUnableOpenCanvasFile, 4000, "error")
      return undefined
    }

    const blockId = await options.insertCanvasEmbed({
      canvasPath,
      canvasRaw: rawStr,
      parentBlockId: docId,
      previousBlockId,
    })
    if (blockId) {
      options.showMessage(options.messages.insertCanvasEmbedSuccess, 3000)
      return blockId
    }

    options.showMessage(options.messages.insertCanvasEmbedFailed, 4000, "error")
  } catch (error) {
    options.debugLog("insert failed", { canvasPath, error, mode })
    if (mode === "link") {
      options.showMessage(options.messages.insertCanvasLinkFailed, 4000, "error")
    } else {
      options.showMessage(options.messages.insertCanvasEmbedFailed, 4000, "error")
    }
  }

  return undefined
}
