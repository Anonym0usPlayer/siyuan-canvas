import type { CanvasNode, CanvasEdge } from "@/canvas/types"
import { resolveCanvasFileTarget } from "@/canvas/file-target-resolution"
import {
  findSiyuanAssetByPath,
  findSiyuanBlockById,
  findSiyuanDocumentByBlockId,
  findSiyuanDocumentByPath,
  findSiyuanImageAssetByBlockId,
  getSiyuanBlockMarkdown,
  getSiyuanHeadingBlockMarkdown,
  getSiyuanDocumentMarkdown,
} from "@/canvas/siyuan-kernel-file-node-lookups"

// Siyuan lookups for file target resolution
const resolveLookups = {
  resolveBlockById: async (blockId: string) => {
    const block = await findSiyuanBlockById(blockId)
    return block ? { ...block, kind: 'block' as const } : null
  },
  resolveCanvasByPath: async (path: string) => (
    path.trim().endsWith('.canvas')
      ? { kind: 'canvas' as const, path, title: path.replace(/\\/g, '/').split('/').at(-1) || path }
      : null
  ),
  resolveDocumentByBlockId: async (blockId: string) => {
    const document = await findSiyuanDocumentByBlockId(blockId)
    return document ? { ...document, kind: 'document' as const } : null
  },
  resolveDocumentByPath: async (path: string) => {
    const document = await findSiyuanDocumentByPath(path)
    return document ? { ...document, kind: 'document' as const } : null
  },
  resolveImageByBlockId: async (blockId: string) => {
    const image = await findSiyuanImageAssetByBlockId(blockId)
    return image ? { blockId: image.blockId || blockId, kind: 'image' as const, openPath: image.openPath, path: image.path, title: image.title || image.name } : null
  },
  resolveImageByPath: async (path: string) => {
    const image = await findSiyuanAssetByPath(path)
    return image ? { blockId: image.blockId, kind: 'image' as const, openPath: image.openPath, path: image.path, title: image.title || image.name } : null
  },
}

export interface CollectedContextNode {
  id: string
  type: string
  title: string
  content: string
  depth: number
}

/**
 * BFS algorithm to trace back upstream connected nodes of a target node.
 */
export async function collectUpstreamContext(
  targetNodeId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  maxDepth: number,
  maxCards: number
): Promise<{
  collected: CollectedContextNode[]
  relations: string[]
  targetNode: CollectedContextNode | null
}> {
  const collected: CollectedContextNode[] = []
  const relations: string[] = []
  const visited = new Set<string>([targetNodeId])

  // BFS Queue: { nodeId: string, depth: number }
  const queue: { id: string; depth: number }[] = [{ id: targetNodeId, depth: 0 }]
  let targetNode: CollectedContextNode | null = null

  // Helper to extract content of a node
  async function getNodeContent(node: CanvasNode): Promise<{ title: string; content: string }> {
    if (node.type === "text") {
      return { title: "文本卡片", content: node.text || "" }
    } else if (node.type === "file") {
      try {
        const resolved = await resolveCanvasFileTarget(node.file, resolveLookups)
        if (resolved.kind === "block") {
          const isHeading = resolved.type === "h"
          const markdown = isHeading
            ? await getSiyuanHeadingBlockMarkdown(resolved.id)
            : await getSiyuanBlockMarkdown(resolved.id)
          return { title: resolved.title || "思源块", content: markdown }
        } else if (resolved.kind === "document") {
          const markdown = await getSiyuanDocumentMarkdown(resolved.id)
          return { title: resolved.title || "思源文档", content: markdown }
        }
        return { title: resolved.title || "文件卡片", content: `[不支持的卡片类型: ${resolved.kind}]` }
      } catch (err) {
        console.error(`[AI Search] Failed to resolve file node ${node.id}:`, err)
        return { title: "笔记卡片(解析失败)", content: `[解析路径为 ${node.file} 的卡片内容失败]` }
      }
    }
    return { title: "画布卡片", content: `[暂不支持的内容类型: ${node.type}]` }
  }

  // Find target node first to populate targetNode info
  const rawTargetNode = nodes.find((n) => n.id === targetNodeId)
  if (rawTargetNode) {
    const { title, content } = await getNodeContent(rawTargetNode)
    targetNode = {
      id: targetNodeId,
      type: rawTargetNode.type,
      title,
      content,
      depth: 0,
    }
  }

  while (queue.length > 0 && collected.length < maxCards) {
    const curr = queue.shift()!
    
    // Process upstream nodes (skip targetNode itself for collected output)
    if (curr.id !== targetNodeId) {
      const node = nodes.find((n) => n.id === curr.id)
      if (node && (node.type === "text" || node.type === "file")) {
        const { title, content } = await getNodeContent(node)
        collected.push({
          id: node.id,
          type: node.type,
          title,
          content,
          depth: curr.depth,
        })
        if (collected.length >= maxCards) {
          break
        }
      }
    }

    if (curr.depth < maxDepth) {
      // Find all incoming edges to curr.id (which means: edge.toNode === curr.id)
      const incomingEdges = edges.filter((e) => e.toNode === curr.id)
      for (const edge of incomingEdges) {
        if (!visited.has(edge.fromNode)) {
          visited.add(edge.fromNode)
          queue.push({ id: edge.fromNode, depth: curr.depth + 1 })
          
          // Log relation: nodeFrom -> nodeTo
          const fromNodeObj = nodes.find((n) => n.id === edge.fromNode)
          const toNodeObj = nodes.find((n) => n.id === edge.toNode)
          if (fromNodeObj && toNodeObj) {
            relations.push(`卡片 "${fromNodeObj.id}" (${fromNodeObj.type === "text" ? "文本" : "笔记"}) -> 指向 -> 卡片 "${toNodeObj.id}" (${toNodeObj.type === "text" ? "文本" : "笔记"})`)
          }
        }
      }
    }
  }

  return {
    collected,
    relations,
    targetNode,
  }
}

