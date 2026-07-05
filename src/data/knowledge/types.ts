/**
 * 知识库数据类型定义
 * 
 * 设计原则：
 * - 每个知识条目(KnowledgeEntry)是最小可搜索单元
 * - 支持术语互引(terms → 跳转到对应条目)
 * - 支持备注说明(notes)
 * - 按模块(module) → 章节(chapter) → 条目(entry) 三级结构
 */

// 术语引用：文中出现的专业术语，点击可跳转
export interface TermRef {
  term: string       // 术语文字
  targetId: string   // 目标条目ID（格式：module/chapter/entryId）
}

// 知识条目：最小可搜索/可展示单元
export interface KnowledgeEntry {
  id: string              // 唯一ID
  title: string           // 标题（如"天蓬星"、"木生火"）
  keywords: string[]      // 搜索关键词
  summary: string         // 一句话摘要（搜索结果展示用）
  content: string         // 正文（markdown格式，支持表格/列表）
  notes?: string          // 备注说明
  terms?: TermRef[]       // 文中术语引用
  tags?: string[]         // 标签（如"吉星"、"水"、"凶门"）
}

// 章节
export interface KnowledgeChapter {
  id: string              // 如 "jiuxing"
  title: string           // 如 "九星"
  desc: string            // 简述
  entries: KnowledgeEntry[]
}

// 模块
export interface KnowledgeModule {
  id: string              // 如 "basics"
  title: string           // 如 "基础知识"
  icon: string            // emoji图标
  chapters: KnowledgeChapter[]
}

// 搜索结果
export interface SearchResult {
  entry: KnowledgeEntry
  chapter: KnowledgeChapter
  module: KnowledgeModule
  matchField: 'title' | 'keywords' | 'content' | 'summary'
  highlight?: string     // 匹配片段
}
