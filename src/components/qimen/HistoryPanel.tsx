/**
 * 历史记录面板组件
 * - 当历史记录超过5条时默认折叠，只显示最近5条
 * - 点击"展开更多"可查看全部历史
 * - 点击某条历史记录会回调 onLoad 以加载该次排盘
 */
import { useState } from 'react'

/** 单条历史记录 */
export interface HistoryItem {
  dt: string    // 日期时间字符串
  label: string // 显示标签
}

interface HistoryPanelProps {
  history: HistoryItem[]
  currentDt: string
  onLoad: (dt: string) => void
  onClear: () => void
}

/** 默认只显示最近几条 */
const DEFAULT_SHOW = 5

export default function HistoryPanel({
  history,
  currentDt,
  onLoad,
  onClear,
}: HistoryPanelProps) {
  // 折叠/展开状态
  const [expanded, setExpanded] = useState(false)

  if (history.length === 0) return null

  // 决定显示哪些条目
  const showAll = expanded || history.length <= DEFAULT_SHOW
  const displayed = showAll ? history : history.slice(0, DEFAULT_SHOW)
  const hiddenCount = history.length - DEFAULT_SHOW

  return (
    <div className="mt-4 pt-3 border-t border-dark-700/40">
      {/* 头部：标题 + 清除按钮 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-dark-500">历史记录</span>
        <button
          onClick={onClear}
          className="text-[10px] text-dark-600 hover:text-red-400"
        >
          清除
        </button>
      </div>

      {/* 历史条目列表 */}
      <div className="flex flex-wrap gap-1.5">
        {displayed.map((h, i) => (
          <button
            key={i}
            onClick={() => onLoad(h.dt)}
            className={`text-[11px] px-2 py-1 rounded border transition-colors ${
              h.dt === currentDt
                ? 'border-purple-500/60 bg-purple-500/10 text-purple-300'
                : 'border-dark-700/40 bg-dark-800/40 text-dark-400 hover:text-dark-200 hover:border-dark-500'
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>

      {/* 超出5条时显示展开/收起按钮 */}
      {history.length > DEFAULT_SHOW && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-[10px] text-dark-500 hover:text-dark-300 transition-colors"
        >
          {expanded
            ? '收起'
            : `展开更多（${hiddenCount}条）`}
        </button>
      )}
    </div>
  )
}
