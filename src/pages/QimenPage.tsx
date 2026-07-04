/**
 * 奇门遁甲排盘页面 — 完整版（匹配参考 App 信息量）
 */
import { useState, useEffect } from 'react'
import { calculateQimen } from '../lib/qimen'
import type { QimenResult } from '../lib/qimen'
import {
  GONG_GUA, JIEQI_MONTH_ZHI,
  getXingStatus, getMenStatus, getGanTwelveInGong
} from '../lib/qimen-status'

// 洛书九宫排列：巽4|离9|坤2 / 震3|中5|兑7 / 艮8|坎1|乾6
const LUOSHU_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6]

function formatDateTime(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 天干五行颜色
const GAN_COLOR: Record<string, string> = {
  '甲': 'text-green-400', '乙': 'text-green-400',
  '丙': 'text-red-400', '丁': 'text-red-400',
  '戊': 'text-yellow-400', '己': 'text-yellow-400',
  '庚': 'text-gray-300', '辛': 'text-gray-300',
  '壬': 'text-blue-400', '癸': 'text-blue-400',
}
const ZHI_COLOR: Record<string, string> = {
  '子': 'text-blue-400', '丑': 'text-yellow-400', '寅': 'text-green-400', '卯': 'text-green-400',
  '辰': 'text-yellow-400', '巳': 'text-red-400', '午': 'text-red-400', '未': 'text-yellow-400',
  '申': 'text-gray-300', '酉': 'text-gray-300', '戌': 'text-yellow-400', '亥': 'text-blue-400',
}

export default function QimenPage() {
  const [datetime, setDatetime] = useState(formatDateTime(new Date()))
  const [result, setResult] = useState<QimenResult | null>(null)

  const doPaipan = (dt?: Date) => {
    const d = dt || new Date(datetime)
    setResult(calculateQimen(d))
  }

  useEffect(() => { doPaipan(new Date()) }, [])

  const setNow = () => {
    const now = new Date()
    setDatetime(formatDateTime(now))
    doPaipan(now)
  }

  // 获取当前月令地支
  const monthZhi = result ? (JIEQI_MONTH_ZHI[result.jieQi] || '午') : '午'

  return (
    <div className="space-y-5">
      {/* 输入区 */}
      <div className="card">
        <h2 className="text-lg font-bold text-dark-100 mb-4">奇门遁甲排盘</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label block mb-1">日期时间</label>
            <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} className="input-field w-52" />
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
              <div className="flex gap-3 text-[11px]">
                <Legend color="bg-purple-400" label="八神" />
                <Legend color="bg-amber-400" label="九星" />
                <Legend color="bg-cyan-400" label="天盘干" />
                <Legend color="bg-dark-100" label="八门" />
                <Legend color="bg-dark-500" label="地盘干" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5">
              {LUOSHU_ORDER.map((gongNum) => {
                const palace = result.palaces.find(p => p.gongNumber === gongNum)
                if (!palace) return <div key={gongNum} />
                return <PalaceCell key={gongNum} palace={palace} monthZhi={monthZhi} />
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// === 子组件 ===

function InfoItem({ label, value, color = 'text-dark-100' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-dark-500">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`w-2 h-2 rounded-sm ${color}`}></span>
      <span className="text-dark-400">{label}</span>
    </span>
  )
}

function PillarCard({ label, value }: { label: string; value: string }) {
  const gan = value[0] || ''
  const zhi = value[1] || ''
  return (
    <div className="bg-dark-800/60 border border-dark-700/40 rounded-lg py-4 px-3 text-center">
      <div className="text-xs text-dark-500 mb-2">{label}</div>
      <div className="flex flex-col items-center gap-1">
        <span className={`text-xl font-bold ${GAN_COLOR[gan] || 'text-dark-100'}`}>{gan}</span>
        <span className={`text-xl font-bold ${ZHI_COLOR[zhi] || 'text-dark-100'}`}>{zhi}</span>
      </div>
    </div>
  )
}

// === 九宫格核心 Cell ===
interface PalaceData {
  gongNumber: number
  gongName: string
  diPanGan: string
  tianPanGan: string
  jiuXing: string
  baMen: string
  baShen: string
}

// 宫位五行颜色（卦名和数字共用）
const GONG_COLOR: Record<number, string> = {
  1: 'text-blue-400',    // 坎·水
  2: 'text-yellow-400',  // 坤·土
  3: 'text-green-400',   // 震·木
  4: 'text-green-400',   // 巽·木
  5: 'text-yellow-400',  // 中·土
  6: 'text-gray-300',    // 乾·金
  7: 'text-gray-300',    // 兑·金
  8: 'text-yellow-400',  // 艮·土
  9: 'text-red-400',     // 离·火
}

function PalaceCell({ palace, monthZhi }: { palace: PalaceData; monthZhi: string }) {
  const gongNum = palace.gongNumber
  const guaName = GONG_GUA[gongNum] || ''
  const gongColor = GONG_COLOR[gongNum] || 'text-dark-400'
  
  // 九星旺衰
  const xingStatus = getXingStatus(palace.jiuXing, gongNum, monthZhi)
  // 八门旺衰
  const menStatus = getMenStatus(palace.baMen, gongNum, monthZhi)
  // 天盘干十二长生
  const tianGanTwelve = getGanTwelveInGong(palace.tianPanGan, gongNum)
  // 地盘干十二长生
  const diGanTwelve = getGanTwelveInGong(palace.diPanGan, gongNum)

  return (
    <div className="bg-dark-800/40 border border-dark-700/30 rounded-lg p-2.5 min-h-[160px] relative flex flex-col justify-between">
      {/* 左上角：卦名（五行色） */}
      <span className={`absolute top-1.5 left-2 text-[11px] font-bold ${gongColor}`}>{guaName}</span>
      
      {/* 左下角：宫位数字（五行色） */}
      <span className={`absolute bottom-1.5 left-2 text-sm font-bold ${gongColor}`}>{gongNum}</span>

      {/* 主内容区 */}
      <div className="flex flex-col items-center gap-[3px] pt-4 pb-3">
        {/* 八神 */}
        <span className="text-purple-400 text-xs font-medium">{palace.baShen}</span>
        
        {/* 九星 + 天盘干 */}
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400 text-xs">{palace.jiuXing}</span>
          <span className={`text-cyan-400 text-sm font-bold`}>{palace.tianPanGan}</span>
        </div>
        
        {/* 九星旺衰 + 十二长生 */}
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-dark-500">{xingStatus.gongWs}月{xingStatus.monthWs}</span>
          {tianGanTwelve && <span className="text-orange-400/80">{tianGanTwelve}</span>}
        </div>

        {/* 八门 + 地盘干 */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-dark-100 text-xs font-medium">{palace.baMen}</span>
          <span className="text-dark-400 text-xs">{palace.diPanGan}</span>
        </div>
        
        {/* 八门旺衰 + 十二长生 */}
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-dark-500">{menStatus.gongWs}月{menStatus.monthWs}</span>
          {diGanTwelve && <span className="text-orange-400/80">{diGanTwelve}</span>}
        </div>
      </div>
    </div>
  )
}
