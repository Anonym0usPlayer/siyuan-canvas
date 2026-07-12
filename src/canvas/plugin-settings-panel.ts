import type { CanvasColorThemeId } from "@/canvas/canvas-color-themes"
import type { Setting } from "siyuan"
import type { CanvasPluginSettings } from "@/canvas/plugin-data"
import type { CanvasI18nTranslator } from "@/canvas/use-canvas-editor-shared"

import { CANVAS_COLOR_THEMES } from "@/canvas/canvas-color-themes"

interface CanvasPluginSettingsPanelOptions {
  createSetting: (options: { width: string }) => Setting
  getSettings: () => CanvasPluginSettings
  onSettingsChanged?: () => void
  pluginName: string
  saveSettings: (settings: CanvasPluginSettings) => Promise<void>
  t: CanvasI18nTranslator
}

export function openCanvasPluginSettingsPanel(options: CanvasPluginSettingsPanelOptions): Setting {
  const {
    createSetting,
    getSettings,
    onSettingsChanged,
    pluginName,
    saveSettings,
    t,
  } = options

  const draft = getSettings()
  const setting = createSetting({
    width: "560px",
  })
  const saveDraft = async () => {
    await saveSettings({
      ...draft,
    })
    onSettingsChanged?.()
  }

  setting.addItem({
    title: t("settingsColorThemeTitle"),
    description: t("settingsColorThemeDescription"),
    createActionElement: () => {
      const select = document.createElement("select")
      select.dataset.settingKey = "colorTheme"
      select.className = "b3-select fn__flex-center"
      for (const theme of CANVAS_COLOR_THEMES) {
        const option = document.createElement("option")
        option.value = theme.id
        option.textContent = t(theme.nameKey as any)
        if (theme.id === draft.colorTheme) {
          option.selected = true
        }
        select.appendChild(option)
      }
      select.addEventListener("change", () => {
        draft.colorTheme = select.value as CanvasColorThemeId
        void saveDraft()
      })
      return select
    },
  })
  setting.addItem({
    title: t("settingsDefaultCanvasDirectoryTitle"),
    description: t("settingsDefaultCanvasDirectoryDescription"),
    createActionElement: () => {
      const input = document.createElement("input")
      input.dataset.settingKey = "defaultCanvasDirectory"
      input.className = "b3-text-field fn__flex-center"
      input.type = "text"
      input.value = draft.defaultCanvasDirectory
      input.disabled = true
      return input
    },
  })
  setting.addItem({
    title: t("settingsRecentCanvasFileLimitTitle"),
    description: t("settingsRecentCanvasFileLimitDescription"),
    createActionElement: () => {
      const input = document.createElement("input")
      input.dataset.settingKey = "recentFilesLimit"
      input.className = "b3-text-field fn__flex-center"
      input.type = "number"
      input.min = "1"
      input.max = "20"
      input.value = draft.recentFilesLimit.toString()
      input.addEventListener("change", () => {
        const nextValue = Number.parseInt(input.value, 10)
        draft.recentFilesLimit = Number.isNaN(nextValue) ? 8 : Math.min(20, Math.max(1, nextValue))
        input.value = draft.recentFilesLimit.toString()
        void saveDraft()
      })
      return input
    },
  })
  setting.addItem({
    title: t("settingsDetectExternalFileChangesTitle"),
    description: t("settingsDetectExternalFileChangesDescription"),
    createActionElement: () => {
      const input = document.createElement("input")
      input.dataset.settingKey = "detectExternalChanges"
      input.type = "checkbox"
      input.checked = draft.detectExternalChanges
      input.addEventListener("change", () => {
        draft.detectExternalChanges = input.checked
        void saveDraft()
      })
      return input
    },
  })
  setting.addItem({
    title: t("settingsShowCanvasThumbnailsTitle"),
    description: t("settingsShowCanvasThumbnailsDescription"),
    createActionElement: () => {
      const input = document.createElement("input")
      input.dataset.settingKey = "showCanvasThumbnails"
      input.type = "checkbox"
      input.checked = draft.showCanvasThumbnails
      input.addEventListener("change", () => {
        draft.showCanvasThumbnails = input.checked
        void saveDraft()
      })
      return input
    },
  })
  setting.addItem({
    title: t("settingsShowNodeHeaderTitle"),
    description: t("settingsShowNodeHeaderDescription"),
    createActionElement: () => {
      const input = document.createElement("input")
      input.dataset.settingKey = "showNodeHeader"
      input.type = "checkbox"
      input.checked = draft.showNodeHeader
      input.addEventListener("change", () => {
        draft.showNodeHeader = input.checked
        void saveDraft()
      })
      return input
    },
  })
  setting.addItem({
    title: t("settingsShowDragAlignmentGuidesTitle"),
    description: t("settingsShowDragAlignmentGuidesDescription"),
    createActionElement: () => {
      const input = document.createElement("input")
      input.dataset.settingKey = "showDragAlignmentGuides"
      input.type = "checkbox"
      input.checked = draft.showDragAlignmentGuides
      input.addEventListener("change", () => {
        draft.showDragAlignmentGuides = input.checked
        void saveDraft()
      })
      return input
    },
  })
  setting.addItem({
    title: t("settingsAutoCreateTextCardOnDragTitle"),
    description: t("settingsAutoCreateTextCardOnDragDescription"),
    createActionElement: () => {
      const input = document.createElement("input")
      input.dataset.settingKey = "autoCreateTextCardOnDrag"
      input.type = "checkbox"
      input.checked = draft.autoCreateTextCardOnDrag
      input.addEventListener("change", () => {
        draft.autoCreateTextCardOnDrag = input.checked
        void saveDraft()
      })
      return input
    },
  })
  setting.addItem({
    title: t("settingsEnableDebugLogTitle"),
    description: t("settingsEnableDebugLogDescription"),
    createActionElement: () => {
      const input = document.createElement("input")
      input.dataset.settingKey = "enableDebugLog"
      input.type = "checkbox"
      input.checked = draft.enableDebugLog
      input.addEventListener("change", () => {
        draft.enableDebugLog = input.checked
        void saveDraft()
      })
      return input
    },
  })
  setting.addItem({
    title: t("settingsNoteCreationDirectoryTitle"),
    description: t("settingsNoteCreationDirectoryDescription"),
    createActionElement: () => {
      const input = document.createElement("input")
      input.dataset.settingKey = "noteCreationDirectory"
      input.className = "b3-text-field fn__flex-center"
      input.type = "text"
      input.value = draft.noteCreationDirectory
      input.addEventListener("change", () => {
        draft.noteCreationDirectory = input.value.trim()
        void saveDraft()
      })
      return input
    },
  })

  setting.addItem({
    title: t("settingsPresentationStyleTitle"),
    description: t("settingsPresentationStyleDescription"),
    createActionElement: () => {
      const select = document.createElement("select")
      select.dataset.settingKey = "presentationStyle"
      select.className = "b3-select fn__flex-center"
      
      const optionZoom = document.createElement("option")
      optionZoom.value = "zoom"
      optionZoom.textContent = t("settingsPresentationStyleZoom")
      
      const optionMask = document.createElement("option")
      optionMask.value = "mask"
      optionMask.textContent = t("settingsPresentationStyleMask")
      
      select.appendChild(optionZoom)
      select.appendChild(optionMask)
      
      select.value = draft.presentationStyle || "zoom"
      
      select.addEventListener("change", () => {
        draft.presentationStyle = select.value as "zoom" | "mask"
        void saveDraft()
      })
      return select
    },
  })
  setting.addItem({
    title: t("settingsPresentationAutoRatioTitle"),
    description: t("settingsPresentationAutoRatioDescription"),
    createActionElement: () => {
      const input = document.createElement("input")
      input.dataset.settingKey = "presentationAutoRatio"
      input.type = "checkbox"
      input.checked = draft.presentationAutoRatio !== false
      input.addEventListener("change", () => {
        draft.presentationAutoRatio = input.checked
        void saveDraft()
      })
      return input
    },
  })
  setting.addItem({
    title: t("settingsPresentationMaskOpacityTitle"),
    description: t("settingsPresentationMaskOpacityDescription"),
    createActionElement: () => {
      const input = document.createElement("input")
      input.dataset.settingKey = "presentationMaskOpacity"
      input.className = "b3-text-field fn__flex-center"
      input.type = "number"
      input.min = "0"
      input.max = "100"
      input.value = (draft.presentationMaskOpacity !== undefined ? draft.presentationMaskOpacity : 60).toString()
      input.addEventListener("change", () => {
        const nextValue = Number.parseInt(input.value, 10)
        draft.presentationMaskOpacity = Number.isNaN(nextValue) ? 60 : Math.min(100, Math.max(0, nextValue))
        input.value = draft.presentationMaskOpacity.toString()
        void saveDraft()
      })
      return input
    },
  })
  setting.addItem({
    title: t("settingsPresentationAutoPlayIntervalTitle"),
    description: t("settingsPresentationAutoPlayIntervalDescription"),
    createActionElement: () => {
      const input = document.createElement("input")
      input.dataset.settingKey = "presentationAutoPlayInterval"
      input.className = "b3-text-field fn__flex-center"
      input.type = "number"
      input.min = "1"
      input.max = "60"
      input.value = (draft.presentationAutoPlayInterval || 3).toString()
      input.addEventListener("change", () => {
        const nextValue = Number.parseInt(input.value, 10)
        draft.presentationAutoPlayInterval = Number.isNaN(nextValue) ? 3 : Math.min(60, Math.max(1, nextValue))
        input.value = draft.presentationAutoPlayInterval.toString()
        void saveDraft()
      })
      return input
    },
  })

  setting.open(pluginName)

  let retryCount = 0
  const tryCategorize = () => {
    const anchorEl = document.querySelector('[data-setting-key="colorTheme"]')
    if (anchorEl) {
      try {
        categorizeSettings(t)
      }
      catch (err) {
        console.error("Failed to categorize siyuan-canvas settings:", err)
      }
    }
    else if (retryCount < 50) {
      retryCount++
      setTimeout(tryCategorize, 50)
    }
  }
  tryCategorize()

  return setting
}

