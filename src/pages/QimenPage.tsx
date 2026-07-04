/**
 * 奇门遁甲排盘页面
 */
import { useState, useEffect } from 'react'
import { calculateQimen } from '../lib/qimen'
import type { QimenResult, QimenPalace } from '../lib/qimen'

// 洛书九宫排列顺序（从左上到右下，3行3列）
// 巽4 | 离9 | 坤2
// 震3 | 中5 | 兑7
// 艮8 | 坎1 | 乾6
const LUOSHU_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6]

// 宫位标签
const GONG_LABELS: Record<number, string> = {
  1: '坎一', 2: '坤二', 3: '震三',
  4: '巽四', 5: '中五', 6: '乾六',
  7: '兑七', 8: '艮八', 9: '离九',
}

function formatDateTime(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function PalaceCard({ palace }: { palace: QimenPalace }) {
  const isCenter = palace.gongNumber === 5
  return (
    <div className={`card text-center text-xs space-y-0.5 min-h-[120px] flex flex-col justify-center ${isCenter ? 'opacity-70' : ''}`}>
      <div className="text-purple-400 font-medium">{palace.baShen}</div>
      <div className="text-yellow-400">{palace.jiuXing}</div>
      <div className="text-green-400 text-sm font-bold">{palace.tianPanGan}</div>
      <div className="text-blue-400">{palace.baMen}</div>
      <div className="text-dark-400">{palace.diPanGan}</div>
      <div className="text-dark-500 text-[10px] mt-1">{GONG_LABELS[palace.gongNumber]}</div>
    </div>
  )
}

export default function QimenPage() {
  const now = new Date()
  const [datetimeStr, setDatetimeStr] = useState(formatDateTime(now))
  const [result, setResult] = useState<QimenResult | null>(null)
  const [loading, setLoading] = useState(false)

  const doPaipan = (dateOverride?: Date) => {
    setLoading(true)
    try {
      const d = dateOverride || new Date(datetimeStr)
      const r = calculateQimen(d)
      setResult(r)
    } catch (e) {
      console.error('奇门排盘出错:', e)
    } finally {
      setLoading(false)
    }
  }

  const useNow = () => {
    const n = new Date()
    setDatetimeStr(formatDateTime(n))
    doPaipan(n)
  }

  useEffect(() => {
    doPaipan()
  }, [])

  // 按洛书顺序排列九宫
  const orderedPalaces = result
    ? LUOSHU_ORDER.map(num => result.palaces.find(p => p.gongNumber === num)!)
    : []

  return (
    <div className="space-y-6">
      {/* 输入区 */}
      <div className="card">
        <h2 className="text-lg font-bold text-dark-100 mb-4">奇门遁甲排盘</h2>
        <div className="flex flex-wrap gap-3 items-end mb-4">
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
            onClick={() => doPaipan()}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? '排盘中…' : '排盘'}
          </button>
        </div>

        {/* 基础信息栏 */}
        {result && (
          <div className="flex flex-wrap gap-3 pt-3 border-t border-dark-700/50">
            <InfoBadge
              label={result.isYangDun ? '阳遁' : '阴遁'}
              value={`${result.juNumber}局`}
              highlight
            />
            <InfoBadge label="三元" value={`${result.yuan}元`} />
            <InfoBadge label="节气" value={result.jieQi} />
            <InfoBadge label="值符" value={result.zhiFu} color="text-yellow-400" />
            <InfoBadge label="值使" value={result.zhiShi} color="text-blue-400" />
            <InfoBadge label="旬首" value={result.xunShou} color="text-purple-400" />
          </div>
        )}
      </div>

      {result && (
        <>
          {/* 四柱信息 */}
          <div className="card">
            <h3 className="text-sm font-semibold text-dark-200 mb-3">四柱</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              {[
                { label: '年柱', gz: result.yearGZ },
                { label: '月柱', gz: result.monthGZ },
                { label: '日柱', gz: result.dayGZ },
                { label: '时柱', gz: result.hourGZ },
              ].map(({ label, gz }) => (
                <div key={label} className="bg-dark-800/50 rounded-lg p-2">
                  <div className="text-xs text-dark-500 mb-1">{label}</div>
                  <div className="text-xl font-bold text-dark-100">{gz}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 九宫格 */}
          <div className="card">
            <h3 className="text-sm font-semibold text-dark-200 mb-4">九宫盘局</h3>

            {/* 图例 */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs">
              <span className="text-purple-400">■ 八神</span>
              <span className="text-yellow-400">■ 九星</span>
              <span className="text-green-400">■ 天盘干</span>
              <span className="text-blue-400">■ 八门</span>
              <span className="text-dark-400">■ 地盘干</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {orderedPalaces.map((palace, idx) =>
                palace ? <PalaceCard key={idx} palace={palace} /> : <div key={idx} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function InfoBadge({
  label,
  value,
  highlight,
  color,
}: {
  label: string
  value: string
  highlight?: boolean
  color?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-dark-500 text-xs">{label}</span>
      <span
        className={`text-sm font-semibold ${highlight ? 'text-indigo-400' : color || 'text-dark-200'}`}
      >
        {value}
      </span>
    </div>
  )
}
