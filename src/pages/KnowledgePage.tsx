import { useState, useMemo } from 'react'
import { MOD_BASICS } from '../data/knowledge/mod-basics'
import { MOD_PAIPAN } from '../data/knowledge/mod-paipan'
import { MOD_GEJU } from '../data/knowledge/mod-geju'
import { MOD_DUANJU } from '../data/knowledge/mod-duanju'
import { MOD_SHIZHAN } from '../data/knowledge/mod-shizhan'
import { MOD_KEYING } from '../data/knowledge/mod-keying'
import { MOD_BAZI_BASICS } from '../data/knowledge/mod-bazi-basics'
import { MOD_BAZI_SHISHEN } from '../data/knowledge/mod-bazi-shishen'
import { MOD_BAZI_GEJU } from '../data/knowledge/mod-bazi-geju'
import { MOD_BAZI_SHIZHAN } from '../data/knowledge/mod-bazi-shizhan'
import { registerModule, searchKnowledge, getModules, getEntryByTitle, getBacklinks } from '../data/knowledge/search'
import { SUBJECTS } from '../data/knowledge/types'
import type { KnowledgeEntry, SubjectId } from '../data/knowledge/types'

// 注册所有模块
registerModule(MOD_BASICS)
registerModule(MOD_PAIPAN)
registerModule(MOD_GEJU)
registerModule(MOD_DUANJU)
registerModule(MOD_KEYING)
registerModule(MOD_BAZI_BASICS)
registerModule(MOD_BAZI_SHISHEN)
registerModule(MOD_BAZI_GEJU)
registerModule(MOD_BAZI_SHIZHAN)
registerModule(MOD_SHIZHAN)

const TAG_COLORS: Record<string, string> = {
  '重要': 'bg-red-900/40 text-red-400',
  '基础': 'bg-blue-900/30 text-blue-400',
  '三奇': 'bg-purple-900/30 text-purple-400',
  '六仪': 'bg-amber-900/30 text-amber-400',
  '天网': 'bg-gray-700/50 text-gray-300',
  '速查': 'bg-green-900/30 text-green-400',
}

// Callout 样式（Obsidian 风格）
const CALLOUT_STYLE: Record<string, { icon: string; cls: string; title: string }> = {
  info: { icon: 'ℹ️', cls: 'border-blue-500/50 bg-blue-900/15', title: '说明' },
  tip: { icon: '💡', cls: 'border-green-500/50 bg-green-900/15', title: '口诀' },
  example: { icon: '📋', cls: 'border-purple-500/50 bg-purple-900/15', title: '例子' },
  warning: { icon: '⚠️', cls: 'border-amber-500/50 bg-amber-900/15', title: '注意' },
  quote: { icon: '📖', cls: 'border-dark-500/50 bg-dark-800/40', title: '原文' },
}

/** 行内渲染：解析 [[wiki链接]] 和 **加粗** */
function InlineText({ text, onJump }: { text: string; onJump: (title: string) => void }) {
  const parts: React.ReactNode[] = []
  // 分割 [[link]] / [[link|display]] / **bold**
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={key++}>{text.slice(last, m.index)}</span>)
    if (m[1] !== undefined) {
      const target = m[1]; const display = m[2] || m[1]
      const exists = getEntryByTitle(target) !== null
      parts.push(
        exists ? (
          <span key={key++} onClick={(e) => { e.stopPropagation(); onJump(target) }}
            className="text-purple-400 cursor-pointer hover:underline decoration-purple-500/50">
            {display}
          </span>
        ) : (
          <span key={key++} className="text-dark-300 border-b border-dotted border-dark-500">{display}</span>
        )
      )
    } else if (m[3] !== undefined) {
      parts.push(<span key={key++} className="text-dark-200 font-semibold">{m[3]}</span>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>)
  return <>{parts}</>
}