function categorizeSettings(t: CanvasI18nTranslator) {
  const anchorEl = document.querySelector('[data-setting-key="colorTheme"]') as HTMLElement
  if (!anchorEl) return

  let wrapper: HTMLElement | null = anchorEl
  while (wrapper && wrapper.parentElement) {
    const parent = wrapper.parentElement
    if (parent.children.length > 5) {
      break
    }
    wrapper = parent
  }

  const container = wrapper?.parentElement
  if (!container) return

  const groups = [
    {
      id: "basic",
      title: t("settingsGroupBasic" as any) || "基础设置",
      keys: [
        "defaultCanvasDirectory",
        "noteCreationDirectory",
        "recentFilesLimit",
        "detectExternalChanges",
        "enableDebugLog",
      ],
      open: true,
    },
    {
      id: "display",
      title: t("settingsGroupDisplay" as any) || "显示设置",
      keys: [
        "colorTheme",
        "showCanvasThumbnails",
        "showNodeHeader",
        "showDragAlignmentGuides",
        "autoCreateTextCardOnDrag",
      ],
      open: true,
    },
    {
      id: "presentation",
      title: t("settingsGroupPresentation" as any) || "演示设置",
      keys: [
        "presentationStyle",
        "presentationAutoRatio",
        "presentationMaskOpacity",
        "presentationAutoPlayInterval",
      ],
      open: true,
    },
  ]

  const itemWrappersMap = new Map<string, HTMLElement>()
  for (const group of groups) {
    for (const key of group.keys) {
      const el = container.querySelector(`[data-setting-key="${key}"]`) as HTMLElement
      if (el) {
        let itemWrapper: HTMLElement | null = el
        while (itemWrapper && itemWrapper.parentElement !== container) {
          itemWrapper = itemWrapper.parentElement
        }
        if (itemWrapper) {
          itemWrappersMap.set(key, itemWrapper)
        }
      }
    }
  }

  // 具体的说明文字改为悬浮 Tooltips 提示
  const settingKeysMapping = [
    { key: "colorTheme", title: "settingsColorThemeTitle", desc: "settingsColorThemeDescription" },
    { key: "defaultCanvasDirectory", title: "settingsDefaultCanvasDirectoryTitle", desc: "settingsDefaultCanvasDirectoryDescription" },
    { key: "recentFilesLimit", title: "settingsRecentCanvasFileLimitTitle", desc: "settingsRecentCanvasFileLimitDescription" },
    { key: "detectExternalChanges", title: "settingsDetectExternalFileChangesTitle", desc: "settingsDetectExternalFileChangesDescription" },
    { key: "showCanvasThumbnails", title: "settingsShowCanvasThumbnailsTitle", desc: "settingsShowCanvasThumbnailsDescription" },
    { key: "showNodeHeader", title: "settingsShowNodeHeaderTitle", desc: "settingsShowNodeHeaderDescription" },
    { key: "showDragAlignmentGuides", title: "settingsShowDragAlignmentGuidesTitle", desc: "settingsShowDragAlignmentGuidesDescription" },
    { key: "autoCreateTextCardOnDrag", title: "settingsAutoCreateTextCardOnDragTitle", desc: "settingsAutoCreateTextCardOnDragDescription" },
    { key: "enableDebugLog", title: "settingsEnableDebugLogTitle", desc: "settingsEnableDebugLogDescription" },
    { key: "noteCreationDirectory", title: "settingsNoteCreationDirectoryTitle", desc: "settingsNoteCreationDirectoryDescription" },
    { key: "presentationStyle", title: "settingsPresentationStyleTitle", desc: "settingsPresentationStyleDescription" },
    { key: "presentationAutoRatio", title: "settingsPresentationAutoRatioTitle", desc: "settingsPresentationAutoRatioDescription" },
    { key: "presentationMaskOpacity", title: "settingsPresentationMaskOpacityTitle", desc: "settingsPresentationMaskOpacityDescription" },
    { key: "presentationAutoPlayInterval", title: "settingsPresentationAutoPlayIntervalTitle", desc: "settingsPresentationAutoPlayIntervalDescription" }
  ]

  settingKeysMapping.forEach(({ key, title, desc }) => {
    const itemWrapper = itemWrappersMap.get(key)
    if (!itemWrapper) return

    const titleText = t(title as any)
    const descText = t(desc as any)

    const allNodes = Array.from(itemWrapper.querySelectorAll("*")) as HTMLElement[]
    let titleEl: HTMLElement | null = null
    let descEl: HTMLElement | null = null

    for (const node of allNodes) {
      const txt = node.textContent?.trim()
      if (txt === titleText.trim()) {
        titleEl = node
      }
      else if (txt === descText.trim()) {
        descEl = node
      }
    }

    if (descEl) {
      descEl.style.display = "none"
    }

    if (titleEl && descText) {
      if (!titleEl.querySelector(".siyuan-canvas-info-icon")) {
        const infoIcon = document.createElement("span")
        infoIcon.className = "siyuan-canvas-info-icon fn__flex fn__flex-center"
        infoIcon.innerHTML = `<svg viewBox="0 0 24 24" class="siyuan-canvas-info-svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`
        infoIcon.dataset.tooltip = descText

        titleEl.style.display = "inline-flex"
        titleEl.style.alignItems = "center"
        titleEl.appendChild(infoIcon)
      }
    }
  })

  const categorizedWrappers = new Set(itemWrappersMap.values())
  const otherWrappers: HTMLElement[] = []
  Array.from(container.children).forEach((child) => {
    const htmlChild = child as HTMLElement
    if (htmlChild.tagName !== "DETAILS" && htmlChild.tagName !== "STYLE" && !categorizedWrappers.has(htmlChild)) {
      otherWrappers.push(htmlChild)
    }
  })

  injectSettingsPanelStyles()

  groups.forEach((group) => {
    const groupWrappers = group.keys
      .map(key => itemWrappersMap.get(key))
      .filter((w): w is HTMLElement => !!w)

    if (groupWrappers.length === 0) return

    const details = document.createElement("details")
    details.className = "siyuan-canvas-settings-details"
    if (group.open) {
      details.setAttribute("open", "")
    }

    const summary = document.createElement("summary")
    summary.className = "siyuan-canvas-settings-summary fn__flex fn__flex-center"

    const arrowIcon = document.createElement("span")
    arrowIcon.className = "siyuan-canvas-settings-summary-arrow fn__flex fn__flex-center"
    arrowIcon.innerHTML = `<svg viewBox="0 0 24 24" class="siyuan-canvas-settings-arrow-svg"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`

    const titleSpan = document.createElement("span")
    titleSpan.className = "siyuan-canvas-settings-summary-title"
    titleSpan.textContent = group.title

    summary.appendChild(arrowIcon)
    summary.appendChild(titleSpan)
    details.appendChild(summary)

    const contentDiv = document.createElement("div")
    contentDiv.className = "siyuan-canvas-settings-details-content"

    groupWrappers.forEach((wrapper) => {
      contentDiv.appendChild(wrapper)
    })

    details.appendChild(contentDiv)
    container.appendChild(details)
  })

  if (otherWrappers.length > 0) {
    const details = document.createElement("details")
    details.className = "siyuan-canvas-settings-details"
    details.setAttribute("open", "")

    const summary = document.createElement("summary")
    summary.className = "siyuan-canvas-settings-summary fn__flex fn__flex-center"

    const arrowIcon = document.createElement("span")
    arrowIcon.className = "siyuan-canvas-settings-summary-arrow fn__flex fn__flex-center"
    arrowIcon.innerHTML = `<svg viewBox="0 0 24 24" class="siyuan-canvas-settings-arrow-svg"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`

    const titleSpan = document.createElement("span")
    titleSpan.className = "siyuan-canvas-settings-summary-title"
    titleSpan.textContent = t("settingsGroupOther" as any) || "其他设置"

    summary.appendChild(arrowIcon)
    summary.appendChild(titleSpan)
    details.appendChild(summary)

    const contentDiv = document.createElement("div")
    contentDiv.className = "siyuan-canvas-settings-details-content"

    otherWrappers.forEach((wrapper) => {
      contentDiv.appendChild(wrapper)
    })

    details.appendChild(contentDiv)
    container.appendChild(details)
  }
}

