/**
 * 奇门遁甲排盘页面 — 重构版
 * 
 * 职责：
 * - 管理日期时间输入状态
 * - 调用 calculateQimen 排盘
 * - 维护历史记录（localStorage）
 * - 渲染信息栏、四柱、九宫格布局
 * - 子组件：DetailContext / PalaceCell / ReferenceSection / HistoryPanel
 */
import { useState, useEffect } from 'react'
import { calculateQimen } from '../lib/qimen'
import type { QimenResult } from '../lib/qimen'
import { JIEQI_MONTH_ZHI } from '../lib/qimen-status'
import { DetailProvider } from '../components/qimen/DetailContext'
import PalaceCell from '../components/qimen/PalaceCell'
import ReferenceSection from '../components/qimen/ReferenceSection'
import HistoryPanel from '../components/qimen/HistoryPanel'
import type { HistoryItem } from '../components/qimen/HistoryPanel'

// 洛书九宫排列：巽4|离9|坤2 / 震3|中5|兑7 / 艮8|坎1|乾6
const LUOSHU_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6]

function formatDateTime(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ============================================================================
// 五行颜色工具（页面级，用于信息栏 / 四柱）
// ============================================================================

const WX_TEXT_COLOR: Record<string, string> = {
  '金': 'text-yellow-400',
  '木': 'text-green-400',
  '水': 'text-blue-400',
  '火': 'text-red-400',
  '土': 'text-amber-600',
}

const GAN_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}
const ZHI_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
}
const XING_WUXING: Record<string, string> = {
  '天蓬': '水', '天芮': '土', '天冲': '木', '天辅': '木',
  '天禽': '土', '天心': '金', '天柱': '金', '天任': '土', '天英': '火',
}
const MEN_WUXING: Record<string, string> = {
  '休门': '水', '死门': '土', '伤门': '木', '杜门': '木',
  '景门': '火', '开门': '金', '惊门': '金', '生门': '土',
}

function ganColor(gan: string) { return WX_TEXT_COLOR[GAN_WUXING[gan] || '土'] || 'text-dark-100' }
function zhiColor(zhi: string) { return WX_TEXT_COLOR[ZHI_WUXING[zhi] || '土'] || 'text-dark-100' }
function xingColor(xing: string) { return WX_TEXT_COLOR[XING_WUXING[xing] || '土'] || 'text-dark-100' }
function menColor(men: string) { return WX_TEXT_COLOR[MEN_WUXING[men] || '土'] || 'text-dark-100' }

// ============================================================================
// 辅助小组件
// ============================================================================

