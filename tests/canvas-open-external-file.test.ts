/* @vitest-environment jsdom */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { getDroppedFilePath, openExternalFile, resolveToAbsolutePath } from '@/canvas/open-external-file'

describe('getDroppedFilePath', () => {
  const originalRequire = (window as any).require

  afterEach(() => {
    (window as any).require = originalRequire
  })

  it('retrieves path via webUtils.getPathForFile in Electron 30+', () => {
    const mockGetPath = vi.fn(() => 'D:\\MyCodingProjects\\siyuan-canvas\\docs\\changelog.md')
    ;(window as any).require = vi.fn((mod: string) => {
      if (mod === '@electron/remote') {
        return {
          require: (sub: string) => sub === 'electron' ? { webUtils: { getPathForFile: mockGetPath } } : null,
        }
      }
      return null
    })

    const file = new File([''], 'changelog.md')
    const path = getDroppedFilePath(file)

    expect(mockGetPath).toHaveBeenCalledWith(file)
    expect(path).toBe('D:\\MyCodingProjects\\siyuan-canvas\\docs\\changelog.md')
  })

  it('falls back to file.path if webUtils is unavailable', () => {
    delete (window as any).require
    const file = new File([''], 'changelog.md')
    Object.defineProperty(file, 'path', { value: 'C:\\Users\\Admin\\Desktop\\changelog.md' })

    const path = getDroppedFilePath(file)
    expect(path).toBe('C:\\Users\\Admin\\Desktop\\changelog.md')
  })

  it('falls back to file.name if path is unavailable', () => {
    delete (window as any).require
    const file = new File([''], 'changelog.md')

    const path = getDroppedFilePath(file)
    expect(path).toBe('changelog.md')
  })
})

describe('resolveToAbsolutePath', () => {
  it('keeps Windows absolute path untouched', async () => {
    const res = await resolveToAbsolutePath('C:\\Users\\Admin\\Desktop\\notes.md')
    expect(res).toBe('C:\\Users\\Admin\\Desktop\\notes.md')
  })

  it('strips leading slash from Windows path', async () => {
    const res = await resolveToAbsolutePath('/D:/projects/doc.pdf')
    expect(res).toBe('D:\\projects\\doc.pdf')
  })
})

describe('openExternalFile', () => {
  const originalRequire = (window as any).require
  const originalOpen = window.open

  beforeEach(() => {
    delete (window as any).require
    window.open = vi.fn()
  })

  afterEach(() => {
    (window as any).require = originalRequire
    window.open = originalOpen
  })

  it('ignores empty input', async () => {
    const res = await openExternalFile('  ')
    expect(res.success).toBe(false)
    expect(window.open).not.toHaveBeenCalled()
  })

  it('calls @electron/remote shell.openPath if available', async () => {
    const mockOpenPath = vi.fn(async () => '')
    ;(window as any).require = vi.fn((mod: string) => {
      if (mod === '@electron/remote') {
        return {
          require: (sub: string) => sub === 'electron' ? { shell: { openPath: mockOpenPath } } : null,
        }
      }
      return null
    })

    const res = await openExternalFile('C:\\Users\\Admin\\Desktop\\notes.md')

    expect(res.success).toBe(true)
    expect(mockOpenPath).toHaveBeenCalledWith('C:\\Users\\Admin\\Desktop\\notes.md')
    expect(window.open).not.toHaveBeenCalled()
  })

  it('falls back to shell.openExternal if openPath fails', async () => {
    const mockOpenPath = vi.fn(async () => 'failed to open path')
    const mockOpenExternal = vi.fn(async () => {})
    ;(window as any).require = vi.fn((mod: string) => {
      if (mod === 'electron') {
        return { shell: { openExternal: mockOpenExternal, openPath: mockOpenPath } }
      }
      return null
    })

    const res = await openExternalFile('C:\\Users\\Admin\\Desktop\\notes.md')

    expect(res.success).toBe(true)
    expect(mockOpenPath).toHaveBeenCalled()
    expect(mockOpenExternal).toHaveBeenCalledWith('file:///C:/Users/Admin/Desktop/notes.md')
  })

  it('calls child_process.exec when electron shell is unavailable but cp exists', async () => {
    const mockExec = vi.fn()
    ;(window as any).require = vi.fn((mod: string) => {
      if (mod === 'child_process') {
        return { exec: mockExec }
      }
      return null
    })

    const res = await openExternalFile('D:/documents/notes.docx')

    expect(res.success).toBe(true)
    expect(mockExec).toHaveBeenCalled()
    expect(window.open).not.toHaveBeenCalled()
  })

  it('falls back to window.open if require is unavailable', async () => {
    const res = await openExternalFile('E:/data/archive.zip')

    expect(res.success).toBe(true)
    expect(window.open).toHaveBeenCalledWith(
      'file:///E:/data/archive.zip',
      '_blank',
      'noopener,noreferrer',
    )
  })
})