function injectSettingsPanelStyles() {
  if (document.getElementById("siyuan-canvas-settings-panel-styles")) return

  const style = document.createElement("style")
  style.id = "siyuan-canvas-settings-panel-styles"
  style.textContent = `
    .siyuan-canvas-settings-details {
      margin: 6px 0 18px 0 !important;
      border: 1px solid var(--b3-theme-border, rgba(0,0,0,0.1)) !important;
      border-radius: 8px !important;
      background-color: rgba(120, 120, 128, 0.06) !important;
      overflow: hidden !important;
      display: block !important;
      transition: all 0.2s ease-in-out !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03) !important;
    }
    .siyuan-canvas-settings-details[open] {
      background-color: var(--b3-theme-background) !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06) !important;
    }
    .siyuan-canvas-settings-summary {
      padding: 14px 18px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      user-select: none !important;
      background-color: rgba(120, 120, 128, 0.04) !important;
      border-bottom: 1px solid transparent !important;
      display: flex !important;
      align-items: center !important;
      color: var(--b3-theme-on-background) !important;
      transition: background-color 0.2s ease !important;
      outline: none !important;
    }
    .siyuan-canvas-settings-details[open] .siyuan-canvas-settings-summary {
      border-bottom-color: var(--b3-theme-border) !important;
      background-color: rgba(120, 120, 128, 0.02) !important;
    }
    .siyuan-canvas-settings-summary:hover {
      background-color: rgba(120, 120, 128, 0.1) !important;
    }
    .siyuan-canvas-settings-summary::-webkit-details-marker {
      display: none !important;
    }
    .siyuan-canvas-settings-summary::marker {
      display: none !important;
    }
    .siyuan-canvas-settings-summary-arrow {
      margin-right: 12px !important;
      width: 16px !important;
      height: 16px !important;
      color: var(--b3-theme-on-background) !important;
      transition: transform 0.2s ease !important;
      opacity: 0.8 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .siyuan-canvas-settings-arrow-svg {
      width: 100% !important;
      height: 100% !important;
      fill: currentColor !important;
      transition: transform 0.2s ease !important;
    }
    .siyuan-canvas-settings-details[open] .siyuan-canvas-settings-summary-arrow {
      transform: rotate(90deg) !important;
    }
    .siyuan-canvas-settings-summary-title {
      flex: 1 !important;
      letter-spacing: 0.5px !important;
    }
    .siyuan-canvas-settings-details-content {
      padding: 6px 12px 10px 12px !important;
    }
    .siyuan-canvas-settings-details-content > .fn__flex,
    .siyuan-canvas-settings-details-content > .b3-label {
      padding: 10px 12px !important;
      margin: 2px 0 !important;
      border-bottom: 1px solid var(--b3-theme-border-mute, rgba(0, 0, 0, 0.04)) !important;
      border-radius: 6px !important;
      transition: background-color 0.15s ease !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }
    .siyuan-canvas-settings-details-content > .fn__flex:hover,
    .siyuan-canvas-settings-details-content > .b3-label:hover {
      background-color: var(--b3-theme-hover) !important;
    }
    .siyuan-canvas-settings-details-content > *:last-child {
      border-bottom: none !important;
    }

    /* ⓘ 信息提示图标 */
    .siyuan-canvas-info-icon {
      position: relative !important;
      cursor: help !important;
      margin-left: 8px !important;
      width: 14px !important;
      height: 14px !important;
      color: var(--b3-theme-on-surface-mute, --b3-theme-on-background) !important;
      opacity: 0.6 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: opacity 0.2s ease !important;
    }
    .siyuan-canvas-info-icon:hover {
      opacity: 1 !important;
    }
    .siyuan-canvas-info-svg {
      width: 100% !important;
      height: 100% !important;
      fill: currentColor !important;
    }
    
    /* 精致悬浮 Tooltips 气泡 */
    .siyuan-canvas-info-icon::after {
      content: attr(data-tooltip) !important;
      position: absolute !important;
      bottom: 130% !important;
      left: 50% !important;
      transform: translateX(-50%) scale(0.85) !important;
      transform-origin: bottom center !important;
      background-color: var(--b3-theme-background-hover, #333) !important;
      color: var(--b3-theme-on-background, #fff) !important;
      border: 1px solid var(--b3-theme-border) !important;
      padding: 6px 12px !important;
      border-radius: 6px !important;
      font-size: 12px !important;
      font-weight: normal !important;
      white-space: pre-wrap !important;
      width: 220px !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
      z-index: 10000 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition: opacity 0.15s ease, transform 0.15s ease !important;
    }
    .siyuan-canvas-info-icon:hover::after {
      opacity: 1 !important;
      transform: translateX(-50%) scale(1) !important;
      pointer-events: auto !important;
    }
    
    /* Tooltip 底部指示小三角 */
    .siyuan-canvas-info-icon::before {
      content: "" !important;
      position: absolute !important;
      bottom: 110% !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      border-width: 5px !important;
      border-style: solid !important;
      border-color: var(--b3-theme-border) transparent transparent transparent !important;
      z-index: 10000 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      transition: opacity 0.15s ease !important;
    }
    .siyuan-canvas-info-icon:hover::before {
      opacity: 1 !important;
    }

    /* 纯 CSS 打造的高级 iOS / Modern Slider 开关样式 */
    input[data-setting-key][type="checkbox"] {
      position: relative !important;
      appearance: none !important;
      -webkit-appearance: none !important;
      width: 42px !important;
      height: 22px !important;
      background-color: rgba(120, 120, 128, 0.25) !important;
      border: 1px solid rgba(120, 120, 128, 0.15) !important;
      border-radius: 22px !important;
      outline: none !important;
      cursor: pointer !important;
      transition: background-color 0.2s ease, border-color 0.2s ease !important;
      display: inline-block !important;
      margin: 0 !important;
    }
    input[data-setting-key][type="checkbox"]:checked {
      background-color: var(--b3-theme-primary, #007aff) !important;
      border-color: var(--b3-theme-primary, #007aff) !important;
    }
    input[data-setting-key][type="checkbox"]::after {
      content: "" !important;
      position: absolute !important;
      top: 2px !important;
      left: 2px !important;
      width: 16px !important;
      height: 16px !important;
      border-radius: 50% !important;
      background-color: #ffffff !important;
      transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.25) !important;
    }
    input[data-setting-key][type="checkbox"]:checked::after {
      transform: translateX(20px) !important;
      background-color: #ffffff !important;
    }
  `
  document.head.appendChild(style)
}
