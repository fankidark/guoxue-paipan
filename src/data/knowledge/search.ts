/**
 * 知识库搜索引擎
 * 前端全文检索，支持关键词/标题/内容/标签搜索
 */
import type { KnowledgeModule, KnowledgeEntry, KnowledgeChapter, SearchResult } from './types'

// 全局知识库数据（懒加载填充）
let modules: KnowledgeModule[] = []

export function registerModule(mod: KnowledgeModule) {
  // 去重
  const idx = modules.findIndex(m => m.id === mod.id)
  if (idx >= 0) modules[idx] = mod
  else modules.push(mod)
}

export function getModules(): KnowledgeModule[] {
  return modules
}

export function getEntryById(fullId: string): { entry: KnowledgeEntry; chapter: KnowledgeChapter; module: KnowledgeModule } | null {
  // fullId格式: moduleId/chapterId/entryId
  const [modId, chapId, entryId] = fullId.split('/')
  const mod = modules.find(m => m.id === modId)
  if (!mod) return null
  const chap = mod.chapters.find(c => c.id === chapId)
  if (!chap) return null
  const entry = chap.entries.find(e => e.id === entryId)
  if (!entry) return null
  return { entry, chapter: chap, module: mod }
}

/**
 * 搜索知识库
 * @param query 搜索词（支持空格分词，所有词必须匹配）
 * @param options 可选：模块过滤、标签过滤、限制数量
 */
export function searchKnowledge(
  query: string,
  options?: { moduleId?: string; tag?: string; limit?: number }
): SearchResult[] {
  if (!query.trim()) return []
  
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const results: SearchResult[] = []
  const limit = options?.limit || 30
  
  const targetModules = options?.moduleId 
    ? modules.filter(m => m.id === options.moduleId) 
    : modules

  for (const mod of targetModules) {
    for (const chap of mod.chapters) {
      for (const entry of chap.entries) {
        // 标签过滤
        if (options?.tag && !entry.tags?.includes(options.tag)) continue
        
        // 构建搜索文本
        const titleLower = entry.title.toLowerCase()
        const keywordsStr = entry.keywords.join(' ').toLowerCase()
        const summaryLower = entry.summary.toLowerCase()
        const contentLower = entry.content.toLowerCase()
        const tagsStr = (entry.tags || []).join(' ').toLowerCase()
        
        // 所有搜索词都必须在某个字段中匹配
        const allTermsMatch = terms.every(term => 
          titleLower.includes(term) || 
          keywordsStr.includes(term) || 
          summaryLower.includes(term) || 
          contentLower.includes(term) ||
          tagsStr.includes(term)
        )
        
        if (!allTermsMatch) continue
        
        // 确定主匹配字段（优先级：标题 > 关键词 > 摘要 > 内容）
        let matchField: SearchResult['matchField'] = 'content'
        if (terms.some(t => titleLower.includes(t))) matchField = 'title'
        else if (terms.some(t => keywordsStr.includes(t))) matchField = 'keywords'
        else if (terms.some(t => summaryLower.includes(t))) matchField = 'summary'
        
        // 生成高亮片段
        let highlight = entry.summary
        if (matchField === 'content') {
          // 从正文中提取包含关键词的片段
          const idx = contentLower.indexOf(terms[0])
          if (idx >= 0) {
            const start = Math.max(0, idx - 20)
            const end = Math.min(entry.content.length, idx + 60)
            highlight = (start > 0 ? '...' : '') + entry.content.slice(start, end) + (end < entry.content.length ? '...' : '')
          }
        }
        
        results.push({ entry, chapter: chap, module: mod, matchField, highlight })
        
        if (results.length >= limit) return results
      }
    }
  }
  
  // 排序：标题匹配 > 关键词 > 摘要 > 内容
  const priority = { title: 0, keywords: 1, summary: 2, content: 3 }
  results.sort((a, b) => priority[a.matchField] - priority[b.matchField])
  
  return results
}

/**
 * 获取所有标签（用于筛选面板）
 */
export function getAllTags(): string[] {
  const tagSet = new Set<string>()
  for (const mod of modules) {
    for (const chap of mod.chapters) {
      for (const entry of chap.entries) {
        entry.tags?.forEach(t => tagSet.add(t))
      }
    }
  }
  return Array.from(tagSet).sort()
}

/**
 * 按标题查找条目（wiki link [[标题]] 解析用）
 * 支持别名：标题精确匹配 > 标题包含
 */
export function getEntryByTitle(title: string): { entry: KnowledgeEntry; chapter: KnowledgeChapter; module: KnowledgeModule } | null {
  const t = title.trim()
  let fuzzy: { entry: KnowledgeEntry; chapter: KnowledgeChapter; module: KnowledgeModule } | null = null
  for (const mod of modules) {
    for (const chap of mod.chapters) {
      for (const entry of chap.entries) {
        if (entry.title === t) return { entry, chapter: chap, module: mod }
        if (!fuzzy && (entry.title.includes(t) || t.includes(entry.title))) {
          fuzzy = { entry, chapter: chap, module: mod }
        }
      }
    }
  }
  return fuzzy
}

/**
 * 反向链接：找出所有正文中 [[引用]] 了目标条目的条目（Obsidian backlinks）
 */
export function getBacklinks(target: KnowledgeEntry): { entry: KnowledgeEntry; chapter: KnowledgeChapter; module: KnowledgeModule }[] {
  const results: { entry: KnowledgeEntry; chapter: KnowledgeChapter; module: KnowledgeModule }[] = []
  for (const mod of modules) {
    for (const chap of mod.chapters) {
      for (const entry of chap.entries) {
        if (entry.id === target.id) continue
        // [[title]] 或 [[title|display]] 引用，或 terms 显式引用
        const linkRe = new RegExp(`\\[\\[${target.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\|[^\\]]*)?\\]\\]`)
        const hasWiki = linkRe.test(entry.content)
        const hasTerm = entry.terms?.some(tr => tr.term === target.title)
        if (hasWiki || hasTerm) results.push({ entry, chapter: chap, module: mod })
        if (results.length >= 12) return results
      }
    }
  }
  return results
}
