/**
 * 思源 Protyle 原生渲染工具
 * 负责在 DOM 挂载/更新后调度思源前台原生的 Protyle 渲染器（如 mermaid 流程图、MathJax、Flowchart 等），
 * 并提供包含 Mermaid SVG 流程图直绘保底的多重原生渲染能力。
 */

/**
 * 解转义 HTML 实体字符串，恢复 raw 源码
 */
export function unescapeHtmlEntities(str: string): string {
  if (!str) {
    return ''
  }

  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#10;/g, '\n')
    .replace(/\r\n?/g, '\n')
}

/**
 * 动态获取或初始化全局 Mermaid 渲染引擎
 */
async function getOrInitMermaid(): Promise<any> {
  if (typeof window === 'undefined') {
    return null
  }

  const win = window as any

  if (win.mermaid && typeof win.mermaid.render === 'function') {
    return win.mermaid
  }

  if (typeof document !== 'undefined' && document.head) {
    return new Promise((resolve) => {
      const scriptId = 'siyuan-canvas-mermaid-js'
      let script = document.getElementById(scriptId) as HTMLScriptElement | null
      if (!script) {
        script = document.createElement('script')
        script.id = scriptId

        const baseUrl = win.location?.origin || ''
        const scriptUrl = `${baseUrl}/stage/protyle/js/mermaid/mermaid.min.js`

        script.src = scriptUrl
        script.onload = () => {
          if (win.mermaid) {
            try {
              win.mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' })
            } catch (e) {
              console.warn('[siyuan-canvas] win.mermaid.initialize warning:', e)
            }
            resolve(win.mermaid)
          } else {
            resolve(null)
          }
        }
        script.onerror = (err) => {
          console.warn(`[siyuan-canvas] Failed to load mermaid script: ${scriptUrl}`, err)
          resolve(null)
        }
        document.head.appendChild(script)
      } else {
        let attempts = 0
        const timer = setInterval(() => {
          attempts++
          if (win.mermaid && typeof win.mermaid.render === 'function') {
            clearInterval(timer)
            resolve(win.mermaid)
          } else if (attempts > 20) {
            clearInterval(timer)
            resolve(null)
          }
        }, 100)
      }
    })
  }

  return null
}

/**
 * 渲染 Mermaid 流程图（包含思源 NodeCodeBlock 与标准代码块）
 */
export async function renderMermaidBlocksDirectly(container: HTMLElement): Promise<void> {
  if (!container || typeof container.querySelectorAll !== 'function') {
    return
  }

  const mermaidNodes = container.querySelectorAll<HTMLElement>(
    '[data-subtype="mermaid"], [data-type="NodeCodeBlock"][data-subtype="mermaid"], .language-mermaid',
  )

  if (mermaidNodes.length === 0) {
    return
  }

  const protyleApi = typeof window !== 'undefined' ? ((window as any).Protyle || (window as any).siyuan?.Protyle) : null

  // 1. 尝试优先使用思源原生 Protyle.mermaidRender
  if (protyleApi && typeof protyleApi.mermaidRender === 'function') {
    try {
      protyleApi.mermaidRender(container, 'stage/protyle')
    } catch (err) {
      console.warn('[siyuan-canvas] Protyle.mermaidRender error:', err)
    }
  }

  // 2. 检查是否有节点未成功生成 SVG，使用直绘保底机制
  const mermaid = await getOrInitMermaid()

  for (let i = 0; i < mermaidNodes.length; i++) {
    const node = mermaidNodes[i]!
    const hasSvg = !!node.querySelector('svg')
    const renderedAttr = node.getAttribute('data-mermaid-rendered')

    if (renderedAttr === 'true' && hasSvg) {
      continue
    }

    const rawDataContent = node.getAttribute('data-content')
    let code = rawDataContent ? unescapeHtmlEntities(rawDataContent) : node.textContent || ''
    code = code.trim()

    if (!code) {
      continue
    }

    if (mermaid && typeof mermaid.render === 'function') {
      const uniqueId = `mermaid-canvas-${Math.random().toString(36).slice(2)}-${i}`
      try {
        const renderResult = await mermaid.render(uniqueId, code)
        const svgHtml = typeof renderResult === 'string' ? renderResult : renderResult?.svg
        if (svgHtml) {
          node.innerHTML = svgHtml
          node.setAttribute('data-mermaid-rendered', 'true')
          const svgEl = node.querySelector('svg')
          if (svgEl) {
            svgEl.style.maxWidth = '100%'
            svgEl.style.height = 'auto'
            svgEl.style.display = 'block'
            svgEl.style.margin = '0 auto'
          }
        }
      } catch (err) {
        console.warn('[siyuan-canvas] Direct mermaid.render failed:', err)
      }
    }
  }
}

/**
 * 触发多重原生的 Protyle 渲染器
 */
export function triggerNativeProtyleRender(container: HTMLElement | null | undefined): void {
  if (!container || typeof window === 'undefined' || typeof container.querySelector !== 'function') {
    return
  }

  // 1. 异步触发 Mermaid 流程图原生渲染
  void renderMermaidBlocksDirectly(container)

  // 快速短路检查：如果 DOM 容器内不包含任何需要渲染的 data-subtype 属性，直接返回
  if (!container.querySelector('[data-subtype]')) {
    return
  }

  const protyleApi = (window as any).Protyle || (window as any).siyuan?.Protyle
  if (!protyleApi) {
    return
  }

  const cdnPath = 'stage/protyle'

  // 2. 原生 MathJax 数学公式渲染
  if (
    typeof protyleApi.mathRender === 'function' &&
    container.querySelector('[data-subtype="math"]')
  ) {
    try {
      protyleApi.mathRender(container, cdnPath)
    } catch (error) {
      console.warn('[siyuan-canvas] Trigger Protyle.mathRender failed:', error)
    }
  }

  // 3. 原生 Flowchart 流程图渲染
  if (
    typeof protyleApi.flowchartRender === 'function' &&
    container.querySelector('[data-subtype="flowchart"]')
  ) {
    try {
      protyleApi.flowchartRender(container, cdnPath)
    } catch (error) {
      console.warn('[siyuan-canvas] Trigger Protyle.flowchartRender failed:', error)
    }
  }

  // 4. 原生 Mindmap 思维导图渲染
  if (
    typeof protyleApi.mindmapRender === 'function' &&
    container.querySelector('[data-subtype="mindmap"]')
  ) {
    try {
      protyleApi.mindmapRender(container, cdnPath)
    } catch (error) {
      console.warn('[siyuan-canvas] Trigger Protyle.mindmapRender failed:', error)
    }
  }

  // 5. 原生 Graphviz 渲染
  if (
    typeof protyleApi.graphvizRender === 'function' &&
    container.querySelector('[data-subtype="graphviz"]')
  ) {
    try {
      protyleApi.graphvizRender(container, cdnPath)
    } catch (error) {
      console.warn('[siyuan-canvas] Trigger Protyle.graphvizRender failed:', error)
    }
  }

  // 6. 原生 ECharts 图表渲染
  if (
    typeof protyleApi.chartRender === 'function' &&
    container.querySelector('[data-subtype="echarts"]')
  ) {
    try {
      protyleApi.chartRender(container, cdnPath)
    } catch (error) {
      console.warn('[siyuan-canvas] Trigger Protyle.chartRender failed:', error)
    }
  }
}