function InfoItem({ label, value, color = 'text-dark-100' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-dark-500">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  )
}

function PillarCard({ label, value }: { label: string; value: string }) {
  const gan = value[0] || ''
  const zhi = value[1] || ''
  return (
    <div className="bg-dark-800/60 border border-dark-700/40 rounded-lg py-4 px-3 text-center">
      <div className="text-xs text-dark-500 mb-2">{label}</div>
      <div className="flex flex-col items-center gap-1">
        <span className={`text-xl font-bold ${ganColor(gan)}`}>{gan}</span>
        <span className={`text-xl font-bold ${zhiColor(zhi)}`}>{zhi}</span>
      </div>
    </div>
  )
}

// ============================================================================
// 主页面
// ============================================================================

export default function QimenPage() {
  const [datetime, setDatetime] = useState(formatDateTime(new Date()))
  const [result, setResult] = useState<QimenResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('qimen_history')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  // 保存历史记录
  const saveToHistory = (dt: string, res: QimenResult) => {
    const label = `${res.datetime} ${res.isYangDun ? '阳' : '阴'}遁${res.juNumber}局 ${res.fuYin ? '伏吟' : res.fanYin ? '反吟' : ''}`.trim()
    const newItem: HistoryItem = { dt, label }
    setHistory((prev) => {
      const updated = [newItem, ...prev.filter((h) => h.dt !== dt)].slice(0, 20)
      try { localStorage.setItem('qimen_history', JSON.stringify(updated)) } catch {}
      return updated
    })
  }

  const doPaipan = (dt?: Date) => {
    const d = dt || new Date(datetime)
    const r = calculateQimen(d)
    setResult(r)
    saveToHistory(formatDateTime(d), r)
  }

  useEffect(() => { doPaipan(new Date()) }, [])

  const setNow = () => {
    const now = new Date()
    setDatetime(formatDateTime(now))
    doPaipan(now)
  }

  const loadHistory = (dt: string) => {
    setDatetime(dt)
    doPaipan(new Date(dt))
  }

  const clearHistory = () => {
    setHistory([])
    try { localStorage.removeItem('qimen_history') } catch {}
  }

  const monthZhi = result ? (JIEQI_MONTH_ZHI[result.jieQi] || '午') : '午'

  return (
    <DetailProvider>
      <div className="space-y-5">
        {/* 输入区 */}
        <div className="card">
          <h2 className="text-lg font-bold text-dark-100 mb-4">奇门遁甲排盘</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label block mb-1">日期时间</label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="input-field w-52"
              />
            </div>
            <button onClick={setNow} className="btn-secondary text-sm">当前时间</button>
            <button onClick={() => doPaipan()} className="btn-primary text-sm">排盘</button>
          </div>

          {/* 历史记录面板 */}
          <HistoryPanel
            history={history}
            currentDt={datetime}
            onLoad={loadHistory}
            onClear={clearHistory}
          />
        </div>

        {result && (
          <>
            {/* 信息栏 */}
            <div className="card">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <InfoItem label="遁局" value={result.isYangDun ? '阳遁' : '阴遁'} />
                <InfoItem label="局数" value={`${result.juNumber}局`} color="text-amber-400" />
                <InfoItem label="三元" value={`${result.yuan}元`} />
                <InfoItem label="节气" value={result.jieQi} />
                <InfoItem label="值符" value={result.zhiFu} color={xingColor(result.zhiFu)} />
                <InfoItem label="值使" value={result.zhiShi} color={menColor(result.zhiShi)} />
                <InfoItem
                  label="旬首"
                  value={`${result.xunShou}(${(
                    { '甲子': '戊', '甲戌': '己', '甲申': '庚', '甲午': '辛', '甲辰': '壬', '甲寅': '癸' } as Record<string, string>
                  )[result.xunShou] || ''})`}
                  color="text-amber-500"
                />
                <InfoItem label="局式" value="拆补法-转盘奇门" />
                {result.fuYin && <span className="text-xs text-pink-400 font-medium">伏吟</span>}
                {result.fanYin && <span className="text-xs text-pink-400 font-medium">反吟</span>}
                {/* 全局格局 */}
                {result.geJu.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.geJu.map((g, i) => (
                      <span key={i} className="text-xs text-purple-400 bg-purple-900/20 rounded px-1.5 py-0.5">{g}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 四柱 */}
            <div className="card">
              <h3 className="text-sm text-dark-400 font-medium mb-3">四柱</h3>
              <div className="grid grid-cols-4 gap-3">
                <PillarCard label="年柱" value={result.yearGZ} />
                <PillarCard label="月柱" value={result.monthGZ} />
                <PillarCard label="日柱" value={result.dayGZ} />
                <PillarCard label="时柱" value={result.hourGZ} />
              </div>
            </div>

            {/* 九宫盘局 */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-dark-400 font-medium">九宫盘局</h3>
              </div>

              {/* 方位标记 + 九宫格 */}
              <div className="relative">
                {/* 上方位：南 */}
                <div className="text-center text-[10px] text-dark-500 mb-1">南</div>
                <div className="flex items-center gap-1">
                  {/* 左方位：东 */}
                  <div className="text-[10px] text-dark-500 w-4 text-center shrink-0">东</div>
                  {/* 九宫格：响应式 gap */}
                  <div className="grid grid-cols-3 gap-1 sm:gap-1.5 flex-1">
                    {LUOSHU_ORDER.map((gongNum) => {
                      const palace = result.palaces.find((p) => p.gongNumber === gongNum)
                      if (!palace) return <div key={gongNum} />
                      return <PalaceCell key={gongNum} palace={palace} monthZhi={monthZhi} />
                    })}
                  </div>
                  {/* 右方位：西 */}
                  <div className="text-[10px] text-dark-500 w-4 text-center shrink-0">西</div>
                </div>
                {/* 下方位：北 */}
                <div className="text-center text-[10px] text-dark-500 mt-1">北</div>
              </div>
            </div>

            {/* 底部参考速查区 */}
            <ReferenceSection />
          </>
        )}
      </div>
    </DetailProvider>
  )
}
