/**
 * 梅花易数起卦页面
 */
import { useState, useEffect } from 'react'
import { qiGuaByTime, qiGuaByNumber } from '../lib/meihua'
import type { MeihuaResult, Hexagram, Gua } from '../lib/meihua'

type Mode = 'time' | 'number'

function formatDateTime(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 五行颜色
const WX_COLOR: Record<string, string> = {
  '木': 'text-green-400',
  '火': 'text-red-400',
  '土': 'text-yellow-400',
  '金': 'text-gray-300',
  '水': 'text-blue-400',
}

// 五行关系颜色
const FORTUNE_COLOR: Record<string, string> = {
  '大吉': 'text-green-400',
  '吉': 'text-green-400',
  '小吉': 'text-green-300',
  '平': 'text-yellow-400',
  '小凶': 'text-orange-400',
  '凶': 'text-red-400',
  '大凶': 'text-red-500',
}

/** 单爻渲染 */
function YaoLine({
  value,
  isMoving,
}: {
  value: number
  isMoving: boolean
}) {
  const movingClass = isMoving ? 'ring-1 ring-red-400' : ''

  if (value === 1) {
    // 阳爻：一条长横线
    return (
      <div className={`h-1 bg-emerald-400 rounded ${movingClass}`} />
    )
  } else {
    // 阴爻：两段短横线
    return (
      <div className={`flex gap-2 ${movingClass}`}>
        <div className="flex-1 h-1 bg-emerald-400 rounded" />
        <div className="flex-1 h-1 bg-emerald-400 rounded" />
      </div>
    )
  }
}

/** 卦象展示组件 */
function HexagramCard({
  hex,
  title,
  movingLine,
  showMoving = false,
}: {
  hex: Hexagram
  title: string
  movingLine?: number
  showMoving?: boolean
}) {
  // lines[0] 是第1爻（最下爻），渲染时从下到上
  const lines = [...hex.lines].reverse() // 从上到下：第6爻→第1爻

  return (
    <div className="card text-center flex flex-col items-center gap-3">
      <div className="text-xs text-dark-500">{title}</div>
      <div className="text-lg font-bold text-dark-100">{hex.name}</div>

      {/* 六爻图，从下到上显示 */}
      <div className="w-20 space-y-1.5">
        {lines.map((val, displayIdx) => {
          // displayIdx 0 = 第6爻，displayIdx 5 = 第1爻
          const lineNum = 6 - displayIdx
          const isMoving = showMoving && lineNum === movingLine
          return (
            <div key={displayIdx} className="relative">
              <YaoLine value={val} isMoving={isMoving} />
              {isMoving && (
                <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-[10px] text-red-400">
                  动
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* 上下卦标注 */}
      <div className="text-xs space-y-0.5">
        <div className="flex items-center justify-between w-20">
          <span className="text-dark-500">上</span>
          <span className={`font-medium ${WX_COLOR[hex.upper.wuXing]}`}>
            {hex.upper.name}（{hex.upper.nature}）
          </span>
        </div>
        <div className="flex items-center justify-between w-20">
          <span className="text-dark-500">下</span>
          <span className={`font-medium ${WX_COLOR[hex.lower.wuXing]}`}>
            {hex.lower.name}（{hex.lower.nature}）
          </span>
        </div>
      </div>
    </div>
  )
}

/** 体用分析卡片 */
function TiYongCard({
  tiGua,
  yongGua,
  tiYongRelation,
  fortune,
  tiWuXing,
  yongWuXing,
}: {
  tiGua: Gua
  yongGua: Gua
  tiYongRelation: string
  fortune: string
  tiWuXing: string
  yongWuXing: string
}) {
  const fortuneColor =
    FORTUNE_COLOR[fortune] || 'text-dark-200'

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-dark-200 mb-4">体用分析</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xs text-dark-500 mb-1">体卦</div>
          <div className={`text-xl font-bold ${WX_COLOR[tiWuXing]}`}>{tiGua.name}</div>
          <div className="text-xs text-dark-400">{tiGua.symbol} {tiGua.nature}</div>
          <div className={`text-xs mt-1 ${WX_COLOR[tiWuXing]}`}>{tiWuXing}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-dark-500 mb-1">用卦</div>
          <div className={`text-xl font-bold ${WX_COLOR[yongWuXing]}`}>{yongGua.name}</div>
          <div className="text-xs text-dark-400">{yongGua.symbol} {yongGua.nature}</div>
          <div className={`text-xs mt-1 ${WX_COLOR[yongWuXing]}`}>{yongWuXing}</div>
        </div>
      </div>

      <div className="border-t border-dark-700/50 pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-dark-400">体用关系</span>
          <span className="text-dark-200 font-medium">{tiYongRelation}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-dark-400">吉凶判断</span>
          <span className={`font-bold ${fortuneColor}`}>{fortune}</span>
        </div>
      </div>
    </div>
  )
}

export default function MeihuaPage() {
  const now = new Date()
  const [mode, setMode] = useState<Mode>('time')
  const [datetimeStr, setDatetimeStr] = useState(formatDateTime(now))
  const [num1, setNum1] = useState(3)
  const [num2, setNum2] = useState(5)
  const [result, setResult] = useState<MeihuaResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const doQiGua = (overrideDate?: Date) => {
    setLoading(true)
    setError('')
    try {
      let r: MeihuaResult
      if (mode === 'time') {
        const d = overrideDate || new Date(datetimeStr)
        r = qiGuaByTime(d)
      } else {
        if (!num1 || !num2) {
          setError('请输入两个有效数字')
          setLoading(false)
          return
        }
        r = qiGuaByNumber(num1, num2)
      }
      setResult(r)
    } catch (e: any) {
      console.error('起卦出错:', e)
      setError(e?.message || '起卦出错，请检查输入')
    } finally {
      setLoading(false)
    }
  }

  const useNow = () => {
    const n = new Date()
    setDatetimeStr(formatDateTime(n))
    doQiGua(n)
  }

  // 初始化：用当前时间起卦
  useEffect(() => {
    doQiGua(now)
  }, [])

  // 切换模式时重新起卦
  const handleModeChange = (m: Mode) => {
    setMode(m)
    setResult(null)
    setError('')
  }

  return (
    <div className="space-y-6">
      {/* 输入区 */}
      <div className="card">
        <h2 className="text-lg font-bold text-dark-100 mb-4">梅花易数起卦</h2>

        {/* 模式 Tab */}
        <div className="flex gap-1 mb-4 bg-dark-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => handleModeChange('time')}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              mode === 'time'
                ? 'bg-indigo-600 text-white'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            时间起卦
          </button>
          <button
            onClick={() => handleModeChange('number')}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              mode === 'number'
                ? 'bg-indigo-600 text-white'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            数字起卦
          </button>
        </div>

        {/* 时间起卦 */}
        {mode === 'time' && (
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-dark-400 mb-1">日期时间</label>
              <input
                type="datetime-local"
                value={datetimeStr}
                onChange={e => setDatetimeStr(e.target.value)}
                className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={useNow}
              className="px-3 py-2 text-sm bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg border border-dark-600 transition-colors"
            >
              当前时间
            </button>
            <button
              onClick={() => doQiGua()}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '起卦中…' : '起卦'}
            </button>
          </div>
        )}

        {/* 数字起卦 */}
        {mode === 'number' && (
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-dark-400 mb-1">上卦数</label>
              <input
                type="number"
                value={num1}
                onChange={e => setNum1(Number(e.target.value))}
                min={1}
                className="w-24 bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="上卦数"
              />
            </div>
            <div>
              <label className="block text-xs text-dark-400 mb-1">下卦数</label>
              <input
                type="number"
                value={num2}
                onChange={e => setNum2(Number(e.target.value))}
                min={1}
                className="w-24 bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-dark-100 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="下卦数"
              />
            </div>
            <button
              onClick={() => doQiGua()}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '起卦中…' : '起卦'}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-2 text-red-400 text-sm">{error}</p>
        )}

        {/* 起卦信息 */}
        {result && (
          <div className="mt-3 pt-3 border-t border-dark-700/50 flex flex-wrap gap-3 text-xs">
            <span className="text-dark-500">起卦方式：</span>
            <span className="text-indigo-400">{result.method}</span>
            <span className="text-dark-500">输入：</span>
            <span className="text-dark-300">{result.input}</span>
            <span className="text-dark-500">动爻：</span>
            <span className="text-red-400">第 {result.movingLine} 爻</span>
          </div>
        )}
      </div>

      {result && (
        <>
          {/* 三卦展示 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HexagramCard
              hex={result.mainHex}
              title="主卦（本卦）"
              movingLine={result.movingLine}
              showMoving
            />
            <HexagramCard
              hex={result.mutualHex}
              title="互卦"
            />
            <HexagramCard
              hex={result.changedHex}
              title="变卦"
            />
          </div>

          {/* 体用分析 */}
          <TiYongCard
            tiGua={result.tiGua}
            yongGua={result.yongGua}
            tiYongRelation={result.tiYongRelation}
            fortune={result.fortune}
            tiWuXing={result.tiWuXing}
            yongWuXing={result.yongWuXing}
          />
        </>
      )}
    </div>
  )
}
