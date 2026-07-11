/**
 * 奇门遁甲详情弹窗 Context 系统
 * 栈式弹窗：支持术语连续跳转 + 返回上一层继续查看
 */
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

// ============================================================================
// 类型定义
// ============================================================================

/** 弹窗内容 */
interface DetailState {
  title: string
  content: ReactNode
}

/** Context 值 */
interface DetailContextValue {
  showDetail: (title: string, content: ReactNode) => void
}

// ============================================================================
// Context 创建
// ============================================================================

const DetailContext = createContext<DetailContextValue>({
  showDetail: () => {},
})

// ============================================================================
// 弹窗 UI 组件（栈式：可返回上一层）
// ============================================================================

function DetailModal({
  stack,
  onBack,
  onClose,
}: {
  stack: DetailState[]
  onBack: () => void
  onClose: () => void
}) {
  const current = stack[stack.length - 1]
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-dark-900 border border-dark-700 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {stack.length > 1 && (
              <button
                onClick={onBack}
                className="shrink-0 text-xs px-2 py-0.5 rounded bg-dark-800 text-dark-300 hover:bg-dark-700"
              >
                ← 返回
              </button>
            )}
            <h3 className="text-base font-bold text-dark-100 truncate">{current.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-dark-500 hover:text-dark-200 text-xl shrink-0 ml-2"
          >
            ×
          </button>
        </div>
        {stack.length > 1 && (
          <div className="text-[9px] text-dark-500 mb-2 truncate">
            {stack.map(s => s.title).join(' › ')}
          </div>
        )}
        <div className="text-sm text-dark-300 space-y-3">{current.content}</div>
      </div>
    </div>
  )
}

// ============================================================================
// Provider 组件
// ============================================================================

export function DetailProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<DetailState[]>([])

  const showDetail = (title: string, content: ReactNode) => {
    setStack(prev => {
      // 同标题去重：已在栈顶则不重复压栈
      if (prev.length > 0 && prev[prev.length - 1].title === title) return prev
      return [...prev, { title, content }].slice(-10)
    })
  }

  return (
    <DetailContext.Provider value={{ showDetail }}>
      {children}
      {stack.length > 0 && (
        <DetailModal
          stack={stack}
          onBack={() => setStack(prev => prev.slice(0, -1))}
          onClose={() => setStack([])}
        />
      )}
    </DetailContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

/** 使用弹窗 Context，获取 showDetail 方法 */
export function useDetail(): DetailContextValue {
  return useContext(DetailContext)
}
