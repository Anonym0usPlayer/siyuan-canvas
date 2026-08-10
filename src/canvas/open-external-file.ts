import { fetchSyncPost, type IWebSocketData } from 'siyuan'

/**
 * 从拖拽的 HTML5 File 对象中提取系统绝对物理路径。
 * 兼容 Electron 30+ 的 webUtils.getPathForFile(file) 及旧版 file.path。
 */
export function getDroppedFilePath(file: File): string {
  try {
    const requireFn = (window as any).require || (globalThis as any).require
    if (typeof requireFn === 'function') {
      let webUtils: any = null
      try {
        const remote = requireFn('@electron/remote')
        if (remote) {
          if (typeof remote.require === 'function') {
            webUtils = remote.require('electron')?.webUtils
          }
          if (!webUtils && remote.webUtils) {
            webUtils = remote.webUtils
          }
        }
      } catch {}

      if (!webUtils) {
        try {
          webUtils = requireFn('electron')?.webUtils
        } catch {}
      }

      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        const fullPath = webUtils.getPathForFile(file)
        if (fullPath) {
          return fullPath
        }
      }
    }
  } catch (error) {
    console.warn('Failed to get file path via webUtils:', error)
  }

  const legacyPath = (file as any).path
  if (typeof legacyPath === 'string' && legacyPath.trim()) {
    return legacyPath.trim()
  }

  return file.name
}

export async function resolveToAbsolutePath(
  filePath: string,
  currentCanvasFilePath?: string,
): Promise<string> {
  let trimmed = filePath.trim()
  if (!trimmed)
    return ''

  // 解码 file:/// 协议
  if (trimmed.startsWith('file:///')) {
    trimmed = decodeURIComponent(trimmed.substring(8))
  } else if (trimmed.startsWith('file://')) {
    trimmed = decodeURIComponent(trimmed.substring(7))
  }

  // 清理多余的前导斜杠 (如 /D:/path -> D:/path)
  trimmed = trimmed.replace(/^[/\\]+([a-zA-Z]:)/, '$1')

  // 如果已经是 Windows 绝对路径 (如 C:\... 或 D:/...)
  if (/^[a-zA-Z]:[/\\]/.test(trimmed)) {
    return trimmed.replace(/\//g, '\\')
  }

  // 获取思源工作区根路径
  let workspaceDir = ''
  try {
    const response = await fetchSyncPost('/api/system/getConf', {}) as IWebSocketData
    workspaceDir = response?.data?.conf?.system?.workspaceDir || ''
  } catch {}

  const normalizedWorkspace = workspaceDir.replace(/[/\\]+$/, '')

  // 如果是以 /data/ 或 data/ 开头的相对路径
  if (/^\/?data[/\\]/i.test(trimmed)) {
    const relativeDataPath = trimmed.replace(/^[/\\]+/, '')
    if (normalizedWorkspace) {
      return `${normalizedWorkspace}/${relativeDataPath}`.replace(/\//g, '\\')
    }
  }

  // 如果是相对于当前 .canvas 文件的相对文件名 (如 "README_zh_CN.md")
  if (currentCanvasFilePath) {
    const canvasDir = currentCanvasFilePath.includes('/')
      ? currentCanvasFilePath.substring(0, currentCanvasFilePath.lastIndexOf('/'))
      : currentCanvasFilePath.includes('\\')
        ? currentCanvasFilePath.substring(0, currentCanvasFilePath.lastIndexOf('\\'))
        : ''

    if (canvasDir) {
      const combinedWorkspacePath = `${canvasDir.replace(/[/\\\\]+$/, '')}/${trimmed.replace(/^[/\\\\]+/, '')}`
      if (normalizedWorkspace) {
        return `${normalizedWorkspace}/${combinedWorkspacePath.replace(/^[/\\\\]+/, '')}`.replace(/\//g, '\\')
      }
      return combinedWorkspacePath.replace(/\//g, '\\')
    }
  }

  if (normalizedWorkspace) {
    return `${normalizedWorkspace}/${trimmed.replace(/^[/\\\\]+/, '')}`.replace(/\//g, '\\')
  }

  return trimmed.replace(/\//g, '\\')
}

export interface OpenExternalFileResult {
  error?: string
  success: boolean
}

/**
 * 唤起操作系统默认程序打开指定的本地文件路径或链接。
 * 兼容 Electron (@electron/remote)、Node child_process 命令行及 Web 浏览器环境。
 */
export async function openExternalFile(
  filePath: string,
  options?: { currentCanvasFilePath?: string },
): Promise<OpenExternalFileResult> {
  const trimmed = filePath.trim()
  if (!trimmed)
    return { success: false, error: 'Empty file path' }

  const absPath = await resolveToAbsolutePath(trimmed, options?.currentCanvasFilePath) || trimmed
  const normalizedWinPath = absPath.replace(/\//g, '\\')

  let fileUrl = absPath.replace(/\\/g, '/')
  if (!fileUrl.startsWith('file://') && !fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
    fileUrl = fileUrl.startsWith('/') ? `file://${fileUrl}` : `file:///${fileUrl}`
  }

  const requireFn = (window as any).require || (globalThis as any).require

  if (typeof requireFn === 'function') {
    let electronShell: any = null
    try {
      const remote = requireFn('@electron/remote')
      if (remote) {
        if (typeof remote.require === 'function') {
          electronShell = remote.require('electron')?.shell
        }
        if (!electronShell && remote.shell) {
          electronShell = remote.shell
        }
      }
    } catch {}

    if (!electronShell) {
      try {
        electronShell = requireFn('electron')?.shell
      } catch {}
    }

    // 1. 尝试 Electron shell.openPath
    if (electronShell && typeof electronShell.openPath === 'function') {
      try {
        const err = await electronShell.openPath(normalizedWinPath)
        if (!err)
          return { success: true }
      } catch {}

      try {
        const errAlt = await electronShell.openPath(absPath)
        if (!errAlt)
          return { success: true }
      } catch {}
    }

    // 2. 尝试 Electron shell.openExternal (处理 file:/// URL)
    if (electronShell && typeof electronShell.openExternal === 'function') {
      try {
        await electronShell.openExternal(fileUrl)
        return { success: true }
      } catch {}
    }

    // 3. 尝试 Node child_process.exec ("start "" "PATH"")
    let cp: any = null
    try {
      const remote = requireFn('@electron/remote')
      if (remote && typeof remote.require === 'function') {
        cp = remote.require('child_process')
      }
    } catch {}

    if (!cp) {
      try {
        cp = requireFn('child_process')
      } catch {}
    }

    if (cp && typeof cp.exec === 'function') {
      try {
        const isWin = typeof process !== 'undefined' && process.platform === 'win32'
        const isMac = typeof process !== 'undefined' && process.platform === 'darwin'
        if (isWin) {
          cp.exec(`start "" "${normalizedWinPath}"`)
        } else if (isMac) {
          cp.exec(`open "${absPath}"`)
        } else {
          cp.exec(`xdg-open "${absPath}"`)
        }
        return { success: true }
      } catch {}
    }
  }

  // 4. Web 环境回退：window.open
  try {
    window.open(fileUrl, '_blank', 'noopener,noreferrer')
    return { success: true }
  } catch (error: any) {
    return { error: String(error?.message || error || 'Failed to open file'), success: false }
  }
}
