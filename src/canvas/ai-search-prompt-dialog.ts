import { Dialog } from "siyuan"

export interface AiSearchPromptDialogOptions {
  cancelLabel: string
  confirmLabel: string
  hint?: string
  initialValue?: string
  placeholder?: string
  title: string
  width?: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function escapeAttr(value: string): string {
  return escapeHtml(value)
}

/**
 * 弹出 AI 探索提示词输入对话框
 * 用户可输入具体探索方向/要求，直接留空确认返回 ""，点击取消返回 null
 */
export function openAiSearchPromptDialog(options: AiSearchPromptDialogOptions): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false

    const hintHtml = options.hint
      ? `<div class="canvas-ai-search-dialog__hint">${escapeHtml(options.hint)}</div>`
      : ""

    const dialog = new Dialog({
      title: options.title,
      width: options.width || "540px",
      content: `
        <div class="canvas-ai-search-dialog">
          ${hintHtml}
          <textarea
            class="b3-text-field fn__block canvas-ai-search-dialog__input"
            data-canvas-ai-search-input
            placeholder="${escapeAttr(options.placeholder || "")}"
          >${escapeHtml(options.initialValue || "")}</textarea>
          <div class="canvas-ai-search-dialog__actions">
            <button class="b3-button b3-button--outline" data-canvas-ai-search-cancel type="button">${escapeHtml(options.cancelLabel)}</button>
            <button class="b3-button" data-canvas-ai-search-confirm type="button">${escapeHtml(options.confirmLabel)}</button>
          </div>
        </div>
      `,
      destroyCallback: () => {
        if (settled) {
          return
        }
        settled = true
        resolve(null)
      },
    })

    const textarea = dialog.element.querySelector("[data-canvas-ai-search-input]") as HTMLTextAreaElement | null
    const cancelButton = dialog.element.querySelector("[data-canvas-ai-search-cancel]") as HTMLButtonElement | null
    const confirmButton = dialog.element.querySelector("[data-canvas-ai-search-confirm]") as HTMLButtonElement | null

    const close = (value: string | null) => {
      if (settled) {
        return
      }
      settled = true
      resolve(value)
      dialog.destroy()
    }

    cancelButton?.addEventListener("click", () => {
      close(null)
    })

    confirmButton?.addEventListener("click", () => {
      const text = (textarea?.value ?? "").trim()
      close(text)
    })

    if (textarea) {
      // 监听 Ctrl+Enter 或 Cmd+Enter 快速提交
      textarea.addEventListener("keydown", (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault()
          confirmButton?.click()
        }
      })

      queueMicrotask(() => {
        textarea.focus()
        if (options.initialValue) {
          textarea.setSelectionRange(textarea.value.length, textarea.value.length)
        }
      })
    }
  })
}
