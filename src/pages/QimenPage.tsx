/**
 * 奇门遁甲排盘页面 — 匹配参考 UI 设计
 */
import { useState, useEffect } from 'react'
import { calculateQimen } from '../lib/qimen'
import type { QimenResult } from '../lib/qimen'

// 洛书九宫排列顺序（从左上到右下）
// 巽4 | 离9 | 坤2
// 震3 | 中5 | 兑7
// 艮8 | 坎1 | 乾6
const LUOSHU_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6]

function formatDateTime(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function QimenPage() {
  const [datetime, setDatetime] = useState(formatDateTime(new Date()))
  const [result, setResult] = useState<QimenResult | null>(null)

  const doPaipan = (dt?: Date) => {
    const d = dt || new Date(datetime)
    const r = calculateQimen(d)
    setResult(r)
  }

  useEffect(() => {
    doPaipan(new Date())
  }, [])

  const setNow = () => {
    const now = new Date()
    setDatetime(formatDateTime(now))
    doPaipan(now)
  }

  return (
    <div className="space-y-5">
      {/* 标题 + 输入区 */}
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
              <InfoItem label="值符" value={result.zhiFu} color="text-purple-400" />
              <InfoItem label="值使" value={result.zhiShi} color="text-purple-400" />
              <InfoItem label="旬首" value={result.xunShou} color="text-amber-500" />
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
              {/* 图例 */}
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-purple-400"></span>
                  <span className="text-dark-400">八神</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-emerald-400"></span>
                  <span className="text-dark-400">九星</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-cyan-400"></span>
                  <span className="text-dark-400">天盘干</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-white"></span>
                  <span className="text-dark-400">八门</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-dark-400"></span>
                  <span className="text-dark-400">地盘干</span>
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5">
              {LUOSHU_ORDER.map((gongNum) => {
                const palace = result.palaces.find(p => p.gongNumber === gongNum)
                if (!palace) return <div key={gongNum} />
                return <PalaceCell key={gongNum} palace={palace} />
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// 信息栏单项
function InfoItem({ label, value, color = 'text-dark-100' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-dark-500">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  )
}

// 四柱卡片
function PillarCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-dark-800/60 border border-dark-700/40 rounded-lg py-4 px-3 text-center">
      <div className="text-xs text-dark-500 mb-2">{label}</div>
      <div className="text-xl font-bold text-dark-100 tracking-wider">{value}</div>
    </div>
  )
}

// 九宫格单元格
function PalaceCell({ palace }: { palace: { gongNumber: number; gongName: string; diPanGan: string; tianPanGan: string; jiuXing: string; baMen: string; baShen: string } }) {
  const isCenterPalace = palace.gongNumber === 5
  
  return (
    <div className="bg-dark-800/40 border border-dark-700/30 rounded-lg py-3 px-2 text-center min-h-[140px] flex flex-col items-center justify-center gap-0.5">
      {isCenterPalace ? (
        <>
          <span className="text-purple-400 text-xs">{palace.baShen}</span>
          <span className="text-emerald-400 text-xs">{palace.jiuXing}</span>
          <span className="text-cyan-400 text-base font-bold my-1">{palace.tianPanGan}</span>
          <span className="text-dark-100 text-xs">中</span>
          <span className="text-dark-500 text-xs">{palace.diPanGan}</span>
          <span className="text-dark-600 text-[10px] mt-1">宫五</span>
        </>
      ) : (
        <>
          <span className="text-purple-400 text-xs">{palace.baShen}</span>
          <span className="text-emerald-400 text-xs">{palace.jiuXing}</span>
          <span className="text-cyan-400 text-base font-bold my-1">{palace.tianPanGan}</span>
          <span className="text-dark-100 text-xs">{palace.baMen}</span>
          <span className="text-dark-500 text-xs">{palace.diPanGan}</span>
          <span className="text-dark-600 text-[10px] mt-1">宫{numToChinese(palace.gongNumber)}</span>
        </>
      )}
    </div>
  )
}

function numToChinese(n: number): string {
  return ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'][n] || String(n)
}
