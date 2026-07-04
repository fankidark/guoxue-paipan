/**
 * 奇门遁甲详情弹窗 Context 系统
 * 替代原先的全局变量 globalShowDetail，使用 React Context 管理弹窗状态。
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

/** Context 值：提供 showDetail 方法 */
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
// 弹窗 UI 组件
// ============================================================================

function DetailModal({
  title,
  content,
  onClose,
}: {
  title: string
  content: ReactNode
  onClose: () => void
}) {
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
          <h3 className="text-base font-bold text-dark-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-dark-500 hover:text-dark-200 text-xl"
          >
            ×
          </button>
        </div>
        <div className="text-sm text-dark-300 space-y-3">{content}</div>
      </div>
    </div>
  )
}

// ============================================================================
// Provider 组件
// ============================================================================

export function DetailProvider({ children }: { children: ReactNode }) {
  const [detail, setDetail] = useState<DetailState | null>(null)

  const showDetail = (title: string, content: ReactNode) => {
    setDetail({ title, content })
  }

  return (
    <DetailContext.Provider value={{ showDetail }}>
      {children}
      {detail && (
        <DetailModal
          title={detail.title}
          content={detail.content}
          onClose={() => setDetail(null)}
        />
      )}
    </DetailContext.Provider>
  )
}

// ============================================================================
// Hook：在子组件中使用弹窗
// ============================================================================

/** 使用弹窗 Context，获取 showDetail 方法 */
export function useDetail(): DetailContextValue {
  return useContext(DetailContext)
}
