/**
 * 节点内容尺寸测量与自适应计算模块
 * 负责测量卡片内部内容（如 Mermaid 流程图 SVG、ECharts 图表、Markdown 表格/文本）
 * 并根据设定的上下限计算适合的卡片宽高。
 */

export interface NodeMeasurementOptions {
  /** 最小宽度，默认 320px */
  minWidth?: number
  /** 最小高度，默认 180px */
  minHeight?: number
  /** 最大宽度上限，默认 960px */
  maxWidth?: number
  /** 最大高度上限，默认 720px */
  maxHeight?: number
  /** 水平方向额外内边距/外边距总和，默认 28px */
  paddingX?: number
  /** 垂直方向额外内边距总和，默认 28px */
  paddingY?: number
  /** 顶部标题栏高度，默认 36px */
  headerHeight?: number
  /** 预留安全缓冲，防止浮点微小舍入误差出现不必要的滚动条，默认 12px */
  safetyMargin?: number
}

export const DEFAULT_MIN_NODE_WIDTH = 320
export const DEFAULT_MIN_NODE_HEIGHT = 180
export const DEFAULT_MAX_NODE_WIDTH = 960
export const DEFAULT_MAX_NODE_HEIGHT = 720

/**
 * 测量给定节点 DOM 元素内部内容所需的理想宽度和高度
 */
export function measureNodeContentSize(
  nodeElement: HTMLElement | null | undefined,
  currentWidth: number,
  currentHeight: number,
  options: NodeMeasurementOptions = {},
): { width: number, height: number } {
  if (!nodeElement) {
    return { width: currentWidth, height: currentHeight }
  }

  const {
    minWidth = DEFAULT_MIN_NODE_WIDTH,
    minHeight = DEFAULT_MIN_NODE_HEIGHT,
    maxWidth = DEFAULT_MAX_NODE_WIDTH,
    maxHeight = DEFAULT_MAX_NODE_HEIGHT,
    paddingX = 28,
    paddingY = 28,
    headerHeight = 36,
    safetyMargin = 12,
  } = options

  let contentWidth = 0
  let contentHeight = 0

  // 1. 特殊检测 Mermaid 流程图（查找已渲染生成的 SVG）
  const mermaidSvg = nodeElement.querySelector<SVGSVGElement>(
    '[data-subtype="mermaid"] svg, [data-type="NodeCodeBlock"][data-subtype="mermaid"] svg, .language-mermaid svg',
  )

  if (mermaidSvg) {
    let svgWidth = 0
    let svgHeight = 0

    // 优先尝试 getBBox
    try {
      if (typeof mermaidSvg.getBBox === 'function') {
        const bbox = mermaidSvg.getBBox()
        if (bbox && bbox.width > 0 && bbox.height > 0) {
          svgWidth = bbox.width
          svgHeight = bbox.height
        }
      }
    } catch {
      // getBBox 在某些未挂载或特殊环境下可能抛异常，静默降级
    }

    // 次选 getBoundingClientRect
    if (!svgWidth || !svgHeight) {
      const rect = mermaidSvg.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        svgWidth = rect.width
        svgHeight = rect.height
      }
    }

    // 备选 viewBox
    if (!svgWidth || !svgHeight) {
      const viewBoxAttr = mermaidSvg.getAttribute('viewBox')
      if (viewBoxAttr) {
        const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number)
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          svgWidth = parts[2]
          svgHeight = parts[3]
        }
      }
    }

    // 备选 width / height 属性
    if (!svgWidth || !svgHeight) {
      const attrW = parseFloat(mermaidSvg.getAttribute('width') || '0')
      const attrH = parseFloat(mermaidSvg.getAttribute('height') || '0')
      if (attrW > 0) svgWidth = attrW
      if (attrH > 0) svgHeight = attrH
    }

    if (svgWidth > 0 && svgHeight > 0) {
      contentWidth = svgWidth + paddingX + safetyMargin
      contentHeight = svgHeight + headerHeight + paddingY + safetyMargin
    }
  }

  // 2. 特殊检测 ECharts 图表
  if (!contentWidth || !contentHeight) {
    const echartsContainer = nodeElement.querySelector<HTMLElement>(
      '[data-subtype="echarts"], [data-subtype="chart"], [data-type="NodeCodeBlock"][data-subtype="echarts"]',
    )
    if (echartsContainer) {
      // ECharts 图表推荐舒适尺寸为 560x360（加上 header 约为 560x400）
      const chartWidth = Math.max(currentWidth, 560)
      const chartHeight = Math.max(currentHeight, 360)
      contentWidth = chartWidth
      contentHeight = chartHeight + headerHeight
    }
  }

  // 3. 通用 Markdown 文本/表格/列表等内容测量
  if (!contentWidth || !contentHeight) {
    const previewEl = nodeElement.querySelector<HTMLElement>('.file-card__document-preview, .markdown-preview, .canvas-node__body')
    if (previewEl) {
      // 使用 scrollWidth 和 scrollHeight
      let measuredW = previewEl.scrollWidth
      let measuredH = previewEl.scrollHeight

      // 遍历直接子元素（如大表格 table、代码块 pre）计算最大包围
      const directChildren = previewEl.children
      for (let i = 0; i < directChildren.length; i++) {
        const child = directChildren[i] as HTMLElement
        if (child) {
          measuredW = Math.max(measuredW, child.scrollWidth || 0, child.offsetWidth || 0)
          measuredH = Math.max(measuredH, child.offsetTop + (child.offsetHeight || 0))
        }
      }

      if (measuredW > 0 && measuredH > 0) {
        contentWidth = measuredW + paddingX + safetyMargin
        contentHeight = measuredH + headerHeight + paddingY + safetyMargin
      }
    }
  }

  // 若测量失败，回退到当前尺寸
  if (!contentWidth || !contentHeight) {
    return { width: currentWidth, height: currentHeight }
  }

  // 4. 上下限限制（Clamp）
  // 保证不低于下限，且不超过上限。超出上限的内容通过内部 overflow: auto 滚动展示
  const clampedWidth = Math.round(Math.min(maxWidth, Math.max(minWidth, contentWidth)))
  const clampedHeight = Math.round(Math.min(maxHeight, Math.max(minHeight, contentHeight)))

  return {
    width: clampedWidth,
    height: clampedHeight,
  }
}