/** Markdown 表格渲染 */
function MdTable({ lines, onJump }: { lines: string[]; onJump: (t: string) => void }) {
  const rows = lines
    .filter(l => !/^\|[\s:|-]+\|$/.test(l.trim()))
    .map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()))
  if (rows.length === 0) return null
  const [head, ...body] = rows
  return (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr>{head.map((c, i) => (
            <th key={i} className="border border-dark-700 bg-dark-800/60 px-2 py-1 text-dark-200 font-medium text-left whitespace-nowrap">
              <InlineText text={c} onJump={onJump} />
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri} className={ri % 2 ? 'bg-dark-800/20' : ''}>
              {r.map((c, ci) => (
                <td key={ci} className="border border-dark-700/60 px-2 py-1 text-dark-400">
                  <InlineText text={c} onJump={onJump} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Obsidian 风格正文渲染器：callout / 表格 / wiki链接 / 标题 / 列表 */
function ObsidianContent({ content, onJump }: { content: string; onJump: (t: string) => void }) {
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0, key = 0
  while (i < lines.length) {
    const line = lines[i]
    // Callout 块: > [!type] 标题 \n > 内容...
    const co = line.match(/^>\s*\[!(\w+)\]\s*(.*)/)
    if (co) {
      const type = co[1].toLowerCase()
      const style = CALLOUT_STYLE[type] || CALLOUT_STYLE.info
      const title = co[2] || style.title
      const body: string[] = []
      i++
      while (i < lines.length && lines[i].startsWith('>')) {
        body.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push(
        <div key={key++} className={`border-l-2 rounded-r-lg px-3 py-2 my-2 ${style.cls}`}>
          <div className="text-[10px] font-medium text-dark-200 mb-1">{style.icon} {title}</div>
          <div className="text-[11px] text-dark-400 leading-relaxed space-y-0.5">
            {body.map((b, bi) => <div key={bi}><InlineText text={b} onJump={onJump} /></div>)}
          </div>
        </div>
      )
      continue
    }
    // 表格块
    if (line.trim().startsWith('|')) {
      const tbl: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) { tbl.push(lines[i]); i++ }
      blocks.push(<MdTable key={key++} lines={tbl} onJump={onJump} />)
      continue
    }
    // 标题
    if (line.startsWith('## ')) {
      blocks.push(<h3 key={key++} className="text-sm font-bold text-dark-100 mt-4 mb-1.5 border-b border-dark-700/50 pb-1">{line.slice(3)}</h3>)
    } else if (line.startsWith('### ')) {
      blocks.push(<h4 key={key++} className="text-xs font-bold text-dark-200 mt-3 mb-1">{line.slice(4)}</h4>)
    } else if (line.startsWith('- ')) {
      blocks.push(
        <div key={key++} className="ml-2 text-[11px] text-dark-400 leading-relaxed flex gap-1.5">
          <span className="text-purple-500/70 shrink-0">•</span>
          <span><InlineText text={line.slice(2)} onJump={onJump} /></span>
        </div>
      )
    } else if (line.startsWith('> ')) {
      blocks.push(
        <div key={key++} className="border-l-2 border-dark-600 pl-2 my-1 text-[11px] text-dark-500 italic">
          <InlineText text={line.slice(2)} onJump={onJump} />
        </div>
      )
    } else if (line.trim() === '---') {
      blocks.push(<hr key={key++} className="border-dark-700/50 my-3" />)
    } else if (line.trim() === '') {
      blocks.push(<div key={key++} className="h-1.5" />)
    } else {
      blocks.push(
        <div key={key++} className="text-[11px] text-dark-400 leading-relaxed">
          <InlineText text={line} onJump={onJump} />
        </div>
      )
    }
    i++
  }
  return <div>{blocks}</div>
}

export default function KnowledgePage() {
  const [subject, setSubject] = useState<SubjectId>('qimen')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeEntry, setActiveEntry] = useState<KnowledgeEntry | null>(null)
  const [history, setHistory] = useState<KnowledgeEntry[]>([])
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())

  const modules = getModules().filter(m => (m.subject || 'qimen') === subject)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchKnowledge(searchQuery)
  }, [searchQuery])

  function openEntry(entry: KnowledgeEntry) {
    if (activeEntry?.id !== entry.id) {
      setHistory(prev => [entry, ...prev.filter(e => e.id !== entry.id)].slice(0, 20))
    }
    setActiveEntry(entry)
    setSearchQuery('')
  }

  // wiki 链接跳转
  function jumpByTitle(title: string) {
    const found = getEntryByTitle(title)
    if (found) openEntry(found.entry)
  }

  function goBack() {
    if (history.length > 1) {
      const prev = history[1]
      setHistory(h => h.slice(1))
      setActiveEntry(prev)
    } else {
      setActiveEntry(null)
    }
  }

  function toggleChapter(chapId: string) {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapId)) next.delete(chapId); else next.add(chapId)
      return next
    })
  }

  // ============ 详情页（Obsidian 风格） ============
  if (activeEntry) {
    const backlinks = getBacklinks(activeEntry)
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="px-2 py-1 rounded bg-dark-800 text-dark-300 text-xs hover:bg-dark-700">← 返回</button>
          <button onClick={() => { setActiveEntry(null) }} className="px-2 py-1 rounded bg-dark-800 text-dark-300 text-xs hover:bg-dark-700">📚 目录</button>
          {history.length > 1 && <span className="text-[10px] text-dark-500">历史 {history.length} 条</span>}
        </div>

        <div>
          <h2 className="text-lg font-bold text-dark-100">{activeEntry.title}</h2>
          {activeEntry.tags && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {activeEntry.tags.map(tag => (
                <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded ${TAG_COLORS[tag] || 'bg-dark-700 text-dark-400'}`}>{tag}</span>
              ))}
            </div>
          )}
          <p className="text-xs text-dark-400 mt-1">{activeEntry.summary}</p>
        </div>

        {/* 正文 - Obsidian 渲染 */}
        <div className="card">
          <ObsidianContent content={activeEntry.content} onJump={jumpByTitle} />
        </div>

        {/* 相关术语（显式 terms） */}
        {activeEntry.terms && activeEntry.terms.length > 0 && (
          <div className="card">
            <div className="text-[10px] text-dark-500 mb-1.5">🔗 相关条目</div>
            <div className="flex flex-wrap gap-1.5">
              {activeEntry.terms.map((tr, i) => (
                <button key={i} onClick={() => jumpByTitle(tr.term)}
                  className="text-[11px] px-2 py-0.5 rounded bg-purple-900/25 text-purple-400 hover:bg-purple-900/40">
                  {tr.term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 反向链接（Obsidian backlinks） */}
        {backlinks.length > 0 && (
          <div className="card">
            <div className="text-[10px] text-dark-500 mb-1.5">⬅ 被这些条目引用</div>
            <div className="space-y-1">
              {backlinks.map((b, i) => (
                <div key={i} onClick={() => openEntry(b.entry)}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-dark-700/30 cursor-pointer">
                  <span className="text-[11px] text-dark-300">{b.entry.title}</span>
                  <span className="text-[9px] text-dark-500">{b.module.icon} {b.chapter.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeEntry.notes && (
          <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
            <div className="text-[10px] text-amber-400 font-medium mb-1">📝 备注</div>
            <div className="text-xs text-amber-200/80">{activeEntry.notes}</div>
          </div>
        )}
      </div>
    )
  }

  // ============ 目录页 ============
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* 学科 Tab */}
      <div className="flex justify-center gap-2">
        {SUBJECTS.map(s => (
          <button key={s.id}
            onClick={() => s.ready && setSubject(s.id)}
            disabled={!s.ready}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              subject === s.id
                ? 'bg-purple-600/80 text-white'
                : s.ready
                  ? 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                  : 'bg-dark-800/40 text-dark-600 cursor-not-allowed'
            }`}>
            {s.icon} {s.title}{!s.ready && <span className="ml-1 text-[9px]">筹备中</span>}
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-[10px] text-dark-500">
          {subject === 'qimen' ? `${modules.length}大模块 · 全文搜索 · 点击紫色词条跳转` : ''}
        </p>
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
            <button onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 text-sm">✕</button>
          )}
        </div>
      </div>

      {/* 搜索结果 */}
      {searchQuery && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-dark-500">{searchResults.length} 条结果</div>
          {searchResults.map((r, i) => (
            <div key={i}
              className="bg-dark-800/40 rounded-lg p-2.5 border border-dark-700/30 cursor-pointer hover:bg-dark-700/40 transition-colors"
              onClick={() => openEntry(r.entry)}>
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
              <button key={e.id} onClick={() => openEntry(e)}
                className="text-[10px] px-2 py-0.5 rounded bg-dark-800/60 text-dark-300 hover:bg-dark-700">{e.title}</button>
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
                  onClick={() => toggleChapter(chap.id)}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-dark-200">{chap.title}</span>
                    <span className="text-[9px] text-dark-500">{chap.entries.length}条</span>
                  </div>
                  <span className="text-dark-500 text-[10px]">{expandedChapters.has(chap.id) ? '▼' : '▶'}</span>
                </div>
                {expandedChapters.has(chap.id) && (
                  <div className="ml-2 mt-1 space-y-0.5">
                    {chap.entries.map(entry => (
                      <div key={entry.id}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-dark-700/30 cursor-pointer transition-colors"
                        onClick={() => openEntry(entry)}>
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

      {subject !== 'qimen' && (
        <div className="text-center text-xs text-dark-500 py-8">
          {SUBJECTS.find(s => s.id === subject)?.title} 知识库筹备中…
        </div>
      )}
    </div>
  )
}