export interface AiSearchCardResult {
  content: string
}

export interface AiSearchResponse {
  cards: AiSearchCardResult[]
}

/**
 * Request LLM API to perform AI exploration
 */
export async function requestAiSearch(options: {
  collected: CollectedContextNode[]
  relations: string[]
  targetNode: CollectedContextNode
  apiConfig: {
    provider: string
    baseUrl: string
    apiKey: string
    model: string
    requestTimeoutSeconds: number
    temperature: number
    maxTokens: number
  }
  richness: "simple" | "medium" | "detailed"
  cardCount: number
}): Promise<AiSearchResponse> {
  const { collected, relations, targetNode, apiConfig, richness, cardCount } = options
  const { baseUrl, apiKey, model, requestTimeoutSeconds, temperature, maxTokens } = apiConfig

  if (!baseUrl || !model) {
    throw new Error("Missing API Configuration (baseUrl or model)")
  }

  // Construct system prompt
  const systemPrompt = `你是一个思维导图和画布探索的 AI 助手。你的任务是根据用户提供的节点以及前序连线相关节点的上下文内容，针对当前选中的节点进行主题下钻、关联问题提出或关联知识点的探索。
请根据用户设定的卡片数量以及内容丰富度需求，自动生成关联的子文本卡片内容。

输出格式必须为合法 JSON，绝对不要包含任何多余文字或解释，格式必须严格如下（包含顶层 "cards" 键）：
{
  "cards": [
    {
      "content": "新生成的关联卡片内容（可以使用 Markdown）"
    }
  ]
}

约束要求：
1. 必须使用指定的 JSON 结构，顶层键必须为 "cards"。禁止直接输出类似 {"content": "..."} 的结构，即使只生成 1 个卡片，也必须将其包裹在 "cards" 数组中。
2. **严格数量限制**："cards" 数组中的元素数量必须**正好且最多**等于指定的生成卡片数量：${cardCount} 个。绝对不能私自生成额外的卡片，否则会导致系统截断报错。
3. 丰富度要求为 "${richness}"：
   - "simple" (简洁): 每张卡片内容非常精炼，约 30-50 字内，1-2 句核心观点或直接回答。
   - "medium" (适中): 每张卡片内容包含对主题的适度阐述，约 100-150 字左右，结构清晰。
   - "detailed" (丰富): 每张卡片内容进行深度下钻，使用丰富的 Markdown 格式（如列表、粗体、分点说明），字数在 250 字以上。`

  // Construct user prompt
  let contextRelations = "无前序连线卡片。"
  if (relations.length > 0) {
    contextRelations = relations.join("\n")
  }

  let nodeDetails = ""
  if (collected.length > 0) {
    nodeDetails = "【前序上下文卡片详情】\n" + collected.map((c) => (
      `卡片 ID: "${c.id}"
类型: ${c.type === "text" ? "文本卡片" : "笔记卡片"} (标题: ${c.title})
深度: ${c.depth}
内容:
${c.content}
---`
    )).join("\n")
  }

  const userPrompt = `[上下文节点连线关系]
${contextRelations}
 
${nodeDetails}
 
【当前选中卡片详情】
卡片 ID: "${targetNode.id}"
类型: ${targetNode.type === "text" ? "文本卡片" : "笔记卡片"} (标题: ${targetNode.title})
内容:
${targetNode.content}
 
请根据以上上下文和当前选中的卡片，进行 AI 探索。生成 ${cardCount} 个直接相连且有深度的关联卡片内容，丰富度要求为 "${richness}"。只能输出 JSON，且必须严格遵循包含 "cards" 数组的顶层格式，禁止直接输出以 "content" 为顶层键的结构。
【警告】必须且只能生成恰好 ${cardCount} 个卡片，绝对不要多于 ${cardCount} 个，请合理控制输出，防止生成内容过长被截断！`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`
  }

  const requestBody = {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: temperature ?? 0.7,
    max_tokens: maxTokens ?? 2048,
    response_format: { type: "json_object" }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), (requestTimeoutSeconds ?? 30) * 1000)

  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error("Received empty response content from LLM API")
    }

    // Parse the JSON response
    // Strip markdown code block wrappers if any
    const cleanContent = content.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim()

    // 助手函数：在常规 JSON 解析失败或数据缺失时，尝试通过正则抢救大模型已生成的卡片内容
    function tryExtractCardsFallback(text: string): AiSearchResponse | null {
      const cards: { content: string }[] = []
      // 匹配 "content" 或 "text" 属性值，支持转义字符
      const pattern = /"(?:content|text)"\s*:\s*"((?:[^"\\]|\\.)*)"/g
      let match
      while ((match = pattern.exec(text)) !== null) {
        try {
          const decoded = JSON.parse(`"${match[1]}"`)
          if (decoded && typeof decoded === 'string' && decoded.trim()) {
            cards.push({ content: decoded })
          }
        } catch (e) {
          if (match[1] && match[1].trim()) {
            cards.push({ content: match[1] })
          }
        }
      }
      return cards.length > 0 ? { cards } : null
    }

    try {
      let parsed: any
      try {
        parsed = JSON.parse(cleanContent)
      } catch (parseErr) {
        // 常规 JSON 解析失败（如未闭合的字符串或非法格式），尝试使用正则挽救内容
        const fallbackResult = tryExtractCardsFallback(cleanContent)
        if (fallbackResult) {
          return fallbackResult
        }
        throw parseErr
      }

      // 容错与结构标准化
      if (parsed && typeof parsed === "object") {
        // 情况 1: 如果大模型直接返回了形如 {"content": "..."} 的对象
        if (!parsed.cards && typeof parsed.content === "string") {
          parsed = {
            cards: [{ content: parsed.content }]
          }
        }
        // 情况 2: 如果大模型直接返回了一个数组，形如 [{"content": "..."}]
        else if (Array.isArray(parsed)) {
          parsed = {
            cards: parsed.map((item: any) => {
              if (item && typeof item === "object" && typeof item.content === "string") {
                return { content: item.content }
              }
              return { content: typeof item === "string" ? item : JSON.stringify(item) }
            })
          }
        }
        // 情况 3: 如果包含 cards，但 cards 不是数组
        else if (parsed.cards && !Array.isArray(parsed.cards)) {
          if (typeof parsed.cards === "string") {
            parsed.cards = [{ content: parsed.cards }]
          } else if (typeof parsed.cards === "object" && typeof parsed.cards.content === "string") {
            parsed.cards = [{ content: parsed.cards.content }]
          } else {
            parsed.cards = [{ content: JSON.stringify(parsed.cards) }]
          }
        }
      }

      if (!parsed || !parsed.cards || !Array.isArray(parsed.cards)) {
        // 尝试用 fallback 挽救
        const fallbackResult = tryExtractCardsFallback(cleanContent)
        if (fallbackResult) {
          return fallbackResult
        }
        throw new Error("Missing 'cards' array in LLM response JSON")
      }
      return parsed as AiSearchResponse
    } catch (parseErr) {
      console.error("[AI Search] Failed to parse LLM JSON response:", cleanContent, parseErr)
      throw new Error("大模型响应格式解析 JSON 失败：" + String(parseErr))
    }
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === "AbortError") {
      throw new Error("API 请求超时")
    }
    throw err
  }
}
