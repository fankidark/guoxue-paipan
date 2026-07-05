import { useState, useEffect, useMemo } from 'react'
import { MOD_BASICS } from '../data/knowledge/mod-basics'
import { registerModule, searchKnowledge, getModules } from '../data/knowledge/search'
import type { KnowledgeEntry, KnowledgeChapter, KnowledgeModule, SearchResult } from '../data/knowledge/types'

// 注册所有模块
registerModule(MOD_BASICS)

// 五行颜色
const WX_COLOR: Record<string, string> = {
  '木': 'text-green-400', '火': 'text-red-400', '土': 'text-amber-600',
  '金': 'text-yellow-400', '水': 'text-blue-400',
}

const TAG_COLORS: Record<string, string> = {
  '重要': 'bg-red-900/40 text-red-400',
  '基础': 'bg-blue-900/30 text-blue-400',
  '三奇': 'bg-purple-900/30 text-purple-400',
  '六仪': 'bg-amber-900/30 text-amber-400',
  '天网': 'bg-gray-700/50 text-gray-300',
  '速查': 'bg-green-900/30 text-green-400',
}

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeEntry, setActiveEntry] = useState<KnowledgeEntry | null>(null)
  const [history, setHistory] = useState<KnowledgeEntry[]>([])
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [activeModuleFilter, setActiveModuleFilter] = useState<string | null>(null)

  const modules = getModules()
  
  // 搜索结果
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchKnowledge(searchQuery, { moduleId: activeModuleFilter || undefined })
  }, [searchQuery, activeModuleFilter])

  // 打开条目（记录历史）
  function openEntry(entry: KnowledgeEntry) {
    if (activeEntry?.id !== entry.id) {
      setHistory(prev => {
        const filtered = prev.filter(e => e.id !== entry.id)
        return [entry, ...filtered].slice(0, 20)
      })
    }
    setActiveEntry(entry)
    setSearchQuery('')
  }

  // 返回上一个
  function goBack() {
    if (history.length > 1) {
      const prev = history[1]
      setHistory(h => h.slice(1))
      setActiveEntry(prev)
    } else {
      setActiveEntry(null)
    }
  }

  // 切换章节展开
  function toggleChapter(chapId: string) {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapId)) next.delete(chapId)
      else next.add(chapId)
      return next
    })
  }

  // 详情页面
  if (activeEntry) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {/* 返回按钮 + 面包屑 */}
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="px-2 py-1 rounded bg-dark-800 text-dark-300 text-xs hover:bg-dark-700">
            ← 返回
          </button>
          {history.length > 1 && (
            <span className="text-[10px] text-dark-500">历史 {history.length} 条</span>
          )}
        </div>

        {/* 标题 + 标签 */}
        <div>
          <h2 className="text-lg font-bold text-dark-100">{activeEntry.title}</h2>
          {activeEntry.tags && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {activeEntry.tags.map(tag => (
                <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded ${TAG_COLORS[tag] || 'bg-dark-700 text-dark-400'}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-dark-400 mt-1">{activeEntry.summary}</p>
        </div>

        {/* 正文 */}
        <div className="card prose-sm">
          <div className="text-xs text-dark-300 leading-relaxed whitespace-pre-wrap">
            {activeEntry.content.split('\n').map((line, i) => {
              // 简单markdown渲染
              if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-dark-200 mt-3 mb-1">{line.slice(3)}</h3>
              if (line.startsWith('- **')) {
                const match = line.match(/^- \*\*(.+?)\*\*[：:](.*)/)
                if (match) return <div key={i} className="ml-2"><span className="text-dark-200 font-medium">{match[1]}</span>：<span className="text-dark-400">{match[2]}</span></div>
              }
              if (line.startsWith('- ')) return <div key={i} className="ml-2 text-dark-400">• {line.slice(2)}</div>
              if (line.startsWith('> ')) return <div key={i} className="border-l-2 border-purple-500/50 pl-2 my-1 text-dark-400 italic">{line.slice(2)}</div>
              if (line.startsWith('|')) return <div key={i} className="text-[10px] text-dark-400 font-mono">{line}</div>
              if (line.startsWith('**') && line.endsWith('**')) return <div key={i} className="text-dark-200 font-bold mt-2">{line.slice(2, -2)}</div>
              if (line.trim() === '') return <div key={i} className="h-1" />
              return <div key={i} className="text-dark-400">{line}</div>
            })}
          </div>
        </div>

        {/* 备注 */}
        {activeEntry.notes && (
          <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
            <div className="text-[10px] text-amber-400 font-medium mb-1">📝 备注</div>
            <div className="text-xs text-amber-200/80">{activeEntry.notes}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* 标题 */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-dark-200">奇门遁甲知识库</h2>
        <p className="text-[10px] text-dark-500 mt-0.5">6大模块 · 30章节 · 全文搜索</p>
      </div>

      {/* 搜索栏 */}
      <div className="sticky top-14 z-40 bg-dark-900/95 backdrop-blur-md py-2 -mx-4 px-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索知识点...（如：庚金、相生、天蓬、十二长生）"
            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 placeholder:text-dark-500 focus:outline-none focus:border-purple-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 text-sm"
            >✕</button>
          )}
        </div>
      </div>

      {/* 搜索结果 */}
      {searchQuery && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-dark-500">{searchResults.length} 条结果</div>
          {searchResults.map((r, i) => (
            <div
              key={i}
              className="bg-dark-800/40 rounded-lg p-2.5 border border-dark-700/30 cursor-pointer hover:bg-dark-700/40 transition-colors"
              onClick={() => openEntry(r.entry)}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-dark-200">{r.entry.title}</span>
                <span className="text-[9px] text-dark-500">{r.module.icon} {r.chapter.title}</span>
              </div>
              <div className="text-[10px] text-dark-400 mt-0.5 line-clamp-1">{r.highlight || r.entry.summary}</div>
            </div>
          ))}
          {searchResults.length === 0 && (
            <div className="text-center text-xs text-dark-500 py-4">未找到匹配内容</div>
          )}
        </div>
      )}

      {/* 浏览历史 */}
      {!searchQuery && history.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-dark-500">最近查看</span>
            <button onClick={() => setHistory([])} className="text-[9px] text-dark-600 hover:text-dark-400">清除</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {history.slice(0, 8).map(e => (
              <button
                key={e.id}
                onClick={() => openEntry(e)}
                className="text-[10px] px-2 py-0.5 rounded bg-dark-800/60 text-dark-300 hover:bg-dark-700"
              >{e.title}</button>
            ))}
          </div>
        </div>
      )}

      {/* 模块目录 */}
      {!searchQuery && modules.map(mod => (
        <div key={mod.id} className="card">
          <h3 className="text-sm font-bold text-purple-400 mb-2">{mod.icon} {mod.title}</h3>
          <div className="space-y-1">
            {mod.chapters.map(chap => (
              <div key={chap.id}>
                <div
                  className="flex items-center justify-between px-2 py-1.5 rounded bg-dark-800/30 hover:bg-dark-700/40 cursor-pointer transition-colors"
                  onClick={() => toggleChapter(chap.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-dark-200">{chap.title}</span>
                    <span className="text-[9px] text-dark-500">{chap.entries.length}条</span>
                  </div>
                  <span className="text-dark-500 text-[10px]">{expandedChapters.has(chap.id) ? '▼' : '▶'}</span>
                </div>
                {expandedChapters.has(chap.id) && (
                  <div className="ml-2 mt-1 space-y-0.5">
                    {chap.entries.map(entry => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-dark-700/30 cursor-pointer transition-colors"
                        onClick={() => openEntry(entry)}
                      >
                        <span className="text-[11px] text-dark-300">{entry.title}</span>
                        <span className="text-[9px] text-dark-500 truncate flex-1">{entry.summary}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 待补充模块提示 */}
      {!searchQuery && (
        <div className="text-center text-[10px] text-dark-600 py-2">
          更多模块持续补充中：排盘要素 · 断局基础 · 格局判断 · 实战分类占 · 高级秘断
        </div>
      )}
    </div>
  )
}
